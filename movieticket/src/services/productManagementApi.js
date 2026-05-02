import { requestJson } from './api';

function normalizeProduct(product) {
  if (!product) return null;

  return {
    productId: product.productId ?? product.ProductID ?? '',
    productName: product.productName ?? product.ProductName ?? '',
    productType: product.productType ?? product.ProductType ?? '',
    basePrice: Number(product.basePrice ?? product.BasePrice ?? 0),
    productStatus: product.productStatus ?? product.ProductStatus ?? '',
    orderUsageCount: Number(product.orderUsageCount ?? product.OrderUsageCount ?? 0),
    totalSold: Number(product.totalSold ?? product.TotalSold ?? 0),
    totalRevenue: Number(product.totalRevenue ?? product.TotalRevenue ?? 0),
  };
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.set(key, value);
    }
  });

  return query.toString();
}

export async function fetchProductCatalog(params) {
  const query = buildQuery(params);
  const data = await requestJson(`/products/management/catalog${query ? `?${query}` : ''}`);

  return {
    ...data,
    items: Array.isArray(data.items) ? data.items.map(normalizeProduct) : [],
  };
}

export async function createProduct(payload) {
  const data = await requestJson('/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return normalizeProduct(data);
}

export async function updateProduct(productId, payload) {
  const data = await requestJson(`/products/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return normalizeProduct(data);
}

export async function deleteProduct(productId) {
  return requestJson(`/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  });
}

export async function previewProductRevenue(payload) {
  return requestJson('/products/management/revenue-preview', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
