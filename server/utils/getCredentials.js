export const getCredentials = (query) => {
  const requiredFields = ["interactiveNonce", "interactivePublicKey", "urlSlug", "visitorId"];
  const missingFields = requiredFields.filter((variable) => !query[variable]);
  if (missingFields.length > 0) {
    throw new Error(`Missing required body parameters: ${missingFields.join(", ")}`);
  }

  if (process.env.INTERACTIVE_KEY !== query.interactivePublicKey) {
    throw new Error("Provided public key does not match");
  }

  return {
    assetId: query.assetId,
    interactiveNonce: query.interactiveNonce,
    interactivePublicKey: query.interactivePublicKey,
    profileId: query.profileId,
    sceneDropId: query.sceneDropId,
    urlSlug: query.urlSlug,
    username: query.username,
    sceneDropId: query.sceneDropId,
    visitorId: Number(query.visitorId),
  };
};
