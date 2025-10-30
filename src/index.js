import { config } from "./config/index.js";
import createServer from "./server.js";

const app = createServer();

app.listen(config.server.port, () => {
  console.log(`✅ ConversaX Agent Kit v1 corriendo en http://localhost:${config.server.port}`);
});
