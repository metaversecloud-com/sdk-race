export const getErrorMessage = (action: string, error: any): string => {
  const message = error.response?.data?.error?.message || error.response?.data?.message || error.message || error;

  console.error(message);
  console.error(error);

  return `An error occurred while ${action} the race.`;
};
