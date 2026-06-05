import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import CookieBanner from './CookieBanner';
import ChatBot from './ChatBot';
import { ToastContainer } from './Toast';
import { ConfirmModal } from './ConfirmModal';
import { useUI } from '../hooks/useUI';
import { UIContext } from '../hooks/UIContext';

export default function Layout() {
  const ui = useUI();

  return (
    <UIContext.Provider value={ui}>
      <div style={{ background: 'var(--color-background-tertiary)', overflow: 'visible' }}>
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </main>
        <CookieBanner />
        <Footer />
        <ChatBot />
        <ToastContainer toasts={ui.toasts} onRemove={ui.removeToast} />
        {ui.confirmState && (
          <ConfirmModal
            options={ui.confirmState.options}
            onConfirm={ui.handleConfirm}
            onCancel={ui.handleCancel}
          />
        )}
      </div>
    </UIContext.Provider>
  );
}