import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import {
  CACHE_MANAGER,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../../../common/types/jwt-payload.type';
import { Cache } from 'cache-manager';
import { UsersV1Service } from 'src/models/users/services/users.v1.service';
import { JwtPayloadWithRt } from 'src/common/types/jwt-payload-with-rt.type';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersV1Service,
    @Inject(CACHE_MANAGER) private redis: Cache,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          let token = null;
          if (req && req.cookies) {
            token = req.cookies.token;
          }
          return token;
        },
      ]),
      secretOrKey: config.get<string>('JWT_REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<JwtPayloadWithRt> {
    const refresh_token = req.cookies.token;
    if (!refresh_token) throw new ForbiddenException('invlaid refresh token');

    // check cache
    const cachedToken = await this.redis.get<string>(`refresh:${payload.sub}`);
    if (cachedToken != refresh_token)
      throw new UnauthorizedException('invalid refresh token');

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
      if(!user) throw new UnauthorizedException('invalid refresh token');

    return {
      email: user.email,
      sub: user.id,
      role: user.role,
      status: user.status,
      refresh_token,
    };
  }
}
