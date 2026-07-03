import DoctorProfileForm from '../../features/doctor/components/DoctorProfileForm.jsx';
import { useDoctorProfile, useUpdateDoctorProfile } from '../../features/doctor/index.js';
import { ChangePasswordModal, SecurityCard } from '../../features/user/index.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import { useState } from 'react';
import './doctor.css';
import '../patient/patient-portal.css';

export default function DoctorProfilePage() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const profileQuery = useDoctorProfile();
  const updateMutation = useUpdateDoctorProfile();

  if (profileQuery.isLoading) {
    return <LoadingBlock label="Đang tải hồ sơ bác sĩ..." />;
  }

  if (profileQuery.error) {
    return <StateBlock variant="error" title="Không thể tải hồ sơ bác sĩ" description={profileQuery.error.message} />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <DoctorProfileForm
        doctor={profileQuery.data?.data}
        isSubmitting={updateMutation.isPending}
        submitError={updateMutation.error?.message}
        onSubmit={(values) => updateMutation.mutateAsync(values)}
      />
      <SecurityCard onChangePassword={() => setIsPasswordModalOpen(true)} />
      <ChangePasswordModal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
