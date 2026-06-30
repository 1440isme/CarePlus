import { useEffect, useId, useMemo, useState } from 'react';
import { useUpdateMyAvatar } from '../hooks/useUpdateMyAvatar.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024;

function getInitials(name) {
  if (!name) {
    return 'BN';
  }

  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('') || 'BN';
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.5 6.25 7.7 4.5h4.6l1.2 1.75H15A1.75 1.75 0 0 1 16.75 8v6A1.75 1.75 0 0 1 15 15.75H5A1.75 1.75 0 0 1 3.25 14V8A1.75 1.75 0 0 1 5 6.25Z" />
      <path d="M10 8.1a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8Z" />
    </svg>
  );
}

function getAvatarUploadErrorMessage(error) {
  switch (error?.code) {
    case 'AVATAR_FILE_REQUIRED':
      return 'Vui lòng chọn ảnh đại diện.';
    case 'INVALID_FILE_TYPE':
      return 'Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.';
    case 'FILE_TOO_LARGE':
      return 'Ảnh đại diện phải nhỏ hơn 2MB.';
    case 'CLOUDINARY_UPLOAD_FAILED':
      return 'Không thể tải ảnh đại diện lên hệ thống.';
    default:
      return error?.message ?? 'Không thể cập nhật ảnh đại diện.';
  }
}

export default function ProfileAvatarUpload({
  name,
  avatarUrl,
  sizeClassName = '',
  errorClassName = '',
  buttonClassName = '',
  compact = false,
}) {
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState('');
  const [localError, setLocalError] = useState('');
  const [visibleError, setVisibleError] = useState('');
  const avatarMutation = useUpdateMyAvatar({
    onSuccess: () => {
      setLocalError('');
      setVisibleError('');
    },
  });

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!localError) {
      return undefined;
    }

    setVisibleError(localError);
    const timeoutId = window.setTimeout(() => {
      setVisibleError('');
      setLocalError('');
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [localError]);

  useEffect(() => {
    if (!avatarMutation.error) {
      return undefined;
    }

    const nextErrorMessage = getAvatarUploadErrorMessage(avatarMutation.error);
    setVisibleError(nextErrorMessage);

    const timeoutId = window.setTimeout(() => {
      setVisibleError('');
    }, 5000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [avatarMutation.error]);

  const effectiveAvatarUrl = useMemo(() => previewUrl || avatarMutation.data?.data?.user?.avatarUrl || avatarUrl || '', [
    avatarMutation.data,
    avatarUrl,
    previewUrl,
  ]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setLocalError('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setLocalError('Ảnh đại diện phải nhỏ hơn 2MB.');
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setPreviewUrl(nextPreviewUrl);
    setLocalError('');

    avatarMutation.mutate(file, {
      onError: () => {
        URL.revokeObjectURL(nextPreviewUrl);
        setPreviewUrl('');
      },
    });
  };

  return (
    <div className={`patient-profile-avatar-upload ${compact ? 'is-compact' : ''}`.trim()}>
      <div className={`patient-profile-avatar-shell ${sizeClassName}`.trim()}>
        {effectiveAvatarUrl ? (
          <img
            className="patient-profile-avatar-image"
            src={effectiveAvatarUrl}
            alt={`Ảnh đại diện của ${name ?? 'bệnh nhân'}`}
          />
        ) : (
          <div className="patient-profile-avatar">{getInitials(name)}</div>
        )}
      </div>

      <label
        className={`patient-profile-avatar-button ${buttonClassName}`.trim()}
        htmlFor={inputId}
        aria-disabled={avatarMutation.isPending}
      >
        <CameraIcon />
        <span>{avatarMutation.isPending ? 'Đang tải...' : 'Cập nhật ảnh'}</span>
      </label>

      <input
        id={inputId}
        className="patient-profile-avatar-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={avatarMutation.isPending}
        onChange={handleFileChange}
      />

      {visibleError ? (
        <p className={`patient-profile-avatar-feedback ${errorClassName}`.trim()}>
          {visibleError}
        </p>
      ) : null}
    </div>
  );
}
