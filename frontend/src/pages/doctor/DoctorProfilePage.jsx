import DoctorProfileForm from '../../features/doctor/components/DoctorProfileForm.jsx';
import { useDoctorProfile, useUpdateDoctorProfile } from '../../features/doctor/index.js';
import LoadingBlock from '../../shared/components/feedback/LoadingBlock.jsx';
import StateBlock from '../../shared/components/feedback/StateBlock.jsx';
import './doctor.css';

export default function DoctorProfilePage() {
  const profileQuery = useDoctorProfile();
  const updateMutation = useUpdateDoctorProfile();

  if (profileQuery.isLoading) {
    return <LoadingBlock label="Đang tải hồ sơ bác sĩ..." />;
  }

  if (profileQuery.error) {
    return <StateBlock variant="error" title="Không thể tải hồ sơ bác sĩ" description={profileQuery.error.message} />;
  }

  return (
    <DoctorProfileForm
      doctor={profileQuery.data?.data}
      isSubmitting={updateMutation.isPending}
      submitError={updateMutation.error?.message}
      onSubmit={(values) => updateMutation.mutateAsync(values)}
    />
  );
}
