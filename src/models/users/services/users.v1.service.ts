import { Injectable, NotFoundException } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { PrismaService } from '../../../providers/database/prisma/prisma.service';


@Injectable()
export class UsersV1Service {
    constructor(private readonly prisma: PrismaService){}

    // Create
    async create(data: Prisma.UserCreateArgs): Promise<User>{
        const user = await this.prisma.user.create(data)
        return user;
    }

    // Read
    async findAll(filter: Prisma.UserFindManyArgs = {}): Promise<User[]> {
        const users = await this.prisma.user.findMany(filter);
        return users;
    }

    async findOne(filter: Prisma.UserFindFirstArgs){
        const user = await this.prisma.user.findFirst(filter);
        return user;
    }

    async findOneOrFail(filter: Prisma.UserFindFirstArgs){
        const user = await this.findOne(filter);
        if(!user) throw new NotFoundException();
        return user;
    }

    async getCount(filter: Prisma.Subset<Prisma.UserCountArgs, Prisma.UserCountArgs>){
        return await this.prisma.user.count(filter);
    }

    // Update
    async updateOne(updateArgs: Prisma.UserUpdateArgs){
        const user = await this.prisma.user.update(updateArgs);
        return user;
    }

    async updateMany(updateArgs: Prisma.UserUpdateArgs){
        const users = await this.prisma.user.update(updateArgs);
        return users;
    }

    // Delete
    async deleteOne(filter: Prisma.UserDeleteArgs){
        const user = await this.prisma.user.delete(filter);
        return user;
    }

    async deleteMany(filter: Prisma.UserDeleteManyArgs){
        const users = await this.prisma.user.deleteMany(filter);
        return users;
    }
}
