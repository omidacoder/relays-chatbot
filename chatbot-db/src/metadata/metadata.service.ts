/* eslint-disable prettier/prettier */
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class MetadataService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper function to parse CSV buffer into a JSON array
   */
  private async parseCsvBuffer(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from(buffer);

      stream
        .pipe(
          csv({
            // Cleans up BOM characters (like \uFEFF) from the first column header
            mapHeaders: ({ header }) => header.trim().replace(/^\uFEFF/, ''),
          }),
        )
        .on('data', (data) => results.push(data))
        .on('error', (error) => reject(error))
        .on('end', () => resolve(results));
    });
  }

  async importRelaysData(file: Express.Multer.File) {
    try {
      const records = await this.parseCsvBuffer(file.buffer);

      const mappedData = records.map((row) => ({
        fileName: row['file_metadata_file_name'] || '',
        documentType: row['file_metadata_document_type'] || null,
        language: row['file_metadata_language'] || null,
        projectSubstationName:
          row['file_metadata_project_substation_name'] || null,
        digitalQuality:
          row['file_metadata_quality_status_digital_quality'] || null,
        operationalStatus:
          row['file_metadata_quality_status_operational_status'] || null,
        documentVersion:
          row['file_metadata_quality_status_document_version'] || null,
        publicationYear:
          row['file_metadata_quality_status_publication_year'] || null,
        manufacturer: row['hardware_info_manufacturer'] || null,
        relayModel: row['hardware_info_relay_model'] || null,
        firmwareVersion: row['hardware_info_firmware_version'] || null,
        communicationProtocols:
          row['hardware_info_communication_protocols'] || null,
        ioInputCount: row['hardware_info_io_count_input_count'] || null,
        ioOutputCount: row['hardware_info_io_count_output_count'] || null,
        assetType: row['asset_info_asset_type'] || null,
        assetSubtype: row['asset_info_asset_subtype'] || null,
        voltageKv: row['asset_info_voltage_kv'] || null,
        voltageClass: row['asset_info_voltage_class'] || null,
        primaryProtectionFunction:
          row['protection_info_primary_protection_function'] || null,
        allIdentifiedFunctions:
          row['protection_info_all_identified_functions'] || null,
        ansiCodes: row['protection_info_ansi_codes'] || null,
        redundancyRole: row['protection_info_redundancy_role'] || null,
        isMultiFunctional: row['protection_info_is_multi_functional'] || null,
        technicalSummary: row['technical_summary'] || null,
        extraDescriptions: row['extra_descriptions'] || null,
      }));

      // Bulk insert into the DB
      const result = await this.prisma.relayDocument.createMany({
        data: mappedData,
        skipDuplicates: true,
      });

      return {
        message: 'Relay data imported successfully',
        count: result.count,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to import relay data: ${error.message}`,
      );
    }
  }

  async importOthersData(file: Express.Multer.File) {
    try {
      const records = await this.parseCsvBuffer(file.buffer);

      const mappedData = records.map((row) => ({
        fileName: row['file_metadata_file_name'] || '',
        language: row['file_metadata_language'] || null,
        summary: row['summary'] || null,
      }));

      // Bulk insert into the DB
      const result = await this.prisma.otherDocument.createMany({
        data: mappedData,
        skipDuplicates: true,
      });

      return {
        message: 'Other documents imported successfully',
        count: result.count,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to import others data: ${error.message}`,
      );
    }
  }
}
