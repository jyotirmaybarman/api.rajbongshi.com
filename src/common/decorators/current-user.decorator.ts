import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtPayload } from '../types/jwt-payload.type';

export const CurrentUser = createParamDecorator(
  (_data: any, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    
    let user: JwtPayload = null;
    if (request.user) user = request.user;

    return user;
  },
);
