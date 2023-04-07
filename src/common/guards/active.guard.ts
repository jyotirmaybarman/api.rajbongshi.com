import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.type';

@Injectable()
export class ActiveGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const user: JwtPayload = request.user;

    return user.status === 'active';
  }
}