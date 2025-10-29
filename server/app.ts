import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import chatRouter from './routes/chat';

const app = express();

app.use(bodyParser.json());
app.use(express.static('../dist/web'));

app.get('/health', (_, res) => res.json({ ok: true }));

app.use('/api/chat', chatRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;

