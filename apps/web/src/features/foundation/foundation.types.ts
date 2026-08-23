export type FoundationResource = "Environments" | "Games" | "Users";

export type ResourceState = "loading" | "ready" | "error";

export type ResourceSummary = {
  label: FoundationResource;
  count: number;
  state: ResourceState;
};
