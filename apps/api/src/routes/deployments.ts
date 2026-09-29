import { Router } from 'express';
import prisma from '../prismaClient';
import { requireAuth } from '../auth';
import { GitLabError, createSweetBonanzaPipeline, listPipelineJobs, playManualJob } from '../services/gitlabClient';

const router = Router();
const BUILD_JOB_NAME = 'Build:SBZ';
const ALLOWED_BRANCHES = new Set(['chat/swb-1k-staging-1']);
const IN_FLIGHT_STATUSES = ['REQUESTED', 'PIPELINE_CREATED', 'BUILD_PENDING', 'BUILD_RUNNING', 'BUILD_SUCCEEDED', 'UNKNOWN'];

class DeploymentRequestError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
  }
}

router.use(requireAuth);

function isGitLabJobTerminal(status: string) {
  return ['success', 'failed', 'canceled', 'skipped'].includes(status);
}

function getBuildRequestStatus(jobStatus: string) {
  if (jobStatus === 'success') return 'BUILD_SUCCEEDED';
  if (jobStatus === 'failed' || jobStatus === 'canceled' || jobStatus === 'skipped') return 'BUILD_FAILED';
  if (jobStatus === 'running') return 'BUILD_RUNNING';
  return 'BUILD_PENDING';
}

function parseRequestBody(body: unknown): { reservationId: string; branch: string } {
  if (!body || typeof body !== 'object') {
    throw new DeploymentRequestError('A reservationId and approved POC branch are required.', 400);
  }
  const { reservationId, branch } = body as Record<string, unknown>;
  if (typeof reservationId !== 'string' || !reservationId || typeof branch !== 'string' || !ALLOWED_BRANCHES.has(branch)) {
    throw new DeploymentRequestError('A reservationId and approved POC branch are required.', 400);
  }
  return { reservationId, branch };
}

async function loadAuthorizedReservation(reservationId: string, userId: string, role: string) {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { environment: true, game: true, pocs: { select: { userId: true } } },
  });
  if (!reservation) throw new DeploymentRequestError('Reservation not found.', 404);
  if (reservation.status !== 'ACTIVE' || reservation.expiresAt <= new Date()) {
    throw new DeploymentRequestError('The reservation is not currently active.', 409);
  }

  const isAuthorized = role === 'ADMIN' || reservation.currentOwnerId === userId ||
    reservation.pocs.some((poc) => poc.userId === userId);
  if (!isAuthorized) {
    throw new DeploymentRequestError('Only the reservation holder, a POC, or an admin can request a deployment.', 403);
  }

  const normalizedEnvironment = reservation.environment.name.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (normalizedEnvironment !== 'stress1' || reservation.game.name.toLowerCase() !== 'sweetbonanza') {
    throw new DeploymentRequestError('The POC currently supports SweetBonanza on Stress 1 only.', 400);
  }
  return reservation;
}

async function createBuildRequest(reservationId: string, branch: string, userId: string, role: string) {
  let requestId: string | undefined;
  try {
    await loadAuthorizedReservation(reservationId, userId, role);
    const existingRequest = await prisma.gitLabDeploymentRequest.findFirst({
      where: { reservationId, status: { in: IN_FLIGHT_STATUSES } },
      orderBy: { createdAt: 'desc' },
    });
    if (existingRequest) {
      throw new DeploymentRequestError('A deployment request is already in progress for this reservation.', 409);
    }

    const request = await prisma.gitLabDeploymentRequest.create({
      data: {
        reservationId,
        requestedById: userId,
        branch,
        deployType: 'regular',
        status: 'REQUESTED',
      },
    });
    requestId = request.id;

    const pipeline = await createSweetBonanzaPipeline(branch);
    await prisma.gitLabDeploymentRequest.update({
      where: { id: request.id },
      data: { pipelineId: pipeline.pipelineId, pipelineUrl: pipeline.pipelineUrl, status: 'PIPELINE_CREATED' },
    });

    const jobs = await listPipelineJobs(pipeline.pipelineId);
    const buildJobs = jobs
      .filter((job) => job.name === BUILD_JOB_NAME && job.stage === 'Build' && job.status === 'manual')
      .sort((first, second) => second.id - first.id);
    const buildJob = buildJobs[0];
    if (!buildJob) {
      await prisma.gitLabDeploymentRequest.update({ where: { id: request.id }, data: { status: 'FAILED' } });
      throw new GitLabError('Build job was not found in the created GitLab pipeline.');
    }

    await prisma.gitLabDeploymentRequest.update({
      where: { id: request.id },
      data: { buildJobId: String(buildJob.id), buildStatus: buildJob.status, status: 'BUILD_PENDING' },
    });

    await playManualJob(buildJob.id);

    return {
      requestId: request.id,
      status: 'BUILD_PENDING',
      pipelineId: pipeline.pipelineId,
      pipelineUrl: pipeline.pipelineUrl,
      buildJobId: String(buildJob.id),
      buildJobName: buildJob.name,
    };
  } catch (error) {
    if (requestId) {
      const request = await prisma.gitLabDeploymentRequest.findUnique({ where: { id: requestId } }).catch(() => null);
      await prisma.gitLabDeploymentRequest.updateMany({
        where: { id: requestId, status: { not: 'FAILED' } },
        data: { status: request?.pipelineId ? 'UNKNOWN' : 'FAILED' },
      }).catch(() => undefined);
    }
    throw error;
  }
}

async function refreshBuildStatus(request: {
  id: string;
  pipelineId: string | null;
  buildJobId: string | null;
  buildStatus: string | null;
  status: string;
}) {
  if (!request.pipelineId || !request.buildJobId || isGitLabJobTerminal(request.buildStatus ?? '')) return request;
  const jobs = await listPipelineJobs(request.pipelineId);
  const currentBuild = jobs.find((job) => String(job.id) === request.buildJobId);
  if (!currentBuild) return request;

  const buildStatus = currentBuild.status;
  const status = getBuildRequestStatus(buildStatus);
  await prisma.gitLabDeploymentRequest.update({ where: { id: request.id }, data: { buildStatus, status } });
  return { ...request, buildStatus, status };
}

function canViewRequest(request: {
  requestedById: string;
  reservation: { currentOwnerId: string; pocs: { userId: string }[] };
}, userId: string, role: string) {
  return role === 'ADMIN' || request.requestedById === userId ||
    request.reservation.currentOwnerId === userId ||
    request.reservation.pocs.some((poc) => poc.userId === userId);
}

router.post('/', async (req, res, next) => {
  try {
    const { reservationId, branch } = parseRequestBody(req.body);
    const result = await createBuildRequest(reservationId, branch, req.user!.id, req.user!.role);
    return res.status(202).json(result);
  } catch (error) {
    if (error instanceof DeploymentRequestError || error instanceof GitLabError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    return next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const request = await prisma.gitLabDeploymentRequest.findUnique({
      where: { id: req.params.id },
      include: { reservation: { include: { pocs: { select: { userId: true } } } } },
    });
    if (!request) return res.status(404).json({ error: 'Deployment request not found.' });

    if (!canViewRequest(request, req.user!.id, req.user!.role)) {
      return res.status(403).json({ error: 'You cannot view this deployment request.' });
    }

    const currentRequest = await refreshBuildStatus(request);

    res.json({
      id: request.id,
      reservationId: request.reservationId,
      branch: request.branch,
      status: currentRequest.status,
      buildStatus: currentRequest.buildStatus,
      pipelineId: request.pipelineId,
      pipelineUrl: request.pipelineUrl,
      buildJobId: request.buildJobId,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
    });
  } catch (error) {
    if (error instanceof GitLabError) return res.status(error.statusCode).json({ error: error.message });
    next(error);
  }
});

export default router;