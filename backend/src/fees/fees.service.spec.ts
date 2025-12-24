import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fc from 'fast-check';
import { FeesService } from './fees.service';
import { FeeStructure } from '../entities/fee-structure.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { Student, EnrollmentStatus } from '../entities/student.entity';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { GenerateInvoicesDto } from './dto/generate-invoices.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';

describe('FeesService', () => {
  let service: FeesService;
  let feeStructureRepository: Repository<FeeStructure>;
  let invoiceRepository: Repository<Invoice>;
  let studentRepository: Repository<Student>;

  const mockFeeStructureRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
    remove: jest.fn(),
  };

  const mockInvoiceRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockStudentRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        {
          provide: getRepositoryToken(FeeStructure),
          useValue: mockFeeStructureRepository,
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: mockInvoiceRepository,
        },
        {
          provide: getRepositoryToken(Student),
          useValue: mockStudentRepository,
        },
      ],
    }).compile();

    service = module.get<FeesService>(FeesService);
    feeStructureRepository = module.get<Repository<FeeStructure>>(getRepositoryToken(FeeStructure));
    invoiceRepository = module.get<Repository<Invoice>>(getRepositoryToken(Invoice));
    studentRepository = module.get<Repository<Student>>(getRepositoryToken(Student));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Feature: unisense-mvp, Property 17: Fee structure storage
   * Validates: Requirements 5.1
   * 
   * For any valid fee structure (session, level, amount), creation should store
   * the data and make it retrievable for invoice generation.
   */
  describe('Property 17: Fee structure storage', () => {
    it('should store and retrieve all fee structure fields for any valid data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            universityId: fc.uuid(),
            session: fc.string({ minLength: 4, maxLength: 20 }),
            level: fc.integer({ min: 1, max: 10 }),
            amount: fc.float({ min: Math.fround(0.01), max: Math.fround(1000000), noNaN: true }),
          }),
          async (feeData) => {
            const createDto: CreateFeeStructureDto = {
              universityId: feeData.universityId,
              session: feeData.session,
              level: feeData.level,
              amount: feeData.amount,
            };

            const expectedFeeStructure: FeeStructure = {
              id: fc.sample(fc.uuid(), 1)[0],
              universityId: createDto.universityId,
              session: createDto.session,
              level: createDto.level,
              amount: createDto.amount,
              createdAt: new Date(),
              university: null,
            };

            mockFeeStructureRepository.findOne.mockResolvedValue(null);
            mockFeeStructureRepository.create.mockReturnValue(expectedFeeStructure);
            mockFeeStructureRepository.save.mockResolvedValue(expectedFeeStructure);

            const result = await service.createFeeStructure(createDto);

            // Verify all fields are stored correctly
            expect(result.universityId).toBe(feeData.universityId);
            expect(result.session).toBe(feeData.session);
            expect(result.level).toBe(feeData.level);
            expect(result.amount).toBe(feeData.amount);

            // Verify the data can be retrieved
            mockFeeStructureRepository.findOne.mockResolvedValue(expectedFeeStructure);
            const retrieved = await service.findOneFeeStructure(result.id, feeData.universityId);
            
            expect(retrieved.session).toBe(feeData.session);
            expect(retrieved.level).toBe(feeData.level);
            expect(retrieved.amount).toBe(feeData.amount);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: unisense-mvp, Property 18: Invoice generation completeness
   * Validates: Requirements 5.2
   * 
   * For any new session with enrolled students, invoice generation should create
   * exactly one invoice per student with the correct fee amount based on their level.
   */
  describe('Property 18: Invoice generation completeness', () => {
    it('should create exactly one invoice per active student with correct fee amount', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            universityId: fc.uuid(),
            session: fc.string({ minLength: 4, maxLength: 20 }),
            students: fc.array(
              fc.record({
                id: fc.uuid(),
                studentId: fc.string({ minLength: 1, maxLength: 50 }),
                level: fc.integer({ min: 1, max: 10 }),
                universityId: fc.uuid(),
              }),
              { minLength: 1, maxLength: 10 },
            ),
          }),
          async (data) => {
            // Ensure all students have the same universityId
            const students = data.students.map(s => ({
              ...s,
              universityId: data.universityId,
              enrollmentStatus: EnrollmentStatus.ACTIVE,
              firstName: 'Test',
              lastName: 'Student',
              faculty: 'Engineering',
              department: 'Computer Science',
              creditLimit: 24,
              userId: null,
              createdAt: new Date(),
              university: null,
              user: null,
            })) as Student[];

            // Create fee structures for each level
            const feeStructures = Array.from(new Set(students.map(s => s.level))).map(level => ({
              id: fc.sample(fc.uuid(), 1)[0],
              universityId: data.universityId,
              session: data.session,
              level,
              amount: 50000 + level * 1000,
              createdAt: new Date(),
              university: null,
            })) as FeeStructure[];

            mockStudentRepository.find.mockResolvedValue(students);
            mockInvoiceRepository.findOne.mockResolvedValue(null);
            
            // Mock fee structure lookup
            mockFeeStructureRepository.findOne.mockImplementation(async (options) => {
              const level = options.where.level;
              return feeStructures.find(fs => fs.level === level) || null;
            });

            const invoices: Invoice[] = [];
            mockInvoiceRepository.create.mockImplementation((data) => {
              const invoice = {
                id: fc.sample(fc.uuid(), 1)[0],
                ...data,
                createdAt: new Date(),
                university: null,
                student: null,
              };
              invoices.push(invoice);
              return invoice;
            });
            mockInvoiceRepository.save.mockImplementation(async (invoice) => invoice);

            const generateDto: GenerateInvoicesDto = {
              universityId: data.universityId,
              session: data.session,
            };

            const result = await service.generateInvoices(generateDto);

            // Verify exactly one invoice per student
            expect(result.successCount).toBe(students.length);
            expect(invoices.length).toBe(students.length);

            // Verify each invoice has correct amount based on student level
            invoices.forEach(invoice => {
              const student = students.find(s => s.id === invoice.studentId);
              const feeStructure = feeStructures.find(fs => fs.level === student.level);
              expect(invoice.amount).toBe(feeStructure.amount);
              expect(invoice.status).toBe(InvoiceStatus.UNPAID);
              expect(invoice.amountPaid).toBe(0);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: unisense-mvp, Property 19: Payment status transitions
   * Validates: Requirements 5.3
   * 
   * For any invoice and payment amount, recording payment should update the
   * amount_paid and transition status correctly (unpaid → partially_paid → fully_paid).
   */
  describe('Property 19: Payment status transitions', () => {
    it('should correctly transition invoice status based on payment amounts', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            invoiceId: fc.uuid(),
            universityId: fc.uuid(),
            totalAmount: fc.float({ min: Math.fround(100), max: Math.fround(100000), noNaN: true }),
            payments: fc.array(
              fc.float({ min: Math.fround(1), max: Math.fround(50000), noNaN: true }),
              { minLength: 1, maxLength: 5 },
            ),
          }),
          async (data) => {
            let currentAmountPaid = 0;
            const totalAmount = Math.round(data.totalAmount * 100) / 100;

            for (const payment of data.payments) {
              const paymentAmount = Math.round(payment * 100) / 100;
              const newAmountPaid = Math.round((currentAmountPaid + paymentAmount) * 100) / 100;

              // Skip if payment would exceed total
              if (newAmountPaid > totalAmount) {
                continue;
              }

              const invoice: Invoice = {
                id: data.invoiceId,
                universityId: data.universityId,
                studentId: fc.sample(fc.uuid(), 1)[0],
                session: '2023/2024',
                amount: totalAmount,
                amountPaid: currentAmountPaid,
                status: currentAmountPaid === 0 
                  ? InvoiceStatus.UNPAID 
                  : currentAmountPaid < totalAmount 
                    ? InvoiceStatus.PARTIALLY_PAID 
                    : InvoiceStatus.FULLY_PAID,
                createdAt: new Date(),
                university: null,
                student: null,
              };

              mockInvoiceRepository.findOne.mockResolvedValue(invoice);
              mockInvoiceRepository.save.mockImplementation(async (inv) => inv);

              const recordPaymentDto: RecordPaymentDto = {
                amount: paymentAmount,
              };

              const result = await service.recordPayment(
                data.invoiceId,
                data.universityId,
                recordPaymentDto,
              );

              // Verify amount_paid is updated correctly (with floating point tolerance)
              expect(Math.abs(result.amountPaid - newAmountPaid)).toBeLessThan(0.01);

              // Verify status transitions correctly
              if (newAmountPaid === 0) {
                expect(result.status).toBe(InvoiceStatus.UNPAID);
              } else if (newAmountPaid < totalAmount) {
                expect(result.status).toBe(InvoiceStatus.PARTIALLY_PAID);
              } else {
                expect(result.status).toBe(InvoiceStatus.FULLY_PAID);
              }

              currentAmountPaid = newAmountPaid;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Feature: unisense-mvp, Property 20: Financial report export correctness
   * Validates: Requirements 5.4
   * 
   * For any set of invoices and payments, the exported CSV should contain all
   * payment records with accurate data matching the database.
   */
  describe('Property 20: Financial report export correctness', () => {
    it('should export all invoice data accurately in CSV format', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            universityId: fc.uuid(),
            session: fc.string({ minLength: 4, maxLength: 20 }),
            invoices: fc.array(
              fc.record({
                id: fc.uuid(),
                studentId: fc.uuid(),
                amount: fc.float({ min: Math.fround(1000), max: Math.fround(100000), noNaN: true }),
                amountPaid: fc.float({ min: Math.fround(0), max: Math.fround(100000), noNaN: true }),
                status: fc.constantFrom(
                  InvoiceStatus.UNPAID,
                  InvoiceStatus.PARTIALLY_PAID,
                  InvoiceStatus.FULLY_PAID,
                ),
              }),
              { minLength: 1, maxLength: 10 },
            ),
          }),
          async (data) => {
            const invoicesWithStudents = data.invoices.map(inv => {
              const amount = Math.round(inv.amount * 100) / 100;
              const amountPaid = Math.min(
                Math.round(inv.amountPaid * 100) / 100,
                amount,
              );

              return {
                id: inv.id,
                universityId: data.universityId,
                studentId: inv.studentId,
                session: data.session,
                amount,
                amountPaid,
                status: inv.status,
                createdAt: new Date(),
                university: null,
                student: {
                  id: inv.studentId,
                  universityId: data.universityId,
                  studentId: `STU${Math.floor(Math.random() * 10000)}`,
                  firstName: 'Test',
                  lastName: 'Student',
                  faculty: 'Engineering',
                  department: 'Computer Science',
                  level: 1,
                  enrollmentStatus: EnrollmentStatus.ACTIVE,
                  creditLimit: 24,
                  userId: null,
                  createdAt: new Date(),
                  university: null,
                  user: null,
                },
              } as Invoice;
            });

            const mockQueryBuilder = {
              leftJoinAndSelect: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getMany: jest.fn().mockResolvedValue(invoicesWithStudents),
            };

            mockInvoiceRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

            const csv = await service.exportFinancialReport(data.universityId, data.session);

            // Verify CSV contains header
            expect(csv).toContain('Invoice ID');
            expect(csv).toContain('Student ID');
            expect(csv).toContain('Amount');
            expect(csv).toContain('Amount Paid');
            expect(csv).toContain('Balance');
            expect(csv).toContain('Status');

            // Verify all invoices are in the CSV
            invoicesWithStudents.forEach(invoice => {
              expect(csv).toContain(invoice.id);
              expect(csv).toContain(invoice.student.studentId);
              expect(csv).toContain(invoice.amount.toString());
              expect(csv).toContain(invoice.amountPaid.toString());
              
              const balance = invoice.amount - invoice.amountPaid;
              expect(csv).toContain(balance.toString());
              expect(csv).toContain(invoice.status);
            });

            // Verify CSV has correct number of rows (header + data rows)
            const lines = csv.split('\n').filter(line => line.trim());
            expect(lines.length).toBe(invoicesWithStudents.length + 1);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
