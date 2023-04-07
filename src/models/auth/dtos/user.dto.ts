import { Expose } from "class-transformer";
import { Role } from '@prisma/client';
import { Status } from "cloudinary";

export class UserDto {
    
    @Expose()
    id: string;

    @Expose()
    first_name: string;
    
    @Expose()
    last_name: string;
    
    @Expose()
    email: string;
    
    @Expose()
    role: string;
    
    @Expose()
    avatar: string;
    
    @Expose()
    bio: string;

    @Expose({ groups: [ Role.admin ] })
    verified: boolean;

    @Expose({ groups: [ Role.admin ] })
    status: Status;
    
    @Expose({ groups: [ Role.admin ] })
    avatar_id: string;
    
    @Expose({ groups: [ Role.admin ] })
    created_at: string;
    
    @Expose({ groups: [ Role.admin ] })
    updated_at: string;
    

}