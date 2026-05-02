import { Clock, AlertTriangle } from 'lucide-react';
import { formatCountdown } from '../../utils/formatDate';
import { useCountdown } from '../../hooks/useCountdown';

export default function Timer({ className = '' }) {
  const { timeLeft, isActive, isWarning, isDanger } = useCountdown();

  if (!isActive) return null;

  const bgClass = isDanger
    ? 'bg-red-500/15 border-red-500/40 text-red-300'
    : isWarning
    ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-300'
    : 'bg-primary/15 border-primary/40 text-primary';

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${bgClass} ${className} ${isDanger ? 'animate-pulse' : ''}`}>
      {isDanger ? <AlertTriangle size={16} /> : <Clock size={16} />}
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wider opacity-70">Giữ ghế</span>
        <span className="font-mono font-bold text-lg">{formatCountdown(timeLeft)}</span>
      </div>
    </div>
  );
}
