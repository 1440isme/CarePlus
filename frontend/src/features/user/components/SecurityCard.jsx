import { Shield, ChevronRight } from 'lucide-react';

export default function SecurityCard({ onChangePassword }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-5 mt-5 shadow-sm">
      <div className="mb-4">
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Bảo mật tài khoản</span>
        <h3 className="text-sm font-bold text-gray-800 mt-0.5">Mật khẩu đăng nhập</h3>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-[#49BCE2]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono tracking-widest text-gray-500">••••••••••</p>
          <p className="text-xs text-gray-400 mt-1">
            Đổi mật khẩu định kỳ để bảo vệ tài khoản và thông tin khám bệnh của bạn.
          </p>
        </div>

        <button
          className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer shrink-0"
          type="button"
          onClick={onChangePassword}
        >
          <span>Đổi mật khẩu</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
