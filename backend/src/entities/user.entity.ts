import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { University } from './university.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  DEAN = 'DEAN',
  LECTURER = 'LECTURER',
  STUDENT = 'STUDENT',
  FINANCE = 'FINANCE',
}

@Entity('users')
@Index(['universityId', 'email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'university_id', type: 'uuid' })
  universityId: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: UserRole,
  })
  role: UserRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => University, university => university.users)
  @JoinColumn({ name: 'university_id' })
  university: University;
}
