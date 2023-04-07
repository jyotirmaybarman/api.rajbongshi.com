import { Injectable } from '@nestjs/common';
import { Authorizer } from '../../authorizer/authorizer';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { Blog, Role } from '@prisma/client';

export enum BlogMethods {
  create,
  read,
  update,
  destroy,
  readAll,
  updateStatus
}

@Injectable()
export class BlogsAuthorizer extends Authorizer<
  JwtPayload,
  Blog,
  keyof typeof BlogMethods
> {
  protected create(user: JwtPayload, model: Blog): boolean {
    return true;
  }

  protected read(user: JwtPayload, model: Blog): boolean {
    if (
      user.role === Role.admin ||
      user.role === Role.editor ||
      user.sub === model.user_id
    ) {
      return true;
    }
    return false;
  }

  protected update(user: JwtPayload, model: Blog): boolean {
    if (
      user.role === Role.admin ||
      user.role === Role.editor ||
      user.sub === model.user_id
    ) {
      return true;
    }
    return false;
  }

  protected destroy(user: JwtPayload, model: Blog): boolean {
    if (
      user.role === Role.admin ||
      user.role === Role.editor ||
      user.sub === model.user_id
    ) {
      return true;
    }
    return false;
  }

  protected readAll(user: JwtPayload, model: Blog): boolean {
    return true;
  }

  protected updateStatus(user: JwtPayload, model: Blog, data: Partial<Blog>): boolean {
        
    if( user.role === Role.admin || user.role === Role.editor ) {
      return true;
    }
    if(user.sub === model.user_id && data.status != 'published') {
      return true;
    }
    return false
  }
}
