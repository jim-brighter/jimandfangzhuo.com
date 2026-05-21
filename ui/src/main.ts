import { initAuth } from "./auth";
import { AppController } from "./app-controller";

initAuth();

const app = new AppController();
app.init();

