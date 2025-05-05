import {
  Controller,
  Logger,
} from '@nestjs/common';
import {
  MessagePattern,
  Payload,
  Ctx,
  RmqContext,
  RpcException,
} from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CsvData } from '../csv/entities/csv-data.entity';
import { RabbitMQService } from './rabbitmq.service';
import { CsvService } from '../csv/csv.service';
import { firstValueFrom } from 'rxjs';

@Controller()
export class RabbitMQConsumer {
  private readonly logger = new Logger(RabbitMQConsumer.name);

  constructor(
    @InjectRepository(CsvData)
    private readonly csvDataRepository: Repository<CsvData>,
    private readonly rabbitMQService: RabbitMQService,
    private readonly csvService: CsvService,
  ) { }

  // process csv file and store it in DB
  @MessagePattern('csv.upload')
  async handleCsvFile(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      this.logger.log('Received csv.file event');

      if (!data.content || !data.userId) {
        throw new RpcException({
          message: 'Invalid message format. Expected content and userId',
          code: 'INVALID_FORMAT'
        });
      }

      const buffer = Buffer.from(data.content, 'base64');

      this.logger.log(`Processing CSV buffer of size: ${buffer.length}`);
      await this.csvService.processCsvContent(buffer, data.userId);

      return { status: 'success', message: 'CSV file processed successfully' };
    } catch (error) {
      this.logger.error(`Error in handleCsvFile: ${error.message}`);
      throw new RpcException({
        message: 'Failed to process CSV file',
        code: 'PROCESS_ERROR'
      });
    }
  }

  // Queue2: Receives CSV file, processes it, and publishes each record to queue3
  @MessagePattern('csv.process')
  async handleCsvProcess(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      this.logger.log('Received csv.process event');

      if (!data.content || !data.userId) {
        throw new RpcException({
          message: 'Invalid message format. Expected content and userId',
          code: 'INVALID_FORMAT'
        });
      }

      const buffer = Buffer.from(data.content, 'base64');
      this.logger.log(`Processing CSV buffer of size: ${buffer.length}`);

      const records = await this.csvService.parseCsvContent(buffer);
      this.logger.log(`Parsed ${records.length} records from CSV`);

      if (records.length === 0) {
        return { status: 'success', message: 'No records to process' };
      }

      // Publish each record individually to queue3
      let publishedCount = 0;
      for (const record of records) {
        const normalizedRecord = {
          code: record['Code'] || record['code'],
          id: record['Id'] || record['id'],
          name: record['Name'] || record['name'],
          value: record['Value'] || record['value'],
        };

        // Publish the individual record to queue3
        await firstValueFrom(
          this.rabbitMQService.publishToQueue3({
            record: normalizedRecord,
            userId: data.userId
          })
        );
        publishedCount++;
      }

      return {
        status: 'success',
        message: `Published ${publishedCount} records to processing queue`
      };
    } catch (error) {
      this.logger.error(`Error in handleCsvProcess: ${error.message}`);

      if (error instanceof RpcException) {
        throw error;
      }

      if (error.code === '23505') {
        throw new RpcException({
          message: 'Database duplicate key error',
          code: 'DUPLICATE_ENTRY',
        });
      }

      throw new RpcException({
        message: 'Internal error during CSV processing',
        code: 'INTERNAL_ERROR',
      });
    }
  }


  // Queue3: Receives a single record and saves it to the database using csvService.saveToDatabase
  @MessagePattern('csv.save')
  async handleCsvSave(@Payload() data: any, @Ctx() context: RmqContext) {
    try {
      this.logger.log('Received csv.save event');

      if (!data.record || !data.userId) {
        throw new RpcException({
          message: 'Invalid message format. Expected record and userId',
          code: 'INVALID_FORMAT'
        });
      }

      // Use the saveToDatabase method from csvService to save the record
      // The method expects an array of records, so we wrap the single record in an array
      await this.csvService.saveToDatabase([data.record], data.userId);

      this.logger.log(`Successfully saved record with code ${data.record.code}`);
      return { status: 'success', message: 'Record saved successfully' };
    } catch (error) {
      this.logger.error(`Error in handleCsvSave: ${error.message}`);

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        message: 'Failed to save record',
        code: 'SAVE_ERROR'
      });
    }
  }
}
