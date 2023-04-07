import { Module, Global } from '@nestjs/common';
import { BlogsAuthorizer } from '../models/blogs/blogs.authorizer';

@Global()
@Module({
    providers: [BlogsAuthorizer],
    exports: [BlogsAuthorizer]
})
export class AuthorizerModule {}
