const { connectDB, sql } = require("../config/db");

const PRODUCT_CATALOG_PROCEDURE =
  process.env.PRODUCT_CATALOG_PROCEDURE || "sp_ProductCatalogForManagement";

const PRODUCT_TOTAL_FUNCTION =
  process.env.PRODUCT_TOTAL_FUNCTION || "fn_CalculateProductOrderTotal";

const PRODUCT_SALES_SUMMARY_PROCEDURE =
  process.env.PRODUCT_SALES_SUMMARY_PROCEDURE || "sp_GetProductSalesSummary";

const SORT_COLUMNS = {
  productId: "p.ProductID",
  name: "p.ProductName",
  type: "p.ProductType",
  price: "p.BasePrice",
  status: "p.ProductStatus",
  usage: "OrderUsageCount",
  revenue: "TotalRevenue",
};

const SQL_BUSINESS_FIELD_MAP = {
  50001: "productId",
  50009: "productId",
  50002: "productName",
  50003: "productType",
  50004: "productType",
  50005: "basePrice",
  50006: "basePrice",
  50007: "productStatus",
  50008: "productStatus",

  50101: "productId",
  50102: "productId",
  50103: "productName",
  50104: "productType",
  50105: "productType",
  50106: "basePrice",
  50107: "basePrice",
  50108: "productStatus",
  50109: "productStatus",

  50201: "productId",
  50202: "productId",
  50203: "productStatus",
  50204: "productId",

  50301: "toDate",
  50302: "minTotalQuantity",
  50303: "minTotalRevenue",
};

function createHttpError(
  message,
  statusCode = 400,
  code = "BUSINESS_ERROR",
  fieldErrors = null
) {
  const error = new Error(message);
  error.status = statusCode;
  error.statusCode = statusCode;
  error.code = code;
  if (fieldErrors) error.fieldErrors = fieldErrors;
  return error;
}

function normalizeRoutineName(value, fallback) {
  const raw = String(value || fallback).trim();
  const name = raw || fallback;
  const valid = /^[A-Za-z_][\w$#]*(\.[A-Za-z_][\w$#]*)?$/.test(name);
  const safeName = valid ? name : fallback;

  return safeName.includes(".") ? safeName : `dbo.${safeName}`;
}

function collectSqlErrorCandidates(error) {
  const candidates = [];
  const seen = new Set();

  function visit(value) {
    if (!value || typeof value !== "object") return;
    if (seen.has(value)) return;

    seen.add(value);
    candidates.push(value);

    visit(value.info);
    visit(value.originalError);
    visit(value.parent);

    if (Array.isArray(value.precedingErrors)) {
      value.precedingErrors.forEach(visit);
    }

    if (Array.isArray(value.errors)) {
      value.errors.forEach(visit);
    }
  }

  visit(error);
  return candidates;
}

function getSqlErrorDetails(error) {
  const candidates = collectSqlErrorCandidates(error);

  const businessCandidate = candidates.find((candidate) => {
    const number = Number(candidate?.number);
    return Number.isFinite(number) && number >= 50000;
  });

  const numberedCandidate =
    businessCandidate ||
    candidates.find((candidate) => Number.isFinite(Number(candidate?.number)));

  const messageCandidate =
    businessCandidate ||
    candidates.find((candidate) => typeof candidate?.message === "string") ||
    error;

  const number = Number(numberedCandidate?.number);
  const message = String(messageCandidate?.message || error?.message || "").trim();

  return {
    number: Number.isFinite(number) ? number : null,
    message,
  };
}

function fieldErrorsForSqlCode(sqlErrorNumber, message) {
  const fieldName = SQL_BUSINESS_FIELD_MAP[sqlErrorNumber];
  if (!fieldName) return null;

  return {
    [fieldName]: message || "Dữ liệu không hợp lệ.",
  };
}

function shouldFallbackRoutine(error) {
  const { number, message } = getSqlErrorDetails(error);
  const normalizedMessage = String(message || error?.message || "").toLowerCase();
  const fallbackNumbers = new Set([195, 201, 208, 2812, 4121, 8144]);

  return (
    fallbackNumbers.has(Number(number)) ||
    normalizedMessage.includes("could not find stored procedure") ||
    normalizedMessage.includes("is not a recognized built-in function name") ||
    normalizedMessage.includes("invalid object name") ||
    normalizedMessage.includes("too many arguments") ||
    normalizedMessage.includes("expects parameter")
  );
}

function mapDbError(error, fallbackMessage) {
  if (error?.statusCode) return error;

  const { number: sqlErrorNumber, message: sqlErrorMessage } =
    getSqlErrorDetails(error);

  if (Number(sqlErrorNumber) >= 50000) {
    return createHttpError(
      sqlErrorMessage || fallbackMessage || "Lỗi nghiệp vụ từ SQL Server.",
      400,
      `SQL_ERROR_${sqlErrorNumber}`,
      fieldErrorsForSqlCode(
        sqlErrorNumber,
        sqlErrorMessage || fallbackMessage || "Dữ liệu không hợp lệ."
      )
    );
  }

  if (sqlErrorNumber === 2627 || sqlErrorNumber === 2601) {
    return createHttpError(
      "Mã hoặc tên sản phẩm đã tồn tại.",
      409,
      "PRODUCT_DUPLICATED"
    );
  }

  if (sqlErrorNumber === 547) {
    return createHttpError(
      "Không thể xóa sản phẩm vì sản phẩm đã phát sinh dữ liệu liên quan.",
      409,
      "PRODUCT_IN_USE"
    );
  }

  if (["ELOGIN", "ETIMEOUT", "ESOCKET", "ECONNCLOSED"].includes(error?.code)) {
    return createHttpError(
      "Không thể kết nối cơ sở dữ liệu. Vui lòng kiểm tra SQL Server và tài khoản kết nối.",
      503,
      "DB_CONNECTION_ERROR"
    );
  }

  if (sqlErrorNumber || sqlErrorMessage) {
    console.error("[product.service] SQL error", {
      sqlErrorNumber,
      sqlErrorMessage,
      fallbackMessage,
      code: error?.code,
    });

    return createHttpError(
      sqlErrorMessage || fallbackMessage || "Thao tác dữ liệu thất bại.",
      500,
      sqlErrorNumber ? `SQL_ERROR_${sqlErrorNumber}` : "DB_OPERATION_FAILED"
    );
  }

  console.error("[product.service] Unknown DB error", {
    fallbackMessage,
    message: error?.message,
    code: error?.code,
  });

  return createHttpError(
    fallbackMessage || "Thao tác dữ liệu thất bại.",
    500,
    "DB_OPERATION_FAILED"
  );
}

async function getPool() {
  try {
    return await connectDB();
  } catch (error) {
    throw mapDbError(error, "Không thể kết nối cơ sở dữ liệu.");
  }
}

function getPayloadValue(payload, ...keys) {
  for (const key of keys) {
    if (payload?.[key] !== undefined && payload?.[key] !== null) {
      return payload[key];
    }
  }

  return "";
}

function validateProductPayload(payload, options = {}) {
  const { requireId = false } = options;
  const fieldErrors = {};

  const productId = String(
    getPayloadValue(payload, "ProductID", "productID", "ProductId", "productId", "id")
  ).trim();

  const productName = String(
    getPayloadValue(
      payload,
      "ProductName",
      "productName",
      "product_name",
      "name"
    )
  ).trim();

  const productType = String(
    getPayloadValue(payload, "ProductType", "productType", "product_type", "type")
  ).trim();

  const productStatus = String(
    getPayloadValue(
      payload,
      "ProductStatus",
      "productStatus",
      "product_status",
      "status"
    )
  ).trim();

  const rawPrice = getPayloadValue(
    payload,
    "BasePrice",
    "basePrice",
    "base_price",
    "price"
  );
  const basePrice = Number(rawPrice);

  if (requireId) {
    if (!productId) {
      fieldErrors.productId = "Vui lòng nhập mã sản phẩm.";
    } else if (productId.length > 20) {
      fieldErrors.productId = "Mã sản phẩm tối đa 20 ký tự.";
    }
  }

  if (!productName) {
    fieldErrors.productName = "Vui lòng nhập tên sản phẩm.";
  } else if (productName.length > 100) {
    fieldErrors.productName = "Tên sản phẩm tối đa 100 ký tự.";
  }

  if (!productType) {
    fieldErrors.productType = "Vui lòng chọn loại sản phẩm.";
  } else if (productType.length > 50) {
    fieldErrors.productType = "Loại sản phẩm không được vượt quá 50 ký tự.";
  }

  if (rawPrice === "" || rawPrice === null || rawPrice === undefined) {
    fieldErrors.basePrice = "Giá cơ bản không được để trống.";
  } else if (!Number.isFinite(basePrice)) {
    fieldErrors.basePrice = "Giá cơ bản phải là một số hợp lệ.";
  } else if (basePrice < 0) {
    fieldErrors.basePrice = "Giá cơ bản phải lớn hơn hoặc bằng 0.";
  } else if (basePrice > 10000000) {
    fieldErrors.basePrice = "Giá cơ bản không được vượt quá 10.000.000đ.";
  }

  if (!productStatus) {
    fieldErrors.productStatus = "Vui lòng chọn trạng thái.";
  } else if (productStatus.length > 30) {
    fieldErrors.productStatus = "Trạng thái không được vượt quá 30 ký tự.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw createHttpError(
      "Dữ liệu sản phẩm chưa hợp lệ.",
      400,
      "VALIDATION_ERROR",
      fieldErrors
    );
  }

  return {
    productId,
    productName,
    productType,
    basePrice,
    productStatus,
  };
}

function normalizeProductId(productId) {
  return String(productId || "").trim();
}

function normalizeCatalogFilters(query = {}) {
  const sortBy = SORT_COLUMNS[query.sortBy] ? query.sortBy : "productId";

  const sortOrder =
    String(query.sortOrder || "asc").toLowerCase() === "desc"
      ? "DESC"
      : "ASC";

  return {
    search: String(query.search || "").trim(),
    type: String(query.type || "").trim(),
    status: String(query.status || "").trim(),
    sortBy,
    sortOrder,
  };
}

function normalizeDateParam(value) {
  const normalized = String(value || "").trim();
  return normalized || null;
}

function normalizeNonNegativeNumber(value, fallback = 0) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return fallback;
  }

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
}

function normalizeProductSalesSummaryFilters(query = {}) {
  return {
    productType: String(query.productType || query.ProductType || "").trim() || null,
    fromDate: normalizeDateParam(query.fromDate || query.FromDate),
    toDate: normalizeDateParam(query.toDate || query.ToDate),
    minTotalQuantity: normalizeNonNegativeNumber(
      query.minTotalQuantity ?? query.MinTotalQuantity,
      0
    ),
    minTotalRevenue: normalizeNonNegativeNumber(
      query.minTotalRevenue ?? query.MinTotalRevenue,
      0
    ),
  };
}

function mapProduct(row) {
  if (!row) return null;

  return {
    productId: row.ProductID ?? row.productId,
    productName: row.ProductName ?? row.productName,
    productType: row.ProductType ?? row.productType,
    basePrice: Number(row.BasePrice ?? row.basePrice ?? 0),
    productStatus: row.ProductStatus ?? row.productStatus,
  };
}

function mapCatalogRow(row) {
  return {
    productId: row.ProductID || row.productId,
    productName: row.ProductName || row.productName,
    productType: row.ProductType || row.productType,
    basePrice: Number(row.BasePrice ?? row.basePrice ?? 0),
    productStatus: row.ProductStatus || row.productStatus,
    orderUsageCount: Number(row.OrderUsageCount ?? row.orderUsageCount ?? 0),
    totalSold: Number(row.TotalSold ?? row.totalSold ?? 0),
    totalRevenue: Number(row.TotalRevenue ?? row.totalRevenue ?? 0),
  };
}

function mapProductSalesSummaryRow(row) {
  return {
    productId: row.ProductID || row.productId,
    productName: row.ProductName || row.productName,
    productType: row.ProductType || row.productType,
    productStatus: row.ProductStatus || row.productStatus,
    totalOrders: Number(row.TotalOrders ?? row.totalOrders ?? 0),
    totalQuantitySold: Number(
      row.TotalQuantitySold ?? row.totalQuantitySold ?? row.TotalSold ?? row.totalSold ?? 0
    ),
    totalRevenue: Number(row.TotalRevenue ?? row.totalRevenue ?? 0),
  };
}

async function getProductByIdRaw(pool, productId) {
  const normalizedProductId = normalizeProductId(productId);

  const result = await pool
    .request()
    .input("ProductID", sql.VarChar(20), normalizedProductId)
    .query(`
      SELECT ProductID, ProductName, ProductType, BasePrice, ProductStatus
      FROM PRODUCT
      WHERE ProductID = @ProductID
    `);

  return result.recordset[0] || null;
}

async function getAllProducts() {
  const pool = await getPool();

  try {
    const result = await pool.request().query(`
      SELECT ProductID, ProductName, ProductType, BasePrice, ProductStatus
      FROM PRODUCT
      ORDER BY ProductID
    `);

    return result.recordset;
  } catch (error) {
    throw mapDbError(error, "Không thể lấy danh sách sản phẩm.");
  }
}

async function getProductByIdService(productId) {
  const pool = await getPool();

  try {
    return await getProductByIdRaw(pool, productId);
  } catch (error) {
    throw mapDbError(error, "Không thể lấy thông tin sản phẩm.");
  }
}

async function createProductService(payload) {
  try {
    const product = validateProductPayload(payload, { requireId: true });
    const pool = await getPool();

    await pool
      .request()
      .input("ProductID", sql.VarChar(20), product.productId)
      .input("ProductName", sql.NVarChar(100), product.productName)
      .input("ProductType", sql.NVarChar(50), product.productType)
      .input("BasePrice", sql.Decimal(12, 2), product.basePrice)
      .input("ProductStatus", sql.NVarChar(30), product.productStatus)
      .execute("dbo.sp_InsertProduct");

    return mapProduct(await getProductByIdRaw(pool, product.productId));
  } catch (error) {
    throw mapDbError(error, "Không thể thêm sản phẩm.");
  }
}

async function updateProductService(productId, payload) {
  try {
    const normalizedProductId = normalizeProductId(productId);
    const product = validateProductPayload(
      {
        ...payload,
        ProductID: normalizedProductId,
        productId: normalizedProductId,
      },
      { requireId: true }
    );

    const pool = await getPool();

    await pool
      .request()
      .input("ProductID", sql.VarChar(20), product.productId)
      .input("ProductName", sql.NVarChar(100), product.productName)
      .input("ProductType", sql.NVarChar(50), product.productType)
      .input("BasePrice", sql.Decimal(12, 2), product.basePrice)
      .input("ProductStatus", sql.NVarChar(30), product.productStatus)
      .execute("dbo.sp_UpdateProduct");

    return mapProduct(await getProductByIdRaw(pool, product.productId));
  } catch (error) {
    throw mapDbError(error, "Không thể cập nhật sản phẩm.");
  }
}

async function deleteProductService(productId) {
  try {
    const normalizedProductId = normalizeProductId(productId);
    const pool = await getPool();

    await pool
      .request()
      .input("ProductID", sql.VarChar(20), normalizedProductId)
      .execute("dbo.sp_DeleteProduct");

    return {
      productId: normalizedProductId,
      deleted: true,
    };
  } catch (error) {
    throw mapDbError(error, "Không thể xóa sản phẩm.");
  }
}

async function getProductSalesSummaryService(query) {
  const filters = normalizeProductSalesSummaryFilters(query);
  const pool = await getPool();
  const routine = normalizeRoutineName(
    PRODUCT_SALES_SUMMARY_PROCEDURE,
    "sp_GetProductSalesSummary"
  );

  try {
    const result = await pool
      .request()
      .input("ProductType", sql.NVarChar(50), filters.productType)
      .input("FromDate", sql.Date, filters.fromDate)
      .input("ToDate", sql.Date, filters.toDate)
      .input("MinTotalQuantity", sql.Int, filters.minTotalQuantity)
      .input("MinTotalRevenue", sql.Decimal(12, 2), filters.minTotalRevenue)
      .execute(routine);

    return {
      routine,
      source: "stored_procedure",
      filters,
      items: (result.recordset || []).map(mapProductSalesSummaryRow),
    };
  } catch (error) {
    throw mapDbError(error, "Không thể lấy thống kê sản phẩm.");
  }
}

async function getProductCatalogByQuery(pool, filters) {
  const orderBy = SORT_COLUMNS[filters.sortBy] || SORT_COLUMNS.productId;

  const result = await pool
    .request()
    .input("Search", sql.NVarChar(100), filters.search)
    .input("ProductType", sql.NVarChar(50), filters.type)
    .input("ProductStatus", sql.NVarChar(50), filters.status)
    .query(`
      SELECT
        p.ProductID,
        p.ProductName,
        p.ProductType,
        p.BasePrice,
        p.ProductStatus,
        COUNT(pd.OrderDetailID) AS OrderUsageCount,
        COALESCE(SUM(od.OrderDetailQuantity), 0) AS TotalSold,
        COALESCE(SUM(od.OrderDetailSubtotal), 0) AS TotalRevenue
      FROM PRODUCT p
      LEFT JOIN PRODUCT_DETAIL pd
        ON pd.ProductID = p.ProductID
      LEFT JOIN ORDER_DETAIL od
        ON od.OrderDetailID = pd.OrderDetailID
      WHERE (
          @Search = ''
          OR p.ProductID LIKE '%' + @Search + '%'
          OR p.ProductName LIKE '%' + @Search + '%'
          OR p.ProductType LIKE '%' + @Search + '%'
        )
        AND (@ProductType = '' OR p.ProductType = @ProductType)
        AND (@ProductStatus = '' OR p.ProductStatus = @ProductStatus)
      GROUP BY
        p.ProductID,
        p.ProductName,
        p.ProductType,
        p.BasePrice,
        p.ProductStatus
      ORDER BY ${orderBy} ${filters.sortOrder}
    `);

  return result.recordset.map(mapCatalogRow);
}

async function getProductCatalogService(query) {
  const filters = normalizeCatalogFilters(query);
  const pool = await getPool();

  const routine = normalizeRoutineName(
    PRODUCT_CATALOG_PROCEDURE,
    "sp_ProductCatalogForManagement"
  );

  try {
    const result = await pool
      .request()
      .input("SearchTerm", sql.NVarChar(100), filters.search)
      .input("ProductType", sql.NVarChar(50), filters.type)
      .input("ProductStatus", sql.NVarChar(50), filters.status)
      .input("SortBy", sql.VarChar(30), filters.sortBy)
      .input("SortOrder", sql.VarChar(4), filters.sortOrder)
      .execute(routine);

    return {
      routine,
      source: "stored_procedure",
      filters,
      items: (result.recordset || []).map(mapCatalogRow),
    };
  } catch (error) {
    if (!shouldFallbackRoutine(error)) {
      throw mapDbError(error, "Không thể lấy danh sách sản phẩm.");
    }

    try {
      return {
        routine,
        source: "query_fallback",
        filters,
        items: await getProductCatalogByQuery(pool, filters),
      };
    } catch (fallbackError) {
      throw mapDbError(fallbackError, "Không thể lấy danh sách sản phẩm.");
    }
  }
}

async function getProductUsageSummary(pool, productId) {
  const result = await pool
    .request()
    .input("ProductID", sql.VarChar(20), normalizeProductId(productId))
    .query(`
      SELECT
        COUNT(pd.OrderDetailID) AS OrderUsageCount,
        COALESCE(SUM(od.OrderDetailQuantity), 0) AS TotalSold,
        COALESCE(SUM(od.OrderDetailSubtotal), 0) AS TotalRevenue
      FROM PRODUCT_DETAIL pd
      JOIN ORDER_DETAIL od
        ON od.OrderDetailID = pd.OrderDetailID
      WHERE pd.ProductID = @ProductID
    `);

  const row = result.recordset[0] || {};

  return {
    orderUsageCount: Number(row.OrderUsageCount || 0),
    totalSold: Number(row.TotalSold || 0),
    totalRevenue: Number(row.TotalRevenue || 0),
  };
}

function validatePreviewPayload(payload) {
  const fieldErrors = {};

  const productId = String(
    getPayloadValue(payload, "ProductID", "productID", "ProductId", "productId")
  ).trim();

  const quantity = Number(getPayloadValue(payload, "Quantity", "quantity"));

  if (!productId) {
    fieldErrors.productId = "Vui lòng chọn sản phẩm.";
  }

  if (!Number.isInteger(quantity)) {
    fieldErrors.quantity = "Số lượng phải là số nguyên.";
  } else if (quantity <= 0) {
    fieldErrors.quantity = "Số lượng phải lớn hơn 0.";
  } else if (quantity > 500) {
    fieldErrors.quantity = "Số lượng tối đa cho một lần thử là 500.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw createHttpError(
      "Dữ liệu gọi hàm chưa hợp lệ.",
      400,
      "VALIDATION_ERROR",
      fieldErrors
    );
  }

  return { productId, quantity };
}

async function previewProductOrderTotalService(payload) {
  try {
    const input = validatePreviewPayload(payload);
    const pool = await getPool();

    const routine = normalizeRoutineName(
      PRODUCT_TOTAL_FUNCTION,
      "fn_CalculateProductOrderTotal"
    );

    const product = await getProductByIdRaw(pool, input.productId);

    if (!product) {
      throw createHttpError(
        "Không tìm thấy sản phẩm để tính thử.",
        404,
        "PRODUCT_NOT_FOUND",
        { productId: "Mã sản phẩm không tồn tại." }
      );
    }

    let estimatedTotal = null;
    let source = "sql_function";

    try {
      const functionResult = await pool
        .request()
        .input("ProductID", sql.VarChar(20), input.productId)
        .input("Quantity", sql.Int, input.quantity)
        .query(`
          SELECT ${routine}(@ProductID, @Quantity) AS EstimatedTotal
        `);

      estimatedTotal = Number(functionResult.recordset[0]?.EstimatedTotal || 0);
    } catch (error) {
      if (!shouldFallbackRoutine(error)) throw error;

      estimatedTotal = Number(product.BasePrice || 0) * input.quantity;
      source = "query_fallback";
    }

    return {
      routine,
      source,
      product: mapProduct(product),
      quantity: input.quantity,
      unitPrice: Number(product.BasePrice || 0),
      estimatedTotal,
      usage: await getProductUsageSummary(pool, input.productId),
      warnings:
        String(product.ProductStatus || "").toLowerCase().includes("ngừng") ||
        String(product.ProductStatus || "").toLowerCase().includes("ngung")
          ? ["Sản phẩm đang ngừng bán, không nên tạo đơn mới."]
          : [],
    };
  } catch (error) {
    throw mapDbError(error, "Không thể gọi hàm tính doanh thu sản phẩm.");
  }
}

module.exports = {
  getAllProducts,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
  getProductSalesSummaryService,
  getProductCatalogService,
  previewProductOrderTotalService,
};