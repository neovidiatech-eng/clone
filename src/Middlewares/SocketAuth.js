import { verifyToken } from "../Utils/Token/token.js";
import * as db from "../database/dbService.js"
import { getApplicationOpen } from "../Utils/ApplicationAvailability.js";


export const socketAuthentication = async (socket, next) => {
  try {
    if (!(await getApplicationOpen())) {
      return next(new Error("APPLICATION_UNDER_MAINTENANCE"));
    }

    const token = socket.handshake.auth.token;
    if (!token || typeof token !== "string") {
      return next(new Error("TOKEN_MISSED_OR_INVALID", { cause: 401 }));
    }

    const decoded = verifyToken({ token });
    if (!decoded || !decoded.id) {
      return next(new Error("TOKEN_SIGNATURE_INVALID", { cause: 401 }));
    }

    
    const user = await db.findFirst({
      model: "user",
      where: {
        id: decoded.id,
      },
      include: {
        student: true,
        teacher: true,
        role: true,
      },
    });
    
    if (!user) {
      return next(new Error("TOKEN_USER_NOT_FOUND", { cause: 401 }));
    }

    socket.user = user;
    socket.decoded = decoded;

    next();
  } catch (error) {
    next(error);
  }
};
