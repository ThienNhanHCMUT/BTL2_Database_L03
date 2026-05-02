const {
  validatePromotionService,
  getActivePromotionsService,
} = require("../services/checkout.service");

async function validatePromotion(req, res, next) {
  try {
    const result = await validatePromotionService(req.body);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function getActivePromotions(req, res, next) {
  try {
    const result = await getActivePromotionsService();
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  validatePromotion,
  getActivePromotions,
};