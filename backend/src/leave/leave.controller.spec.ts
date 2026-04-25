import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';

describe('LeaveController', () => {
  let app: any;
  const leaveService = {
    submitRequest: jest.fn(),
    approveRequest: jest.fn(),
    cancelRequest: jest.fn(),
    getBalance: jest.fn(),
    forceSyncBalance: jest.fn(),
    getRequestsForEmployee: jest.fn(),
    getAllPending: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LeaveController],
      providers: [{ provide: LeaveService, useValue: leaveService }],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /leave/request - returns 201 on success', async () => {
    leaveService.submitRequest.mockResolvedValue({ id: 1, status: 'PENDING' });
    await request(app.getHttpServer())
      .post('/leave/request')
      .send({ employeeId: 1, locationId: 'LOC-1', daysRequested: 1, reason: 'x' })
      .expect(201);
  });

  it('POST /leave/request - returns 400 on insufficient balance', async () => {
    leaveService.submitRequest.mockRejectedValue(new BadRequestException('Insufficient balance'));
    await request(app.getHttpServer())
      .post('/leave/request')
      .send({ employeeId: 1, locationId: 'LOC-1', daysRequested: 99, reason: 'x' })
      .expect(400);
  });

  it('POST /leave/approve/:id - returns 200 on approve', async () => {
    leaveService.approveRequest.mockResolvedValue({ id: 1, status: 'APPROVED' });
    await request(app.getHttpServer())
      .post('/leave/approve/1')
      .send({ managerId: 4, action: 'APPROVED' })
      .expect(200);
  });

  it('DELETE /leave/request/:id - returns 200 on cancel', async () => {
    leaveService.cancelRequest.mockResolvedValue(undefined);
    await request(app.getHttpServer())
      .delete('/leave/request/1')
      .send({ employeeId: 1 })
      .expect(200);
  });
});
