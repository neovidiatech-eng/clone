import * as db from "../database/dbService.js";
import { redis } from "./Redis/Connection.js";

export const APPLICATION_OPEN_CACHE_KEY = "settings:application-open";

export const getApplicationOpen = async () => {
  try {
    const cachedValue = await redis.get(APPLICATION_OPEN_CACHE_KEY);
    if (cachedValue === "true" || cachedValue === "false") {
      return cachedValue === "true";
    }
  } catch (error) {
    console.error("Application availability cache read failed:", error.message);
  }

  const settings = await db.findFirst({ model: "Setting" });
  const applicationOpen = settings?.applicationOpen ?? true;

  try {
    await redis.set(APPLICATION_OPEN_CACHE_KEY, String(applicationOpen), { EX: 5 });
  } catch (error) {
    console.error("Application availability cache write failed:", error.message);
  }

  return applicationOpen;
};
