import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../../../common/types/jwt-payload.type';
import { Cache } from 'cache-manager';
import { UsersV1Service } from '../../users/services/users.v1.service';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersV1Service,
    @Inject(CACHE_MANAGER) private redis: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtPayload> {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) throw new UnauthorizedException('invalid access token');

    // check redis cache
    const cachedToken = await this.redis.get<string>(`access:${payload.sub}`);
    if (cachedToken != token)
      throw new UnauthorizedException('invalid access token');

    const user = await this.usersService.findOne({
      select:{
        email: true,
        role: true,
        id: true,
        status: true
      },
      where:{
        id: payload.sub,
        verified: true
      }
    });

    if(!user) throw new UnauthorizedException('invalid access token');

    return {
      email: user.email,
      role: user.role,
      sub: user.id,
      status: user.status
    };
  }
}
