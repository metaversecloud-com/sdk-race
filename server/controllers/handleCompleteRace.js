import { errorHandler, getCredentials, getVisitor } from "../utils/index.js";

export const handleCompleteRace = async (req, res) => {
  try {
    const credentials = getCredentials(req.query);

    const { visitorProgress } = await getVisitor(credentials);
    const elapsedTime = visitorProgress.elapsedTime;

    return res.json({ success: true, elapsedTime });
  } catch (error) {
    return errorHandler({
      error,
      functionName: "handleCompleteRace",
      message: "Error completing race",
      req,
      res,
    });
  }
};
