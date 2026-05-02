export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '0đ';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + 'đ';
}

export function formatCurrencyFull(amount) {
  if (amount == null || isNaN(amount)) return '0 VND';
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' VND';
}
