import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { UsersV1Service } from '../../users/services/users.v1.service';
import { RegisterDto } from '../dtos/register.dto';
import * as bcrypt from 'bcryptjs';
import { Role, User, Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from '../dtos/login.dto';
import { JwtPayload } from 'src/common/types/jwt-payload.type';
import { JwtPayloadWithRt } from 'src/common/types/jwt-payload-with-rt.type';
import { Cache } from 'cache-manager';
import { ResendVerificationDto } from '../dtos/resend-verification.dto';
import { ValidateEmailDto } from '../dtos/validate-email.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { QueueService } from '../../../providers/queue/queue.service';
import { SendEmailJobDto } from '../../../providers/queue/dtos/send-email-job.dto';
import { UploadProfilePictureJobDto } from 'src/providers/queue/dtos/upload-profile-picture.job.dto';
import { instanceToPlain } from 'class-transformer';
import { AddNewUserDto } from '../dtos/admin/add-new-user.dto';
import { UpdateUserDto } from '../dtos/admin/update-user.dto';
import { getPagination } from '../../../common/dtos/pagination.dto';
import { GetUsersQueryDto } from '../dtos/admin/get-users-query.dto';
import { DeleteProfilePictureJobDto } from '../../../providers/queue/dtos/delete-profile-picture.job';
import { ForbiddenException } from '@nestjs/common';
import { Status } from '@prisma/client';

@Injectable()
export class AuthV1Service {
  constructor(
    private readonly usersService: UsersV1Service,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private redis: Cache,
    private readonly queueService: QueueService,
  ) {}

  async register(regData: RegisterDto) {
    let data = instanceToPlain(regData) as Omit<
      RegisterDto,
      'password_confirmation'
    >;
    let user = await this.usersService.findOne({
      where: {
        email: data.email,
      },
    });
    if (user) throw new BadRequestException('email address already in use');

    const count = await this.usersService.getCount({});
    let role:Role = Role.user;
    let status: Status = null;
    if(count == 0){
      role = Role.admin;
      status = Status.active
    }

    // generate verification token
    const verification_token = this.jwt.sign(
      { email: data.email },
      {
        secret: this.configService.get('JWT_VERIFY_EMAIL_SECRET'),
        expiresIn: '1h',
      },
    );

    // hash password with bcrypt
    data.password = await bcrypt.hash(data.password, 13);

    user = await this.usersService.create({
      data: {
        ...data,
        verification_token,
        avatar: `https://avatars.dicebear.com/api/bottts/${data.first_name[0].toLowerCase()}${data.last_name[0].toLowerCase()}.svg`,
        role,
        ...(status && { status }),
      },
    });

    // send the email -> it will queue the email sending

    await this.queueService.addJob<SendEmailJobDto>({
      task: 'sendEmail',
      data: {
        template: 'verify-email',
        to: data.email,
        subject: 'Verify your email address',
        context: {
          link: this.generateVerificationLink(verification_token),
          contact_email: 'contact@developerzilla.com',
        },
      },
    });

    return {
      message: 'registered ! check email for confirmation link',
    };
  }

  async resendVerificationEmail(data: ResendVerificationDto) {
    const user = await this.usersService.findOne({
      where: {
        email: data.email,
        verified: false,
        verification_token: {
          not: null,
        },
      },
      select: {
        verification_token: true,
        email: true,
      },
    });
    if (!user) return {
        message: 'a verification link will be sent to your email'
      }

    const new_verification_token = this.jwt.sign(
      { email: user.email },
      {
        secret: this.configService.get('JWT_VERIFY_EMAIL_SECRET'),
        expiresIn: '1h',
      },
    );

    await this.usersService.updateOne({
      where: {
        email: user.email,
      },
      data: {
        verification_token: new_verification_token,
      },
    });

    // queue email sending

    await this.queueService.addJob<SendEmailJobDto>({
      task: 'sendEmail',
      data: {
        template: 'verify-email',
        to: data.email,
        subject: 'Verify your email address',
        context: {
          link: this.generateVerificationLink(new_verification_token),
          contact_email: 'contact@developerzilla.com',
        },
      },
    });

    return {
      message: 'a verification link will be sent to your email',
    };
  }

  async verifyEmail(verification_token: string) {
    let valid: { email: string } = null;
    try {
      valid = await this.jwt.verifyAsync(verification_token, {
        secret: this.configService.get('JWT_VERIFY_EMAIL_SECRET'),
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException('invalid verification token');
    }
    if (!valid) throw new BadRequestException('invalid verification token');

    // update user as verified
    const user = await this.usersService.findOne({
      where: {
        email: valid.email,
        verification_token: {
          not: null,
        },
      },
    });
    if (!user) throw new BadRequestException('invalid verification token');

    await this.usersService.updateOne({
      data: {
        verified: true,
        verification_token: null,
      },
      where: {
        id: user.id,
      },
    });

    return {
      message: 'email address verified, you may login now !',
    };
  }

  async login(data: LoginDto) {
    const user = await this.usersService.findOne({
      where: {
        email: data.email,
        verified: true,
      },
    });

    if (!user) throw new BadRequestException('invalid username or password');

    // check password
    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) throw new BadRequestException('invalid username or password');

    // generate tokens
    let refresh_expiry = data.remember
      ? 1000 * 60 * 60 * 24 * 7
      : 1000 * 60 * 60 * 24;
    let access_expiry = 1000 * 60 * 15; // 15 minutes
    const refresh_token = this.generateRefreshToken(
      { email: user.email, sub: user.id },
      { expiresIn: refresh_expiry },
    );
    const access_token = this.generateAccessToken(
      { email: user.email, sub: user.id },
      { expiresIn: access_expiry },
    );

    // add refresh_token to redis to maintain whitelist
    await this.redis.set(`refresh:${user.id}`, refresh_token, refresh_expiry);
    await this.redis.set(`access:${user.id}`, access_token, access_expiry);

    return {
      refresh_token,
      access_token,
      message: 'successfully logged in',
    };
  }

  async getLoggedInProfile(user: JwtPayload) {
    const profile = await this.usersService.findOne({
      where: {
        id: user.sub,
      },
    });

    if (!profile) throw new NotFoundException('user not found');

    return profile;
  }

  async refreshAccessToken(user: JwtPayloadWithRt) {
    let access_expiry = 1000 * 60 * 15; // 15 minutes
    const access_token = this.generateAccessToken(
      { email: user.email, sub: user.sub },
      { expiresIn: access_expiry },
    );
    await this.redis.set(`access:${user.sub}`, access_token, access_expiry);

    return {
      access_token,
    };
  }

  async logout(user: JwtPayloadWithRt) {
    if (!user) throw new InternalServerErrorException('something went wrong');

    await this.redis.get(`refresh:${user.sub}`);
    await this.redis.get(`access:${user.sub}`);

    return {
      message: 'logged out successfully',
    };
  }

  async sendPasswordResetLink(data: ValidateEmailDto) {
    const user = await this.usersService.findOne({
      where: {
        email: data.email,
        verified: true,
      },
    });

    if (!user)
      return {
        message: 'reset link will be sent shortly',
      };

    const reset_token = this.jwt.sign(
      {
        email: user.email,
      },
      {
        secret: this.configService.get('JWT_RESET_TOKEN_SECRET'),
        expiresIn: '10m',
      },
    );

    await this.usersService.updateOne({
      where: {
        id: user.id,
      },
      data: {
        reset_token,
      },
    });

    const reset_link = `${this.configService.get(
      'FRONTEND_URL',
    )}/reset-password?token=${reset_token}`;

    // send the reset link

    await this.queueService.addJob<SendEmailJobDto>({
      task: 'sendEmail',
      data: {
        to: user.email,
        subject: 'Reset Password',
        template: 'reset-password',
        context: {
          link: reset_link,
          contact_email: 'contact@developerzilla.com',
        },
      },
    });

    return {
      message: 'reset link will be sent shortly',
    };
  }

  async resetPassword(data: ResetPasswordDto) {
    const valid_token = await this.jwt.verifyAsync(data.token, {
      secret: this.configService.get('JWT_RESET_TOKEN_SECRET'),
    });

    if (!valid_token)
      return {
        message: 'invalid reset token',
      };

    const user = await this.usersService.findOneOrFail({
      where: {
        reset_token: data.token,
      },
    });

    const hased_password = await bcrypt.hash(data.password, 13);

    await this.usersService.updateOne({
      where: {
        email: user.email,
      },
      data: {
        reset_token: null,
        password: hased_password,
      },
    });

    // logout the user after password reset
    this.redis.del(`refresh:${user.id}`);
    this.redis.del(`access:${user.id}`);

    return {
      message: 'password reset successful',
    };
  }

  async updateProfile(
    data: UpdateProfileDto,
    user: JwtPayload,
    file: Express.Multer.File,
  ) {
    let verification_token = null;
    if (data.email && data.email != user.email) {
      verification_token = this.jwt.sign(
        {
          email: data.email,
        },
        {
          secret: this.configService.get('JWT_VERIFY_EMAIL_SECRET'),
          expiresIn: '10m',
        },
      );

      await this.queueService.addJob<SendEmailJobDto>({
        task: 'sendEmail',
        data: {
          to: data.email,
          template: 'verify-email',
          subject: 'Verify Email Address',
          context: {
            link: `${this.configService.get(
              'FRONTEND_URL',
            )}/verify-email?token=${verification_token}`,
            contact_email: 'contact@developerzilla.com',
          },
        },
      });
    }

    let updateData: Partial<User> = {
      ...(data.email && { new_email: data.email }),
      ...(data.first_name && { first_name: data.first_name }),
      ...(data.last_name && { last_name: data.last_name }),
      ...(data.bio && { bio: data.bio }),
      ...(verification_token && { verification_token }),
    };

    if (file) {
      this.queueService.addJob<UploadProfilePictureJobDto>({
        task: 'uploadProfilePicture',
        data: {
          file,
          folder: 'profile-pictures',
          user_id: user.sub,
        },
      });
    }

    await this.usersService.updateOne({
      where: {
        email: user.email,
      },
      data: updateData,
    });
    if (verification_token) {
      return {
        message: 'profile updated, verification link sent to new email address',
      };
    }
    return {
      message: 'profile updated',
    };
  }

  // Admin only functionalities
  async addNewUser(
    data: AddNewUserDto,
    avatar: Express.Multer.File,
  ): Promise<ServiceResponseType<User>> {
    let user = await this.usersService.findOne({
      where: {
        email: data.email,
      },
    });

    if (user) throw new BadRequestException('user already exists');

    user = await this.usersService.create({
      data: {
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: await bcrypt.hash(data.password, 13),
        bio: data.bio,
        avatar: `https://avatars.dicebear.com/api/bottts/${data.first_name[0].toLowerCase()}${data.last_name[0].toLowerCase()}.svg`,
        role: data.role,
        verified: data.verified,
        status: data.status
      },
    });

    if (avatar) {
      this.queueService.addJob<UploadProfilePictureJobDto>({
        task: 'uploadProfilePicture',
        data: {
          file: avatar,
          folder: 'profile-pictures',
          user_id: user.id,
        },
      });
    }

    return {
      data: user,
      message: 'user added successfully',
    };
  }

  async getAllUsers(query: GetUsersQueryDto): Promise<ServiceResponseType<User>> {
    let pagination = getPagination(query);

    const mode = "insensitive";   

    const filter: Prisma.UserWhereInput = {
      ...(query.role && { role: query.role }),
      ...(query.status && { status: query.status }),
      ...(query.verified && { verified: query.verified == 'true' }),
      ...(query.search && {
        OR:[
          { first_name: { contains: query.search, mode } },
          { last_name: { contains: query.search, mode } },
          { email: { contains: query.search, mode } },
        ]
      })
    }

    let users = await this.usersService.findAll({
      where: filter,
      take: pagination.take,
      skip: pagination.skip,
      orderBy:{
        created_at: query.sort
      }
    });
    
    const count = await this.usersService.getCount({ where: filter });

    return {
      data: users,
      meta: {
        count,
        limit: pagination.take,
        page: pagination.page,
        skip: pagination.skip,
      },
      message: 'users fetched successfully',
    };
  }

  async getOneUserById(id: string): Promise<ServiceResponseType<User>> {
    const user = await this.usersService.findOneOrFail({
      where: { id },
    });

    return {
      data: user,
    };
  }

  async updateOneUserById(
    id: string,
    data: UpdateUserDto,
    admin_user: JwtPayload,
    avatar?: Express.Multer.File,
  ): Promise<ServiceResponseType<User>> {

    data = instanceToPlain(data)

    let user = await this.usersService.findOneOrFail({
      where: { id },
    });  

    if(user.id == admin_user.sub && (data.role != user.role || data.status != user.status || data.verified != user.verified)){
      throw new ForbiddenException("you can't downgrade your own account");
    }
    
    if(data.email && user.email != data.email){
      let existing = await this.usersService.findOne({
        where: {
          email: data.email
        }
      });
  
      if(existing) throw new BadRequestException('email address already exists');
    }

    user = await this.usersService.updateOne({
      where: { id },
      data: {
        ...data,
        ...(data.password && { password: await bcrypt.hash(data.password, 13) }),
      },
    });

    if (avatar) {
      this.queueService.addJob<UploadProfilePictureJobDto>({
        task: 'uploadProfilePicture',
        data: {
          file: avatar,
          folder: 'profile-pictures',
          user_id: user.id,
        },
      });
    }

    if(data.verified != user.verified){
      await this.redis.get(`refresh:${user.id}`);
      await this.redis.get(`access:${user.id}`);
    }

    return {
      data: user,
      message: 'user updated successfully',
    };
  }

  async deleteOneUserById(id: string, admin_user: JwtPayload): Promise<ServiceResponseType<User>> {
    const user = await this.usersService.findOneOrFail({
      where: { id },
    });

    if(user.id == admin_user.sub){
      throw new ForbiddenException("you can't delete your own account");
    }

    await this.usersService.deleteOne({
      where: { id },
    });

    if(user.avatar_id){
      this.queueService.addJob<DeleteProfilePictureJobDto>({
        task: 'deleteProfilePicture',
        data: {
          file_id: user.avatar_id
        },
      });
    }
    
    return {
      data: user,
      message: 'user deleted successfully',
    };
  }

  // utilities
  generateVerificationLink(verification_token: string) {
    return `${this.configService.get(
      'FRONTEND_URL',
    )}/verify-email?token=${verification_token}`;
  }

  generateRefreshToken(
    data: { sub: string; email: string },
    options?: { expiresIn: string | number },
  ): string {
    let refresh_token = this.jwt.sign(data, {
      secret: this.configService.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn:
        options.expiresIn && typeof options.expiresIn == 'number'
          ? options.expiresIn / 1000
          : '7d',
    });
    return refresh_token;
  }

  generateAccessToken(
    data: { sub: string; email: string },
    options?: { expiresIn: number | string },
  ): string {
    let access_token = this.jwt.sign(data, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn:
        options.expiresIn && typeof options.expiresIn == 'number'
          ? options.expiresIn / 1000
          : '10m',
    });
    return access_token;
  }
}
