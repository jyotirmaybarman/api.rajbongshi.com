import { Module } from '@nestjs/common';
import { AuthV1Service } from './services/auth.v1.service';
import { AuthV1Controller } from './controllers/auth.v1.controller';
import { UsersV1Service } from '../users/services/users.v1.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { CloudinaryService } from '../../providers/cloudinary/cloudinary.service';

@Module({
  imports: [],
  providers: [
    AuthV1Service,
    UsersV1Service,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    CloudinaryService
  ],
  controllers: [AuthV1Controller],
})
export class AuthModule {}
