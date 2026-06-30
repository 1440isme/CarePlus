import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Inbox, MessageSquare, Calendar, ShieldCheck, Info, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/useNotifications';
import socketService from '../../../shared/services/socket.service';

export default function NotificationBellDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [toastNoti, setToastNoti] = useState(null); // Local realtime toast popup
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUserId = useSelector((state) => state.auth.user?.id);

  const { data, isLoading } = useNotifications({ page: 1, limit: 15 });
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = data?.data?.items || [];
  const unreadCount = data?.data?.unreadCount || 0;

  // Listen to Socket.IO notification:new events
  useEffect(() => {
    const unsubscribe = socketService.onNotification((newNoti) => {
      // Invalidate the cache to fetch fresh notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // If it is a chat notification sent by the current user, do not show the toast
      if (newNoti.type === 'CHAT' && newNoti.senderId === currentUserId) {
        return;
      }

      // Trigger standard audio notification or premium custom toast
      setToastNoti(newNoti);
      
      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => {
        setToastNoti(null);
      }, 5000);

      return () => clearTimeout(timer);
    });

    return () => {
      unsubscribe();
    };
  }, [queryClient, currentUserId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (noti) => {
    if (!noti.isRead) {
      await markReadMutation.mutateAsync(noti.id);
    }
    setIsOpen(false);
    if (noti.link) {
      navigate(noti.link);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    await markAllReadMutation.mutateAsync();
  };

  const getNotiIcon = (type) => {
    switch (type) {
      case 'CHAT':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'APPOINTMENT':
        return <Calendar className="w-4 h-4 text-emerald-500" />;
      case 'APPROVAL':
        return <ShieldCheck className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatRelativeTime = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return past.toLocaleDateString('vi-VN');
  };

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Realtime in-app Toast Notification */}
      {toastNoti && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-white/95 backdrop-blur-md border border-gray-150 rounded-xl shadow-2xl p-4 flex gap-3 transition-all duration-300 animate-slide-in-right transform translate-x-0">
          <div className="w-9 h-9 bg-cyan-50 rounded-full flex items-center justify-center shrink-0 border border-cyan-100">
            {getNotiIcon(toastNoti.type)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-800 truncate">{toastNoti.title}</h4>
            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{toastNoti.content}</p>
            {toastNoti.link && (
              <button
                onClick={() => {
                  navigate(toastNoti.link);
                  setToastNoti(null);
                }}
                className="text-[11px] font-bold text-cyan-600 hover:text-cyan-700 mt-2 block"
              >
                Xem chi tiết →
              </button>
            )}
          </div>
          <button onClick={() => setToastNoti(null)} className="text-gray-400 hover:text-gray-600 shrink-0 self-start">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bell Button trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full relative transition-colors cursor-pointer"
        aria-label="Thông báo"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-gray-150 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-[500px]">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
            <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              Thông báo
              {unreadCount > 0 && (
                <span className="bg-red-50 text-red-600 text-xs px-2 py-0.5 rounded-full font-semibold">
                  {unreadCount} mới
                </span>
              )}
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={markAllReadMutation.isPending}
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 max-h-[400px]">
            {isLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">Đang tải thông báo...</div>
            ) : notifications.length === 0 ? (
              <div className="p-10 text-center text-gray-400 flex flex-col items-center justify-center gap-2">
                <Inbox className="w-8 h-8 text-gray-300" />
                <span className="text-sm">Không có thông báo nào</span>
              </div>
            ) : (
              notifications.map((noti) => (
                <div
                  key={noti.id}
                  onClick={() => handleNotificationClick(noti)}
                  className={`p-3.5 hover:bg-gray-50 cursor-pointer flex gap-3 transition-colors relative group ${
                    !noti.isRead ? 'bg-cyan-50/20' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                    !noti.isRead ? 'bg-cyan-50 border-cyan-100' : 'bg-gray-50 border-gray-100'
                  }`}>
                    {getNotiIcon(noti.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-1">
                      <h5 className={`text-xs md:text-sm text-gray-800 line-clamp-1 ${!noti.isRead ? 'font-bold' : 'font-medium'}`}>
                        {noti.title}
                      </h5>
                      <span className="text-[10px] text-gray-400 shrink-0 font-medium mt-0.5">
                        {formatRelativeTime(noti.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                      {noti.content}
                    </p>
                  </div>
                  {!noti.isRead && (
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-red-500 rounded-full" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
