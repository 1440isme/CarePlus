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
  useResetUserPassword,
  useUpdateUserStatus,
} from '../../features/admin/users/index.js';
import { Plus, X, CheckCircle, XCircle } from 'lucide-react';

const PAGE_LIMIT = 10;
const FEEDBACK_AUTO_HIDE_MS = 5000;

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
    case 'CANNOT_RESET_OWN_PASSWORD':
      return 'Không thể tự reset mật khẩu của chính mình.';
    case 'INVALID_USER_STATUS':
      return 'Trạng thái tài khoản không hợp lệ.';
    case 'USER_EMAIL_NOT_FOUND':
      return 'Người dùng chưa có email để nhận mật khẩu mới.';
    case 'UPDATE_USER_STATUS_FAILED':
      return 'Cập nhật trạng thái tài khoản thất bại.';
    case 'RESET_NO_SHOW_FAILED':
      return 'Reset số lần vắng mặt thất bại.';
    case 'SEND_RESET_PASSWORD_EMAIL_FAILED':
      return 'Không gửi được email thông báo mật khẩu mới.';
    case 'RESET_USER_PASSWORD_FAILED':
      return 'Reset mật khẩu thất bại.';
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
  const resetPasswordMutation = useResetUserPassword({
    onSuccess: (response) => {
      setFeedback({
        type: 'success',
        message: response?.data?.message ?? 'Đã reset mật khẩu và gửi thông báo qua email cho người dùng.',
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

    if (dialogState.type === 'reset-no-show') {
      return {
        title: 'Reset số lần vắng mặt',
        description: 'Bạn có chắc muốn reset số lần vắng mặt của người dùng này không?',
        confirmLabel: 'Reset',
        confirmVariant: 'primary',
        pendingLabel: 'Đang reset...',
      };
    }

    if (dialogState.type === 'reset-password') {
      return {
        title: 'Reset mật khẩu người dùng',
        description: 'Bạn có chắc muốn reset mật khẩu của người dùng này không? Mật khẩu tạm thời mới sẽ được gửi qua email của người dùng.',
        confirmLabel: 'Reset mật khẩu',
        confirmVariant: 'primary',
        pendingLabel: 'Đang reset...',
      };
    }

    return null;
  }, [dialogState.type]);

  const dialogErrorMessage = dialogState.type === 'reset-no-show'
    ? (resetNoShowMutation.error ? getMutationErrorMessage(resetNoShowMutation.error) : '')
    : dialogState.type === 'reset-password'
      ? (resetPasswordMutation.error ? getMutationErrorMessage(resetPasswordMutation.error) : '')
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
    if (!updateStatusMutation.isPending && !resetNoShowMutation.isPending && !resetPasswordMutation.isPending) {
      updateStatusMutation.reset();
      resetNoShowMutation.reset();
      resetPasswordMutation.reset();
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

    if (dialogState.type === 'reset-no-show') {
      resetNoShowMutation.mutate({ userId: dialogState.user.id });
      return;
    }

    if (dialogState.type === 'reset-password') {
      resetPasswordMutation.mutate({ userId: dialogState.user.id });
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý tài khoản người dùng và nhân sự trong hệ thống</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFeedback(null);
            setFormModalState({
              open: true,
              mode: 'create',
              user: null,
            });
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#49BCE2] hover:bg-[#3ca4c5] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Tạo tài khoản nhân sự
        </button>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
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

        {/* Feedback Banner */}
        {feedback ? (
          <div
            className={`mx-5 mt-4 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${
              feedback.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success'
                ? <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                : <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              }
              {feedback.message}
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              aria-label="Ẩn thông báo"
              className="text-current opacity-60 hover:opacity-100 transition-opacity flex-shrink-0 text-lg leading-none"
            >
              ×
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
          resetPasswordMutation.reset();
          setDialogState({
            type: user.status === 'ACTIVE' ? 'lock' : 'unlock',
            user,
          });
        }}
        onRequestResetNoShow={(user) => {
          updateStatusMutation.reset();
          resetNoShowMutation.reset();
          resetPasswordMutation.reset();
          setDialogState({
            type: 'reset-no-show',
            user,
          });
        }}
        onRequestResetPassword={(user) => {
          updateStatusMutation.reset();
          resetNoShowMutation.reset();
          resetPasswordMutation.reset();
          setDialogState({
            type: 'reset-password',
            user,
          });
        }}
        isStatusUpdating={updateStatusMutation.isPending}
        statusUpdatingUserId={updateStatusMutation.variables?.userId ?? null}
        isResettingNoShow={resetNoShowMutation.isPending}
        resetNoShowUserId={resetNoShowMutation.variables?.userId ?? null}
        isResettingPassword={resetPasswordMutation.isPending}
        resetPasswordUserId={resetPasswordMutation.variables?.userId ?? null}
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
        pendingLabel={dialogConfig?.pendingLabel ?? 'Đang xử lý...'}
        confirmVariant={dialogConfig?.confirmVariant ?? 'primary'}
        user={dialogState.user}
        isPending={updateStatusMutation.isPending || resetNoShowMutation.isPending || resetPasswordMutation.isPending}
        errorMessage={dialogErrorMessage}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDialog}
      />
    </div>
  );
}
