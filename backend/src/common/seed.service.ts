import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Employee, UserRole } from '../entities/employee.entity';
import { LeaveBalance } from '../entities/leave-balance.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Employee) private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(LeaveBalance) private readonly balanceRepo: Repository<LeaveBalance>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.employeeRepo.count();
    if (count > 0) return;

    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('pass1234', saltRounds);

    const employees = await this.employeeRepo.save([
      this.employeeRepo.create({
        name: 'Ali Khan',
        email: 'ali@readyon.com',
        passwordHash: defaultPassword,
        locationId: 'LOC-1',
        role: UserRole.EMPLOYEE,
      }),
      this.employeeRepo.create({
        name: 'Sara Ahmed',
        email: 'sara@readyon.com',
        passwordHash: defaultPassword,
        locationId: 'LOC-1',
        role: UserRole.EMPLOYEE,
      }),
      this.employeeRepo.create({
        name: 'Ahmed Raza',
        email: 'ahmed@readyon.com',
        passwordHash: defaultPassword,
        locationId: 'LOC-2',
        role: UserRole.EMPLOYEE,
      }),
      this.employeeRepo.create({
        name: 'Zara Manager',
        email: 'manager@readyon.com',
        passwordHash: defaultPassword,
        locationId: 'LOC-1',
        role: UserRole.MANAGER,
      }),
    ]);

    const byEmail = new Map(employees.map((e) => [e.email, e]));

    await this.balanceRepo.save([
      this.balanceRepo.create({
        employeeId: byEmail.get('ali@readyon.com')!.id,
        locationId: 'LOC-1',
        totalDays: 15,
        usedDays: 0,
        availableDays: 15,
      }),
      this.balanceRepo.create({
        employeeId: byEmail.get('sara@readyon.com')!.id,
        locationId: 'LOC-1',
        totalDays: 12,
        usedDays: 0,
        availableDays: 12,
      }),
      this.balanceRepo.create({
        employeeId: byEmail.get('ahmed@readyon.com')!.id,
        locationId: 'LOC-2',
        totalDays: 10,
        usedDays: 0,
        availableDays: 10,
      }),
    ]);

    this.logger.log('Seeded employees and leave balances');
  }
}
