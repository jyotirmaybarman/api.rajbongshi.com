import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../providers/database/prisma/prisma.service';
import { CreateBlogDto } from '../dtos/create-blog.dto';
import { JwtPayload } from '../../../common/types/jwt-payload.type';
import { nanoid } from 'nanoid';
import slugify from 'slugify';
import { QueueService } from '../../../providers/queue/queue.service';
import { UploadBlogImageJobDto } from '../../../providers/queue/dtos/upload-blog-image-job.dto';
import { Blog, Prisma, Role } from '@prisma/client';
import { getPagination } from 'src/common/dtos/pagination.dto';
import { BlogsQueryDto } from '../dtos/blogs-query.dto';
import { UpdateBlogDto } from '../dtos/update-blog.dto';
import { instanceToPlain } from 'class-transformer';
import { BlogsAuthorizer } from '../blogs.authorizer';
import { UpdateBlogStatusDto } from '../dtos/update-blog-status.dto';

@Injectable()
export class BlogsV1Service {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly blogsAuthorizer: BlogsAuthorizer,
  ) {}

  async createBlogpost(
    data: CreateBlogDto,
    user: JwtPayload,
    image: Express.Multer.File,
  ): Promise<ServiceResponseType<Blog>> {
    this.blogsAuthorizer.authorize(user, 'create');

    const slug = slugify(`${data.title} ${nanoid(8)}`, {
      lower: true,
    });

    const blog = await this.prisma.blog.create({
      data: {
        ...data,
        author: {
          connect: {
            id: user.sub,
          },
        },
        slug,
      },
      include:{
        author:{
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
            bio: true,
            role: true
          }
        }
      }
    });

    await this.queueService.addJob<UploadBlogImageJobDto>({
      task: 'uploadBlogImage',
      data: {
        blog_id: blog.id,
        file: image,
        folder: 'blogs',
      },
    });

    return {
      message: 'blog created successfully',
      data: blog
    };
  }

  async getAllBlogs(
    query: BlogsQueryDto,
    user: JwtPayload,
  ): Promise<ServiceResponseType<Blog>> {
    this.blogsAuthorizer.authorize(user, 'readAll');

    const pagination = getPagination(query);

    // ADMIN/EDITOR - all blogs of everyone
    // USER - only blogs of user
    const filter = this.generateFilterData(query, user);

    const blogs = await this.prisma.blog.findMany({
      where: {
        ...filter,
      },
      include:{
        author: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
            bio: true,
            role: true
          }
        },
        
      },
      skip: pagination.skip,
      take: pagination.take,
    });
    const count = await this.prisma.blog.count({
      where: {
        ...filter,
      },
    });

    return {
      data: blogs,
      meta: {
        page: pagination.page,
        limit: pagination.take,
        skip: pagination.skip,
        count,
      },
    };
  }

  async getOneBlogBySlug(
    slug: string,
    user: JwtPayload,
  ): Promise<ServiceResponseType<Blog>> {
    const blog = await this.findOneOrFail({
      where: {
        slug,
      },
      include: {
        author:{
          select:{
            id: true,
            first_name: true,
            last_name: true,
            avatar: true,
            bio: true,
            role: true
          }
        }
      }
    });

    this.blogsAuthorizer.authorize(user, 'read', blog);

    return {
      data: blog,
    };
  }

  async getOneBlogById(
    id: string,
    user: JwtPayload,
  ): Promise<ServiceResponseType<Blog>> {
    const blog = await this.findOneOrFail({
      where: {
        id,
      },
    });

    this.blogsAuthorizer.authorize(user, 'read', blog);

    return {
      data: blog,
    };
  }

  async updateOneBlogBySlug(
    slug: string,
    body: UpdateBlogDto,
    user: JwtPayload,
    image: Express.Multer.File,
  ): Promise<ServiceResponseType<Blog>> {
    let blog = await this.findOneOrFail({
      select: {
        slug: true,
        title: true,
        user_id: true,
        id: true,
      },
      where: {
        slug,
      },
    });

    this.blogsAuthorizer.authorize(user, 'update', blog);

    const data = instanceToPlain(body);

    blog = await this.updateOneBlog({
      where: {
        slug,
      },
      data: {
        ...data,
        ...(body.update_slug && {
          slug: slugify(`${body.title} ${nanoid(8)}`, {
            lower: true,
          }),
        }),
      },
    });

    if (image) {
      await this.queueService.addJob<UploadBlogImageJobDto>({
        task: 'uploadBlogImage',
        data: {
          blog_id: blog.id,
          file: image,
          folder: 'blogs',
        },
      });
    }

    return {
      data: blog,
      message: 'blogpost updated',
    };
  }

  async updateOneBlogById(
    id: string,
    body: UpdateBlogDto,
    user: JwtPayload,
    image: Express.Multer.File,
  ): Promise<ServiceResponseType<Blog>> {
    let blog = await this.findOneOrFail({
      select: {
        slug: true,
        title: true,
        user_id: true,
        id: true,
      },
      where: {
        id,
      },
    });

    this.blogsAuthorizer.authorize(user, 'update', blog);

    const data = instanceToPlain(body);

    blog = await this.updateOneBlog({
      where: {
        id,
      },
      data: {
        ...data,
        ...(body.update_slug && {
          slug: slugify(`${body.title} ${nanoid(8)}`, {
            lower: true,
          }),
        }),
      },
    });

    if (image) {
      await this.queueService.addJob<UploadBlogImageJobDto>({
        task: 'uploadBlogImage',
        data: {
          blog_id: blog.id,
          file: image,
          folder: 'blogs',
        },
      });
    }

    return {
      data: blog,
      message: 'blogpost updated',
    };
  }

  async updateOneBlogStatusBySlug(slug:string, data: UpdateBlogStatusDto, user: JwtPayload): Promise<ServiceResponseType<Blog>> {
    let blog = await this.findOneOrFail({
      where: {
        slug,
      },
    });

    this.blogsAuthorizer.authorize(user, 'updateStatus', blog, {
      status: data.status
    });

    blog = await this.updateOneBlog({
      where: {
        slug
      },
      data:{
        status: data.status
      }
    });

    return {
      data: blog,
      message: `blogpost ${data.status}`,
    }
  }

  async updateOneBlogStatusById(id:string, data: UpdateBlogStatusDto, user: JwtPayload): Promise<ServiceResponseType<Blog>> {
    let blog = await this.findOneOrFail({
      where: {
        id,
      },
    });

    this.blogsAuthorizer.authorize(user, 'updateStatus', blog, { status: data.status });

    blog = await this.updateOneBlog({
      where: {
        id
      },
      data:{
        status: data.status
      }
    });

    return {
      data: blog,
      message: `blogpost ${data.status}`,
    }
  }

  async deleteOneBlogBySlug(
    slug: string,
    user: JwtPayload,
  ): Promise<ServiceResponseType<Blog>> {
    let blog = await this.findOneOrFail({
      where: {
        slug,
      },
    });

    this.blogsAuthorizer.authorize(user, 'destroy', blog);

    blog = await this.prisma.blog.delete({
      where: {
        slug,
      },
    });

    return {
      data: blog,
      message: 'blogpost deleted',
    };
  }

  async deleteOneBlogById(
    id: string,
    user: JwtPayload,
  ): Promise<ServiceResponseType<Blog>> {
    let blog = await this.findOneOrFail({
      where: {
        id,
      },
    });

    this.blogsAuthorizer.authorize(user, 'destroy', blog);

    blog = await this.prisma.blog.delete({
      where: {
        id,
      },
    });

    return {
      data: blog,
      message: 'blogpost deleted',
    };
  }

  // Helper methods, not for controllers
  async updateOneBlog(data: Prisma.BlogUpdateArgs) {
    return await this.prisma.blog.update(data);
  }

  async findOneOrFail(filter: Prisma.BlogFindFirstArgs) {
    const blog = await this.prisma.blog.findFirst(filter);
    if (!blog) throw new NotFoundException('blog not found');
    return blog;
  }

  generateFilterData(query: BlogsQueryDto, user: JwtPayload) {
    let filter = {};
    if (user.role == Role.admin || user.role == Role.editor) {
      filter = {
        ...(query.author && {
          author: {
            id: query.author,
          },
        }),
        ...(query.id && {
          id: query.id,
        }),
        ...(query.slug && {
          slug: query.slug,
        }),
        ...(query.status && {
          status: query.status,
        }),
      };
    } else {
      filter = {
        ...(query.status && {
          status: query.status,
        }),
        author: {
          id: user.sub,
        },
      };
    }

    return filter;
  }
}
