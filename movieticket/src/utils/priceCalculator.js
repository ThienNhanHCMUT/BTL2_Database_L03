import { DAY_TYPES } from './constants';

/**
 * Giá vé = BasePrice × PriceMultiplier (chính sách) × SurchargeMultiplier (ghế)
 * Ví dụ: 70,000 × 1.2 (cuối tuần) × 1.5 (VIP) = 126,000đ
 */
export function calculateTicketPrice(basePrice, seatSurcharge = 1.0, policyMultiplier = 1.0) {
  return Math.round(basePrice * policyMultiplier * seatSurcharge);
}

export function getDayType(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  if (day === 0 || day === 6) return 'Cuối tuần';
  return 'Thường';
}

export function getDayMultiplier(dateStr) {
  const type = getDayType(dateStr);
  return DAY_TYPES[type] || 1.0;
}

export function calculateOrderTotal(seats, basePrice, policyMultiplier, combos = [], discount = 0) {
  const ticketTotal = seats.reduce((sum, seat) => {
    return sum + calculateTicketPrice(basePrice, seat.surcharge, policyMultiplier);
  }, 0);

  const comboTotal = combos.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);

  return {
    ticketTotal,
    comboTotal,
    discount,
    grandTotal: Math.max(0, ticketTotal + comboTotal - discount),
  };
}
