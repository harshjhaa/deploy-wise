type GitLabConfig = {
  baseUrl: string;
  projectId: string;
  token: string;
};

type GitLabPipelineCreateResponse = {
  data?: {
    pipelineCreate?: {
      errors?: string[];
      pipeline?: {
        id: string;
        path: string;
      } | null;
    };
  };
  errors?: { message?: string }[];
};

export type GitLabJob = {
  id: number;
  name: string;
  stage: string;
  status: string;
  web_url?: string;
  when?: string;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
};

export class GitLabError extends Error {
  constructor(
    message: string,
    readonly statusCode = 502,
  ) {
    super(message);
    this.name = "GitLabError";
  }
}

function getConfig(): GitLabConfig {
  const baseUrl = process.env.GITLAB_URL?.replace(/\/+$/, "");
  const projectId = process.env.GITLAB_PROJECT_ID;
  const token = process.env.GITLAB_TOKEN;

  if (!baseUrl || !projectId || !token || token === "replace-with-a-local-secret") {
    throw new GitLabError("GitLab integration is not configured on the API server.", 503);
  }

  return { baseUrl, projectId, token };
}

async function gitLabRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getConfig();
  let response: Response;

  try {
    response = await fetch(`${config.baseUrl}${path}`, {
      ...init,
      headers: {
        "PRIVATE-TOKEN": config.token,
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new GitLabError("Could not connect to GitLab.");
  }

  if (!response.ok) {
    // Do not forward GitLab response bodies; they may contain sensitive details.
    throw new GitLabError(`GitLab request failed with HTTP ${response.status}.`, 502);
  }

  return (await response.json()) as T;
}

export async function createSweetBonanzaPipeline(ref: string) {
  const config = getConfig();
  const query = `mutation internalPipelineCreate($input: PipelineCreateInput!) {
    pipelineCreate(input: $input) {
      errors
      pipeline { id path }
    }
  }`;
  const inputs = [
    { name: "force_job_kind", value: "product" },
    { name: "product_job_path", value: "games/sweetbonanza" },
    { name: "force_job_path", value: "none" },
    { name: "enable_pocket_parrot_v2", value: "false" },
    { name: "pp_playwright_workers", value: 5 },
    { name: "pp_playwright_retries", value: 1 },
    { name: "pp_playwright_fully_parallel", value: "true" },
    { name: "stats_events_project", value: "libraries/core" },
    { name: "deploy_type", value: "regular" },
    { name: "playwright_tag", value: "playwright:1.57.0-noble-vault-upd" },
    { name: "playwright_lean_tag", value: "playwright-lean:1.62.1-noble" },
    // { name: "bun_tag", value: "latest" },
    { name: "schedule_scope", value: "none" },
    { name: "schedule_pipeline", value: "none" },
  ];

  const result = await gitLabRequest<GitLabPipelineCreateResponse>("/api/graphql", {
    method: "POST",
    body: JSON.stringify({
      operationName: "internalPipelineCreate",
      variables: { input: { projectPath: "pp-live/frontend", ref, variables: [], inputs } },
      query,
    }),
  });

  const creation = result.data?.pipelineCreate;
  if (result.errors?.length || creation?.errors?.length || !creation?.pipeline) {
    const diagnostics = [
      ...(result.errors ?? []).map((error) => error.message).filter(Boolean),
      ...(creation?.errors ?? []),
    ];
    // Keep GitLab diagnostics in the API server logs; never return them to the client.
    console.error("GitLab pipeline creation was rejected.", diagnostics.length ? diagnostics : ["No pipeline was returned."]);
    throw new GitLabError("GitLab rejected the pipeline creation request.", 502);
  }

  const pipelineId = creation.pipeline.id.split("/").at(-1);
  if (!pipelineId || !/^\d+$/.test(pipelineId)) {
    throw new GitLabError("GitLab returned an unrecognized pipeline ID.", 502);
  }

  return {
    pipelineId,
    pipelineUrl: `${config.baseUrl}${creation.pipeline.path}`,
  };
}

export async function listPipelineJobs(pipelineId: string): Promise<GitLabJob[]> {
  const config = getConfig();
  const project = encodeURIComponent(config.projectId);
  const jobs: GitLabJob[] = [];
  let page = 1;

  while (page <= 20) {
    const pageJobs = await gitLabRequest<GitLabJob[]>(
      `/api/v4/projects/${project}/pipelines/${encodeURIComponent(pipelineId)}/jobs?include_retried=true&per_page=100&page=${page}`,
    );
    jobs.push(...pageJobs);
    if (pageJobs.length < 100) return jobs;
    page += 1;
  }

  throw new GitLabError("GitLab pipeline has an unexpectedly large job list.");
}

export async function playManualJob(jobId: number): Promise<void> {
  const config = getConfig();
  const project = encodeURIComponent(config.projectId);
  await gitLabRequest<unknown>(
    `/api/v4/projects/${project}/jobs/${encodeURIComponent(String(jobId))}/play`,
    { method: "POST" },
  );
}