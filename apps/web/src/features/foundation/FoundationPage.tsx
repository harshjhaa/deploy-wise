import { useState } from "react";
import { AsyncState } from "../../components/feedback/AsyncState";
import { EnvironmentSection } from "../dashboard/components/EnvironmentSection";
import {
  useCreateReservation,
  useDashboardData,
} from "../dashboard/dashboard.hooks";
import {
  DashboardEnvironment,
  DashboardGame,
} from "../dashboard/dashboard.types";
import { ReserveModal } from "../dashboard/components/ReserveModal";
import "../dashboard/DashboardPage.scss";

export function FoundationPage() {
  const { data, isLoading, error, isFetching, refetch } = useDashboardData();
  const createReservation = useCreateReservation();
  const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
  const [environmentSearch, setEnvironmentSearch] = useState("");
  const [selectedResource, setSelectedResource] = useState<{
    environment: DashboardEnvironment;
    game: DashboardGame;
  } | null>(null);
  const environments =
    data?.environments.filter((environment) => {
      return (
        environment.isActive &&
        environment.name.toLowerCase().includes(environmentSearch.trim().toLowerCase())
      );
    }) ?? [];
  const selectedEnvironment =
    environments.find((environment) => environment.id === selectedEnvironmentId) ??
    environments[0];

  return (
    <main className="content dashboard-overview">
      <AsyncState isLoading={isLoading} error={error} />
      {!isLoading && !error && (
        <section className="environment-workspace" aria-label="Environment overview">
          <aside className="environment-sidebar" aria-label="Select an environment">
            <p className="eyebrow">Environments</p>
            <label className="environment-search">
              <span className="visually-hidden">Search environments</span>
              <input
                type="search"
                value={environmentSearch}
                onChange={(event) => setEnvironmentSearch(event.target.value)}
                placeholder="Search environments"
              />
            </label>
            {environments.length === 0 ? (
              <p className="empty-state">
                No environments match your search.
              </p>
            ) : (
              <nav className="environment-selector" aria-label="Environments">
                {environments.map((environment) => (
                  <button
                    key={environment.id}
                    className={`environment-option ${
                      selectedEnvironment?.id === environment.id ? "active" : ""
                    }`}
                    type="button"
                    aria-pressed={selectedEnvironment?.id === environment.id}
                    onClick={() => setSelectedEnvironmentId(environment.id)}
                  >
                    <span className="environment-option-name">{environment.name}</span>
                    <span className="environment-option-meta">
                      {environment.reservations.length} reservation
                      {environment.reservations.length === 1 ? "" : "s"}
                    </span>
                  </button>
                ))}
              </nav>
            )}
          </aside>
          <div className="environment-body">
            {selectedEnvironment ? (
              <EnvironmentSection
                key={selectedEnvironment.id}
                environment={selectedEnvironment}
                games={data?.games ?? []}
                isRefreshing={isFetching}
                onRefresh={() => void refetch()}
                onReserve={(environment, game) =>
                  setSelectedResource({ environment, game })
                }
              />
            ) : (
              <p className="empty-state">Select an environment to view its reservations.</p>
            )}
          </div>
        </section>
      )}
      {selectedResource && data && (
        <ReserveModal
          environmentId={selectedResource.environment.id}
          environmentName={selectedResource.environment.name}
          game={selectedResource.game}
          users={data.users}
          onClose={() => {
            setSelectedResource(null);
            createReservation.reset();
          }}
          isSubmitting={createReservation.isPending}
          error={
            createReservation.error instanceof Error
              ? createReservation.error.message
              : ""
          }
          onSubmit={(values) =>
            createReservation.mutate(
              {
                environmentId: selectedResource.environment.id,
                gameId: selectedResource.game.id,
                createdById: values.currentOwnerId,
                ...values,
              },
              { onSuccess: () => setSelectedResource(null) },
            )
          }
        />
      )}
    </main>
  );
}
