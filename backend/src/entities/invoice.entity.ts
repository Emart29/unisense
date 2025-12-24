import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { University } from './university.entity';
import { Student } from './student.entity';

export enum InvoiceStatus {
  UNPAID = 'unpaid',
  PARTIALLY_PAID = 'partially_paid',
  FULLY_PAID = 'fully_paid',
}

@Entity('invoices')
@Unique(['studentId', 'session'])
@Index(['studentId'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'university_id', type: 'uuid' })
  universityId: string;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @Column({ type: 'varchar', length: 20 })
  session: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ name: 'amount_paid', type: 'decimal', precision: 10, scale: 2, default: 0 })
  amountPaid: number;

  @Column({
    type: 'varchar',
    length: 20,
    enum: InvoiceStatus,
    default: InvoiceStatus.UNPAID,
  })
  status: InvoiceStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => University)
  @JoinColumn({ name: 'university_id' })
  university: University;

  @ManyToOne(() => Student)
  @JoinColumn({ name: 'student_id' })
  student: Student;
}
