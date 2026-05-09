/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { ChatDto, MessageDto, MessageUpdateDto } from './chat.dto';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async findAllPaginated(page: number, userId: number) {
    const pageSize = 10;
    const chats = await this.prisma.chat.findMany({
      where: {
        userId,
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return chats;
  }

  async findAll(userId: number) {
    const chats = await this.prisma.chat.findMany({
      where: {
        userId,
      },
      orderBy: { updatedAt: 'desc' },
    });
    return chats;
  }
  async createChat(body: ChatDto, userId: number): Promise<ChatDto> {
    const data: Prisma.ChatCreateInput = {
      botName: body.botName,
      title: body.title,
      user: { connect: { id: userId } },
    };
    const chat = await this.prisma.chat.create({ data });
    return chat;
  }
  async deleteChat(id: number) {
    await this.prisma.chat.delete({
      where: { id },
    });
  }
  async count(userId: number) {
    return await this.prisma.chat.count({
      where: {
        userId,
      },
    });
  }

  async countMessage(chatId: number) {
    return await this.prisma.message.count({
      where: {
        chatId,
      },
    });
  }

  async createMessage(body: MessageDto) {
    const message = await this.prisma.message.create({
      data: {
        content: body.content,
        chat: { connect: { id: body.chatId } },
        fromChatbot: body.fromChatbot,
        query: body.query ?? undefined
      },
    });
    return message;
  }

  async updateMessage(body: MessageUpdateDto, messageId: number){
    const sources = body.sources;
    const message = await this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        content: body.content ? body.content : undefined,
      },
      include:{sources:true}
    });
    // saving sources
    const dbSources = [];
    if(sources){
      for (const s of sources) {
        dbSources.push({
          messageId: message.id,
          content: s.content,
          refference: s.refference,
        });
      }
      await this.prisma.source.createMany({
        data: dbSources,
      });
    }
    return message
  }

  async checkChatAuthorization(chatId: number, userId: number) {
    try {
      // console.log(chatId)
      // console.log(userId)
      await this.prisma.chat.findUniqueOrThrow({
        where: {
          id: chatId,
          userId,
        },
      });
      return true;
    } catch (err) {
      return null;
    }
  }
  async checkMessageAuthorization(messageId: number, userId: number) {
    const message = await this.getMessage(messageId);
    return this.checkChatAuthorization(message.chatId, userId);
  }
  async getMessage(messageId: number) {
    return await this.prisma.message.findUnique({
      where:{
        id: messageId
      }
    })
  }
  async getMessagesPaginated(page, chatId, userId) {
    const pageSize = 10;
    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        chat: {
          userId,
        },
      },
      include:{
        sources: true
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
    });
    return messages;
  }

  async getMessages(chatId, userId) {
    const messages = await this.prisma.message.findMany({
      where: {
        chatId,
        chat: {
          userId,
        },
      },
      include: {
        sources: true
      },
      orderBy: { updatedAt: 'asc' },
    });
    return messages;
  }
}
