import { fetchAuthSession, signIn, signOut } from "aws-amplify/auth";

let idToken: string | null = null;

/**
 * Gets the current authentication id token.
 * @returns The id token if the user is authenticated, null otherwise.
 */
export const getIdToken = () => {
  return idToken;
};

/**
 * Handles the login process by signing in the user.
 * @param username The username.
 * @param password The password.
 */
export const doLogin = async (username: string, password: string) => {
  await signIn({ username, password });
  const session = await fetchAuthSession();
  idToken = session.tokens?.idToken?.toString() || null;
};

/**
 * Handles the logout process by signing out the user globally.
 */
export const doLogout = async () => {
  await signOut({
    global: true
  });
  idToken = null;
};

/**
 * Checks the current authentication session status.
 * @returns A promise that resolves with true if the user is authenticated, false otherwise.
 */
export const checkAuthSession = async (): Promise<boolean> => {
  const session = await fetchAuthSession();
  idToken = session.tokens?.idToken?.toString() || null;

  return idToken !== null;
};
