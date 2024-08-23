import { backendAPI } from "@utils/backendAPI";

export const resetGame = async () => {
  try {
    const result = await backendAPI.post("/race/reset-game");
    if (result?.data?.success) {
      return true;
    }
  } catch (error) {
    console.error("error in cancel action");
    console.error(error);
  }
};
