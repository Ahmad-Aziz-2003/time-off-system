import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { Employee } from './entities/employee.entity';
import { LeaveBalance } from './entities/leave-balance.entity';
import { LeaveRequest } from './entities/leave-request.entity';
import { SyncLog } from './entities/sync-log.entity';
import { LeaveModule } from './leave/leave.module';
import { SeedService } from './common/seed.service';
import { SyncModule } from './sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isTest = config.get('NODE_ENV') === 'test';
        const database = config.get<string>('DB_DATABASE') ?? 'timeoff.db';

        return {
          type: 'better-sqlite3' as const,
          database: isTest ? ':memory:' : database,
          synchronize: true,
          dropSchema: isTest,
          entities: [Employee, LeaveBalance, LeaveRequest, SyncLog],
        };
      },
    }),
    TypeOrmModule.forFeature([Employee, LeaveBalance, LeaveRequest, SyncLog]),
    AuthModule,
    LeaveModule,
    SyncModule,
  ],
  controllers: [],
  providers: [SeedService],
})
export class AppModule {}
