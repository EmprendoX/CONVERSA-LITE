import express from "express";
import chatRouter from "./routes/chat.js";

export function createServer() {
  const app = express();

  app.use(express.json());
  app.use("/api", chatRouter);

  return app;
}

export default createServer;
