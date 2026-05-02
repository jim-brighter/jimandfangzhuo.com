import { fetchAuthSession, signIn, signOut } from "aws-amplify/auth";

/**
 * Handles the login process by signing in the user.
 * @param username The username.
 * @param password The password.
 */
export const doLogin = async (username: string, password: string) => {
  await signIn({ username, password });
};

/**
 * Handles the logout process by signing out the user globally.
 */
export const doLogout = async () => {
  await signOut({
    global: true
  });
};

/**
 * Checks the current authentication session status.
 * @returns A promise that resolves with the auth session.
 */
export const checkAuthSession = async () => {
  return await fetchAuthSession();
};
