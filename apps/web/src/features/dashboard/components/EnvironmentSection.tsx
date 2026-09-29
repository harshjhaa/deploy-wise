import { useState } from "react";
import { DashboardEnvironment, DashboardGame } from "../dashboard.types";
import { GameReservationCard } from "./GameReservationCard";

type EnvironmentSectionProps = Readonly<{
  environment: DashboardEnvironment;
  games: DashboardGame[];
  isRefreshing: boolean;
  onRefresh: () => void;
  onReserve: (environment: DashboardEnvironment, game: DashboardGame) => void;
}>;

export function EnvironmentSection({
  environment,
  games,
  isRefreshing,
  onRefresh,
  onReserve,
}: EnvironmentSectionProps) {
  const [activeTab, setActiveTab] = useState<"available" | "reserved">("available");
  const activeGames = games.filter((game) => game.isActive);
  const availableGames = activeGames.filter(
    (game) => !environment.reservations.some((item) => item.gameId === game.id),
  );
  const reservedGames = activeGames.filter((game) =>
    environment.reservations.some((item) => item.gameId === game.id),
  );
  const displayedGames = activeTab === "available" ? availableGames : reservedGames;

  return (
    <section
      className="environment-section"
      aria-labelledby={`environment-${environment.id}`}
    >
      <div className="environment-heading">
        <div>
          <p className="eyebrow">Environment</p>
          <h2 id={`environment-${environment.id}`}>{environment.name}</h2>
        </div>
        <button
          className="refresh-button"
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          ↻ Refresh
        </button>
      </div>
      <div className="game-tabs" role="tablist" aria-label="Game availability">
        <button
          className={`game-tab ${activeTab === "available" ? "active" : ""}`}
          type="button"
          role="tab"
          id="available-games-tab"
          aria-selected={activeTab === "available"}
          aria-controls="environment-games-panel"
          onClick={() => setActiveTab("available")}
        >
          Available <span>{availableGames.length}</span>
        </button>
        <button
          className={`game-tab ${activeTab === "reserved" ? "active" : ""}`}
          type="button"
          role="tab"
          id="reserved-games-tab"
          aria-selected={activeTab === "reserved"}
          aria-controls="environment-games-panel"
          onClick={() => setActiveTab("reserved")}
        >
          Reserved <span>{reservedGames.length}</span>
        </button>
      </div>
      <div
        className="game-grid"
        id="environment-games-panel"
        role="tabpanel"
        aria-labelledby={`${activeTab}-games-tab`}
        tabIndex={0}
      >
        {displayedGames.length > 0 ? (
          displayedGames.map((game) => (
            <GameReservationCard
              key={game.id}
              game={game}
              reservation={environment.reservations.find(
                (item) => item.gameId === game.id,
              )}
              onReserve={() => onReserve(environment, game)}
            />
          ))
        ) : (
          <p className="empty-state game-empty-state">
            No {activeTab} games in this environment.
          </p>
        )}
      </div>
    </section>
  );
}
