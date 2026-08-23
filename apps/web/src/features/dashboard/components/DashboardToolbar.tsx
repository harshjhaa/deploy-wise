import { useDashboardStore } from "../../../store/dashboardStore";

export function DashboardToolbar() {
  const search = useDashboardStore((state) => state.search);
  const availability = useDashboardStore((state) => state.availability);
  const setSearch = useDashboardStore((state) => state.setSearch);
  const setAvailability = useDashboardStore((state) => state.setAvailability);

  return (
    <div className="dashboard-toolbar">
      <label className="search-field">
        <span className="visually-hidden">Search environments or games</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search environments or games"
        />
      </label>
      <label className="filter-field">
        <span className="visually-hidden">Filter availability</span>
        <select
          value={availability}
          onChange={(event) =>
            setAvailability(event.target.value as typeof availability)
          }
        >
          <option value="all">All states</option>
          <option value="available">Available</option>
          <option value="reserved">Reserved</option>
        </select>
      </label>
    </div>
  );
}
