import {
  PRODUCT_STATUS_OPTIONS,
  PRODUCT_TYPE_OPTIONS,
} from '../constants/productManagementOptions';

const PRODUCT_TYPE_VALUES = new Set(PRODUCT_TYPE_OPTIONS.map((option) => option.value));
const PRODUCT_STATUS_VALUES = new Set(PRODUCT_STATUS_OPTIONS.map((option) => option.value));

function isBlank(value) {
  return String(value ?? '').trim() === '';
}

function validateDateRange(fromDate, toDate, errors, fromKey = 'fromDate', toKey = 'toDate') {
  if (!fromDate || !toDate) return;

  if (new Date(fromDate) > new Date(toDate)) {
    errors[toKey] = 'ToDate phải lớn hơn hoặc bằng FromDate.';
  }
}

function validateNonNegativeNumber(value, key, label, errors, options = {}) {
  const { integer = false } = options;

  if (isBlank(value)) return;

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    errors[key] = `${label} phải là số hợp lệ.`;
    return;
  }

  if (numericValue < 0) {
    errors[key] = `${label} không được âm.`;
    return;
  }

  if (integer && !Number.isInteger(numericValue)) {
    errors[key] = `${label} phải là số nguyên.`;
  }
}

export function validateProductForm(form) {
  const errors = {};
  const productId = String(form.productId ?? '').trim();
  const productName = String(form.productName ?? '').trim();
  const productType = String(form.productType ?? '').trim();
  const productStatus = String(form.productStatus ?? '').trim();

  if (!productId) {
    errors.productId = 'Vui lòng nhập ProductID.';
  } else if (!/^[A-Za-z0-9_-]{2,20}$/.test(productId)) {
    errors.productId =
      'ProductID dài 2-20 ký tự, chỉ gồm chữ, số, gạch dưới hoặc gạch ngang.';
  }

  if (!productName) {
    errors.productName = 'Vui lòng nhập ProductName.';
  } else if (productName.length < 2 || productName.length > 100) {
    errors.productName = 'ProductName phải dài từ 2 đến 100 ký tự.';
  }

  if (!productType) {
    errors.productType = 'Vui lòng chọn ProductType.';
  } else if (!PRODUCT_TYPE_VALUES.has(productType)) {
    errors.productType = 'ProductType không thuộc nhóm nghiệp vụ hợp lệ.';
  }

  if (isBlank(form.basePrice)) {
    errors.basePrice = 'Vui lòng nhập BasePrice.';
  } else {
    const basePrice = Number(form.basePrice);

    if (!Number.isFinite(basePrice)) {
      errors.basePrice = 'BasePrice phải là số hợp lệ.';
    } else if (basePrice < 0) {
      errors.basePrice = 'BasePrice không được âm.';
    } else if (basePrice > 10000000) {
      errors.basePrice = 'BasePrice không được vượt quá 10.000.000đ.';
    }
  }

  if (!productStatus) {
    errors.productStatus = 'Vui lòng chọn ProductStatus.';
  } else if (!PRODUCT_STATUS_VALUES.has(productStatus)) {
    errors.productStatus = 'ProductStatus không thuộc nhóm nghiệp vụ hợp lệ.';
  }

  return errors;
}

export function validateProductSummaryFilters(filters) {
  const errors = {};

  if (filters.productType && !PRODUCT_TYPE_VALUES.has(filters.productType)) {
    errors.productType = 'ProductType lọc không hợp lệ.';
  }

  validateDateRange(filters.fromDate, filters.toDate, errors);
  validateNonNegativeNumber(
    filters.minTotalQuantity,
    'minTotalQuantity',
    'MinTotalQuantity',
    errors,
    { integer: true }
  );
  validateNonNegativeNumber(
    filters.minTotalRevenue,
    'minTotalRevenue',
    'MinTotalRevenue',
    errors
  );

  return errors;
}

export function validateCustomerNetValueLookup(form) {
  const errors = {};
  const personId = String(form.personId ?? '').trim();

  if (!personId) {
    errors.personId = 'Vui lòng nhập PersonID.';
  } else if (!/^\d+$/.test(personId)) {
    errors.personId = 'PersonID phải là số nguyên dương.';
  }

  if (!form.fromDate) {
    errors.fromDate = 'Vui lòng chọn FromDate.';
  }

  if (!form.toDate) {
    errors.toDate = 'Vui lòng chọn ToDate.';
  }

  validateDateRange(form.fromDate, form.toDate, errors);

  return errors;
}

export function isValidForm(errors) {
  return Object.keys(errors).length === 0;
}
