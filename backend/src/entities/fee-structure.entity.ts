import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { University } from './university.entity';

@Entity('fee_structures')
@Unique(['universityId', 'session', 'level'])
export class FeeStructure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'university_id', type: 'uuid' })
  universityId: string;

  @Column({ type: 'varchar', length: 20 })
  session: string;

  @Column({ type: 'integer' })
  level: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => University)
  @JoinColumn({ name: 'university_id' })
  university: University;
}
