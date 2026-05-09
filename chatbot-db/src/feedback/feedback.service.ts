/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { FeedbackDto } from './feedback.dto';
import { PrismaService } from '../prisma.service';
import { Prisma } from '@prisma/client';
import { ChatService } from 'src/chat/chat.service';

@Injectable()
export class FeedbackService {
  constructor(
    private prisma: PrismaService,
    private chatService: ChatService,
  ) {}

  async findAllPaginated(page: number) {
    const pageSize = 10;
    const feedbacks = await this.prisma.feedback.findMany({
      orderBy: { id: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return feedbacks;
  }

  async findAll() {
    const feedbacks = await this.prisma.feedback.findMany({
      orderBy: { id: 'desc' },
    });
    return feedbacks;
  }
  async createFeedback(
    body: FeedbackDto,
    userId: number,
  ): Promise<FeedbackDto> {
    //check if the message belongs to user
    const result = await this.chatService.checkMessageAuthorization(
      body.messageId,
      userId,
    );
    if (!result) {
      throw new Error('Unauthorized');
    }
    const data: Prisma.FeedbackCreateInput = {
      query: body.query,
      response: body.response,
      isGood: body.isGood,
      correctResponse: body.correctResponse,
      message: { connect: { id: body.messageId } },
      user: { connect: { id: userId } },
    };
    const updateData: Prisma.FeedbackUpdateInput = {
      query: body.query,
      response: body.response,
      isGood: body.isGood,
      correctResponse: body.correctResponse,
      user: { connect: { id: userId } },
    };
    const feedback = await this.prisma.feedback.upsert({ where: {messageId: body.messageId}, create: data, update: updateData });
    return feedback;
  }
  async deleteFeedback(id: number) {
    await this.prisma.feedback.delete({
      where: { id },
    });
  }
  async count(userId: number) {
    return await this.prisma.feedback.count({
      where: {
        userId,
      },
    });
  }
}
