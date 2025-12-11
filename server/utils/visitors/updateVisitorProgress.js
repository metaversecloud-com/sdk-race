export const updateVisitorProgress = async ({
  credentials,
  options = {},
  updatedProgress = {},
  visitor,
  visitorProgress = {},
  hasCompletedRace = false,
}) => {
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
    return new Error(error);
  }
};
