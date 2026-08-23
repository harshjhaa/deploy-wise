import { DashboardEnvironment, DashboardGame } from "../dashboard.types";
import { GameReservationCard } from "./GameReservationCard";

type EnvironmentSectionProps = Readonly<{
  environment: DashboardEnvironment;
  games: DashboardGame[];
}>;

export function EnvironmentSection({
  environment,
  games,
}: EnvironmentSectionProps) {
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
        <span className="environment-description">
          {environment.description || "Shared deployment environment"}
        </span>
      </div>
      <div className="game-grid">
        {games
          .filter((game) => game.isActive)
          .map((game) => (
            <GameReservationCard
              key={game.id}
              game={game}
              reservation={environment.reservations.find(
                (item) => item.gameId === game.id,
              )}
            />
          ))}
      </div>
    </section>
  );
}
