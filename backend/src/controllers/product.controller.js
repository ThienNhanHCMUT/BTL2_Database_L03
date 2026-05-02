const {
  getAllProducts,
  getProductByIdService,
  createProductService,
  updateProductService,
  deleteProductService,
  getProductSalesSummaryService,
  getProductCatalogService,
  previewProductOrderTotalService,
} = require("../services/product.service");

function handleError(res, next, error) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code || "BUSINESS_ERROR",
      fieldErrors: error.fieldErrors || null,
    });
  }

  return next(error);
}

async function getProducts(req, res, next) {
  try {
    const products = await getAllProducts();
    return res.json(products);
  } catch (error) {
    return handleError(res, next, error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await getProductByIdService(productId);

    if (!product) {
      return res.status(404).json({
        message: "Không tìm thấy sản phẩm",
      });
    }

    return res.json(product);
  } catch (error) {
    return handleError(res, next, error);
  }
}

async function createProduct(req, res, next) {
  try {
    const product = await createProductService(req.body);
    return res.status(201).json(product);
  } catch (error) {
    return handleError(res, next, error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const product = await updateProductService(productId, req.body);
    return res.json(product);
  } catch (error) {
    return handleError(res, next, error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { productId } = req.params;
    const result = await deleteProductService(productId);
    return res.json(result);
  } catch (error) {
    return handleError(res, next, error);
  }
}

async function getProductSalesSummary(req, res, next) {
  try {
    const result = await getProductSalesSummaryService(req.query);
    return res.json(result);
  } catch (error) {
    return handleError(res, next, error);
  }
}

async function getProductCatalog(req, res, next) {
  try {
    const result = await getProductCatalogService(req.query);
    return res.json(result);
  } catch (error) {
    return handleError(res, next, error);
  }
}

async function previewProductOrderTotal(req, res, next) {
  try {
    const result = await previewProductOrderTotalService(req.body);
    return res.json(result);
  } catch (error) {
    return handleError(res, next, error);
  }
}

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductSalesSummary,
  getProductCatalog,
  previewProductOrderTotal,
};