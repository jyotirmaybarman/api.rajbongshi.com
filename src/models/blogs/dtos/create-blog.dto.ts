import {
  ArrayMaxSize,
  IsArray,
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  meta: string;

  @IsArray()
  @IsString({
    each: true,
  })
  @ArrayMaxSize(3)
  @IsOptional()
  tags?: string[];
}
