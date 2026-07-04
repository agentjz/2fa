import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles.css";
import { createController } from "./ui/controller";

const app = document.querySelector<HTMLElement>("#app");
if (!app) throw new Error("Missing #app");

createController(app).render();
