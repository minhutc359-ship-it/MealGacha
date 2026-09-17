import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';
import { BottomNav } from './components/layout/BottomNav';
import { Toast } from './components/ui/Toast';
import { ChestPage } from './pages/ChestPage';
import { CollectionPage } from './pages/CollectionPage';
import { WheelPage } from './pages/WheelPage';
import { SettingsPage } from './pages/SettingsPage';

function AppInner() {
  const init = useAppStore((s) => s.init);
  const navigate = useNavigate();

  useEffect(() => { init(); }, []);

  // Cross-tab sync: reload user state when another tab mutates localStorage
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'foodchest.user.v1' && e.newValue) {
        useAppStore.setState({ user: useAppStore.getState()['user'] });
        useAppStore.getState().init();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    const handler = () => navigate('/collection');
    window.addEventListener('nav:collection', handler);
    return () => window.removeEventListener('nav:collection', handler);
  }, [navigate]);

  return (
    <div style={{ background: '#080c18', minHeight: '100dvh' }}>
      <Toast />
      <Routes>
        <Route path="/" element={<ChestPage />} />
        <Route path="/collection" element={<CollectionPage />} />
        <Route path="/wheel" element={<WheelPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
      <BottomNav />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
