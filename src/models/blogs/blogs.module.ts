import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { BlogsV1Controller } from './controllers/blogs.v1.controller';
import { BlogsV1Service } from './services/blogs.v1.service';
import { CheckAuthMiddleware } from '../../common/middlewares/check-auth.middleware';
import { UsersV1Service } from '../users/services/users.v1.service';

@Module({
  controllers: [BlogsV1Controller],
  providers: [BlogsV1Service, UsersV1Service]
})
export class BlogsModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    return consumer.apply(CheckAuthMiddleware).forRoutes(BlogsV1Controller);
  }
}
