import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Employee } from '../entities/employee.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee) private readonly employeeRepo: Repository<Employee>,
  ) {}

  async login(email: string, password: string) {
    const employee = await this.employeeRepo.findOne({ where: { email } });
    if (!employee) throw new NotFoundException('Invalid credentials');

    const ok = await bcrypt.compare(password, employee.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const { passwordHash: _passwordHash, ...safeEmployee } = employee;
    return { employee: safeEmployee, token: `simple-token-${employee.id}` };
  }
}
