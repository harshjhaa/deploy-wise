import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import healthRouter from './routes/health';
import environmentsRouter from './routes/environments';
import gamesRouter from './routes/games';
import reservationsRouter from './routes/reservations';
import usersRouter from './routes/users';

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

//Register routes
app.use('/health', healthRouter);
app.use('/api/v1/environments', environmentsRouter);
app.use('/api/v1/games', gamesRouter);
app.use('/api/v1/reservations', reservationsRouter);
app.use('/api/v1/users', usersRouter);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // simple centralized error handler
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

export default app;
