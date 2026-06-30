import { useSearchParams, Link } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import ResetPasswordForm from '../../features/auth/components/ResetPasswordForm.jsx';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

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
          <h1 className="text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {token
              ? 'Tạo mật khẩu mới để tiếp tục đăng nhập vào CarePlus'
              : 'Nhập thông tin để đặt lại mật khẩu tài khoản của bạn'}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <ResetPasswordForm
            defaultValues={{
              email,
              token,
              newPassword: '',
              confirmPassword: '',
            }}
          />
        </div>
      </div>
    </div>
  );
}
