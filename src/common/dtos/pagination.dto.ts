import { Transform } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

type Pagination = {
    skip?: number;
    take?: number;
    page?: number;
}

export class PaginationDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  page?: number;
  
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  limit?: number;
}

export function getPagination(query: PaginationDto): Pagination{
  if (!query.page && !query.limit) return {};
  if(query.page && !query.limit){
    query.limit = 10
  }else if(!query.page && query.limit){
    query.page = 1
  }
  const page = Math.abs(query.page);
  const take = Math.abs(query.limit);
  const skip = (page - 1) * take;

  return {
    skip,
    take,
    page,
  };
}