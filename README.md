# TimeOff Microservice

ReadyOn TimeOff Microservice is a small full-stack system for leave management. It consists of a NestJS backend, a mock HCM server, and a Next.js frontend. The system maintains a local leave cache, validates requests with HCM, stores request history, and performs background synchronization every 10 minutes.

---

## Services And Ports

| Service     | Port | Purpose                   |
| ----------- | ---- | ------------------------- |
| Frontend    | 3000 | Employee and manager UI   |
| Backend API | 3002 | Auth, leave, and sync API |
| Mock HCM    | 3001 | External balance source   |

---

## Prerequisites

* Node.js 18 or newer
* npm

---

## How To Run The Project

Open **three terminals** and run services in order:

### 1. Start Mock HCM Server

```bash
cd backend
npm install
npm run start:hcm
```

---

### 2. Start Backend API

```bash
cd backend
npm install
$env:PORT=3002
$env:HCM_URL=http://localhost:3001
npm run start
```

You can also place these values in a `.env` file.

---

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
[http://localhost:3000](http://localhost:3000)

---

## What The App Does

* Employees log in and view leave balance
* Submit leave requests
* Cancel only their own pending requests
* Managers approve/reject requests
* Backend refreshes stale data from HCM
* Cron job syncs balances every 10 minutes

---

## API Endpoints

| Method | Path                            | Description       |
| ------ | ------------------------------- | ----------------- |
| POST   | /auth/login                     | Login             |
| GET    | /leave/balance/:employeeId      | Get balance       |
| GET    | /leave/balance/:employeeId/sync | Force sync        |
| POST   | /leave/request                  | Submit leave      |
| GET    | /leave/requests/:employeeId     | Employee requests |
| GET    | /leave/requests/pending/all     | Manager view      |
| POST   | /leave/approve/:requestId       | Approve/reject    |
| DELETE | /leave/request/:requestId       | Cancel request    |
| POST   | /sync/trigger                   | Manual sync       |
| GET    | /sync/logs                      | Sync history      |

---

## Frontend Routes

| Route      | Purpose            |
| ---------- | ------------------ |
| /login     | Login              |
| /dashboard | Employee dashboard |
| /request   | Request leave      |
| /manager   | Manager approvals  |

---

## Sync Logic (Simple Explanation)

1. System reads local balance first
2. If stale → fetch from HCM
3. Before submitting leave → validate with HCM
4. On approval → deduct from HCM first
5. Cron job syncs every 10 minutes
6. Employees with pending requests are skipped

---

## Edge Cases Covered

* HCM offline → fallback to local
* Empty HCM response → marked failed
* Stale balance → refreshed automatically
* Pending requests → skipped in sync
* Unauthorized cancellation → rejected
* Non-pending cancellation → rejected
* Insufficient balance → rejected
* Invalid login → rejected

---

## Seed Data

| Name         | Email                  | Role     | Balance |
| ------------ | ---------------------- | -------- | ------- |
| Ali Khan     | ali@readyon.com        | EMPLOYEE | 15      |
| Sara Ahmed   | sara@readyon.com       | EMPLOYEE | 12      |
| Ahmed Raza   | ahmed@readyon.com      | EMPLOYEE | 10      |
| Zara Manager | manager@readyon.com    | MANAGER  | —       |

---

## Frontend Integration Notes

* Use `POST /auth/login` and store token
* Fetch balance via `/leave/balance/:employeeId`
* Submit leave via `/leave/request`
* Manager uses `/leave/requests/pending/all`
* Approve via `/leave/approve/:requestId`
* View sync logs via `/sync/logs`

---

## Runtime Defaults

* Backend API → [http://localhost:3002](http://localhost:3002)
* Mock HCM → [http://localhost:3001](http://localhost:3001)
* Frontend → [http://localhost:3000](http://localhost:3000)

---

## Testing (Important)

To run backend tests:

```bash
cd backend

# Unit Tests
npm run test

# End-to-End Tests
npm run test:e2e

# Test Coverage (optional)
npm run test:cov
```

### What These Tests Cover

* Auth login flow
* Leave request lifecycle
* Approval & rejection logic
* Cancellation validation
* HCM error handling
* Sync service logic
* Full end-to-end leave flow

---

## Results

* Backend unit tests: ✅ Passed
* Backend e2e tests: ✅ Passed
* Frontend build: ✅ Passed
* ESLint: ✅ No errors

---

## Notes

* Build/test folders are ignored via `.gitignore`
* Backend runs on port **3002**
* HCM runs on port **3001**
* Frontend runs on port **3000**