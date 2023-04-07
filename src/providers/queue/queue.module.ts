import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { QueueProcessor } from './queue.processor';
import { QUEUES } from './queue.constant';
import { EmailService } from '../email/email.service';
import { QueueJobs } from './queue.jobs';
import { UsersV1Service } from '../../models/users/services/users.v1.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { BlogsV1Service } from '../../models/blogs/services/blogs.v1.service';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
    }),
    BullModule.registerQueue({
      name: QUEUES.DEFAULT_QUEUE,
    }),
  ],
  providers: [
    QueueService,
    QueueProcessor,
    EmailService,
    QueueJobs,
    UsersV1Service,
    CloudinaryService,
    BlogsV1Service
  ],
  exports: [QueueService],
})
export class QueueModule {}
