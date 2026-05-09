/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import {  IsNotEmpty, IsNumber, IsNumberString, MinLength, Validate } from 'class-validator';
import { IranianPhone } from 'src/helpers';

export class UserDto {
  @ApiProperty({
    description: 'The name and family of user',
    example: 'امید',
  })
  @IsNotEmpty()
  name: string;
  @IsNotEmpty()
  @IsNumberString()
  @Validate(IranianPhone)
  phone: string;
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class UserDeleteDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
