import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRouter from './routes/auth';
import regionsRouter from './routes/regions';
import stationsRouter from './routes/stations';
import vehiclesRouter from './routes/vehicles';
import faultsRouter from './routes/faults';
import personnelRouter from './routes/personnel';
import servicesRouter from './routes/services';
import settingsRouter from './routes/settings';
import reportsRouter from './routes/reports';
import backupRouter from './routes/backup';
import oilMaintenanceRouter from './routes/oil-maintenance';
import faultReportsRouter from './routes/fault-reports';
import usersRouter from './routes/users';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'] }));
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', authRouter);
app.use('/api/regions', regionsRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/faults', faultsRouter);
app.use('/api/personnel', personnelRouter);
app.use('/api/services', servicesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/backup', backupRouter);
app.use('/api/oil-maintenance', oilMaintenanceRouter);
app.use('/api/fault-reports', faultReportsRouter);
app.use('/api/users', usersRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
