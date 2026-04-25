import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
  Index,
} from 'typeorm';

@Entity('leave_balances')
@Index(['employeeId', 'locationId'], { unique: true })
export class LeaveBalance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  employeeId: number;

  @Column()
  locationId: string;

  @Column('real')
  totalDays: number;

  @Column('real', { default: 0 })
  usedDays: number;

  @Column('real')
  availableDays: number;

  @UpdateDateColumn()
  lastSyncedAt: Date;

  @VersionColumn()
  version: number;
}
