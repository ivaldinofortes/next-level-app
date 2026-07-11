import { CheckCircle2 } from 'lucide-react';

export default function ToastNotification({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;
  return <div className="fixed bottom-6 right-6 z-[9999] animate-slide-up nl-alert nl-alert-success shadow-[0_8px_30px_rgba(9,30,66,0.14)]" style={{ minWidth: 260, maxWidth: 380 }}><div className="nl-alert-icon"><CheckCircle2 size={15} /></div><p className="nl-alert-title">{message}</p></div>;
}
