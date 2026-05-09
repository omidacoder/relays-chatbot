/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
 import { ServeStaticModule } from '@nestjs/serve-static';
 import { join } from 'path';
import { ChatController } from './chat/chat.controller';
import { ChatService } from './chat/chat.service';
import { UserService } from './user/user.service';
import { FeedbackService } from './feedback/feedback.service';
import { FeedbackController } from './feedback/feedback.controller';
import { UserController } from './user/user.controller';
import { MetadataService } from './metadata/metadata.service';
import { MetadataController } from './metadata/metadata.controller';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
  ],
  controllers: [AppController, AuthController, ChatController, FeedbackController, UserController, MetadataController],
  providers: [
    AppService,
    PrismaService,
    JwtService,
    AuthService,
    ChatService,
    UserService,
    FeedbackService,
    MetadataService
  ],
})
export class AppModule {}
