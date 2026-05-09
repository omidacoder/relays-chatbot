/* eslint-disable prettier/prettier */
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Validate } from 'class-validator';
import { IranianPhone } from 'src/helpers';

export class SignInDto {
  @ApiProperty({
    description: 'The phone number starting with "09"',
    example: '09391789010',
  })
  @IsNotEmpty()
  @Validate(IranianPhone)
  phone: string;

  @ApiProperty({
    description: 'The password',
    example: 'test',
  })
  @IsNotEmpty()
  password: string;
}


