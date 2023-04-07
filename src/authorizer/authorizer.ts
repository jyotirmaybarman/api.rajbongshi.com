import { ForbiddenException } from '@nestjs/common';


export class Authorizer<User, Model, Methods> {
  authorize(user: User, method: Methods, model?: Model, data?: Partial<Model>, logError = false): boolean {
    try {
      let methodName = String(method);
      let isAuthorized = this[methodName](user, model, data);
      if (isAuthorized) {
        return true;
      } else {
        throw new ForbiddenException();
      }
    } catch (error) {
      if(logError) console.log(error);
      throw new ForbiddenException();
    }
  }

  protected create(user: User, model: Model, data:Partial<Model>): boolean {
    return false;
  }

  protected read(user: User, model: Model, data:Partial<Model>): boolean {
    return false;
  }

  protected update(user: User, model: Model, data:Partial<Model>): boolean {
    return false;
  }

  protected destroy(user: User, model: Model, data:Partial<Model>): boolean {
    return false;
  }
}
