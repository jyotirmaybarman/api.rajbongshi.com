import { Exclude, Transform } from 'class-transformer';
import { IsNotEmpty, IsIn } from 'class-validator';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';
import { ValidationErrorException } from 'src/common/exceptions/validation-error.exception';
export class UpdateBlogDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  title?: string;

  @IsBoolean()
  @IsOptional()
  @Exclude({ toPlainOnly: true })
  @Transform(({ value }) => {            
    if(['true', 'false'].includes(String(value))) {
        return String(value) === 'true';
    }else{
        throw new ValidationErrorException({ message: "field 'update_slug' must only contain 'true' or 'false'" })
    }
  })
  update_slug?: boolean = false;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  content?: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  meta?: string;

  @IsArray()
  @IsString({
    each: true,
  })
  @ArrayMaxSize(3)
  @IsOptional()
  tags?: string[];
}
