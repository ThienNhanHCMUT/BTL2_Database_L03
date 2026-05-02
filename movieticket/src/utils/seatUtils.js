export function isSeatSelected(selectedSeats, row, col) {
  return selectedSeats.some((seat) => seat.row === row && seat.col === col);
}

export function getSeatClass(seat, isSelected) {
  if (seat.type === 'empty') {
    return 'opacity-0 pointer-events-none';
  }

  if (isSelected) {
    return 'rounded-md bg-[#3B82F6] hover:bg-[#2563EB] transition-colors';
  }

  if (seat.status === 'booked') {
    return 'rounded-md bg-[#1A202C] border border-white/10 cursor-not-allowed';
  }

  if (seat.status === 'broken') {
    return 'rounded-md bg-[#374151] opacity-30 cursor-not-allowed';
  }

  if (seat.type === 'VIP') {
    return 'rounded-md bg-[#D69E2E] hover:brightness-110 transition-colors';
  }

  if (seat.type === 'Đôi') {
    return 'rounded-md bg-[#E53E8C] hover:brightness-110 transition-colors';
  }

  return 'rounded-md bg-[#4A5568] hover:brightness-110 transition-colors';
}

// Giữ lại để tránh lỗi nếu file khác còn import
export const ROOM_CONFIGS = {};

export function generateSeatGrid() {
  return [];
}