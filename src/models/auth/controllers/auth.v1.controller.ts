import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { RegisterDto } from '../dtos/register.dto';
import { AuthV1Service } from '../services/auth.v1.service';
import { LoginDto } from '../dtos/login.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard';
import { JwtPayload } from '../../../common/types/jwt-payload.type';
import { RefreshTokenGuard } from '../../../common/guards/refresh-token.guard';
import { Response } from 'express';
import { JwtPayloadWithRt } from 'src/common/types/jwt-payload-with-rt.type';
import { ResendVerificationDto } from '../dtos/resend-verification.dto';
import { ValidateJwtTokenDto } from '../dtos/validate-jwt-token.dto';
import { ValidateEmailDto } from '../dtos/validate-email.dto';
import { ResetPasswordDto } from '../dtos/reset-password.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { Serialize } from '../../../common/interceptors/serialize.interceptor';
import { UserDto } from '../dtos/user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AddNewUserDto } from '../dtos/admin/add-new-user.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { UpdateUserDto } from '../dtos/admin/update-user.dto';
import { GetUsersQueryDto } from '../dtos/admin/get-users-query.dto';
import { SkipThrottle } from '@nestjs/throttler';
import { ActiveGuard } from '../../../common/guards/active.guard';

@Controller('/api/v1/auth/')
export class AuthV1Controller {
  constructor(private readonly authService: AuthV1Service) {}

  @Post('register')
  async register(@Body() data: RegisterDto) {
    return await this.authService.register(data);
  }

  @Post('verify-email')
  async verifyEmail(@Body() data: ValidateJwtTokenDto) {
    return await this.authService.verifyEmail(data.token);
  }

  @Post('resend-verification')
  async resendVerificationEmail(@Body() data: ResendVerificationDto) {
    return await this.authService.resendVerificationEmail(data);
  }

  @Post('login')
  async login(@Body() data: LoginDto, @Res() res: Response) {
    let result = await this.authService.login(data);

    const expiry = data.remember
      ? 1000 * 60 * 60 * 24 * 7 // 7 days
      : 1000 * 60 * 60 * 24; // 1 day

    return res
      .status(200)
      .cookie('token', result.refresh_token, {
        sameSite: 'strict',
        path: '/',
        expires: new Date(new Date().getTime() + expiry),
        httpOnly: true,
        secure: false,
      })
      .json({
        message: 'Logged in successfully',
        access_token: result.access_token,
      });
  }

  @Get('me')
  @SkipThrottle()
  @UseGuards(AccessTokenGuard)
  @Serialize(UserDto)
  async getLoggedInProfile(@CurrentUser() user: JwtPayload) {
    return await this.authService.getLoggedInProfile(user);
  }

  @Post('refresh')
  @SkipThrottle()
  @UseGuards(RefreshTokenGuard)
  async refreshAccessToken(@CurrentUser() user: JwtPayloadWithRt) {
    return await this.authService.refreshAccessToken(user);
  }

  @Post('logout')
  @SkipThrottle()
  @UseGuards(RefreshTokenGuard)
  async logout(@CurrentUser() user: JwtPayloadWithRt, @Res() res: Response) {
    const result = await this.authService.logout(user);
    return res
      .status(200)
      .cookie('token', null, {
        sameSite: 'strict',
        path: '/',
        expires: new Date(),
        httpOnly: true,
        secure: false,
      })
      .json({
        message: result.message,
        access_token: null,
      });
  }

  @Post('forgot-password')
  async sendPasswordResetLink(@Body() data: ValidateEmailDto) {
    return await this.authService.sendPasswordResetLink(data);
  }

  @Post('reset-password')
  async resetPassword(@Body() data: ResetPasswordDto) {
    return await this.authService.resetPassword(data);
  }

  @Patch('update-profile')
  @UseInterceptors(FileInterceptor('avatar', { storage: diskStorage({}) }))
  @UseGuards(AccessTokenGuard, ActiveGuard)
  async updateProfile(
    @Body() data: UpdateProfileDto,
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    file?: Express.Multer.File,
  ) {
    return await this.authService.updateProfile(data, user, file);
  }

  // admin-only routes

  @Post('users')
  @SkipThrottle()
  @UseGuards(AccessTokenGuard, RolesGuard, ActiveGuard)
  @Roles(Role.admin)
  @Serialize(UserDto)
  @UseInterceptors(FileInterceptor('avatar', { storage: diskStorage({}) }))
  async addNewUser(
    @Body() data: AddNewUserDto,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    avatar?: Express.Multer.File,
  ) {
    return await this.authService.addNewUser(data, avatar);
  }

  @Get('users')
  @UseGuards(AccessTokenGuard, RolesGuard, ActiveGuard)
  @Roles(Role.admin)
  @Serialize(UserDto)
  @SkipThrottle()
  async getAllUsers(@Query() query: GetUsersQueryDto) {
    return await this.authService.getAllUsers(query);
  }

  @Get('users/:id')
  @UseGuards(AccessTokenGuard, RolesGuard, ActiveGuard)
  @Roles(Role.admin)
  @Serialize(UserDto)
  @SkipThrottle()
  async getOneUserById(@Param('id') id: string) {
    return await this.authService.getOneUserById(id);
  }

  @Patch('users/:id')
  @UseGuards(AccessTokenGuard, RolesGuard, ActiveGuard)
  @Roles(Role.admin)
  @Serialize(UserDto)
  @SkipThrottle()
  @UseInterceptors(FileInterceptor('avatar', { storage: diskStorage({}) }))
  async updateOneUserById(
    @Param('id') id: string,
    @Body() body: UpdateUserDto,
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: false,
      }),
    )
    avatar?: Express.Multer.File,
  ) {
    return await this.authService.updateOneUserById(id, body, user, avatar);
  }

  @Delete('users/:id')
  @SkipThrottle()
  @UseGuards(AccessTokenGuard, RolesGuard, ActiveGuard)
  @Roles(Role.admin)
  @Serialize(UserDto)
  async deleteOneUserById(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return await this.authService.deleteOneUserById(id, user);
  }
}
