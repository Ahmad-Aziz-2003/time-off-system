import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('leave_requests')
@Index(['employeeId', 'status'])
export class LeaveRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employeeId: number;

  @Column()
  locationId: string;

  @Column('real')
  daysRequested: number;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text' })
  status: RequestStatus;

  @Column({ type: 'integer', nullable: true })
  managerId: number | null;

  @Column({ default: false })
  hcmAcknowledged: boolean;

  @Column({ type: 'text', nullable: true })
  managerNote: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
