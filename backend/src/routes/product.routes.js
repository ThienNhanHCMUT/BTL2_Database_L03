const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductSalesSummary,
  getProductCatalog,
  previewProductOrderTotal,
} = require("../controllers/product.controller");

router.get("/management/catalog", getProductCatalog);
router.post("/management/revenue-preview", previewProductOrderTotal);

router.get("/sales-summary", getProductSalesSummary);

router.get("/", getProducts);
router.post("/", createProduct);
router.get("/:productId", getProductById);
router.put("/:productId", updateProduct);
router.delete("/:productId", deleteProduct);

module.exports = router;