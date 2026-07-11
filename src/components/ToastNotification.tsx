import { CheckCircle2 } from 'lucide-react';

export default function ToastNotification({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      className="fixed bottom-5 right-5 z-[9999] animate-slide-up nl-alert nl-alert-success shadow-[var(--shadow-lg)]"
      style={{ minWidth: 260, maxWidth: 380 }}
      role="status"
    >
      <div className="nl-alert-icon"><CheckCircle2 size={15} /></div>
      <p className="nl-alert-title">{message}</p>
    </div>
  );
}
