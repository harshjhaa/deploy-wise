import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import healthRouter from './routes/health';

const app = express();

app.disable('x-powered-by');

const allowedOrigins = [process.env.CLIENT_ORIGIN || 'http://localhost:5173'];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.use('/health', healthRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // simple centralized error handler
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

export default app;
