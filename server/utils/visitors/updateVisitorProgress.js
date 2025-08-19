export const updateVisitorProgress = async ({
  credentials,
  options = {},
  updatedProgress = {},
  visitor,
  visitorProgress = {},
}) => {
  try {
    const { urlSlug, sceneDropId } = credentials;

    await visitor.updateDataObject(
      {
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
