import { RegisterDto } from '../register.dto';
import { IsIn, IsString, IsBoolean, IsOptional } from 'class-validator';
import { Role, Status } from '@prisma/client';
import { Transform } from 'class-transformer';
import { ValidationErrorException } from 'src/common/exceptions/validation-error.exception';

export class AddNewUserDto extends RegisterDto{

    @IsString()
    @IsOptional()
    @IsIn(['admin','user','editor'])
    role?: Role = "user";

    @IsString()
    @IsOptional()
    @IsIn(['active','inactive'])
    status?: Status = "inactive";

    @IsBoolean()
    @IsOptional()
    @Transform(({ value }) => {            
        if(['true', 'false'].includes(String(value))) {
            return String(value) === 'true';
        }else{
            throw new ValidationErrorException({ message: "field 'verified' must only contain 'true' or 'false'" })
        }
    })
    verified?: boolean = true;
}