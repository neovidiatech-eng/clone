import { getApplicationOpen } from "../Utils/ApplicationAvailability.js";
const CONTROL_ROUTE = "/settings/health";

export const applicationAvailability = async (req, res, next) => {
  if (
    (req.method === "PATCH" && req.path.replace(/\/+$/, "") === CONTROL_ROUTE) ||
    (req.method === "GET" && req.path === "/")
  ) {
    return next();
  }

  try {
    if (!(await getApplicationOpen())) {
      return res.status(503).json({
        status: 503,
        message: req.t("APPLICATION_UNDER_MAINTENANCE"),
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
};
