import { apiContractPath, requestJson } from './api';
import {
  mapCustomerNetValueResponse,
  mapProductResponse,
  mapProductSalesSummaryResponse,
} from '../utils/productManagementMappers';

export const PRODUCT_API_CONTRACT = {
  list: {
    method: 'GET',
    path: apiContractPath('/products'),
    sql: 'SELECT FROM PRODUCT',
  },
  create: {
    method: 'POST',
    path: apiContractPath('/products'),
    sql: 'sp_InsertProduct',
  },
  update: {
    method: 'PUT',
    path: apiContractPath('/products/:productId'),
    sql: 'sp_UpdateProduct',
  },
  delete: {
    method: 'DELETE',
    path: apiContractPath('/products/:productId'),
    sql: 'sp_DeleteProduct',
  },
  salesSummary: {
    method: 'GET',
    path: apiContractPath('/products/sales-summary'),
    sql: 'sp_GetProductSalesSummary',
  },
  customerNetValue: {
    method: 'GET',
    path: apiContractPath('/customers/net-value'),
    sql: 'dbo.fn_CalculateCustomerNetValue',
  },
};

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, value);
    }
  });

  return query.toString();
}

function readList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data?.items)) return data.data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.recordset)) return data.recordset;
  return [];
}

export async function fetchProducts() {
  const data = await requestJson(PRODUCT_API_CONTRACT.list.path);

  return readList(data).map(mapProductResponse).filter(Boolean);
}

export async function createProduct(payload) {
  const data = await requestJson(PRODUCT_API_CONTRACT.create.path, {
    method: PRODUCT_API_CONTRACT.create.method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return mapProductResponse(data?.data ?? data);
}

export async function updateProduct(productId, payload) {
  const data = await requestJson(
    apiContractPath(`/products/${encodeURIComponent(productId)}`),
    {
      method: PRODUCT_API_CONTRACT.update.method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );

  return mapProductResponse(data?.data ?? data);
}

export async function deleteProduct(productId) {
  return requestJson(apiContractPath(`/products/${encodeURIComponent(productId)}`), {
    method: PRODUCT_API_CONTRACT.delete.method,
  });
}

export async function fetchProductSalesSummary(filters = {}) {
  const query = buildQuery({
    productType: filters.productType,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    minTotalQuantity: filters.minTotalQuantity,
    minTotalRevenue: filters.minTotalRevenue,
  });
  const path = `${PRODUCT_API_CONTRACT.salesSummary.path}${query ? `?${query}` : ''}`;
  const data = await requestJson(path);

  return mapProductSalesSummaryResponse(data);
}

export async function fetchCustomerNetValue(personId, filters = {}) {
  const query = buildQuery({
    personId,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });
  const path = `${PRODUCT_API_CONTRACT.customerNetValue.path}${query ? `?${query}` : ''}`;
  const data = await requestJson(path);

  return mapCustomerNetValueResponse(data, {
    personId,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
  });
}
