import { Injectable, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CsvData } from './entities/csv-data.entity';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

@Injectable()
export class CsvService {
  private readonly logger = new Logger(CsvService.name);

  constructor(
    @InjectRepository(CsvData)
    private csvDataRepository: Repository<CsvData>,
  ) {}

  async processCsvFile(file: Express.Multer.File, userId: string): Promise<void> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Empty file uploaded');
    }

    await this.processCsvContent(file.buffer, userId);

  }

  // This method remains functionally identical, but now uses the parseCsvContent method
  async processCsvContent(csvBuffer: Buffer, userId: string): Promise<void> {
    try {
      // Parse the CSV content to get records
      const records = await this.parseCsvContent(csvBuffer);

      this.logger.log(`Processing ${records.length} records for user ${userId}`);
      // Save the records to the database
      await this.saveToDatabase(records, userId);
    } catch (error) {
      this.logger.error(`Error processing CSV file: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to process CSV file');
    }
  }

  // New method that extracts the CSV parsing logic for reuse
  async parseCsvContent(csvBuffer: Buffer): Promise<any[]> {
    try {
      const records: any[] = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
      });

      const stream = Readable.from(csvBuffer);

      for await (const record of stream.pipe(parser)) {
        if (!record['Code'] && !record['code']) {
          throw new BadRequestException('CSV must contain a Code/code column');
        }
        records.push(record);
      }

      if (records.length === 0) {
        throw new BadRequestException('CSV file contains no valid records');
      }

      return records;
    } catch (error) {
      this.logger.error(`Error parsing CSV file: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to parse CSV file');
    }
  }

  async saveToDatabase(records: any[], userId: string): Promise<void> {
    if (!records || !Array.isArray(records)) {
      throw new BadRequestException('Invalid records format');
    }

    try {
      // deduplicate codes
      const codes = records.map((r) => r['Code'] || r['code']);
      const existingRecords = await this.csvDataRepository.find({
        where: { code: In(codes) },
      });
      console.log('Existing record: ' + JSON.stringify(existingRecords));

      const existingCodeSet = new Set(existingRecords.map((r) => r.code));
      const newRecords = records.filter((r) => {
        const recordCode = r['Code'] || r['code'];
        return !existingCodeSet.has(recordCode);
      });
      console.log('newRecords:' + JSON.stringify(newRecords))

      if (newRecords.length === 0) {
        this.logger.log('All records already exist. Nothing new to save.');
        return
      }

      for (const record of records) {
        const code = record['Code'] || record['code'];
        if (!code) {
          throw new BadRequestException('Record missing required code field');
        }

        const csvData = this.csvDataRepository.create({
          code: code,
          id: record['Id'] || record['id'],
          name: record['Name'] || record['name'],
          value: record['Value'] || record['value'],
          userId,
        });

        await this.csvDataRepository.save(csvData);
      }
      this.logger.log(`Successfully saved ${records.length} records for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error saving to database: ${error.message}`);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to save records to database');
    }
  }

  async findAllByUserId(userId: string): Promise<CsvData[]> {
    try {
      const records = await this.csvDataRepository.find({
        where: { userId },
      });
      this.logger.log(`Retrieved ${records.length} records for user ${userId}`);
      return records;
    } catch (error) {
      this.logger.error(`Error retrieving records: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve records');
    }
  }

  async findByCode(code: string, userId: string): Promise<CsvData> {
    try {
      const record = await this.csvDataRepository.findOne({
        where: { code, userId },
      });

      if (!record) {
        throw new NotFoundException(`Record with code ${code} not found`);
      }

      return record;
    } catch (error) {
      this.logger.error(`Error retrieving record by code: ${error.message}`);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve record');
    }
  }
  async deleteAllByUserId(userId: string): Promise<void> {
    try {
      const result = await this.csvDataRepository.delete({ userId });
      if (result.affected === 0) {
        this.logger.warn(`No records found to delete for user ${userId}`);
      } else {
        this.logger.log(`Deleted ${result.affected} records for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting records: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete records');
    }
  }
}
