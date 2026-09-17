import { FormEvent, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AsyncState } from "../../components/feedback/AsyncState";
import { MultiSelectDropdown } from "../../components/commonComponents/MultiSelectDropdown";
import { useAuthStore } from "../../store/authStore";
import { DashboardUser } from "../dashboard/dashboard.types";
import { useDashboardData } from "../dashboard/dashboard.hooks";
import {
  useExtendReservation,
  useHandoverReservation,
  useReleaseReservation,
  useReservation,
} from "./reservations.hooks";
import "./ReservationDetailsPage.scss";

function displayUser(userId: string, users: DashboardUser[]) {
  const user = users.find((item) => item.id === userId);
  return user ? `${user.name || user.email} (${user.email})` : userId;
}

export function ReservationDetailsPage() {
  const { id = "" } = useParams();
  const { data: reservation, isLoading, error } = useReservation(id);
  const { data: dashboard } = useDashboardData();
  const currentUser = useAuthStore((state) => state.user);
  const performerId =
    dashboard?.users.find((user) => user.email === currentUser?.email)?.id ||
    "";
  const release = useReleaseReservation(id);
  const extend = useExtendReservation(id);
  const handover = useHandoverReservation(id);
  const [newExpiresAt, setNewExpiresAt] = useState("");
  const [newPrimaryId, setNewPrimaryId] = useState("");
  const [newSecondaryIds, setNewSecondaryIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState("");

  if (isLoading)
    return (
      <main className="details-page">
        <AsyncState isLoading error={null} />
      </main>
    );
  if (error || !reservation)
    return (
      <main className="details-page">
        <AsyncState
          isLoading={false}
          error={error || new Error("Reservation not found")}
        />
      </main>
    );

  const users = dashboard?.users || [];
  const currentPocIds = new Set(reservation.pocs.map((poc) => poc.userId));
  const availableUsers = users.filter((user) => !currentPocIds.has(user.id));

  function runAction(action: () => void) {
    setActionError("");
    if (!performerId)
      setActionError(
        "Sign in with a known user before performing reservation actions.",
      );
    else action();
  }

  function submitExtend(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newExpiresAt) return;
    runAction(() =>
      extend.mutate({
        newExpiresAt: new Date(newExpiresAt).toISOString(),
        performedById: performerId,
      }),
    );
  }

  function submitHandover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newPrimaryId || newSecondaryIds.length < 1) return;
    runAction(() =>
      handover.mutate({
        performedById: performerId,
        toUserId: newPrimaryId,
        pocs: [
          { userId: newPrimaryId, isPrimary: true },
          ...newSecondaryIds.map((userId) => ({ userId, isPrimary: false })),
        ],
      }),
    );
  }

  return (
    <main className="details-page">
      <Link className="back-link" to="/">
        Back to dashboard
      </Link>
      <header className="details-header">
        <div>
          <p className="eyebrow">Reservation details</p>
          <h1>{reservation.id}</h1>
          <p className="details-meta">
            {reservation.status} · Game {reservation.gameId} · Environment{" "}
            {reservation.environmentId}
          </p>
        </div>
        <span className={`detail-status ${reservation.status.toLowerCase()}`}>
          {reservation.status}
        </span>
      </header>
      <div className="details-grid">
        <section className="detail-panel">
          <p className="eyebrow">Current owner</p>
          <h2>{displayUser(reservation.currentOwnerId, users)}</h2>
          <p className="details-meta">
            Expires {new Date(reservation.expiresAt).toLocaleString()}
          </p>
          <h3>Current POCs</h3>
          <ul className="poc-list">
            {reservation.pocs.map((poc) => (
              <li key={poc.id}>
                <strong>{poc.isPrimary ? "Primary" : "Secondary"}</strong>
                {displayUser(poc.userId, users)}
              </li>
            ))}
          </ul>
        </section>
        <section className="detail-panel">
          <p className="eyebrow">Activity</p>
          <h2>Event history</h2>
          <ul className="event-list">
            {reservation.events.map((event) => (
              <li key={event.id}>
                <strong>{event.eventType}</strong>
                <span>{new Date(event.createdAt).toLocaleString()}</span>
                <small>
                  Performed by {displayUser(event.performedBy, users)}
                </small>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {actionError && (
        <p className="action-error" role="alert">
          {actionError}
        </p>
      )}
      <section className="actions-panel">
        <div className="action-block">
          <h2>Release</h2>
          <p>Only a current POC can release this reservation.</p>
          <button
            className="danger-button"
            type="button"
            disabled={release.isPending || reservation.status !== "ACTIVE"}
            onClick={() => runAction(() => release.mutate(performerId))}
          >
            {release.isPending ? "Releasing..." : "Release reservation"}
          </button>
        </div>
        <form className="action-block" onSubmit={submitExtend}>
          <h2>Extend expiry</h2>
          <label>
            <span>New expiry</span>
            <input
              type="datetime-local"
              value={newExpiresAt}
              onChange={(event) => setNewExpiresAt(event.target.value)}
              required
            />
          </label>
          <button
            className="primary-button"
            type="submit"
            disabled={extend.isPending || reservation.status !== "ACTIVE"}
          >
            {extend.isPending ? "Updating..." : "Extend reservation"}
          </button>
        </form>
        <form className="action-block" onSubmit={submitHandover}>
          <h2>Handover</h2>
          <label>
            <span>New primary POC / owner</span>
            <select
              value={newPrimaryId}
              onChange={(event) => {
                setNewPrimaryId(event.target.value);
                setNewSecondaryIds([]);
              }}
              required
            >
              <option value="">Select user</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </label>
          <MultiSelectDropdown
            label="New secondary POCs (choose 1 or 2)"
            options={availableUsers
              .filter((user) => user.id !== newPrimaryId)
              .map((user) => ({ id: user.id, label: user.name || user.email }))}
            selectedIds={newSecondaryIds}
            onChange={setNewSecondaryIds}
            minSelections={1}
            maxSelections={2}
            placeholder="Select secondary POCs"
            disabled={!newPrimaryId}
          />
          <button
            className="primary-button"
            type="submit"
            disabled={handover.isPending || reservation.status !== "ACTIVE"}
          >
            {handover.isPending ? "Handing over..." : "Handover reservation"}
          </button>
        </form>
      </section>
    </main>
  );
}
