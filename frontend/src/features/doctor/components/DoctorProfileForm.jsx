import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { doctorProfileSchema } from '../schemas/doctor.schema.js';
import { CheckCircle, Edit2, Save, Lock, AlertCircle } from 'lucide-react';

function getInitials(name) {
  if (!name) return 'BS';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'BS';
}

function RequiredLabel({ htmlFor, children }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 mb-1" htmlFor={htmlFor}>
      {children}
      <span className="text-red-500 ml-0.5">*</span>
    </label>
  );
}

export default function DoctorProfileForm({
  doctor,
  onSubmit,
  isSubmitting,
  submitError,
}) {
  const [isEditMode, setIsEditMode] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(doctorProfileSchema),
    defaultValues: {
      name: doctor?.user?.name || doctor?.name || '',
      phone: doctor?.user?.phone || '',
      title: doctor?.title || '',
      experience: doctor?.experience || 0,
      description: doctor?.description || '',
      position: doctor?.position || '',
    },
  });

  useEffect(() => {
    if (doctor) {
      reset({
        name: doctor.user?.name || doctor.name || '',
        phone: doctor.user?.phone || '',
        title: doctor.title || '',
        experience: doctor.experience || 0,
        description: doctor.description || '',
        position: doctor.position || '',
      });
    }
  }, [doctor, reset]);

  const handleCancel = () => {
    setIsEditMode(false);
    reset({
      name: doctor?.user?.name || doctor?.name || '',
      phone: doctor?.user?.phone || '',
      title: doctor?.title || '',
      experience: doctor?.experience || 0,
      description: doctor?.description || '',
      position: doctor?.position || '',
    });
  };

  const submitWithExit = async (values) => {
    await onSubmit(values);
    setIsEditMode(false);
  };

  const inputStyle = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#49BCE2] bg-white";
  const disabledInput = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed";

  return (
    <form className="max-w-2xl mx-auto flex flex-col gap-5" onSubmit={handleSubmit(submitWithExit)} noValidate>
      {/* Profile summary header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        <div className="bg-[#49BCE2] h-1.5 w-full" />
        <div className="p-5 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 border-2 border-gray-100 flex items-center justify-center text-lg font-bold text-[#49BCE2] flex-shrink-0">
            {getInitials(doctor?.user?.name || doctor?.name)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-lg font-bold text-gray-800">
              {doctor?.title ? `${doctor.title} ` : ''}
              {doctor?.user?.name || doctor?.name || 'Bác sĩ CarePlus'}
            </h2>
            <p className="text-sm text-[#49BCE2] font-medium mt-0.5">
              {doctor?.specialtyName || 'Chuyên khoa'}
            </p>
            <span className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Hoạt động
            </span>
          </div>

          {!isEditMode && (
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="mt-3 sm:mt-0 flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 bg-white hover:bg-gray-50 transition cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>

      {/* Main Form Fields Container */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-6 flex flex-col gap-5">
        <div className="border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-800">Thông tin chi tiết</h3>
          <p className="text-xs text-gray-400 mt-1">Cập nhật hồ sơ năng lực và thông tin liên hệ của bạn.</p>
        </div>

        {isEditMode ? (
          // ─── EDIT MODE ──────────────────────────────────
          <div className="flex flex-col gap-4">
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <RequiredLabel htmlFor="name">Họ và tên</RequiredLabel>
                <input
                  id="name"
                  className={`${inputStyle} ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
                  type="text"
                  {...register('name')}
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <RequiredLabel htmlFor="phone">Số điện thoại</RequiredLabel>
                <input
                  id="phone"
                  className={`${inputStyle} ${errors.phone ? 'border-red-400 focus:ring-red-400' : ''}`}
                  type="tel"
                  {...register('phone')}
                />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
              </div>

              <div>
                <RequiredLabel htmlFor="title">Học hàm / học vị</RequiredLabel>
                <input
                  id="title"
                  className={`${inputStyle} ${errors.title ? 'border-red-400 focus:ring-red-400' : ''}`}
                  type="text"
                  placeholder="Ví dụ: ThS.BS, TS.BS"
                  {...register('title')}
                />
                {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <RequiredLabel htmlFor="experience">Số năm kinh nghiệm</RequiredLabel>
                <input
                  id="experience"
                  className={`${inputStyle} ${errors.experience ? 'border-red-400 focus:ring-red-400' : ''}`}
                  type="number"
                  {...register('experience')}
                />
                {errors.experience && <p className="text-xs text-red-500 mt-1">{errors.experience.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Email
                  <Lock className="w-3 h-3 inline-block ml-1 text-gray-400" />
                </label>
                <input
                  value={doctor?.user?.email || ''}
                  readOnly
                  disabled
                  className={disabledInput}
                />
                <p className="text-[10px] text-gray-400 mt-1">Email dùng đăng nhập, không thể tự sửa.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Chuyên khoa
                  <Lock className="w-3 h-3 inline-block ml-1 text-gray-400" />
                </label>
                <input
                  value={doctor?.specialtyName || ''}
                  readOnly
                  disabled
                  className={disabledInput}
                />
                <p className="text-[10px] text-gray-400 mt-1">Chuyên khoa do Admin quản lý.</p>
              </div>
            </div>

            <div>
              <RequiredLabel htmlFor="position">Chức vụ</RequiredLabel>
              <input
                id="position"
                className={`${inputStyle} ${errors.position ? 'border-red-400 focus:ring-red-400' : ''}`}
                type="text"
                placeholder="Ví dụ: Trưởng khoa, Bác sĩ điều trị"
                {...register('position')}
              />
              {errors.position && <p className="text-xs text-red-500 mt-1">{errors.position.message}</p>}
            </div>

            <div>
              <RequiredLabel htmlFor="description">Giới thiệu bản thân</RequiredLabel>
              <textarea
                id="description"
                rows={4}
                className={`${inputStyle} resize-none ${errors.description ? 'border-red-400 focus:ring-red-400' : ''}`}
                placeholder="Mô tả quá trình đào tạo, thế mạnh chuyên môn..."
                {...register('description')}
              />
              {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
            </div>

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 bg-white hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !isDirty}
                className="flex-1 py-2 bg-[#49BCE2] text-white rounded-lg text-sm font-semibold hover:bg-[#3ca4c5] transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        ) : (
          // ─── READ-ONLY MODE ──────────────────────────────
          <div className="divide-y divide-gray-50">
            {[
              { label: 'Họ và tên', value: doctor?.user?.name || doctor?.name || 'Chưa cập nhật' },
              { label: 'Email đăng nhập', value: doctor?.user?.email || 'Chưa cập nhật' },
              { label: 'Số điện thoại', value: doctor?.user?.phone || 'Chưa cập nhật' },
              { label: 'Học hàm / học vị', value: doctor?.title || 'Chưa cập nhật' },
              { label: 'Chuyên khoa', value: doctor?.specialtyName || 'Chưa cập nhật' },
              { label: 'Chức vụ', value: doctor?.position || 'Chưa cập nhật' },
              { label: 'Kinh nghiệm', value: `${doctor?.experience ?? 0} năm` },
              { label: 'Giới thiệu bản thân', value: doctor?.description || 'Chưa cập nhật', fullWidth: true },
            ].map((row, idx) => (
              <div
                key={idx}
                className={`py-3.5 flex ${row.fullWidth ? 'flex-col gap-1.5' : 'justify-between items-start gap-4'} text-sm`}
              >
                <span className="text-gray-400 font-medium flex-shrink-0">{row.label}</span>
                <span className={`text-gray-700 font-semibold ${row.fullWidth ? 'whitespace-pre-line text-xs font-normal bg-gray-50 p-3 rounded-lg border border-gray-100 leading-relaxed' : 'text-right'}`}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </form>
  );
}
