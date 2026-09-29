import { useState } from "react";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import { ReservationDetail } from "./reservations.types";
import {
  useCreateDeploymentRequest,
  useDeploymentRequests,
  useStartStressOneDeployment,
} from "./deployments.hooks";
import "./DeploymentPanel.scss";

const APPROVED_BRANCH = "chat/swb-1k-staging-1";
const BLOCKING_STATUSES = new Set([
  "REQUESTED",
  "PIPELINE_CREATED",
  "BUILD_PENDING",
  "BUILD_RUNNING",
  "BUILD_SUCCEEDED",
  "DEPLOY_PENDING",
  "DEPLOY_RUNNING",
  "UNKNOWN",
]);

function errorMessage(error: unknown) {
  if (axios.isAxiosError<{ error?: string }>(error)) {
    return error.response?.data?.error || error.message;
  }
  return error instanceof Error ? error.message : "The deployment request failed.";
}

function statusLabel(status: string | null | undefined) {
  if (!status) return "Not started";
  return Array.from(status, (character) =>
    character === "_" ? " " : character.toLowerCase(),
  ).join("");
}

type DeploymentPanelProps = {
  readonly reservation: ReservationDetail;
  readonly gameName: string;
  readonly environmentName: string;
};

export function DeploymentPanel({
  reservation,
  gameName,
  environmentName,
}: DeploymentPanelProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [branch, setBranch] = useState(APPROVED_BRANCH);
  const [buildConfirmed, setBuildConfirmed] = useState(false);
  const [deployConfirmed, setDeployConfirmed] = useState(false);
  const { data: requests, isLoading, error } = useDeploymentRequests(reservation.id);
  const createRequest = useCreateDeploymentRequest(reservation.id);
  const startDeployment = useStartStressOneDeployment(reservation.id);

  const isSupportedTarget =
    gameName.trim().toLowerCase() === "sweetbonanza" &&
    environmentName.replace(/[^a-z0-9]/gi, "").toLowerCase() === "stress1";
  if (!isSupportedTarget) return null;

  const latest = requests?.[0];
  const isAdmin = currentUser?.role === "ADMIN";
  const isAuthorized = Boolean(
    currentUser &&
      (isAdmin ||
        reservation.currentOwnerId === currentUser.id ||
        reservation.pocs.some((poc) => poc.userId === currentUser.id)),
  );
  const isReservationActive =
    reservation.status === "ACTIVE" &&
    new Date(reservation.expiresAt).getTime() > Date.now();
  const canStartBuild =
    !isLoading &&
    !error &&
    (!latest || !BLOCKING_STATUSES.has(latest.status)) &&
    isAuthorized &&
    isReservationActive;
  const buildSucceeded =
    latest?.status === "BUILD_SUCCEEDED" && latest.buildStatus === "success";
  const isBusy = createRequest.isPending || startDeployment.isPending;
  const actionError = createRequest.error || startDeployment.error;

  return (
    <section className="deployment-panel" aria-labelledby="deployment-heading">
      <div className="deployment-panel__header">
        <div>
          <p className="deployment-panel__eyebrow">Phase 2 · Stress 1 POC</p>
          <h2 id="deployment-heading">SweetBonanza deployment</h2>
          <p>
            Build and deploy through GitLab. Deployment is a separate, explicit
            confirmation after the build succeeds.
          </p>
        </div>
        {latest && (
          <span className="deployment-panel__status">
            {statusLabel(latest.status)}
          </span>
        )}
      </div>

      <div className="deployment-panel__summary">
        <div>
          <span>Game / environment</span>
          <strong>{gameName} · {environmentName}</strong>
        </div>
        <div>
          <span>Branch</span>
          <select
            className="deployment-panel__branch-select"
            value={branch}
            onChange={(event) => setBranch(event.target.value)}
            aria-label="Approved deployment branch"
          >
            <option value={APPROVED_BRANCH}>{APPROVED_BRANCH}</option>
          </select>
        </div>
        <div>
          <span>Deploy type</span>
          <strong>regular</strong>
        </div>
        <div>
          <span>Reservation expires</span>
          <strong>{new Date(reservation.expiresAt).toLocaleString()}</strong>
        </div>
      </div>

      {error && <p className="deployment-panel__error" role="alert">{errorMessage(error)}</p>}
      {actionError && (
        <p className="deployment-panel__error" role="alert">
          {errorMessage(actionError)}
        </p>
      )}

      {latest && (
        <div className="deployment-panel__jobs" aria-live="polite">
          <div>
            <span>Build:SBZ</span>
            <strong>{statusLabel(latest.buildStatus)}</strong>
          </div>
          {latest.deployJobId && (
            <div>
              <span>Deploy:SBZ: [stress1]</span>
              <strong>{statusLabel(latest.deployStatus)}</strong>
            </div>
          )}
          {latest.pipelineUrl && (
            <a href={latest.pipelineUrl} target="_blank" rel="noreferrer">
              Open pipeline in GitLab
            </a>
          )}
        </div>
      )}

      {buildSucceeded ? (
        <div className="deployment-panel__confirm">
          <p>
            Build succeeded. Review the target above, then explicitly confirm
            starting the Stress 1 deploy job.
          </p>
          <label className="deployment-panel__checkbox">
            <input
              type="checkbox"
              checked={deployConfirmed}
              onChange={(event) => setDeployConfirmed(event.target.checked)}
            />
            <span>I confirm deployment to Stress 1 for this reservation.</span>
          </label>
          <button
            className="deployment-panel__button"
            type="button"
            disabled={!deployConfirmed || isBusy}
            onClick={() => {
              if (latest) startDeployment.mutate(latest.id);
            }}
          >
            {startDeployment.isPending ? "Starting deploy…" : "Confirm and start deployment"}
          </button>
        </div>
      ) : (
        <div className="deployment-panel__confirm">
          <label className="deployment-panel__checkbox">
            <input
              type="checkbox"
              checked={buildConfirmed}
              onChange={(event) => setBuildConfirmed(event.target.checked)}
            />
            <span>
              I reviewed the game, environment, branch, and regular deploy type.
            </span>
          </label>
          <button
            className="deployment-panel__button"
            type="button"
            disabled={!canStartBuild || !buildConfirmed || isBusy}
            onClick={() => createRequest.mutate(branch)}
          >
            {createRequest.isPending ? "Requesting build…" : "Confirm and start build"}
          </button>
          {!isAuthorized && (
            <small>Only the current reservation owner, a POC, or an admin can deploy.</small>
          )}
          {isAuthorized && !isReservationActive && (
            <small>The reservation must be active and not expired.</small>
          )}
          {latest && BLOCKING_STATUSES.has(latest.status) && !buildSucceeded && (
            <small>Wait for the current deployment request to finish before starting another.</small>
          )}
        </div>
      )}
    </section>
  );
}
