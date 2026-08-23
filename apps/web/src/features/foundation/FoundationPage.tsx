import { useState } from "react";
import { AsyncState } from "../../components/feedback/AsyncState";
import { DashboardToolbar } from "../dashboard/components/DashboardToolbar";
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
import { useDashboardStore } from "../../store/dashboardStore";
import "../dashboard/DashboardPage.scss";

export function FoundationPage() {
  const { data, isLoading, error, isFetching, refetch } = useDashboardData();
  const createReservation = useCreateReservation();
  const [selectedResource, setSelectedResource] = useState<{
    environment: DashboardEnvironment;
    game: DashboardGame;
  } | null>(null);
  const search = useDashboardStore((state) => state.search).toLowerCase();
  const availability = useDashboardStore((state) => state.availability);
  const environments =
    data?.environments.filter((environment) => {
      const matchesSearch =
        !search ||
        environment.name.toLowerCase().includes(search) ||
        environment.reservations.some((reservation) =>
          data.games
            .find((game) => game.id === reservation.gameId)
            ?.name.toLowerCase()
            .includes(search),
        );
      const hasAvailable = data.games.some(
        (game) =>
          game.isActive &&
          !environment.reservations.some(
            (reservation) => reservation.gameId === game.id,
          ),
      );
      const hasReserved = environment.reservations.length > 0;
      const matchesAvailability =
        availability === "all" ||
        (availability === "available" && hasAvailable) ||
        (availability === "reserved" && hasReserved);
      return environment.isActive && matchesSearch && matchesAvailability;
    }) ?? [];

  return (
    <main className="content">
      <section className="dashboard-heading">
        <div>
          <p className="eyebrow">Environment coordination</p>
          <h1>Know what is clear to deploy.</h1>
          <p className="intro-copy">
            A live view of shared environments, owners and reservation windows.
          </p>
        </div>
        <button
          className="refresh-button"
          type="button"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          ↻ Refresh
        </button>
      </section>
      <section className="dashboard-controls" aria-label="Dashboard controls">
        <DashboardToolbar />
      </section>
      <AsyncState isLoading={isLoading} error={error} />
      <section className="environment-list" aria-label="Environments">
        {!isLoading && environments.length === 0 && (
          <p className="empty-state">
            No environments match the current filters.
          </p>
        )}
        {environments.map((environment) => (
          <EnvironmentSection
            key={environment.id}
            environment={environment}
            games={data?.games ?? []}
            onReserve={(selectedEnvironment, selectedGame) =>
              setSelectedResource({
                environment: selectedEnvironment,
                game: selectedGame,
              })
            }
          />
        ))}
      </section>
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
      {/* Foundation resource status remains available through the API layer for later profile/admin surfaces. */}
      <section
        className="status-panel dashboard-footer"
        aria-label="Dashboard status"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">Live status</p>
            <h2>Dashboard connected</h2>
          </div>
          <span className={`status-badge ${error ? "warning" : ""}`}>
            <span className="status-dot" />
            {error ? "Check connection" : "API connected"}
          </span>
        </div>
      </section>
    </main>
  );
}
