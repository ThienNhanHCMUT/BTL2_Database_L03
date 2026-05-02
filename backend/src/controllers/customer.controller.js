const {
  getCustomerNetValueService,
} = require("../services/customer.service");

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

async function getCustomerNetValue(req, res, next) {
  try {
    const result = await getCustomerNetValueService(req.query);
    return res.json(result);
  } catch (error) {
    return handleError(res, next, error);
  }
}

module.exports = {
  getCustomerNetValue,
};