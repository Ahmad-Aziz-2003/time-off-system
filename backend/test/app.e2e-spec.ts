import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { HcmClientService } from '../src/common/hcm-client.service';
import { AppModule } from '../src/app.module';

describe('TimeOff Microservice (e2e)', () => {
  let app: INestApplication;

  const hcmState = {
    employeeId: 1,
    locationId: 'LOC-1',
    totalDays: 15,
    usedDays: 0,
    availableDays: 15,
  };

  const mockHcm: Partial<HcmClientService> = {
    getBalance: jest.fn(async () => ({ ...hcmState } as any)),
    deductDays: jest.fn(async (_employeeId: number, _locationId: string, days: number) => {
      if (hcmState.availableDays < days) return false;
      hcmState.availableDays -= days;
      hcmState.usedDays += days;
      return true;
    }),
    restoreDays: jest.fn(async () => true),
    batchSync: jest.fn(async () => []),
    simulateBonus: jest.fn(async () => true),
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DB_DATABASE = ':memory:';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HcmClientService)
      .useValue(mockHcm)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('full lifecycle', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ali@readyon.com', password: 'pass1234' })
      .expect(201);

    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.employee.email).toBe('ali@readyon.com');

    const balance1 = await request(app.getHttpServer()).get('/leave/balance/1').expect(200);
    expect(balance1.body.success).toBe(true);
    expect(balance1.body.data.availableDays).toBe(15);

    const submit = await request(app.getHttpServer())
      .post('/leave/request')
      .send({ employeeId: 1, locationId: 'LOC-1', daysRequested: 3, reason: 'Vacation' })
      .expect(201);
    expect(submit.body.success).toBe(true);
    expect(submit.body.data.status).toBe('PENDING');

    const list = await request(app.getHttpServer()).get('/leave/requests/1').expect(200);
    expect(list.body.success).toBe(true);
    expect(list.body.data.length).toBeGreaterThan(0);
    const requestId = list.body.data[0].id;

    const approve = await request(app.getHttpServer())
      .post(`/leave/approve/${requestId}`)
      .send({ managerId: 4, action: 'APPROVED', managerNote: 'Enjoy' })
      .expect(200);
    expect(approve.body.success).toBe(true);
    expect(approve.body.data.status).toBe('APPROVED');

    const balance2 = await request(app.getHttpServer()).get('/leave/balance/1').expect(200);
    expect(balance2.body.success).toBe(true);
    expect(balance2.body.data.availableDays).toBe(12);
  });
});

