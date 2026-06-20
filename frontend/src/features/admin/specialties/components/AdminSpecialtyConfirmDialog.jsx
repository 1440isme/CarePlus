function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

export default function AdminSpecialtyConfirmDialog({
  open,
  specialty,
  isPending,
  errorMessage,
  onClose,
  onConfirm,
}) {
  if (!open || !specialty) {
    return null;
  }

  return (
    <div className="admin-specialties-dialog-backdrop" role="presentation">
      <div
        className="admin-specialties-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-specialties-confirm-title"
      >
        <div className="admin-specialties-dialog-header">
          <h3 id="admin-specialties-confirm-title" className="admin-specialties-dialog-title">
            Tắt chuyên khoa
          </h3>

          <button
            className="admin-specialties-dialog-close"
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            disabled={isPending}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="admin-specialties-dialog-body">
          <p className="admin-specialties-dialog-text">
            Bạn có chắc muốn tắt chuyên khoa này không?
          </p>

          <div className="admin-specialties-dialog-summary">
            <strong>{specialty.name}</strong>
            <span>{specialty.description || 'Chưa có mô tả chuyên khoa.'}</span>
          </div>

          {errorMessage ? (
            <p className="admin-specialties-dialog-error">{errorMessage}</p>
          ) : null}
        </div>

        <div className="admin-specialties-dialog-actions">
          <button
            className="admin-specialties-dialog-button is-secondary"
            type="button"
            onClick={onClose}
            disabled={isPending}
          >
            Hủy
          </button>

          <button
            className="admin-specialties-dialog-button is-danger"
            type="button"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Đang xử lý' : 'Tắt'}
          </button>
        </div>
      </div>
    </div>
  );
}
