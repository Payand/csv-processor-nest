import { Controller, Post, Get, Delete, Param, UseInterceptors, UploadedFile, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { CsvService } from './csv.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CsvDataResponseDto } from './dto/csv-response.dto';
import { ApiAuthResponses } from '../common/decorators/api-auth-responses.decorator';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';

@ApiTags('CSV Operations')
@ApiBearerAuth()
@Controller('csv')
@UseGuards(JwtAuthGuard)
export class CsvController {
  constructor(
    private readonly csvService: CsvService,
    private rabbitMQService: RabbitMQService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload and process a CSV file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file to upload',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiAuthResponses()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
     return await this.csvService.processCsvFile(file, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all CSV data for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of CSV data', type: [CsvDataResponseDto] })
  @ApiAuthResponses()
  async findAll(@Request() req) {
    return this.csvService.findAllByUserId(req.user.id);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get CSV data by code' })
  @ApiResponse({ status: 200, description: 'CSV data found', type: CsvDataResponseDto })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiAuthResponses()
  async findByCode(@Param('code') code: string, @Request() req) {
    return this.csvService.findByCode(code, req.user.id);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all CSV data for the authenticated user' })
  @ApiResponse({ status: 200, description: 'All data deleted successfully' })
  @ApiAuthResponses()
  async deleteAll(@Request() req) {
    await this.csvService.deleteAllByUserId(req.user.id);
    return { message: 'All data deleted successfully' };
  }


  @Post('queue1')
  @ApiOperation({ summary: 'Upload and process CSV file via RabbitMQ queue1' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file to upload',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiAuthResponses()
  @UseInterceptors(FileInterceptor('file'))
  async testQueue1(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Empty file uploaded');
    }

    const filedata = file.buffer.toString('base64');

    // Then publish to queue1
    return await this.rabbitMQService.publishToQueue1({
      content: filedata,
      userId: req.user.id
    });
  }

  @Post('queue2')
  @ApiOperation({ summary: 'Upload and process CSV file via RabbitMQ queue2 and queue3' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file to upload',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiAuthResponses()
  @UseInterceptors(FileInterceptor('file'))
  async testQueue2(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Empty file uploaded');
    }

    const filedata = file.buffer.toString('base64');

    // Publish to queue2, which will process the CSV and publish each record to queue3
    return await this.rabbitMQService.publishToQueue2({
      content: filedata,
      userId: req.user.id
    });
  }
}
