import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeeStructure } from '../entities/fee-structure.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Student, EnrollmentStatus } from '../entities/student.entity';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { GenerateInvoicesDto, GenerateInvoicesResultDto } from './dto/generate-invoices.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

@Injectable()
export class FeesService {
  constructor(
    @InjectRepository(FeeStructure)
    private feeStructureRepository: Repository<FeeStructure>,
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  // Fee Structure CRUD Operations
  async createFeeStructure(createFeeStructureDto: CreateFeeStructureDto): Promise<FeeStructure> {
    const existing = await this.feeStructureRepository.findOne({
      where: {
        universityId: createFeeStructureDto.universityId,
        session: createFeeStructureDto.session,
        level: createFeeStructureDto.level,
      },
    });

    if (existing) {
      throw new ConflictException('Fee structure already exists for this session and level');
    }

    const feeStructure = this.feeStructureRepository.create(createFeeStructureDto);
    return this.feeStructureRepository.save(feeStructure);
  }

  async findAllFeeStructures(
    universityId: string,
    session?: string,
    level?: number,
  ): Promise<FeeStructure[]> {
    const query = this.feeStructureRepository.createQueryBuilder('fee_structure')
      .where('fee_structure.universityId = :universityId', { universityId });

    if (session) {
      query.andWhere('fee_structure.session = :session', { session });
    }

    if (level !== undefined) {
      query.andWhere('fee_structure.level = :level', { level });
    }

    return query.getMany();
  }

  async findOneFeeStructure(id: string, universityId: string): Promise<FeeStructure> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id, universityId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    return feeStructure;
  }

  async updateFeeStructure(
    id: string,
    universityId: string,
    updateFeeStructureDto: UpdateFeeStructureDto,
  ): Promise<FeeStructure> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id, universityId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    Object.assign(feeStructure, updateFeeStructureDto);
    return this.feeStructureRepository.save(feeStructure);
  }

  async removeFeeStructure(id: string, universityId: string): Promise<void> {
    const feeStructure = await this.feeStructureRepository.findOne({
      where: { id, universityId },
    });

    if (!feeStructure) {
      throw new NotFoundException('Fee structure not found');
    }

    await this.feeStructureRepository.remove(feeStructure);
  }

  // Invoice Generation
  async generateInvoices(generateInvoicesDto: GenerateInvoicesDto): Promise<GenerateInvoicesResultDto> {
    const { universityId, session } = generateInvoicesDto;

    // Get all active students
    const students = await this.studentRepository.find({
      where: {
        universityId,
        enrollmentStatus: EnrollmentStatus.ACTIVE,
      },
    });

    const result: GenerateInvoicesResultDto = {
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    for (const student of students) {
      try {
        // Check if invoice already exists
        const existingInvoice = await this.invoiceRepository.findOne({
          where: {
            studentId: student.id,
            session,
          },
        });

        if (existingInvoice) {
          result.failureCount++;
          result.errors.push({
            studentId: student.studentId,
            error: 'Invoice already exists for this session',
          });
          continue;
        }

        // Get fee structure for student's level
        const feeStructure = await this.feeStructureRepository.findOne({
          where: {
            universityId,
            session,
            level: student.level,
          },
        });

        if (!feeStructure) {
          result.failureCount++;
          result.errors.push({
            studentId: student.studentId,
            error: `No fee structure found for level ${student.level}`,
          });
          continue;
        }

        // Create invoice
        const invoice = this.invoiceRepository.create({
          universityId,
          studentId: student.id,
          session,
          amount: feeStructure.amount,
          amountPaid: 0,
          status: InvoiceStatus.UNPAID,
        });

        await this.invoiceRepository.save(invoice);
        result.successCount++;
      } catch (error) {
        result.failureCount++;
        result.errors.push({
          studentId: student.studentId,
          error: error.message,
        });
      }
    }

    return result;
  }

  // Payment Recording
  async recordPayment(
    invoiceId: string,
    universityId: string,
    recordPaymentDto: RecordPaymentDto,
  ): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id: invoiceId, universityId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const newAmountPaid = Number(invoice.amountPaid) + Number(recordPaymentDto.amount);
    const totalAmount = Number(invoice.amount);

    if (newAmountPaid > totalAmount) {
      throw new BadRequestException('Payment amount exceeds invoice total');
    }

    invoice.amountPaid = newAmountPaid;

    // Update status based on payment
    if (newAmountPaid === 0) {
      invoice.status = InvoiceStatus.UNPAID;
    } else if (newAmountPaid < totalAmount) {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    } else {
      invoice.status = InvoiceStatus.FULLY_PAID;
    }

    return this.invoiceRepository.save(invoice);
  }

  // Invoice Query
  async findAllInvoices(
    universityId: string,
    session?: string,
    status?: InvoiceStatus,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ invoices: Invoice[]; total: number; page: number; limit: number }> {
    const query = this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.student', 'student')
      .where('invoice.universityId = :universityId', { universityId });

    if (session) {
      query.andWhere('invoice.session = :session', { session });
    }

    if (status) {
      query.andWhere('invoice.status = :status', { status });
    }

    const total = await query.getCount();
    const invoices = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { invoices, total, page, limit };
  }

  async findOneInvoice(id: string, universityId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, universityId },
      relations: ['student'],
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  // Financial Report Export
  async exportFinancialReport(universityId: string, session?: string): Promise<string> {
    const query = this.invoiceRepository.createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.student', 'student')
      .where('invoice.universityId = :universityId', { universityId });

    if (session) {
      query.andWhere('invoice.session = :session', { session });
    }

    const invoices = await query.getMany();

    // Generate CSV
    const headers = [
      'Invoice ID',
      'Student ID',
      'Student Name',
      'Faculty',
      'Department',
      'Level',
      'Session',
      'Amount',
      'Amount Paid',
      'Balance',
      'Status',
      'Created At',
    ];

    const rows = invoices.map(invoice => [
      invoice.id,
      invoice.student.studentId,
      `${invoice.student.firstName} ${invoice.student.lastName}`,
      invoice.student.faculty,
      invoice.student.department,
      invoice.student.level.toString(),
      invoice.session,
      invoice.amount.toString(),
      invoice.amountPaid.toString(),
      (Number(invoice.amount) - Number(invoice.amountPaid)).toString(),
      invoice.status,
      invoice.createdAt.toISOString(),
    ]);

    const csvLines = [headers.join(','), ...rows.map(row => row.join(','))];
    return csvLines.join('\n');
  }
}
