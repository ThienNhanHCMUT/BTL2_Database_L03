/*
import { SEAT_STATUS } from './constants';

export function generateSeatGrid(roomConfig, bookedPercentage = 0.25) {
  const { rows, columns, vipRows = [], coupleRows = [], emptyPositions = [] } = roomConfig;
  const grid = [];

  for (const row of rows) {
    const rowSeats = [];
    const isVip = vipRows.includes(row);
    const isCouple = coupleRows.includes(row);
    const colCount = isCouple ? Math.floor(columns / 2) : columns;

    for (let col = 1; col <= colCount; col++) {
      const isEmpty = emptyPositions.some((p) => p.row === row && p.col === col);
      if (isEmpty) {
        rowSeats.push({ row, col, type: 'empty', status: 'empty' });
        continue;
      }

      const isBooked = Math.random() < bookedPercentage;
      const seatType = isCouple ? 'Đôi' : isVip ? 'VIP' : 'Thường';
      const surcharge = isCouple ? 2.0 : isVip ? 1.5 : 1.0;

      rowSeats.push({
        row,
        col,
        type: seatType,
        status: isBooked ? SEAT_STATUS.BOOKED : SEAT_STATUS.AVAILABLE,
        surcharge,
        zone: isCouple ? 'Sweetbox' : isVip ? 'VIP' : 'Standard',
        label: `${row}${col}`,
      });
    }
    grid.push({ row, seats: rowSeats, isCouple });
  }

  return grid;
}

export function getSeatLabel(row, col) {
  return `${row}${col}`;
}

export function isSeatSelected(selectedSeats, row, col) {
  return selectedSeats.some((s) => s.row === row && s.col === col);
}

export function getSeatClass(seat, isSelected) {
  if (seat.status === SEAT_STATUS.BOOKED) return 'seat seat--booked';
  if (seat.status === 'broken') return 'seat seat--broken';
  if (isSelected) return 'seat seat--selected';

  switch (seat.type) {
    case 'VIP': return 'seat seat--vip';
    case 'Đôi': return 'seat seat--couple';
    default: return 'seat seat--standard';
  }
}

export const ROOM_CONFIGS = {
  standard_large: {
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M'],
    columns: 14,
    vipRows: ['F', 'G', 'H', 'J'],
    coupleRows: ['L', 'M'],
    emptyPositions: [
      { row: 'A', col: 1 }, { row: 'A', col: 2 },
      { row: 'A', col: 13 }, { row: 'A', col: 14 },
    ],
  },
  standard_medium: {
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K'],
    columns: 12,
    vipRows: ['E', 'F', 'G', 'H'],
    coupleRows: ['J', 'K'],
    emptyPositions: [],
  },
  standard_small: {
    rows: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
    columns: 10,
    vipRows: ['D', 'E', 'F'],
    coupleRows: [],
    emptyPositions: [],
  },
};
*/