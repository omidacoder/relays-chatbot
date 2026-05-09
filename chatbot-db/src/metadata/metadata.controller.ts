/* eslint-disable prettier/prettier */
import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MetadataService } from './metadata.service';

@Controller('import')
export class MetadataController {
  constructor(private readonly metadataService: MetadataService) {}

  @Post('relays')
  @UseInterceptors(FileInterceptor('file'))
  async uploadRelaysFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    return this.metadataService.importRelaysData(file);
  }

  @Post('others')
  @UseInterceptors(FileInterceptor('file'))
  async uploadOthersFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('CSV file is required');
    }
    return this.metadataService.importOthersData(file);
  }
}
