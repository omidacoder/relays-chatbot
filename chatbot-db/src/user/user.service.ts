/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import {
  UserDto,
} from './user.dto';
import { Prisma} from '@prisma/client';
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}
  async findOne(phone: string) {
    return await this.prisma.user.findFirst({
      where: {
        phone,
      },
    });
  }
  async findAll() {
    return await this.prisma.user.findMany();
  }
  async createUser(data: UserDto) {
    const processed_data: Prisma.UserCreateInput = {
      name: data.name,
      phone: data.phone,
      verified: true,
    };
    for (const [key, value] of Object.entries(data)) {
      processed_data[key] = value == '' || !value ? null : value;
    }
    return await this.prisma.user.create({
      data: processed_data,
    });
  }

  async updateUser(id: number, user: UserDto) {
    const processed_data: Prisma.UserUpdateInput = {};
    for (const [key, value] of Object.entries(user)) {
      processed_data[key] = value == '' || !value ? undefined : value;
    }
    await this.prisma.user.update({
      where: {
        id,
      },
      data: processed_data,
    });
  }
  async deleteUser(id: number) {
    await this.prisma.user.delete({
      where: { id },
    });
  }
  async count() {
    return await this.prisma.user.count();
  }
}
