import { FilterFunction } from 'src/common/interceptors/serialize.interceptor';
import { Blog, Role, BlogStaus } from '@prisma/client';
import { ClassTransformOptions, plainToInstance } from 'class-transformer';

export const blogsSerializer: FilterFunction = (
  dto,
  data: ServiceResponseType<Blog>,
  user,
) => {
  let options: ClassTransformOptions = {
    excludeExtraneousValues: true,
    groups: [user && user.role ? user.role : ''],
  };

  if (data.data && Array.isArray(data.data)) {
    let filtered = [];
    data.data.forEach((blog) => {
      const validData = filter(blog);
      if (validData) {
        filtered.push(validData);
      }
    });
    data.data = filtered;
  } else if (data.data && !Array.isArray(data.data)) {
    data.data = filter(data.data);
  }

  return data;

  function filter(blog: Blog): Blog {
    let filteredBlog: Partial<Blog>;
    if (
      user &&
      (user.role == Role.admin ||
        user.role == Role.editor ||
        user.sub == blog.user_id)
    ) {
      filteredBlog = blog;
    } else {
      if (blog.status != BlogStaus.published) {
        return null;
      } else {
        filteredBlog = blog;
      }
    }
    if (dto) {
      return plainToInstance(dto, filteredBlog, options) as Blog;
    }
    return filteredBlog as Blog;
  }
};
