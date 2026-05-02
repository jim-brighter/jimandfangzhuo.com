import { Amplify } from "aws-amplify";
import { fetchAuthSession, signIn, signOut } from "aws-amplify/auth";

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: "us-west-2_TdfpNx8YV",
      userPoolClientId: "65frmc7qe1ah5r3trjs0f682du"
    }
  }
});

const doLogin = async (username: string, password: string) => {
  await signIn({ username, password });
};

const loginForm = document.getElementById("login") as HTMLFormElement;
const welcomeHeader = document.getElementById("welcome") as HTMLDivElement;

const setContent = async () => {
  const session = await fetchAuthSession();

  if (session.tokens) {
    loginForm.hidden = true;
    welcomeHeader.hidden = false;
  } else {
    loginForm.hidden = false;
    welcomeHeader.hidden = true;
  }
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(loginForm);
  const username = data.get("username") as string;
  const password = data.get("password") as string;
  await doLogin(username, password);
  setContent();
});

const logoutButton = document.getElementById("logout") as HTMLButtonElement;

logoutButton.addEventListener("click", async () => {
  await signOut({
    global: true
  });

  setContent();
});

setContent();
