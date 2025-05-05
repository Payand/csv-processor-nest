import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('csv_data')
export class CsvData {
  @PrimaryColumn()
  code: string;

  @Column()
  id: number;

  @Column()
  name: string;

  @Column()
  value: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  // @Column('jsonb')
  // data: Record<string, any>;
}
