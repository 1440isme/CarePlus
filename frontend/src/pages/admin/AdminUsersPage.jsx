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

function PlusIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4.25v11.5M4.25 10h11.5" />
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

export default function AdminUsersPage() {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
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

  const queryParams = useMemo(() => ({
    page: currentPage,
    limit: PAGE_LIMIT,
    search: normalizeSearch(debouncedSearch),
    role: selectedRole === 'ALL' ? undefined : selectedRole,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
  }), [currentPage, debouncedSearch, selectedRole, selectedStatus]);

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
    ? getMutationErrorMessage(resetNoShowMutation.error)
    : getMutationErrorMessage(updateStatusMutation.error);

  const handleRoleChange = (value) => {
    setSelectedRole(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

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
          roleOptions={ADMIN_USER_ROLE_OPTIONS}
          statusOptions={ADMIN_USER_STATUS_OPTIONS}
        />

        {feedback ? (
          <p className={`admin-users-feedback ${feedback.type === 'success' ? 'is-success' : 'is-error'}`}>
            {feedback.message}
          </p>
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
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onRequestLockToggle={(user) => {
          setDialogState({
            type: user.status === 'ACTIVE' ? 'lock' : 'unlock',
            user,
          });
        }}
        isStatusUpdating={updateStatusMutation.isPending}
        statusUpdatingUserId={updateStatusMutation.variables?.userId ?? null}
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
