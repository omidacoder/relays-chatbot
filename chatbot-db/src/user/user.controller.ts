/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserDeleteDto, UserDto } from './user.dto';
import { Response } from 'express';
import { AdminAuthGuard } from 'src/auth/auth.guard';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}
  @UseGuards(AdminAuthGuard)
  @Get('admin/user')
  async get(@Res() res: Response) {
    const users = await this.userService.findAll();
    return res.json({
      status: 'success',
      users: users,
    });
  }

  @UseGuards(AdminAuthGuard)
  @Post('admin/user')
  @HttpCode(201)
  async create(
    @Body() body: UserDto,
    @Res() res: Response,
  ) {
    try {
      const user: UserDto = await this.userService.createUser(
        body,
      );
      return res.json({ status: 'success', user: user });
    } catch (err) {
      if (err.message == 'Unauthorized') {
        return res.status(401).json({ message: 'Access Denied' });
      } else {
        return res.status(400).json({ message: 'Bad Request' });
      }
    }
  }
  @UseGuards(AdminAuthGuard)
  @Post('admin/user/delete')
  @HttpCode(201)
  async delete(
    @Body() body: UserDeleteDto,
    @Res() res: Response,
  ) {
    try {
      await this.userService.deleteUser(body.id);
      return res.status(204).send();
    } catch (err) {
        console.log(err)
      if (err.message == 'Unauthorized') {
        return res.status(401).json({ message: 'Access Denied' });
      } else {
        return res.status(400).json({ message: 'Bad Request' });
      }
    }
  }
}
