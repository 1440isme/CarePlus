import './admin-users.css';

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="8.5" cy="8.5" r="4.35" />
      <path d="m11.7 11.7 3.4 3.4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5.75 7.75 4.25 4.5 4.25-4.5" />
    </svg>
  );
}

export default function AdminUsersFilters({
  searchValue,
  onSearchChange,
  roleValue,
  onRoleChange,
  statusValue,
  onStatusChange,
  createdFromValue,
  onCreatedFromChange,
  createdToValue,
  onCreatedToChange,
  onResetFilters,
  canResetFilters,
  roleOptions,
  statusOptions,
}) {
  return (
    <div className="admin-users-filter-bar">
      <div className="admin-users-filter-control admin-users-filter-control-search">
        <span className="admin-users-filter-icon" aria-hidden="true">
          <SearchIcon />
        </span>
        <input
          className="admin-users-search-input"
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm theo họ tên, email, số điện thoại..."
        />
      </div>

      <div className="admin-users-filter-control admin-users-filter-control-role">
        <select
          className="admin-users-select"
          value={roleValue}
          onChange={(event) => onRoleChange(event.target.value)}
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="admin-users-select-icon" aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </div>

      <div className="admin-users-filter-control admin-users-filter-control-status">
        <select
          className="admin-users-select"
          value={statusValue}
          onChange={(event) => onStatusChange(event.target.value)}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <span className="admin-users-select-icon" aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </div>

      <div className="admin-users-filter-control admin-users-filter-control-date">
        <input
          className="admin-users-date-input"
          type="date"
          value={createdFromValue}
          max={createdToValue || undefined}
          onChange={(event) => onCreatedFromChange(event.target.value)}
          aria-label="Ngày tạo từ"
        />
      </div>

      <div className="admin-users-filter-control admin-users-filter-control-date">
        <input
          className="admin-users-date-input"
          type="date"
          value={createdToValue}
          min={createdFromValue || undefined}
          onChange={(event) => onCreatedToChange(event.target.value)}
          aria-label="Ngày tạo đến"
        />
      </div>

      <button
        className="admin-users-filter-reset"
        type="button"
        onClick={onResetFilters}
        disabled={!canResetFilters}
      >
        Đặt lại
      </button>
    </div>
  );
}
