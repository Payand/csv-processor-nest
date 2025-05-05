import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RabbitMQService } from './rabbitmq.service';
import { RabbitMQConsumer } from './rabbitmq.consumer';
import { CsvData } from '../csv/entities/csv-data.entity';
import { CsvModule } from '../csv/csv.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CsvData]),
    forwardRef(() => CsvModule),
  ],
  providers: [RabbitMQService],
  controllers: [RabbitMQConsumer],
  exports: [RabbitMQService],
})
export class RabbitMQModule {}
