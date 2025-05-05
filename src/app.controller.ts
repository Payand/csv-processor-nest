import { Controller, Post, Get, UseInterceptors, UploadedFile, Request, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';
import { HealthCheck } from '@nestjs/terminus';
import { ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ApiAuthResponses } from './common/decorators/api-auth-responses.decorator';
import { CsvService } from './csv/csv.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}


  @Get('health')
  @ApiOperation({ summary: 'Health check for database and RabbitMQ' })
  @ApiResponse({ status: 200, description: 'Health check result' })
  @HealthCheck()
  health() {
    return this.appService.healthCheck();
  }
}
