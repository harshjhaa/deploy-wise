export type DashboardGame = {
  id: string;
  name: string;
  isActive: boolean;
};

export type DashboardUser = {
  id: string;
  name: string | null;
  email: string;
};

export type DashboardReservation = {
  id: string;
  gameId: string;
  currentOwnerId: string;
  status: string;
  expiresAt: string;
};

export type DashboardEnvironment = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  reservations: DashboardReservation[];
};

export type DashboardData = {
  environments: DashboardEnvironment[];
  games: DashboardGame[];
  users: DashboardUser[];
};
