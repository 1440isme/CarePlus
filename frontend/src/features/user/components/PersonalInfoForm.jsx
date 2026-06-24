import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import ProfileAvatarUpload from './ProfileAvatarUpload.jsx';
import { updateMeSchema } from '../schemas/user.schema.js';
import { useUpdateMe } from '../hooks/useUpdateMe.js';
import { Lock } from 'lucide-react';

function getUpdateErrorMessage(error) {
  switch (error?.code) {
    case 'VALIDATION_ERROR':
      return 'Dữ liệu cập nhật không hợp lệ.';
    case 'USER_NOT_FOUND':
      return 'Không tìm thấy người dùng.';
    default:
      return error?.message ?? 'Không thể cập nhật thông tin cá nhân.';
  }
}

function RequiredLabel({ htmlFor, children }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor={htmlFor}>
      {children}
      <span className="text-red-500 ml-0.5">*</span>
    </label>
  );
}

export default function PersonalInfoForm({
  user,
  draftValues,
  onCancel,
  onSuccess,
}) {
  const form = useForm({
    resolver: zodResolver(updateMeSchema),
    defaultValues: {
      name: draftValues?.name ?? user?.name ?? '',
      phone: draftValues?.phone ?? user?.phone ?? '',
      gender: draftValues?.gender ?? user?.gender ?? '',
      dateOfBirth: draftValues?.dateOfBirth ?? user?.dateOfBirth ?? '',
      address: draftValues?.address ?? user?.address ?? '',
    },
  });

  const updateMeMutation = useUpdateMe({
    onSuccess: (_, variables) => {
      onSuccess?.(variables);
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = form;

  useEffect(() => {
    reset({
      name: draftValues?.name ?? user?.name ?? '',
      phone: draftValues?.phone ?? user?.phone ?? '',
      gender: draftValues?.gender ?? user?.gender ?? '',
      dateOfBirth: draftValues?.dateOfBirth ?? user?.dateOfBirth ?? '',
      address: draftValues?.address ?? user?.address ?? '',
    });
  }, [draftValues, reset, user]);

  const submitHandler = (values) => {
    const draftPayload = {
      name: values.name,
      phone: values.phone,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth,
      address: values.address,
    };

    updateMeMutation.mutate({
      name: values.name,
      phone: values.phone,
      gender: values.gender,
      dateOfBirth: values.dateOfBirth,
      address: values.address,
    }, {
      onSuccess: () => {
        onSuccess?.(draftPayload);
      },
    });
  };

  const cancelHandler = () => {
    reset({
      name: draftValues?.name ?? user?.name ?? '',
      phone: draftValues?.phone ?? user?.phone ?? '',
      gender: draftValues?.gender ?? user?.gender ?? '',
      dateOfBirth: draftValues?.dateOfBirth ?? user?.dateOfBirth ?? '',
      address: draftValues?.address ?? user?.address ?? '',
    });
    onCancel?.();
  };

  const inputStyle = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white";

  return (
    <form className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden" onSubmit={handleSubmit(submitHandler)} noValidate>
      {/* Avatar and Identity */}
      <div className="p-5 border-b border-gray-100 flex items-center gap-4">
        <ProfileAvatarUpload
          name={draftValues?.name ?? user?.name}
          avatarUrl={user?.avatarUrl}
          compact
        />
        <div>
          <h3 className="text-base font-bold text-gray-800">{draftValues?.name ?? user?.name ?? 'Bệnh nhân'}</h3>
          <span className="inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-[#49BCE2] border border-blue-100">
            Bệnh nhân
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-4">
        {/* Full name */}
        <div>
          <RequiredLabel htmlFor="patient-name">Họ và tên</RequiredLabel>
          <input
            id="patient-name"
            className={`${inputStyle} ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
            type="text"
            autoComplete="name"
            {...register('name')}
          />
          {errors.name ? <p className="text-xs text-red-500 mt-1">{errors.name.message}</p> : null}
        </div>

        {/* Email */}
        <div>
          <RequiredLabel htmlFor="patient-email">Email</RequiredLabel>
          <div className="relative">
            <input
              id="patient-email"
              className="w-full border border-gray-200 rounded-lg pl-3 pr-9 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              type="email"
              value={user?.email ?? ''}
              readOnly
              disabled
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-4 h-4" />
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Email dùng để đăng nhập và nhận xác nhận lịch hẹn, không thể chỉnh sửa tại đây.
          </p>
        </div>

        {/* Phone */}
        <div>
          <RequiredLabel htmlFor="patient-phone">Số điện thoại</RequiredLabel>
          <input
            id="patient-phone"
            className={`${inputStyle} ${errors.phone ? 'border-red-400 focus:ring-red-400' : ''}`}
            type="tel"
            autoComplete="tel"
            {...register('phone')}
          />
          {errors.phone ? <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p> : null}
        </div>

        {/* Gender */}
        <div>
          <RequiredLabel htmlFor="patient-gender">Giới tính</RequiredLabel>
          <select id="patient-gender" className={inputStyle} {...register('gender')}>
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
        </div>

        {/* DOB */}
        <div>
          <RequiredLabel htmlFor="patient-birthdate">Ngày sinh</RequiredLabel>
          <div className="relative">
            <input
              id="patient-birthdate"
              className={`${inputStyle} ${errors.dateOfBirth ? 'border-red-400 focus:ring-red-400' : ''}`}
              type="date"
              {...register('dateOfBirth')}
            />
          </div>
          {errors.dateOfBirth ? <p className="text-xs text-red-500 mt-1">{errors.dateOfBirth.message}</p> : null}
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor="patient-address">Địa chỉ</label>
          <textarea
            id="patient-address"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white resize-none"
            rows={2}
            {...register('address')}
          />
        </div>

        {updateMeMutation.error ? (
          <p className="text-xs text-red-500">{getUpdateErrorMessage(updateMeMutation.error)}</p>
        ) : null}

        {updateMeMutation.isSuccess ? (
          <p className="text-xs text-green-600">
            {updateMeMutation.data?.data?.message ?? 'Cập nhật thông tin cá nhân thành công.'}
          </p>
        ) : null}

        <div className="flex gap-2.5 mt-2">
          <button
            className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 font-semibold hover:bg-gray-50 cursor-pointer transition-colors"
            type="button"
            onClick={cancelHandler}
            disabled={updateMeMutation.isPending}
          >
            Hủy
          </button>
          <button
            className="flex-1 py-2 bg-[#49BCE2] text-white rounded-lg text-sm font-semibold hover:bg-[#3ca4c7] cursor-pointer transition-colors disabled:bg-gray-150 disabled:text-gray-400 disabled:cursor-not-allowed"
            type="submit"
            disabled={updateMeMutation.isPending || !isDirty}
          >
            {updateMeMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </form>
  );
}
