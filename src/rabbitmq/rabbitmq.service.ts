import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, ClientProxyFactory, Transport, RmqOptions } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private client: ClientProxy;

  constructor(private configService: ConfigService) {
    const rabbitmqUrl = this.configService.get<string>('rabbitmq.url') || 'amqp://guest:guest@localhost:5672';

    const options: RmqOptions = {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'queue1',
        queueOptions: {
          durable: true,
        },
        persistent: true,
      },
    };

    this.client = ClientProxyFactory.create(options);
  }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Failed to connect to RabbitMQ:', error);
    }
  }

  async onModuleDestroy() {
    await this.client.close();
  }

  publishToQueue1(data: any): Observable<any> {
    return this.client.send('csv.upload', data);
  }

  publishToQueue2(data: any): Observable<any> {
    return this.client.send('csv.process', data);
  }

  publishToQueue3(data: any): Observable<any> {
    return this.client.send('csv.save', data);
  }
}
