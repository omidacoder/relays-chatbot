/* eslint-disable prettier/prettier */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { jwtConstants, SuperAdminName, SuperAdminPassword, SuperAdminPhone } from './constants';
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async signIn(phone: string, pass: string) {
    console.log(phone);
    if(phone == SuperAdminPhone) {
      console.log(pass)
      if(pass == SuperAdminPassword){
        console.log("test")
        const payload = {
          user: {
            name: SuperAdminName,
            phone: SuperAdminPhone,
            password: SuperAdminPassword,
            id: -1,
            verified: true,
          },
          sub: -1,
        };
        return {
          access_token: await this.jwtService.signAsync(payload, jwtConstants),
          id: -1,
          name: SuperAdminName,
          phone: SuperAdminPhone,
        };
      }
      else {
        throw new UnauthorizedException();
      }
    }
    const user = await this.userService.findOne(phone);
    if (user?.password !== pass) {
      throw new UnauthorizedException();
    }
    console.log(user);
    const payload = { user: {
      name: user.name,
      phone: user.phone,
      id: user.id,
      verified: user.verified
    }, sub: user.id };
    return {
      access_token: await this.jwtService.signAsync(payload , jwtConstants),
      id : user.id,
      name: user.name,
      phone : user.phone,
    };
  }


}
