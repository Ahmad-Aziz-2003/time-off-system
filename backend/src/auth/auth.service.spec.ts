import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Employee, UserRole } from '../entities/employee.entity';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let repo: Pick<Repository<Employee>, 'findOne'>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Employee),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
    repo = moduleRef.get(getRepositoryToken(Employee));
  });

  it('should return employee on valid credentials', async () => {
    const passwordHash = await bcrypt.hash('pass1234', 10);
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Ali',
      email: 'ali@readyon.com',
      passwordHash,
      locationId: 'LOC-1',
      role: UserRole.EMPLOYEE,
      createdAt: new Date(),
    } satisfies Employee);

    const result = await service.login('ali@readyon.com', 'pass1234');
    expect(result.token).toBe('simple-token-1');
    expect(result.employee.email).toBe('ali@readyon.com');
    expect((result.employee as any).passwordHash).toBeUndefined();
  });

  it('should throw UnauthorizedException on wrong password', async () => {
    const passwordHash = await bcrypt.hash('pass1234', 10);
    (repo.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      name: 'Ali',
      email: 'ali@readyon.com',
      passwordHash,
      locationId: 'LOC-1',
      role: UserRole.EMPLOYEE,
      createdAt: new Date(),
    } satisfies Employee);

    await expect(service.login('ali@readyon.com', 'wrong')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('should throw NotFoundException when email not found', async () => {
    (repo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.login('missing@readyon.com', 'pass1234')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
