import { DashboardGame, DashboardReservation } from "../dashboard.types";

type GameReservationCardProps = Readonly<{
  game: DashboardGame;
  reservation?: DashboardReservation;
}>;

function formatExpiry(expiresAt: string) {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return "Expired";
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  return `${hours}h ${minutes}m remaining`;
}

export function GameReservationCard({
  game,
  reservation,
}: GameReservationCardProps) {
  const isReserved = Boolean(reservation);

  return (
    <article className={`game-card ${isReserved ? "reserved" : "available"}`}>
      <div className="game-card-header">
        <span className="game-name">{game.name}</span>
        <span className="state-label">
          {isReserved ? "Reserved" : "Available"}
        </span>
      </div>
      {reservation ? (
        <div className="reservation-summary">
          <span className="summary-label">Current owner</span>
          <strong>{reservation.currentOwnerId}</strong>
          <span className="expiry-label">
            {formatExpiry(reservation.expiresAt)}
          </span>
        </div>
      ) : (
        <div className="available-summary">
          <span>Ready for a reservation</span>
          <button type="button">Reserve</button>
        </div>
      )}
    </article>
  );
}
