import express from "express";
import dotenv from "dotenv";
import whatsappRouter from "./routes/whatsapp.js";

dotenv.config();

const app = express();

app.use(express.json());

app.use("/api", whatsappRouter);

app.listen(3000, () => console.log("✅ ConversaX Agent Kit v1 corriendo en http://localhost:3000"));

