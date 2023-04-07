import { CallHandler, ExecutionContext, NestInterceptor, Injectable, UseInterceptors } from '@nestjs/common';
import { ClassTransformOptions, plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JwtPayload } from '../types/jwt-payload.type';

type ClassType = new (...args: any[]) => {};

export type FilterFunction = (dto: ClassType, data: any, user: JwtPayload) => object


export function Serialize(dto: ClassType, filter: FilterFunction = defaultFunction ){
  return UseInterceptors(new SerializeInterceptor(dto, filter));
}


function defaultFunction(dto: ClassType, data: any, user: JwtPayload){
  const filtered = [];
  let options: ClassTransformOptions = {
    excludeExtraneousValues: true,
    groups: [user && user.role ? user.role : ''],
  };
  
  if(data.data){
    if(Array.isArray(data.data)){
      data.data.forEach(item => {
        filtered.push(plainToInstance(dto, item, options))
      })
      data.data = filtered
    }else{
      data.data = plainToInstance(dto, data.data, options)
    }
  }else if(Array.isArray(data)){
    data.forEach(item => {
      filtered.push(plainToInstance(dto, item, options))
    })
    data = filtered
  }else{
    data = plainToInstance(dto, data, options)
  }

  return data;
}

@Injectable()
export class SerializeInterceptor implements NestInterceptor{
  constructor(private dto: ClassType, private readonly filter: FilterFunction){}
  async intercept(context: ExecutionContext, next: CallHandler<any>): Promise<Observable<any>> {
    const req: Request = context.switchToHttp().getRequest();
    const user: JwtPayload = req.user as JwtPayload;
    
    return next.handle().pipe(
      map((data: any) => this.filter(this.dto, data, user))
    )
  }

}