import { IsIn, IsString, IsOptional, IsBoolean } from 'class-validator';
import { PaginationDto } from '../../../../common/dtos/pagination.dto';
import { Role, Prisma, Status } from '@prisma/client';

export class GetUsersQueryDto extends PaginationDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsString()
  @IsOptional()
  @IsIn([Role.admin, Role.user, Role.editor])
  role?: Role;

  @IsString()
  @IsOptional()
  @IsIn(['active','inactive'])
  status?: Status;

  @IsString()
  @IsOptional()
  @IsIn(["true", "false"])
  verified?: string;

  @IsString()
  @IsIn(['asc', 'desc'])
  @IsOptional()
  sort?: Prisma.SortOrder = Prisma.SortOrder.desc
}
