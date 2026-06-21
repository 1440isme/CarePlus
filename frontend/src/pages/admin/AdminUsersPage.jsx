import { useEffect, useMemo, useState } from 'react';
import {
  AdminUserConfirmDialog,
  AdminUserDetailDrawer,
  AdminUserFormModal,
  AdminUsersFilters,
  AdminUsersTable,
  ADMIN_USER_ROLE_OPTIONS,
  ADMIN_USER_STATUS_OPTIONS,
  useAdminUsers,
  useResetUserNoShowCount,
  useUpdateUserStatus,
} from '../../features/admin/users/index.js';
import '../../features/admin/users/components/admin-users.css';

const PAGE_LIMIT = 10;
const FEEDBACK_AUTO_HIDE_MS = 5000;

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4.25v11.5M4.25 10h11.5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="m5 5 10 10M15 5 5 15" />
    </svg>
  );
}

function getListErrorMessage(error) {
  switch (error?.code) {
    case 'FORBIDDEN':
      return 'Bạn không có quyền truy cập danh sách người dùng.';
    case 'VALIDATION_ERROR':
      return 'Bộ lọc chưa hợp lệ. Vui lòng kiểm tra lại.';
    default:
      return error?.message ?? 'Đã có lỗi xảy ra khi tải danh sách người dùng.';
  }
}

function getMutationErrorMessage(error) {
  switch (error?.code) {
    case 'USER_NOT_FOUND':
      return 'Không tìm thấy người dùng.';
    case 'CANNOT_UPDATE_OWN_STATUS':
      return 'Không thể tự khóa hoặc mở khóa tài khoản của chính mình.';
    case 'CANNOT_RESET_OWN_NO_SHOW':
      return 'Không thể tự reset số lần vắng mặt của chính mình.';
    case 'INVALID_USER_STATUS':
      return 'Trạng thái tài khoản không hợp lệ.';
    case 'UPDATE_USER_STATUS_FAILED':
      return 'Cập nhật trạng thái tài khoản thất bại.';
    case 'RESET_NO_SHOW_FAILED':
      return 'Reset số lần vắng mặt thất bại.';
    default:
      return error?.message ?? 'Đã có lỗi xảy ra trên hệ thống.';
  }
}

function normalizeSearch(value) {
  const trimmedValue = value.trim();
  return trimmedValue || undefined;
}

function isFilterDirty({ searchValue, selectedRole, selectedStatus, createdFrom, createdTo }) {
  return Boolean(
    searchValue.trim()
    || selectedRole !== 'ALL'
    || selectedStatus !== 'ALL'
    || createdFrom
    || createdTo
  );
}

export default function AdminUsersPage() {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [feedback, setFeedback] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formModalState, setFormModalState] = useState({
    open: false,
    mode: 'create',
    user: null,
  });
  const [dialogState, setDialogState] = useState({
    type: null,
    user: null,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchValue);
      setCurrentPage(1);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [searchValue]);

  useEffect(() => {
    if (!feedback) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setFeedback(null);
    }, FEEDBACK_AUTO_HIDE_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [feedback]);

  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: PAGE_LIMIT,
    search: normalizeSearch(debouncedSearch),
    role: selectedRole === 'ALL' ? undefined : selectedRole,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    createdFrom: createdFrom || undefined,
    createdTo: createdTo || undefined,
  }), [currentPage, debouncedSearch, selectedRole, selectedStatus, createdFrom, createdTo]);

  const usersQuery = useAdminUsers(queryParams);
  const updateStatusMutation = useUpdateUserStatus({
    onSuccess: (response) => {
      setFeedback({
        type: 'success',
        message: response?.data?.message ?? 'Cập nhật trạng thái tài khoản thành công.',
      });
      setDialogState({ type: null, user: null });
    },
  });
  const resetNoShowMutation = useResetUserNoShowCount({
    onSuccess: (response) => {
      setFeedback({
        type: 'success',
        message: response?.data?.message ?? 'Đã reset số lần vắng mặt thành công.',
      });
      setDialogState({ type: null, user: null });
    },
  });

  const users = usersQuery.data?.data ?? [];
  const meta = usersQuery.data?.meta ?? {
    page: currentPage,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
  };

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    const refreshedSelectedUser = users.find((user) => user.id === selectedUser.id);

    if (refreshedSelectedUser) {
      setSelectedUser(refreshedSelectedUser);
    }
  }, [selectedUser, users]);

  const dialogConfig = useMemo(() => {
    if (dialogState.type === 'lock') {
      return {
        title: 'Khóa tài khoản',
        description: 'Bạn có chắc muốn khóa tài khoản này không?',
        confirmLabel: 'Khóa',
        confirmVariant: 'danger',
      };
    }

    if (dialogState.type === 'unlock') {
      return {
        title: 'Mở khóa tài khoản',
        description: 'Bạn có chắc muốn mở khóa tài khoản này không?',
        confirmLabel: 'Mở khóa',
        confirmVariant: 'primary',
      };
    }

    if (dialogState.type === 'reset') {
      return {
        title: 'Reset số lần vắng mặt',
        description: 'Bạn có chắc muốn reset số lần vắng mặt của người dùng này không?',
        confirmLabel: 'Reset',
        confirmVariant: 'primary',
      };
    }

    return null;
  }, [dialogState.type]);

  const dialogErrorMessage = dialogState.type === 'reset'
    ? (resetNoShowMutation.error ? getMutationErrorMessage(resetNoShowMutation.error) : '')
    : (updateStatusMutation.error ? getMutationErrorMessage(updateStatusMutation.error) : '');

  const handleRoleChange = (value) => {
    setSelectedRole(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleCreatedFromChange = (value) => {
    setCreatedFrom(value);
    setCreatedTo((previousValue) => {
      if (previousValue && value && previousValue < value) {
        return value;
      }

      return previousValue;
    });
    setCurrentPage(1);
  };

  const handleCreatedToChange = (value) => {
    setCreatedTo(value);
    setCreatedFrom((previousValue) => {
      if (previousValue && value && previousValue > value) {
        return value;
      }

      return previousValue;
    });
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setSearchValue('');
    setDebouncedSearch('');
    setSelectedRole('ALL');
    setSelectedStatus('ALL');
    setCreatedFrom('');
    setCreatedTo('');
    setCurrentPage(1);
    setFeedback(null);
  };

  const canResetFilters = isFilterDirty({
    searchValue,
    selectedRole,
    selectedStatus,
    createdFrom,
    createdTo,
  });

  const handleCloseDialog = () => {
    if (!updateStatusMutation.isPending && !resetNoShowMutation.isPending) {
      updateStatusMutation.reset();
      resetNoShowMutation.reset();
      setDialogState({ type: null, user: null });
    }
  };

  const handleCloseFormModal = () => {
    setFormModalState({
      open: false,
      mode: 'create',
      user: null,
    });
  };

  const handleConfirmDialog = () => {
    if (!dialogState.user) {
      return;
    }

    if (dialogState.type === 'reset') {
      resetNoShowMutation.mutate({ userId: dialogState.user.id });
      return;
    }

    if (dialogState.type === 'lock' || dialogState.type === 'unlock') {
      updateStatusMutation.mutate({
        userId: dialogState.user.id,
        status: dialogState.type === 'lock' ? 'LOCKED' : 'ACTIVE',
      });
    }
  };

  return (
    <section className="admin-users-page">
      <div className="admin-users-page-header">
        <h2 className="admin-users-page-title">Quản lý người dùng</h2>

        <button
          className="admin-users-create-button"
          type="button"
          onClick={() => {
            setFeedback(null);
            setFormModalState({
              open: true,
              mode: 'create',
              user: null,
            });
          }}
        >
          <PlusIcon />
          <span>Tạo tài khoản nhân sự</span>
        </button>
      </div>

      <div className="admin-users-card">
        <AdminUsersFilters
          searchValue={searchValue}
          onSearchChange={(value) => {
            setFeedback(null);
            setSearchValue(value);
          }}
          roleValue={selectedRole}
          onRoleChange={handleRoleChange}
          statusValue={selectedStatus}
          onStatusChange={handleStatusChange}
          createdFromValue={createdFrom}
          onCreatedFromChange={handleCreatedFromChange}
          createdToValue={createdTo}
          onCreatedToChange={handleCreatedToChange}
          onResetFilters={handleResetFilters}
          canResetFilters={canResetFilters}
          roleOptions={ADMIN_USER_ROLE_OPTIONS}
          statusOptions={ADMIN_USER_STATUS_OPTIONS}
        />

        {feedback ? (
          <div
            className={`admin-users-feedback ${feedback.type === 'success' ? 'is-success' : 'is-error'}`}
            role="status"
            aria-live="polite"
          >
            <span>{feedback.message}</span>
            <button
              className="admin-users-feedback-close"
              type="button"
              onClick={() => setFeedback(null)}
              aria-label="Ẩn thông báo"
            >
              <CloseIcon />
            </button>
          </div>
        ) : null}

        <AdminUsersTable
          users={users}
          meta={meta}
          currentPage={currentPage}
          isLoading={usersQuery.isLoading}
          isError={usersQuery.isError}
          errorMessage={getListErrorMessage(usersQuery.error)}
          onRetry={() => usersQuery.refetch()}
          onViewDetail={(user) => {
            setFeedback(null);
            setSelectedUser(user);
          }}
          onPreviousPage={() => {
            setCurrentPage((page) => Math.max(1, page - 1));
          }}
          onNextPage={() => {
            setCurrentPage((page) => Math.min(meta.totalPages, page + 1));
          }}
        />
      </div>

      <AdminUserDetailDrawer
        open={Boolean(selectedUser)}
        userId={selectedUser?.id ?? null}
        onClose={() => setSelectedUser(null)}
        onRequestLockToggle={(user) => {
          updateStatusMutation.reset();
          resetNoShowMutation.reset();
          setDialogState({
            type: user.status === 'ACTIVE' ? 'lock' : 'unlock',
            user,
          });
        }}
        onRequestResetNoShow={(user) => {
          updateStatusMutation.reset();
          resetNoShowMutation.reset();
          setDialogState({
            type: 'reset',
            user,
          });
        }}
        isStatusUpdating={updateStatusMutation.isPending}
        statusUpdatingUserId={updateStatusMutation.variables?.userId ?? null}
        isResettingNoShow={resetNoShowMutation.isPending}
        resetNoShowUserId={resetNoShowMutation.variables?.userId ?? null}
      />

      <AdminUserFormModal
        open={formModalState.open}
        mode={formModalState.mode}
        user={formModalState.user}
        onClose={handleCloseFormModal}
        onSuccess={(response) => {
          setFeedback({
            type: 'success',
            message: response?.data?.message ?? (
              formModalState.mode === 'create'
                ? 'Tạo tài khoản nhân sự thành công.'
                : 'Cập nhật thông tin người dùng thành công.'
            ),
          });
          handleCloseFormModal();
        }}
      />

      <AdminUserConfirmDialog
        open={Boolean(dialogState.type && dialogState.user)}
        title={dialogConfig?.title ?? ''}
        description={dialogConfig?.description ?? ''}
        confirmLabel={dialogConfig?.confirmLabel ?? ''}
        confirmVariant={dialogConfig?.confirmVariant ?? 'primary'}
        user={dialogState.user}
        isPending={updateStatusMutation.isPending || resetNoShowMutation.isPending}
        errorMessage={dialogErrorMessage}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDialog}
      />
    </section>
  );
}
