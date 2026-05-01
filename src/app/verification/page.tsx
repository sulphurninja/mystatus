import VerificationDashboard from '@/components/verification/VerificationDashboard';

export default function VerificationPage() {
  return <VerificationDashboard tokenStorageKey="verificationToken" apiBasePath="/api/admin/shares" />;
}
