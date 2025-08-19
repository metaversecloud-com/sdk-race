import { Visitor } from "../topiaInit.js";
import { DEFAULT_PROGRESS } from "../../constants.js";
import { updateVisitorProgress } from "./updateVisitorProgress.js";

export const getVisitor = async (credentials, shouldGetVisitorDetails = false) => {
  try {
    const { urlSlug, visitorId } = credentials;
    const sceneDropId = credentials.sceneDropId || keyAssetId;

    let visitor;
    if (shouldGetVisitorDetails) visitor = await Visitor.get(visitorId, urlSlug, { credentials });
    else visitor = await Visitor.create(visitorId, urlSlug, { credentials });

    await visitor.fetchDataObject();

    const dataObject = visitor.dataObject;

    const visitorProgress = dataObject?.[`${urlSlug}-${sceneDropId}`] || DEFAULT_PROGRESS;
    const startTimestamp = visitorProgress.startTimestamp;

    const lockId = `${sceneDropId}-${new Date(Math.round(new Date().getTime() / 60000) * 60000)}`;
    if (!dataObject) {
      await visitor.setDataObject(
        {
          [`${urlSlug}-${sceneDropId}`]: visitorProgress,
        },
        { lock: { lockId, releaseLock: true } },
      );
    } else if (!dataObject?.[`${urlSlug}-${sceneDropId}`] || (startTimestamp && new Date() - startTimestamp > 180000)) {
      // restart client race if the elapsed time is higher than 3 minutes
      const updateVisitorResult = await updateVisitorProgress({
        credentials,
        options: { lock: { lockId, releaseLock: true } },
        updatedProgress: {
          checkpoints: {},
          elapsedTime: null,
          startTimestamp: null,
        },
        visitor,
        visitorProgress,
      });
      if (updateVisitorResult instanceof Error) throw updateVisitorResult;
    }

    await visitor.fetchDataObject();

    return { visitor, visitorProgress: visitor.dataObject?.[`${urlSlug}-${sceneDropId}`] };
  } catch (error) {
    return new Error(error);
  }
};
