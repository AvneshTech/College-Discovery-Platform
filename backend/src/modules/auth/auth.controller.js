const authService = require("./auth.service");
const { asyncHandler } = require("../../middleware/errorHandler");
const {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} = require("../../utils/tokens");

function meta(req) {
  return {
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  };
}

const authController = {
  register: asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);

    res.status(201).json({
      message: "Registered successfully",
      user,
    });
  }),

  login: asyncHandler(async (req, res) => {
    const { tokens, user } = await authService.login(req.body, meta(req));

    res.cookie(
      REFRESH_COOKIE_NAME,
      tokens.refreshToken,
      refreshCookieOptions()
    );

    res.json({
      message: "Login successful",
      accessToken: tokens.accessToken,
      user,
    });
  }),

  refresh: asyncHandler(async (req, res) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];

    const { tokens, user } = await authService.refresh(
      rawToken,
      meta(req)
    );

    res.cookie(
      REFRESH_COOKIE_NAME,
      tokens.refreshToken,
      refreshCookieOptions()
    );

    res.json({
      accessToken: tokens.accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }),

  logout: asyncHandler(async (req, res) => {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];

    await authService.logout(rawToken);

    res.clearCookie(
      REFRESH_COOKIE_NAME,
      refreshCookieOptions()
    );

    res.json({
      message: "Logged out",
    });
  }),

  me: asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);
    res.json(user);
  }),
};

module.exports = authController;