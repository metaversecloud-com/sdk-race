export const getElapsedTime = (currentTimestamp, currentStartTimestamp) => {
  try {
    const startTimestamp = currentStartTimestamp || currentTimestamp;
    const elapsedMilliseconds = currentTimestamp - startTimestamp;

    const minutes = Math.floor(elapsedMilliseconds / 60000);
    const seconds = Math.floor((elapsedMilliseconds % 60000) / 1000);
    const milliseconds = Math.floor((elapsedMilliseconds % 1000) / 10);

    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${milliseconds.toString().padStart(2, "0")}`;
  } catch (error) {
    return new Error(error);
  }
};
