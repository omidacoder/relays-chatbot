/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { MetadataController } from './metadata.controller';
import { MetadataService } from './metadata.service';
import { PrismaService } from '../prisma.service'; // Adjust path as needed

@Module({
  controllers: [MetadataController],
  providers: [MetadataService, PrismaService],
})
export class MetadataModule {}
