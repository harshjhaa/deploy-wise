import { ResourceSummary } from "../foundation.types";

export function ResourceCard({ label, count, state }: ResourceSummary) {
  return (
    <article className="resource-card">
      <span className="resource-label">{label}</span>
      {state === "loading" ? (
        <span className="skeleton" aria-label={`Loading ${label}`} />
      ) : (
        <strong>{count}</strong>
      )}
      <span className={`resource-state ${state}`}>{state}</span>
    </article>
  );
}
