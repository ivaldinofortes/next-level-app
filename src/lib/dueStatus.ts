export function calculateDueStatus(dueDate: string) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [day, month, year] = dueDate.split('/').map(Number);
    const due = new Date(year, month - 1, day);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    let status = 'pago'; let color = 'text-emerald-600'; let bgColor = 'bg-emerald-50'; let borderColor = 'border-emerald-100'; let barColor = 'bg-emerald-500';
    if (diffDays < 0) { status = 'atrasado'; color = 'text-red-600'; bgColor = 'bg-red-50'; borderColor = 'border-red-100'; barColor = 'bg-red-600'; }
    else if (diffDays === 0) { status = 'hoje'; color = 'text-red-500'; bgColor = 'bg-red-50'; borderColor = 'border-red-200'; barColor = 'bg-red-500'; }
    else if (diffDays <= 3) { status = 'critico'; color = 'text-orange-600'; bgColor = 'bg-orange-50'; borderColor = 'border-orange-100'; barColor = 'bg-orange-500'; }
    else if (diffDays <= 7) { status = 'pendente'; color = 'text-amber-600'; bgColor = 'bg-amber-50'; borderColor = 'border-amber-100'; barColor = 'bg-amber-500'; }
    else if (diffDays <= 15) { status = 'alerta'; color = 'text-yellow-600'; bgColor = 'bg-yellow-50'; borderColor = 'border-yellow-100'; barColor = 'bg-yellow-400'; }
    return { progresso: Math.max(0, Math.min(100, (diffDays / 30) * 100)), status, diffDays, color, bgColor, borderColor, barColor };
  } catch {
    return { progresso: 100, status: 'pago', diffDays: 30, color: 'text-emerald-600', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-100', barColor: 'bg-emerald-500' };
  }
}
