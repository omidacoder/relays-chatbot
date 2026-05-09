/* eslint-disable prettier/prettier */
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString} from 'class-validator';

export class ChatDto {
  id?: number;
  @IsNotEmpty()
  @IsString()
  botName: string;
  @IsOptional()
  @IsString()
  title?: string;
}

export class MessageDto {
  id?: number;
  @IsNotEmpty()
  @IsString()
  content: string;
  @IsNotEmpty()
  @IsNumber()
  @IsInt()
  chatId: number;
  @IsNotEmpty()
  @IsBoolean()
  fromChatbot: boolean;
  @IsOptional()
  @IsString()
  query?: string;
}

export class MessageUpdateDto {
  id?: number;
  @IsOptional()
  @IsString()
  content?: string;
  sources?: SourceDto[]
}

export class SourceDto {
  @IsNotEmpty()
  @IsString()
  content: string;
  @IsNotEmpty()
  @IsString()
  refference: string;
}

