const ACCESS_TOKEN_KEY = 'studyweave.accessToken';

/**
 * Store an access token for the current browser tab only.
 *
 * @param accessToken - Signed token returned by the authentication API.
 * @returns Nothing.
 * @example
 * storeAccessToken(session.accessToken);
 */
export const storeAccessToken = (accessToken: string): void => {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
};

/**
 * Read the access token for the current browser tab.
 *
 * @returns The stored token, or null when the user is not authenticated.
 * @example
 * const accessToken = getAccessToken();
 */
export const getAccessToken = (): string | null => sessionStorage.getItem(ACCESS_TOKEN_KEY);
