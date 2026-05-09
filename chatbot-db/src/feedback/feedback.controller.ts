/* eslint-disable prettier/prettier */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { FeedbackService } from './feedback.service';
import { FeedbackDto } from './feedback.dto';
import { Response, Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller()
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}
  @UseGuards(AuthGuard)
  @Get('feedback')
  async get(@Res() res: Response) {
    const feedbacks = await this.feedbackService.findAll();
    return res.json({
      status: 'success',
      feedbacks: feedbacks,
    });
  }

  @UseGuards(AuthGuard)
  @Post('feedback')
  @HttpCode(201)
  async create(
    @Body() body: FeedbackDto,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      const feedback: FeedbackDto =
        await this.feedbackService.createFeedback(body, req['user'].id);
      return res.json({ status: 'success', feedback: feedback });
    } catch (err) {
        if(err.message == "Unauthorized"){
            return res.status(401).json({ message: 'Access Denied' });
        }
        else {
            return res.status(400).json({ message: 'Bad Request' });
        }
    }
  }
}
