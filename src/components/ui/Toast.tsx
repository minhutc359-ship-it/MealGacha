import { useAppStore } from '../../store/useAppStore';

export function Toast() {
  const toast = useAppStore((s) => s.toast);
  const dismiss = useAppStore((s) => s.dismissToast);
  if (!toast) return null;

  const colors: Record<string, string> = {
    success: 'border-green-500/40 bg-green-900/30 text-green-300',
    error: 'border-red-500/40 bg-red-900/30 text-red-300',
    info: 'border-[#00d4ff]/30 bg-[#00d4ff]/10 text-[#00d4ff]',
  };

  return (
    <div
      onClick={dismiss}
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-[90vw] px-4 py-3 rounded-xl border text-sm font-medium cursor-pointer animate-fade-in-up shadow-lg ${colors[toast.type]}`}
    >
      {toast.message}
    </div>
  );
}
