/* eslint-disable prettier/prettier */
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class FeedbackDto {
  @IsNotEmpty()
  @IsString()
  query: string;
  @IsNotEmpty()
  @IsString()
  response: string;
  @IsNotEmpty()
  @IsBoolean()
  isGood: boolean;
  @IsOptional()
  @IsString()
  correctResponse?: string;
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  messageId: number;
}
