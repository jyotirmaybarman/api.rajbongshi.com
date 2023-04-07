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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateBlogDto } from '../dtos/create-blog.dto';
import { BlogsV1Service } from '../services/blogs.v1.service';
import { AccessTokenGuard } from '../../../common/guards/access-token.guard';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtPayload } from 'src/common/types/jwt-payload.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { blogsSerializer } from '../blogs.serializer';
import { BlogsQueryDto } from '../dtos/blogs-query.dto';
import { UpdateBlogDto } from '../dtos/update-blog.dto';
import { UpdateBlogStatusDto } from '../dtos/update-blog-status.dto';

@Controller('api/v1/blogs')
export class BlogsV1Controller {
  constructor(private readonly blogsService: BlogsV1Service) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('image', { storage: diskStorage({}) }))
  async createBlogpost(
    @Body() data: CreateBlogDto,
    @CurrentUser() user: JwtPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png)$/ }),
        ],
        fileIsRequired: true,
      }),
    )
    image: Express.Multer.File,
  ) {
    return this.blogsService.createBlogpost(data, user, image);
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  @Serialize(null, blogsSerializer)
  async getAllBlogs(
    @Query() query: BlogsQueryDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.blogsService.getAllBlogs(query, user);
  }

  @Get('/slug/:slug')
  @UseGuards(AccessTokenGuard)
  @Serialize(null, blogsSerializer)
  async getOneBlogBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.blogsService.getOneBlogBySlug(slug, user);
  }

  @Get('/id/:id')
  @UseGuards(AccessTokenGuard)
  @Serialize(null, blogsSerializer)
  async getOneBlogById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.blogsService.getOneBlogById(id, user);
  }

  @Patch('/slug/:slug')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('image', { storage: diskStorage({}) }))
  async updateOneBlogBySlug(
    @Param('slug') slug: string,
    @Body() body: UpdateBlogDto,
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
    image?: Express.Multer.File,
  ) {
    return await this.blogsService.updateOneBlogBySlug(slug, body, user, image);
  }


  @Patch('/id/:id')
  @UseGuards(AccessTokenGuard)
  @UseInterceptors(FileInterceptor('image', { storage: diskStorage({}) }))
  async updateOneBlogById(
    @Param('id') id: string,
    @Body() body: UpdateBlogDto,
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
    image?: Express.Multer.File,
  ) {
    return await this.blogsService.updateOneBlogById(id, body, user, image);
  }

  @Patch('/update-status/slug/:slug')
  @UseGuards(AccessTokenGuard)
  async updateOneBlogStatusBySlug(
    @Param('slug') slug: string,
    @Body() body: UpdateBlogStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.blogsService.updateOneBlogStatusBySlug(slug, body, user);
  }


  @Patch('/update-status/id/:id')
  @UseGuards(AccessTokenGuard)
  async updateOneBlogStatusById(
    @Param('id') id: string,
    @Body() body: UpdateBlogStatusDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.blogsService.updateOneBlogStatusById(id, body, user);
  }


  @Delete('/slug/:slug')
  @UseGuards(AccessTokenGuard)
  async deleteOneBlogBySlug(
    @Param('slug') slug: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.blogsService.deleteOneBlogBySlug(slug, user);
  }


  @Delete('/id/:id')
  @UseGuards(AccessTokenGuard)
  async deleteOneBlogById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.blogsService.deleteOneBlogById(id, user);
  }
}
