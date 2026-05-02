import { createEmptyProductForm } from '../constants/productManagementOptions';

const FIELD_KEY_MAP = {
  ProductID: 'productId',
  productId: 'productId',
  ProductName: 'productName',
  productName: 'productName',
  ProductType: 'productType',
  productType: 'productType',
  BasePrice: 'basePrice',
  basePrice: 'basePrice',
  ProductStatus: 'productStatus',
  productStatus: 'productStatus',
  PersonID: 'personId',
  personId: 'personId',
  FromDate: 'fromDate',
  fromDate: 'fromDate',
  ToDate: 'toDate',
  toDate: 'toDate',
  MinTotalQuantity: 'minTotalQuantity',
  minTotalQuantity: 'minTotalQuantity',
  MinTotalRevenue: 'minTotalRevenue',
  minTotalRevenue: 'minTotalRevenue',
};

function readValue(source, keys, fallback = '') {
  for (const key of keys) {
    if (source?.[key] !== undefined && source?.[key] !== null) {
      return source[key];
    }
  }

  return fallback;
}

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function toNullableNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : null;
}

function extractItems(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.items)) return response.data.items;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.recordset)) return response.recordset;
  return [];
}

export function mapProductResponse(product) {
  if (!product) return null;

  return {
    productId: String(readValue(product, ['productId', 'ProductID'], '')),
    productName: String(readValue(product, ['productName', 'ProductName'], '')),
    productType: String(readValue(product, ['productType', 'ProductType'], '')),
    basePrice: toNumber(readValue(product, ['basePrice', 'BasePrice'], 0)),
    productStatus: String(readValue(product, ['productStatus', 'ProductStatus'], '')),
  };
}

export function mapProductToForm(product) {
  if (!product) return createEmptyProductForm();

  const basePrice = readValue(product, ['basePrice', 'BasePrice'], '');

  return {
    productId: String(readValue(product, ['productId', 'ProductID'], '')),
    productName: String(readValue(product, ['productName', 'ProductName'], '')),
    productType: String(readValue(product, ['productType', 'ProductType'], 'Combo') || 'Combo'),
    basePrice: basePrice === '' || basePrice === null ? '' : String(basePrice),
    productStatus: String(
      readValue(product, ['productStatus', 'ProductStatus'], 'Đang bán') || 'Đang bán'
    ),
  };
}

export function mapProductFormToPayload(form) {
  return {
    ProductID: String(form.productId ?? '').trim(),
    ProductName: String(form.productName ?? '').trim(),
    ProductType: String(form.productType ?? '').trim(),
    BasePrice: Number(form.basePrice),
    ProductStatus: String(form.productStatus ?? '').trim(),
  };
}

export function mapProductSalesSummaryRow(row) {
  return {
    productId: String(readValue(row, ['productId', 'ProductID'], '')),
    productName: String(readValue(row, ['productName', 'ProductName'], '')),
    productType: String(readValue(row, ['productType', 'ProductType'], '')),
    productStatus: String(readValue(row, ['productStatus', 'ProductStatus'], '')),
    basePrice: toNullableNumber(readValue(row, ['basePrice', 'BasePrice'], null)),
    totalOrders: toNumber(readValue(row, ['totalOrders', 'TotalOrders', 'orderUsageCount', 'OrderUsageCount'], 0)),
    totalQuantitySold: toNumber(
      readValue(row, ['totalQuantitySold', 'TotalQuantitySold', 'totalSold', 'TotalSold'], 0)
    ),
    totalRevenue: toNumber(readValue(row, ['totalRevenue', 'TotalRevenue'], 0)),
  };
}

export function mapProductSalesSummaryResponse(response) {
  return {
    items: extractItems(response).map(mapProductSalesSummaryRow),
    meta: {
      routine:
        response?.routine ||
        response?.procedure ||
        response?.data?.routine ||
        response?.data?.procedure ||
        response?.meta?.routine ||
        'sp_GetProductSalesSummary',
      source: response?.source || response?.data?.source || response?.meta?.source || '',
      filters: response?.filters || response?.data?.filters || response?.meta?.filters || null,
    },
  };
}

export function mapCustomerNetValueResponse(response, context = {}) {
  const rawData = response?.data;
  const payload =
    rawData && typeof rawData === 'object' && !Array.isArray(rawData)
      ? rawData
      : typeof response === 'object' && response !== null
        ? response
        : {};
  const primitiveNetValue =
    typeof rawData === 'number'
      ? rawData
      : typeof response === 'number'
        ? response
        : null;

  return {
    personId: String(
      readValue(payload, ['personId', 'PersonID'], context.personId ?? '')
    ),
    customerName: String(
      readValue(payload, ['customerName', 'CustomerName', 'fullName', 'FullName'], '')
    ),
    fromDate: String(readValue(payload, ['fromDate', 'FromDate'], context.fromDate ?? '')),
    toDate: String(readValue(payload, ['toDate', 'ToDate'], context.toDate ?? '')),
    netValue: toNullableNumber(
      readValue(
        payload,
        ['netValue', 'NetValue', 'customerNetValue', 'CustomerNetValue', 'value', 'Value'],
        primitiveNetValue
      )
    ),
    totalOrders: toNullableNumber(readValue(payload, ['totalOrders', 'TotalOrders'], null)),
    grossValue: toNullableNumber(
      readValue(payload, ['grossValue', 'GrossValue', 'totalSpent', 'TotalSpent'], null)
    ),
    discountAmount: toNullableNumber(
      readValue(payload, ['discountAmount', 'DiscountAmount', 'discountTotal', 'DiscountTotal'], null)
    ),
    refundAmount: toNullableNumber(
      readValue(payload, ['refundAmount', 'RefundAmount', 'refundTotal', 'RefundTotal'], null)
    ),
    lastOrderDate: String(readValue(payload, ['lastOrderDate', 'LastOrderDate'], '')),
    source: response?.source || response?.meta?.source || '',
    raw: payload,
  };
}

export function normalizeFieldErrors(fieldErrors) {
  if (!fieldErrors || typeof fieldErrors !== 'object') return {};

  return Object.entries(fieldErrors).reduce((accumulator, [key, value]) => {
    const normalizedKey = FIELD_KEY_MAP[key] || key;
    accumulator[normalizedKey] = value;
    return accumulator;
  }, {});
}

export function getErrorMessage(error, fallbackMessage) {
  return error?.message || error?.data?.message || fallbackMessage;
}

export function filterProductSummaryRows(rows, searchTerm) {
  const normalizedSearch = String(searchTerm ?? '').trim().toLowerCase();

  if (!normalizedSearch) return rows;

  return rows.filter((row) =>
    [row.productId, row.productName, row.productType, row.productStatus].some((value) =>
      String(value ?? '').toLowerCase().includes(normalizedSearch)
    )
  );
}

export function sortProductSummaryRows(rows, sortBy, sortOrder = 'asc') {
  const direction = sortOrder === 'desc' ? -1 : 1;
  const numericKeys = new Set(['totalOrders', 'totalQuantitySold', 'totalRevenue']);

  return [...rows].sort((leftRow, rightRow) => {
    const leftValue = leftRow?.[sortBy];
    const rightValue = rightRow?.[sortBy];

    if (numericKeys.has(sortBy)) {
      return (toNumber(leftValue, 0) - toNumber(rightValue, 0)) * direction;
    }

    return (
      String(leftValue ?? '').localeCompare(String(rightValue ?? ''), 'vi', {
        sensitivity: 'base',
      }) * direction
    );
  });
}
