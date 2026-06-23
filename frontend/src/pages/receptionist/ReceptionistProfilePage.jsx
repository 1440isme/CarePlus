import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Edit2, Save, Lock, CheckCircle } from 'lucide-react';
import { useMe } from '../../features/user/hooks/useMe.js';
import { useUpdateMe } from '../../features/user/hooks/useUpdateMe.js';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';

// ── Zod schema ──────────────────────────────────────────────────────────────
const localUpdateSchema = z.object({
  name: z.string().trim().min(1, 'Họ tên không được để trống').max(100, 'Họ tên tối đa 100 ký tự'),
  phone: z.string().trim().regex(/^(0|\+84)(3|5|7|8|9)\d{8}$/, 'Số điện thoại không hợp lệ'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], { message: 'Giới tính không hợp lệ' }),
  dateOfBirth: z.string().trim().min(1, 'Ngày sinh không được để trống'),
  address: z.string().trim().min(1, 'Địa chỉ không được để trống').max(255, 'Địa chỉ tối đa 255 ký tự'),
});

// ── Utility functions ────────────────────────────────────────────────────────
function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function convertDmYToYmd(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
}

function convertYmdToDmY(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getInitials(name) {
  if (!name) return 'LT';
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'LT';
}

// ── Reusable sub-components ──────────────────────────────────────────────────
function ReadRow({ label, value, icon }) {
  return (
    <div className="flex items-start justify-between py-4 gap-4">
      <span className="text-sm text-gray-500 shrink-0 w-32">{label}</span>
      <span className="text-sm font-medium text-gray-900 text-right flex items-center gap-1.5">
        {icon && icon}
        {value || '--'}
      </span>
    </div>
  );
}

function EditField({ label, error, children }) {
  return (
    <div className="py-3">
      <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function ReceptionistProfilePage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [statusBanner, setStatusBanner] = useState(null);

  const { data: meResponse, isLoading, isError, error } = useMe();
  const user = meResponse?.data;

  const updateMeMutation = useUpdateMe({
    onSuccess: () => {
      setStatusBanner({ type: 'success', message: 'Cập nhật thông tin cá nhân thành công!' });
      setIsEditMode(false);
      setTimeout(() => setStatusBanner(null), 3000);
    },
    onError: (err) => {
      setStatusBanner({
        type: 'error',
        message:
          err?.response?.data?.error?.message || err?.message || 'Có lỗi xảy ra khi lưu thông tin.',
      });
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(localUpdateSchema),
    defaultValues: {
      name: '',
      phone: '',
      gender: '',
      dateOfBirth: '',
      address: '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        phone: user.phone || '',
        gender: user.gender || '',
        dateOfBirth: convertDmYToYmd(user.dateOfBirth),
        address: user.address || '',
      });
    }
  }, [user, reset]);

  // ── Loading state ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 mx-auto border-[3px] border-gray-200 border-t-[#49BCE2] rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Đang tải thông tin cá nhân...</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (isError || !user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <StateBlock
          variant="danger"
          title="Không thể tải thông tin cá nhân"
          description={error?.message || 'Đã có lỗi xảy ra trên hệ thống. Vui lòng thử lại sau.'}
        />
      </div>
    );
  }

  const handleEditClick = () => {
    setIsEditMode(true);
    setStatusBanner(null);
  };

  const handleCancelClick = () => {
    setIsEditMode(false);
    setStatusBanner(null);
    reset({
      name: user.name || '',
      phone: user.phone || '',
      gender: user.gender || '',
      dateOfBirth: convertDmYToYmd(user.dateOfBirth),
      address: user.address || '',
    });
  };

  const onSubmit = (values) => {
    const formattedDob = convertYmdToDmY(values.dateOfBirth);
    const payload = {};
    if (values.name !== user.name) payload.name = values.name.trim();
    if (values.phone !== user.phone) payload.phone = values.phone.trim();
    if (values.gender !== user.gender) payload.gender = values.gender;
    if (formattedDob !== user.dateOfBirth) payload.dateOfBirth = formattedDob;
    if (values.address !== user.address) payload.address = values.address.trim();

    if (Object.keys(payload).length === 0) {
      setIsEditMode(false);
      return;
    }

    updateMeMutation.mutate(payload);
  };

  const inputCls =
    'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* ── Page Title ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông tin cá nhân</h1>
          <p className="mt-1 text-sm text-gray-500">Quản lý thông tin tài khoản của bạn</p>
        </div>

        {/* ── Status Banner ── */}
        {statusBanner && (
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium border ${
              statusBanner.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            {statusBanner.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* ── Card 1: Profile Summary ── */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
            {/* Cyan accent bar */}
            <div className="h-1.5 bg-[#49BCE2]" />

            <div className="flex items-center gap-4 p-5">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-[#49BCE2] flex items-center justify-center text-white text-xl font-bold shrink-0 select-none">
                {getInitials(user.name)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{user.name}</h2>
                <p className="text-sm font-semibold text-[#49BCE2]">Lễ tân</p>
                <span className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  Hoạt động
                </span>
              </div>

              {/* Edit button */}
              {!isEditMode && (
                <button
                  type="button"
                  className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#49BCE2] text-[#49BCE2] text-sm font-semibold hover:bg-[#EFF9FD] transition"
                  onClick={handleEditClick}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>

          {/* ── Card 2: Details / Edit Form ── */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-xs">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-700">
                {isEditMode ? 'Chỉnh sửa thông tin' : 'Thông tin chi tiết'}
              </h3>
            </div>

            {isEditMode ? (
              /* ── Edit mode ── */
              <div className="px-5 divide-y divide-gray-100">
                <EditField label="Họ và tên" error={errors.name?.message}>
                  <input type="text" className={inputCls} {...register('name')} />
                </EditField>

                <EditField label="Email">
                  <div className="relative">
                    <input
                      type="email"
                      className={`${inputCls} pr-9 bg-gray-50 text-gray-400 cursor-not-allowed`}
                      value={user.email}
                      readOnly
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Email không thể thay đổi.</p>
                </EditField>

                <EditField label="Số điện thoại" error={errors.phone?.message}>
                  <input type="text" className={inputCls} {...register('phone')} />
                </EditField>

                <EditField label="Giới tính" error={errors.gender?.message}>
                  <select className={inputCls} {...register('gender')}>
                    <option value="">Chọn giới tính</option>
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </EditField>

                <EditField label="Ngày sinh" error={errors.dateOfBirth?.message}>
                  <input type="date" className={inputCls} {...register('dateOfBirth')} />
                </EditField>

                <EditField label="Địa chỉ" error={errors.address?.message}>
                  <input type="text" className={inputCls} {...register('address')} />
                </EditField>
              </div>
            ) : (
              /* ── Read-only mode ── */
              <div className="px-5 divide-y divide-gray-100">
                <ReadRow label="Họ và tên" value={user.name} />
                <ReadRow
                  label="Email"
                  value={user.email}
                  icon={<Lock className="w-3 h-3 text-gray-400" />}
                />
                <ReadRow label="Số điện thoại" value={user.phone} />
                <ReadRow
                  label="Giới tính"
                  value={
                    user.gender === 'MALE'
                      ? 'Nam'
                      : user.gender === 'FEMALE'
                      ? 'Nữ'
                      : user.gender === 'OTHER'
                      ? 'Khác'
                      : '--'
                  }
                />
                <ReadRow label="Ngày sinh" value={formatDateForDisplay(user.dateOfBirth)} />
                <ReadRow label="Địa chỉ" value={user.address} />
              </div>
            )}

            {/* ── Save / Cancel buttons ── */}
            {isEditMode && (
              <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
                <button
                  type="button"
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                  onClick={handleCancelClick}
                  disabled={updateMeMutation.isPending}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#49BCE2] text-white text-sm font-semibold hover:bg-[#3ca4c5] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={updateMeMutation.isPending || !isDirty}
                >
                  {updateMeMutation.isPending ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
