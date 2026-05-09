import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { UserService } from 'src/user/user.service';
import { SignInDto } from './signin.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
  ) {}

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('user/login')
  signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto.phone, signInDto.password);
  }

  @Get('user/profile')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('access-token')
  getProfile(@Request() req) {
    return req.user;
  }
  //comment function below on production
  // @Post('createsuperuser')
  // async createSuperUser(@Body() data: UserDto) {
  //   await this.userService.createUser(data);
  // }
}
