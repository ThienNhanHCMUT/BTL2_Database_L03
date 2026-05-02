const {
  registerService,
  loginService,
  refreshService,
  logoutService,
  getMeService,
} = require("../services/auth.service");

async function register(req, res, next) {
  try {
    const result = await registerService(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const result = await loginService(req.body);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await refreshService(req.body);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    const result = await logoutService(req.body);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

async function me(req, res, next) {
  try {
    const result = await getMeService(req.auth.personId);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  me,
};