import cors from 'cors';
import express from 'express';

type Balance = {
  employeeId: number;
  locationId: string;
  totalDays: number;
  usedDays: number;
  availableDays: number;
};

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  // eslint-disable-next-line no-console
  console.log(`[HCM] ${req.method} ${req.url}`);
  next();
});

const balances: Record<string, Balance> = {
  '1:LOC-1': { employeeId: 1, locationId: 'LOC-1', totalDays: 15, usedDays: 0, availableDays: 15 },
  '2:LOC-1': { employeeId: 2, locationId: 'LOC-1', totalDays: 12, usedDays: 0, availableDays: 12 },
  '3:LOC-2': { employeeId: 3, locationId: 'LOC-2', totalDays: 10, usedDays: 0, availableDays: 10 },
};

const makeKey = (employeeId: number, locationId: string) => `${employeeId}:${locationId}`;

app.get('/hcm/balance/:employeeId', (req, res) => {
  const employeeId = Number(req.params.employeeId);
  const locationId = String(req.query.locationId ?? '');
  const key = makeKey(employeeId, locationId);
  const bal = balances[key];
  if (!bal) return res.status(404).json({ success: false, error: 'Employee/location not found' });
  return res.json({ success: true, data: bal });
});

app.post('/hcm/deduct', (req, res) => {
  const { employeeId, locationId, days } = req.body as {
    employeeId: number;
    locationId: string;
    days: number;
  };
  const key = makeKey(Number(employeeId), String(locationId));
  const bal = balances[key];
  if (!bal) return res.status(404).json({ success: false, error: 'Employee/location not found' });
  if (bal.availableDays < Number(days)) {
    return res.status(400).json({ success: false, error: 'Insufficient balance' });
  }
  bal.availableDays -= Number(days);
  bal.usedDays += Number(days);
  return res.json({ success: true, data: bal });
});

app.post('/hcm/restore', (req, res) => {
  const { employeeId, locationId, days } = req.body as {
    employeeId: number;
    locationId: string;
    days: number;
  };
  const key = makeKey(Number(employeeId), String(locationId));
  const bal = balances[key];
  if (!bal) return res.status(404).json({ success: false, error: 'Employee/location not found' });

  bal.availableDays += Number(days);
  bal.usedDays = Math.max(0, bal.usedDays - Number(days));
  return res.json({ success: true, data: bal });
});

app.get('/hcm/batch', (_req, res) => {
  return res.json({ success: true, data: Object.values(balances) });
});

app.post('/hcm/simulate/bonus', (req, res) => {
  const { employeeId, locationId, bonusDays } = req.body as {
    employeeId: number;
    locationId: string;
    bonusDays: number;
  };
  const key = makeKey(Number(employeeId), String(locationId));
  const bal = balances[key];
  if (!bal) return res.status(404).json({ success: false, error: 'Employee/location not found' });

  bal.totalDays += Number(bonusDays);
  bal.availableDays += Number(bonusDays);
  return res.json({ success: true, data: bal });
});

const port = 3001;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Mock HCM server running on port ${port}`);
});
