const {
  holdSeatsService,
  calculatePriceService,
  confirmBookingService,
  getBookingByOrderIdService,
} = require("../services/checkout.service");

const {
  getMyBookingsService,
} = require("../services/booking-history.service");

function handleError(res, next, error) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      message: error.message,
      code: error.code || "BUSINESS_ERROR",
    });
  }

  return next(error);
}

async function holdSeats(req, res, next) {
  try {
    const result = await holdSeatsService(req.body);
    return res.json(result);
  } catch (error) {
    return handleError(res, next, error);
  }
}

async function calculatePrice(req, res, next) {
  try {
    const result = await calculatePriceService(req.body);
    return res.json(result);
  } catch (error) {
    return handleError(res, next, error);
  }
}

async function confirmBooking(req, res, next) {
  try {
    const result = await confirmBookingService(req.body);
    return res.json(result);
  } catch (error) {
    return handleError(res, next, error);
  }
}

async function getBookingByOrderId(req, res, next) {
  try {
    const { orderId } = req.params;
    const booking = await getBookingByOrderIdService(orderId);

    if (!booking) {
      return res.status(404).json({
        message: "Không tìm thấy đơn hàng",
        code: "BOOKING_NOT_FOUND",
      });
    }

    return res.json(booking);
  } catch (error) {
    return handleError(res, next, error);
  }
}

async function getMyBookings(req, res, next) {
  try {
    const personId = req.auth?.personId;
    const result = await getMyBookingsService(personId);
    return res.json(result);
  } catch (error) {
    return handleError(res, next, error);
  }
}

module.exports = {
  holdSeats,
  calculatePrice,
  confirmBooking,
  getBookingByOrderId,
  getMyBookings,
};