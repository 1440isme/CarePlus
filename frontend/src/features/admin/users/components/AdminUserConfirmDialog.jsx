import './admin-users.css';

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

export default function AdminUserConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  pendingLabel = 'Đang xử lý...',
  confirmVariant = 'primary',
  user,
  isPending,
  errorMessage,
  onClose,
  onConfirm,
}) {
  if (!open || !user) {
    return null;
  }

  return (
    <div className="admin-users-dialog-backdrop" role="presentation" onClick={onClose}>
      <div
        className="admin-users-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-user-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-users-dialog-header">
          <h3 className="admin-users-dialog-title" id="admin-user-dialog-title">
            {title}
          </h3>
          <button className="admin-users-dialog-close" type="button" onClick={onClose} aria-label="Đóng">
            <CloseIcon />
          </button>
        </div>

        <div className="admin-users-dialog-body">
          <p className="admin-users-dialog-text">{description}</p>
          <div className="admin-users-dialog-summary">
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
          {errorMessage ? <p className="admin-users-dialog-error">{errorMessage}</p> : null}
        </div>

        <div className="admin-users-dialog-actions">
          <button className="admin-users-dialog-button is-secondary" type="button" onClick={onClose} disabled={isPending}>
            Hủy
          </button>
          <button
            className={`admin-users-dialog-button ${confirmVariant === 'danger' ? 'is-danger' : 'is-primary'}`}
            type="button"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
