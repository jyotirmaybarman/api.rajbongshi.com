import { Module } from '@nestjs/common';
import { UsersV1Service } from './services/users.v1.service';

@Module({
  providers: [ UsersV1Service ],
  exports: [ UsersV1Service ]
})
export class UsersModule {}
