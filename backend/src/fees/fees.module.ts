import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeesService } from './fees.service';
import { FeesController } from './fees.controller';
import { FeeStructure } from '../entities/fee-structure.entity';
import { Invoice } from '../entities/invoice.entity';
import { Student } from '../entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FeeStructure, Invoice, Student])],
  controllers: [FeesController],
  providers: [FeesService],
  exports: [FeesService],
})
export class FeesModule {}
