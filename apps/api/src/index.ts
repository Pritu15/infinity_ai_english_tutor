import { createServer } from "node:http";
import { createApp } from "./app.js";
import { environment } from "./config/environment.js";

const app = createApp();
const server = createServer(app);

server.listen(environment.port, () => {
  console.info(`${environment.apiName} listening on port ${environment.port}`);
});

export { app, server };
