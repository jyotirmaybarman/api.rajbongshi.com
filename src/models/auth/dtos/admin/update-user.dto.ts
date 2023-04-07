import { UpdateProfileDto } from '../update-profile.dto';
import { IsString, IsNotEmpty, Matches, IsOptional, IsIn, IsBoolean } from 'class-validator';
import { Role, Status } from '@prisma/client';
import { Exclude, Transform } from 'class-transformer';
import { SameAs } from 'src/common/decorators/same-as.decorator';
import { ValidationErrorException } from 'src/common/exceptions/validation-error.exception';

export class UpdateUserDto extends UpdateProfileDto {

    @IsString()
    @IsOptional()
    @IsNotEmpty()
    @Matches(/[a-z]/, { message: 'password must consist an lowercase' })
    @Matches(/[A-Z]/, { message: 'password must consist an uppercase' })
    @Matches(/[0-9]/, { message: 'password must consist a digit' })
    @Matches(/.{8,}/, { message: 'password must be atleast 8 chars long' })
    @Matches(/\W|_/, { message: 'password must consist a special character' })
    password?: string;

    @SameAs<UpdateUserDto>('password')
    @Exclude({ toPlainOnly: true })
    password_confirmation?: string;

    @IsString()
    @IsOptional()
    @IsIn([Role.admin, Role.user, Role.editor])
    role?: Role;

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
    verified?: boolean;
}