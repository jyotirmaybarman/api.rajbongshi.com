import { IsOptional, IsString, IsIn } from 'class-validator';
import { PaginationDto } from 'src/common/dtos/pagination.dto';

export class BlogsQueryDto extends PaginationDto {
    @IsString()
    @IsOptional()
    @IsIn(['published', 'draft', 'unpublished'])
    status?: string;

    @IsString()
    @IsOptional()
    author?: string;

    @IsString()
    @IsOptional()
    slug?: string;

    @IsString()
    @IsOptional()
    id?: string;
}