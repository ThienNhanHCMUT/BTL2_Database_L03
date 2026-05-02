import { Download, Ticket as TicketIcon, MapPin, Calendar, Clock, Armchair } from 'lucide-react';
import { formatDateVi, formatTime, formatWeekday } from '../../utils/formatDate';
import { formatCurrency } from '../../utils/formatCurrency';

export default function ETicket({ order }) {
  const primaryTicket = Array.isArray(order?.tickets) && order.tickets.length > 0
    ? order.tickets[0]
    : null;

  const qrPattern =
    primaryTicket?.qrCode ||
    `ORDER-${order?.orderId || 'UNKNOWN'}-${order?.movie?.movieId || 'MOVIE'}`;

  const seatLabels =
    order?.seats?.map((s) => s.label).join(', ') ||
    primaryTicket?.seat?.label ||
    '—';

  const ticketCode = primaryTicket?.ticketId || order?.orderId || '—';

  return (
    <div className="max-w-md mx-auto">
      <div className="relative bg-gradient-to-br from-dark-800 to-dark-700 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-primary/10">
        <div className="relative h-32 overflow-hidden">
          <img
            src={order?.movie?.banner || order?.movie?.poster}
            alt={order?.movie?.vnTitle}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-800 via-dark-800/60 to-transparent" />
          <div className="absolute top-3 left-4 flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <TicketIcon size={16} className="text-white" />
            </div>
            <span className="text-xs uppercase tracking-wider text-white/80 font-bold">
              E-Ticket
            </span>
          </div>
          <div className="absolute bottom-3 left-4 right-4">
            <h2 className="text-white font-bold text-xl leading-tight line-clamp-1">
              {order?.movie?.vnTitle}
            </h2>
            <p className="text-xs text-gray-300 mt-1">
              {order?.showtime?.format} • {order?.showtime?.language} • {order?.movie?.ageRating}
            </p>
          </div>
        </div>

        <div className="relative px-4">
          <div className="border-t-2 border-dashed border-white/10 -mt-px" />
          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-dark-900 -translate-y-1/2" />
          <div className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-dark-900 -translate-y-1/2" />
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Detail icon={MapPin} label="Rạp" value={order?.cinema?.name} />
            <Detail
              icon={Calendar}
              label="Ngày"
              value={
                order?.showtime?.startTime
                  ? `${formatWeekday(order.showtime.startTime)}, ${formatDateVi(order.showtime.startTime)}`
                  : '—'
              }
            />
            <Detail
              icon={Clock}
              label="Giờ"
              value={order?.showtime?.startTime ? formatTime(order.showtime.startTime) : '—'}
            />
            <Detail
              icon={Armchair}
              label="Phòng"
              value={order?.showtime?.roomNumber?.split('_').pop() || order?.showtime?.roomNumber || '—'}
            />
          </div>

          <div className="p-3 bg-dark-900/50 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Ghế</p>
            <p className="text-white font-bold tracking-wide">{seatLabels}</p>
          </div>

          <div className="flex flex-col items-center gap-2 pt-2">
            <div className="w-40 h-40 bg-white rounded-xl p-3 flex items-center justify-center">
              <FakeQR code={qrPattern} />
            </div>
            <p className="text-xs text-gray-400 font-mono">{ticketCode}</p>
            {Array.isArray(order?.tickets) && order.tickets.length > 1 && (
              <p className="text-[11px] text-gray-500 text-center">
                QR đại diện cho vé đầu tiên trong đơn hàng
              </p>
            )}
          </div>

          <div className="pt-3 border-t border-white/5 flex justify-between items-center">
            <span className="text-gray-400 text-sm">Tổng thanh toán</span>
            <span className="text-primary font-bold text-2xl">
              {formatCurrency(order?.grandTotal || 0)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button className="w-full py-3 bg-dark-800 hover:bg-dark-700 border border-white/10 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
          <Download size={16} />
          Tải vé
        </button>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
        <Icon size={12} />
        <span>{label}</span>
      </div>
      <p className="text-white font-semibold text-sm line-clamp-1">{value}</p>
    </div>
  );
}

function FakeQR({ code }) {
  const size = 21;
  const cells = [];
  let hash = 0;

  for (let i = 0; i < code.length; i++) {
    hash = ((hash << 5) - hash + code.charCodeAt(i)) | 0;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const val = (Math.sin(hash + x * 7 + y * 11) * 10000) & 1;
      if (val) cells.push({ x, y });
    }
  }

  const drawMarker = (ox, oy) => {
    const rects = [];
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const border = dx === 0 || dy === 0 || dx === 6 || dy === 6;
        const inner = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
        if (border || inner) rects.push({ x: ox + dx, y: oy + dy });
      }
    }
    return rects;
  };

  const markers = [...drawMarker(0, 0), ...drawMarker(14, 0), ...drawMarker(0, 14)];
  const isMarkerArea = (x, y) =>
    (x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12);

  return (
    <svg viewBox="0 0 21 21" className="w-full h-full">
      {cells.map(
        (c, i) =>
          !isMarkerArea(c.x, c.y) && (
            <rect key={i} x={c.x} y={c.y} width="1" height="1" fill="#000" />
          )
      )}
      {markers.map((c, i) => (
        <rect key={`m${i}`} x={c.x} y={c.y} width="1" height="1" fill="#000" />
      ))}
    </svg>
  );
}