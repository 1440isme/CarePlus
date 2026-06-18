import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  DeleteProfileModal,
  PatientProfileFormModal,
  PatientProfilesList,
  RelativeDetailModal,
  useCreatePatientProfile,
  useDeletePatientProfile,
  usePatientProfiles,
  useUpdatePatientProfile,
} from '../../features/patient-profile/index.js';
import './patient-portal.css';

function getListErrorMessage(error) {
  switch (error?.code) {
    case 'VALIDATION_ERROR':
      return 'Không thể tải danh sách hồ sơ vì tham số chưa hợp lệ.';
    default:
      return error?.message ?? 'Đã có lỗi xảy ra khi lấy hồ sơ người thân.';
  }
}

function PageState({ title, message, actionLabel, onAction, to }) {
  const action = to ? (
    <Link className="patient-profile-primary-button patient-profile-inline-button" to={to}>
      {actionLabel}
    </Link>
  ) : (
    <button className="patient-profile-primary-button patient-profile-inline-button" type="button" onClick={onAction}>
      {actionLabel}
    </button>
  );

  return (
    <section className="patient-relatives-page">
      <div className="patient-relatives-header">
        <div>
          <h2 className="patient-relatives-title">{title}</h2>
        </div>
      </div>

      <div className="patient-profile-state-panel">
        <p className="patient-profile-state-text">{message}</p>
        {action}
      </div>
    </section>
  );
}

export default function PatientRelativesPage() {
  const accessToken = useSelector((state) => state.auth.accessToken);
  const patientProfilesQuery = usePatientProfiles(
    { page: 1, limit: 100 },
    { enabled: Boolean(accessToken) },
  );
  const createMutation = useCreatePatientProfile();
  const updateMutation = useUpdatePatientProfile();
  const deleteMutation = useDeletePatientProfile();
  const [activeModal, setActiveModal] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const profiles = useMemo(() => {
    const list = patientProfilesQuery.data?.data ?? [];
    return list.filter((profile) => profile.isActive);
  }, [patientProfilesQuery.data]);

  const closeModal = () => {
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
    setActiveModal(null);
    setSelectedProfile(null);
  };

  const openCreateModal = () => {
    setFeedbackMessage('');
    setSelectedProfile(null);
    setActiveModal('create');
  };

  const openDetailModal = (profile) => {
    setFeedbackMessage('');
    setSelectedProfile(profile);
    setActiveModal('detail');
  };

  const openDeleteModal = (profile) => {
    setFeedbackMessage('');
    setSelectedProfile(profile);
    setActiveModal('delete');
  };

  if (!accessToken) {
    return (
      <PageState
        title="Hồ sơ người thân"
        message="Bạn cần đăng nhập để quản lý hồ sơ người thân."
        actionLabel="Đi đến đăng nhập"
        to="/dang-nhap"
      />
    );
  }

  if (patientProfilesQuery.isLoading) {
    return (
      <section className="patient-relatives-page">
        <div className="patient-relatives-header">
          <div>
            <h2 className="patient-relatives-title">Hồ sơ người thân</h2>
          </div>
        </div>

        <div className="patient-relatives-card patient-relatives-loading-card">
          <div className="patient-profile-skeleton patient-relatives-skeleton-header" />
          <div className="patient-profile-skeleton patient-relatives-skeleton-row" />
          <div className="patient-profile-skeleton patient-relatives-skeleton-row" />
        </div>
      </section>
    );
  }

  if (patientProfilesQuery.isError) {
    return (
      <PageState
        title="Hồ sơ người thân"
        message={getListErrorMessage(patientProfilesQuery.error)}
        actionLabel="Thử lại"
        onAction={() => patientProfilesQuery.refetch()}
      />
    );
  }

  return (
    <>
      <PatientProfilesList
        profiles={profiles}
        onCreate={openCreateModal}
        onViewDetail={openDetailModal}
        onDelete={openDeleteModal}
      />

      {feedbackMessage ? <p className="patient-relatives-page-feedback">{feedbackMessage}</p> : null}

      {activeModal === 'detail' && selectedProfile ? (
        <RelativeDetailModal
          profile={selectedProfile}
          onClose={closeModal}
          onEdit={() => {
            setActiveModal('edit');
          }}
        />
      ) : null}

      {activeModal === 'create' ? (
        <PatientProfileFormModal
          mode="create"
          profile={null}
          mutation={createMutation}
          onSubmittedSuccess={() => {
            setFeedbackMessage('Thêm hồ sơ người thân thành công.');
          }}
          onClose={closeModal}
        />
      ) : null}

      {activeModal === 'edit' && selectedProfile ? (
        <PatientProfileFormModal
          mode="edit"
          profile={selectedProfile}
          mutation={updateMutation}
          onSubmittedSuccess={() => {
            setFeedbackMessage('Cập nhật hồ sơ người thân thành công.');
          }}
          onClose={closeModal}
        />
      ) : null}

      {activeModal === 'delete' && selectedProfile ? (
        <DeleteProfileModal
          profile={selectedProfile}
          mutation={deleteMutation}
          onClose={closeModal}
          onConfirm={() => {
            deleteMutation.mutate(selectedProfile.id, {
              onSuccess: () => {
                setFeedbackMessage('Xóa hồ sơ người thân thành công.');
                closeModal();
              },
            });
          }}
        />
      ) : null}
    </>
  );
}
