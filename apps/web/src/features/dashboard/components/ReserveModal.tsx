import { FormEvent, useState } from "react";
import { DashboardGame, DashboardUser } from "../dashboard.types";
import { MultiSelectDropdown } from "../../../components/commonComponents/MultiSelectDropdown";
import "./ReserveModal.scss";

type ReserveModalProps = Readonly<{
  environmentId: string;
  environmentName: string;
  game: DashboardGame;
  users: DashboardUser[];
  onClose: () => void;
  onSubmit: (values: {
    currentOwnerId: string;
    expiresAt: string;
    pocs: { userId: string; isPrimary: boolean }[];
  }) => void;
  isSubmitting: boolean;
  error: string;
}>;

export function ReserveModal({
  environmentId,
  environmentName,
  game,
  users,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: ReserveModalProps) {
  const [primaryUserId, setPrimaryUserId] = useState("");
  const [secondaryUserIds, setSecondaryUserIds] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      currentOwnerId: primaryUserId,
      expiresAt: new Date(expiresAt).toISOString(),
      pocs: [
        { userId: primaryUserId, isPrimary: true },
        ...secondaryUserIds.map((userId) => ({ userId, isPrimary: false })),
      ],
    });
  }

  return (
    <dialog open className="modal-backdrop" aria-labelledby="reserve-title">
      <div className="reserve-modal">
        <button
          className="modal-close"
          type="button"
          onClick={onClose}
          aria-label="Close reservation dialog"
        >
          ×
        </button>
        <p className="eyebrow">New reservation</p>
        <h2 id="reserve-title">
          {environmentName} / {game.name}
        </h2>
        <p className="modal-copy">
          Choose the current owner and the POCs responsible for this
          reservation.
        </p>
        <form className="reserve-form" onSubmit={submit}>
          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}
          <label className="modal-field">
            <span>Primary POC and owner</span>
            <select
              value={primaryUserId}
              onChange={(event) => {
                setPrimaryUserId(event.target.value);
                setSecondaryUserIds([]);
              }}
              required
            >
              <option value="">Select a primary POC</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email}
                </option>
              ))}
            </select>
          </label>
          <MultiSelectDropdown
            label="Secondary POCs (choose 1 or 2)"
            options={users
              .filter((user) => user.id !== primaryUserId)
              .map((user) => ({ id: user.id, label: user.name || user.email }))}
            selectedIds={secondaryUserIds}
            onChange={setSecondaryUserIds}
            minSelections={1}
            maxSelections={2}
            placeholder="Select secondary POCs"
            disabled={!primaryUserId}
          />
          <label className="modal-field">
            <span>Expires at</span>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              required
            />
          </label>
          <div className="modal-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="primary-button"
              type="submit"
              disabled={
                isSubmitting || !primaryUserId || secondaryUserIds.length < 1
              }
            >
              {isSubmitting ? "Reserving..." : "Create reservation"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
