/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto, MessageDto, MessageUpdateDto} from './chat.dto';
import { Response, Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller()
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @UseGuards(AuthGuard)
  @Get('chat')
  async get(@Res() res: Response, @Req() req: Request) {
    const chats = await this.chatService.findAll(req['user'].id);
    return res.json({
      status: 'success',
      chats: chats,
    });
  }

  @UseGuards(AuthGuard)
  @Post('chat')
  @HttpCode(201)
  async create(
    @Body() body: ChatDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const chat: ChatDto = await this.chatService.createChat(
      body,
      req['user'].id,
    );
    return res.json({ status: 'success', chat: chat });
  }

  @UseGuards(AuthGuard)
  @Delete('chat')
  @HttpCode(204)
  async delete(@Query() query) {
    const id = Number(query.id);
    await this.chatService.deleteChat(id);
  }
  @UseGuards(AuthGuard)
  @Get('messages')
  async getMessagesPaginated(
    @Query() query,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const chatId = Number(query.chat_id);
    // const page = Number(query.page);
    // check if chat belongs to user
    const result = await this.chatService.checkChatAuthorization(
      chatId,
      req['user'].id,
    );
    if (!result) {
      return res.status(401).json({ message: 'Access Denied' });
    }
    // const totalSize = await this.chatService.countMessage(chatId);
    // const currentPage = page ? page : 1;
    const messages = await this.chatService.getMessages(
      // currentPage,
      chatId,
      req['user'].id,
    );
    return res.json({
      status: 'success',
      messages: messages,
      // paginationInfo: {
      //   currentPage,
      //   totalPages:
      //     totalSize % 10 == 0
      //       ? Math.floor(totalSize / 10)
      //       : Math.floor(totalSize / 10) + 1,
      //   totalItems: totalSize,
      //   showingFrom: totalSize == 0 ? 0 : (currentPage - 1) * 10,
      //   showingTo: totalSize < currentPage * 10 ? totalSize : currentPage * 10,
      // },
    });
  }

  // For messages
  @UseGuards(AuthGuard)
  @Post('message')
  @HttpCode(201)
  async createMessage(@Body() body: MessageDto, @Res() res: Response) {
    const message: MessageDto = await this.chatService.createMessage(body);
    return res.json({ status: 'success', message: message });
  }

  @UseGuards(AuthGuard)
  @Post('message/update')
  @HttpCode(200)
  async updateMessage(
    @Body() body: MessageUpdateDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const messageId = body.id;
    const result = await this.chatService.checkMessageAuthorization(
      messageId,
      req['user'].id,
    );
    if (!result) {
      return res.status(401).json({ message: 'Access Denied' });
    }
    const message: MessageDto = await this.chatService.updateMessage(
      body,
      messageId,
    );
    return res.json({ status: 'success', message});
  }
}

  
