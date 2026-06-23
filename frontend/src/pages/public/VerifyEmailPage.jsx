import { useSearchParams, Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import VerifyEmailForm from '../../features/auth/components/VerifyEmailForm.jsx';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-cyan-600 rounded-xl flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Care<span className="text-cyan-600">Plus</span></span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Xác minh email</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {email
              ? `Tài khoản ${email} đã được tạo. Vui lòng nhập mã OTP để hoàn tất xác minh email`
              : 'Nhập email và mã OTP để hoàn tất xác minh tài khoản'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <VerifyEmailForm defaultValues={{ email, otp: '' }} />
        </div>
      </div>
    </div>
  );
}
