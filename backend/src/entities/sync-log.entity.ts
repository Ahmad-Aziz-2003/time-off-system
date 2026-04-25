import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum SyncType {
  REALTIME = 'REALTIME',
  BATCH = 'BATCH',
  MANUAL = 'MANUAL',
}

export enum SyncStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PARTIAL = 'PARTIAL',
}

@Entity('sync_logs')
export class SyncLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  syncType: SyncType;

  @Column({ type: 'text' })
  status: SyncStatus;

  @Column({ default: 0 })
  employeesProcessed: number;

  @Column({ type: 'text', nullable: true })
  errorDetails: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
