import { CACHE_MANAGER, Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { UsersV1Service } from 'src/models/users/services/users.v1.service';
import { JwtPayload } from 'src/common/types/jwt-payload.type';

@Injectable()
export class CheckAuthMiddleware implements NestMiddleware {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersV1Service,
    @Inject(CACHE_MANAGER) private redis: Cache
    ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { authorization } = req.headers;

    if (!authorization) {
      req.user = null;
      return next();
    }

    try {
      const token = authorization.split(' ')[1];
      const payload: JwtPayload = this.jwt.verify(token, {
        secret: this.config.get<string>('JWT_ACCESS_TOKEN_SECRET')
      });

      // check redis cache
      const cachedToken = await this.redis.get<string>(`access:${payload.sub}`);
      
      if (cachedToken != token){
        req.user = null;
      }else{
        req.user = await this.usersService.findOne({
          select:{
            email: true,
            role: true,
            id: true,
          },
          where:{
            id: payload.sub,
          }
        });
      }
    } catch (error) {
      req.user = null;
    }
    next();
  }
}