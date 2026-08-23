import { AsyncState } from "../../components/feedback/AsyncState";
import { useFoundationResources } from "./foundation.hooks";
import { ResourceGrid } from "./components/ResourceGrid";
import { ResourceSummary } from "./foundation.types";
import "./FoundationPage.scss";

const resourceLabels: ResourceSummary["label"][] = [
  "Environments",
  "Games",
  "Users",
];

export function FoundationPage() {
  const { data, isLoading, error } = useFoundationResources();

  const resources: ResourceSummary[] = resourceLabels.map((label) => {
    const resource = data?.find((item) => item.label === label);
    let state: ResourceSummary["state"] = "ready";
    if (isLoading) state = "loading";
    else if (error || !resource) state = "error";
    return { label, count: resource?.count ?? 0, state };
  });

  return (
    <main className="content">
      <section className="intro">
        <p className="eyebrow">Environment coordination</p>
        <h1>A clear view of what is safe to deploy.</h1>
        <p className="intro-copy">
          The foundation is connected to your local API and ready for the
          reservation dashboard.
        </p>
      </section>
      <section className="status-panel" aria-labelledby="connection-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">System foundation</p>
            <h2 id="connection-heading">Connected resources</h2>
          </div>
          <span className={`status-badge ${error ? "warning" : ""}`}>
            <span className="status-dot" />
            {error ? "Check connection" : "API connected"}
          </span>
        </div>
        <AsyncState isLoading={isLoading} error={error} />
        <ResourceGrid resources={resources} />
      </section>
      <section className="next-panel" aria-labelledby="next-heading">
        <div>
          <p className="eyebrow">Next surface</p>
          <h2 id="next-heading">Reservation dashboard</h2>
          <p>
            Environment and game availability will appear here in the next UI
            phase.
          </p>
        </div>
        <span className="phase-number">03</span>
      </section>
    </main>
  );
}
