import { ResourceSummary } from "../foundation.types";
import { ResourceCard } from "./ResourceCard";

export function ResourceGrid({
  resources,
}: Readonly<{ resources: ResourceSummary[] }>) {
  return (
    <div className="resource-grid">
      {resources.map((resource) => (
        <ResourceCard key={resource.label} {...resource} />
      ))}
    </div>
  );
}
