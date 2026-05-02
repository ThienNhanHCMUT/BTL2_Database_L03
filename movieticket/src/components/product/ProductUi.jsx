import {
  AlertCircle,
  CheckCircle2,
  Inbox,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';

export function NoticeBanner({ notice, onClose }) {
  const isSuccess = notice?.type === 'success';
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={`rounded-xl border px-4 py-3 flex items-start justify-between gap-3 ${
        isSuccess
          ? 'bg-success/10 border-success/30 text-green-200'
          : 'bg-error/10 border-error/30 text-red-200'
      }`}
    >
      <div className="flex gap-3">
        <Icon size={18} className="mt-0.5 flex-shrink-0" />
        <p className="text-sm">{notice?.message}</p>
      </div>

      {onClose ? (
        <button type="button" onClick={onClose} className="text-white/70 hover:text-white">
          <X size={16} />
        </button>
      ) : null}
    </div>
  );
}

export function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-red-300 mt-1">{message}</p>;
}

export function MetricCard({ label, value, helper }) {
  return (
    <div className="rounded-xl bg-dark-800 border border-white/5 px-4 py-3">
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
      {helper ? <p className="text-xs text-gray-500 mt-1">{helper}</p> : null}
    </div>
  );
}

export function StatusBadge({ status }) {
  const normalizedStatus = String(status ?? '').toLowerCase();
  const active = normalizedStatus === 'đang bán';
  const warning =
    normalizedStatus === 'tạm ngừng' ||
    normalizedStatus === 'tạm ngưng' ||
    normalizedStatus === 'hết hàng';

  const className = active
    ? 'bg-success/10 text-green-300 border-success/30'
    : warning
      ? 'bg-warning/10 text-yellow-300 border-warning/30'
      : 'bg-red-500/10 text-red-300 border-red-500/30';

  return (
    <span className={`inline-flex px-2.5 py-1 rounded text-xs font-semibold border ${className}`}>
      {status || 'Chưa rõ'}
    </span>
  );
}

export function RoutineBadge({ label }) {
  return (
    <span className="inline-flex px-2.5 py-1 rounded text-xs font-semibold border border-info/30 bg-info/10 text-blue-300">
      {label}
    </span>
  );
}

export function LoadingState({ label = 'Đang tải dữ liệu...' }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center gap-3 text-gray-400">
      <Loader2 className="animate-spin text-primary" size={28} />
      <p>{label}</p>
    </div>
  );
}

export function EmptyState({
  title = 'Chưa có dữ liệu',
  description = 'Hãy thay đổi bộ lọc hoặc thử lại sau.',
  action = null,
}) {
  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-dark-700 text-gray-300 flex items-center justify-center mb-4">
        <Inbox size={22} />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400 mt-2 max-w-xl">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Không thể tải dữ liệu',
  description,
  onRetry,
}) {
  return (
    <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
      <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-300 flex items-center justify-center mb-4">
        <AlertCircle size={22} />
      </div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="text-sm text-gray-400 mt-2 max-w-xl">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-700 hover:bg-dark-600 text-white transition-colors"
        >
          <RefreshCw size={16} />
          Thử lại
        </button>
      ) : null}
    </div>
  );
}

export function InfoValue({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className="font-semibold text-white break-words">{value}</p>
    </div>
  );
}
