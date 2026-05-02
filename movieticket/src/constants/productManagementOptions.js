export const PRODUCT_TYPE_OPTIONS = [
  { value: 'Combo', label: 'Combo' },
  { value: 'Bắp', label: 'Bắp' },
  { value: 'Nước', label: 'Nước' },
  { value: 'Snack', label: 'Snack' },
  { value: 'Khác', label: 'Khác' },
];

export const PRODUCT_STATUS_OPTIONS = [
  { value: 'Đang bán', label: 'Đang bán' },
  { value: 'Tạm ngưng', label: 'Tạm ngưng' },
  { value: 'Hết hàng', label: 'Hết hàng' },
  { value: 'Ngừng bán', label: 'Ngừng bán' },
];

export const SUMMARY_SORT_OPTIONS = [
  { value: 'productId', label: 'Mã sản phẩm' },
  { value: 'productName', label: 'Tên sản phẩm' },
  { value: 'productType', label: 'Loại sản phẩm' },
  { value: 'productStatus', label: 'Trạng thái' },
  { value: 'totalOrders', label: 'Tổng đơn hàng' },
  { value: 'totalQuantitySold', label: 'Tổng số lượng bán' },
  { value: 'totalRevenue', label: 'Tổng doanh thu' },
];

export const EMPTY_PRODUCT_SUMMARY_FILTERS = {
  productType: '',
  fromDate: '',
  toDate: '',
  minTotalQuantity: '',
  minTotalRevenue: '',
};

export const EMPTY_CUSTOMER_NET_VALUE_FORM = {
  personId: '',
  fromDate: '',
  toDate: '',
};

export function createEmptyProductForm(productId = '') {
  return {
    productId,
    productName: '',
    productType: 'Combo',
    basePrice: '',
    productStatus: 'Đang bán',
  };
}
