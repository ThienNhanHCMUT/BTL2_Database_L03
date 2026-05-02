const express = require("express");
const {
  getCustomerNetValue,
} = require("../controllers/customer.controller");

const router = express.Router();

router.get("/net-value", getCustomerNetValue);

module.exports = router;