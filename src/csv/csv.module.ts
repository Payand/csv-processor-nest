import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CsvController } from './csv.controller';
import { CsvService } from './csv.service';
import { CsvData } from './entities/csv-data.entity';
import { RabbitMQModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CsvData]),
    forwardRef(() => RabbitMQModule)
  ],
  controllers: [CsvController],
  providers: [CsvService],
  exports: [CsvService],
})
export class CsvModule {}
