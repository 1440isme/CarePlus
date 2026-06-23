import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';
import ChatWidget from '../ui/ChatWidget.jsx';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
      <ChatWidget />
    </div>
  );
}