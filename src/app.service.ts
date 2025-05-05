import { Injectable } from '@nestjs/common';
import { HealthCheckService, TypeOrmHealthIndicator, MicroserviceHealthIndicator, HealthCheckResult } from '@nestjs/terminus';
import { Transport } from '@nestjs/microservices';

@Injectable()
export class AppService {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
  ) {}



  async healthCheck(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () =>
        this.microservice.pingCheck('rabbitmq', {
          transport: Transport.RMQ,
          options: {
            urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'],
            queue: 'queue1',
          },
        }),
    ]);
  }
}
