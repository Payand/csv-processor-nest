import { ApiProperty } from '@nestjs/swagger';

export class CsvDataResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'PROD001' })
  code: string;

  @ApiProperty({
    example: {
      name: 'Product 1',
      price: 99.99,
      quantity: 100
    }
  })
  data: Record<string, any>;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: '2024-05-02T15:00:00.000Z' })
  createdAt: Date;
} 