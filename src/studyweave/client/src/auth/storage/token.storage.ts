const accessTokenKey = 'studyweave.accessToken';

export const storeAccessToken = (accessToken: string): void => {
  localStorage.removeItem(accessTokenKey);
  sessionStorage.setItem(accessTokenKey, accessToken);
};

export const getAccessToken = (): string | null => {
  localStorage.removeItem(accessTokenKey);
  return sessionStorage.getItem(accessTokenKey);
};

export const clearAccessToken = (): void => {
  sessionStorage.removeItem(accessTokenKey);
  localStorage.removeItem(accessTokenKey);
};

export const getAuthorizationHeader = (): Record<string, string> => {
  const accessToken = getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
};
