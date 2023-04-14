import { CacheModule, Module } from '@nestjs/common';
import { PrismaModule } from './providers/database/prisma/prisma.module';
import { UsersModule } from './models/users/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './models/auth/auth.module';
import { redisStore } from 'cache-manager-ioredis-yet';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { QueueModule } from './providers/queue/queue.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ValidationErrorFilter } from './common/filters/validation-error.filter';
import { AuthorizerModule } from './authorizer/authorizer.module';
import { CloudinaryModule } from './providers/cloudinary/cloudinary.module';
import { JwtModule } from 'src/providers/jwt/jwt.module';
import { BlogsModule } from './models/blogs/blogs.module';


@Module({
  imports: [
    PrismaModule,
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        store: await redisStore({
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
          username: configService.get('REDIS_USERNAME'),
          password: configService.get('REDIS_PASSWORD'),
        }),
      }),
      isGlobal: true
    }),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST'),
          port: configService.get('SMTP_PORT'),
          auth: {
            user: configService.get('SMTP_USERNAME'),
            pass: configService.get('SMTP_PASSWORD'),
          },
          from: {
            address: configService.get('SMTP_FROM_ADDRESS'),
            name: configService.get('SMTP_FROM_NAME')
          }
        },
        template:{
          dir: join(__dirname, 'providers', 'email', 'templates'),
          adapter: new HandlebarsAdapter(),
          options:{
            strict: true
          }
        },
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    QueueModule,
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 20,
    }),
    AuthorizerModule,
    CloudinaryModule,
    JwtModule,
    BlogsModule,
  ],
  providers: [ 
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_FILTER,
      useClass: ValidationErrorFilter,
    },
  ]
})
export class AppModule {}
