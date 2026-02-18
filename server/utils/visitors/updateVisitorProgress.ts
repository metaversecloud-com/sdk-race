import { Credentials } from "../../../shared/types/index.js";

interface UpdateVisitorProgressParams {
  credentials: Credentials;
  options?: any;
  updatedProgress?: any;
  visitor: any;
  visitorProgress?: any;
  hasCompletedRace?: boolean;
}

export const updateVisitorProgress = async ({
  credentials,
  options = {},
  updatedProgress = {},
  visitor,
  visitorProgress = {},
  hasCompletedRace = false,
}: UpdateVisitorProgressParams) => {
  try {
    const { urlSlug, sceneDropId } = credentials;

    let racesCompleted = visitor.dataObject.racesCompleted || 0;
    if (hasCompletedRace) racesCompleted += 1;

    await visitor.updateDataObject(
      {
        racesCompleted,
        [`${urlSlug}-${sceneDropId}`]: {
          ...visitorProgress,
          ...updatedProgress,
        },
      },
      options,
    );

    return { success: true };
  } catch (error) {
    return new Error(error as string);
  }
};
