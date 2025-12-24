import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  Header,
} from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateFeeStructureDto } from './dto/create-fee-structure.dto';
import { UpdateFeeStructureDto } from './dto/update-fee-structure.dto';
import { GenerateInvoicesDto } from './dto/generate-invoices.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { InvoiceStatus } from '../entities/invoice.entity';

@Controller('fees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  // Fee Structure Endpoints
  @Post('structures')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  createFeeStructure(@Body() createFeeStructureDto: CreateFeeStructureDto, @Request() req) {
    createFeeStructureDto.universityId = req.user.universityId;
    return this.feesService.createFeeStructure(createFeeStructureDto);
  }

  @Get('structures')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  findAllFeeStructures(
    @Request() req,
    @Query('session') session?: string,
    @Query('level') level?: string,
  ) {
    const levelNum = level ? parseInt(level) : undefined;
    return this.feesService.findAllFeeStructures(req.user.universityId, session, levelNum);
  }

  @Get('structures/:id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  findOneFeeStructure(@Param('id') id: string, @Request() req) {
    return this.feesService.findOneFeeStructure(id, req.user.universityId);
  }

  @Patch('structures/:id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  updateFeeStructure(
    @Param('id') id: string,
    @Body() updateFeeStructureDto: UpdateFeeStructureDto,
    @Request() req,
  ) {
    return this.feesService.updateFeeStructure(id, req.user.universityId, updateFeeStructureDto);
  }

  @Delete('structures/:id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  removeFeeStructure(@Param('id') id: string, @Request() req) {
    return this.feesService.removeFeeStructure(id, req.user.universityId);
  }

  // Invoice Endpoints
  @Post('invoices/generate')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  generateInvoices(@Body() generateInvoicesDto: GenerateInvoicesDto, @Request() req) {
    generateInvoicesDto.universityId = req.user.universityId;
    return this.feesService.generateInvoices(generateInvoicesDto);
  }

  @Get('invoices')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.STUDENT)
  findAllInvoices(
    @Request() req,
    @Query('session') session?: string,
    @Query('status') status?: InvoiceStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 50;
    return this.feesService.findAllInvoices(req.user.universityId, session, status, pageNum, limitNum);
  }

  @Get('invoices/:id')
  @Roles(UserRole.ADMIN, UserRole.FINANCE, UserRole.STUDENT)
  findOneInvoice(@Param('id') id: string, @Request() req) {
    return this.feesService.findOneInvoice(id, req.user.universityId);
  }

  @Post('invoices/:id/payments')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  recordPayment(
    @Param('id') id: string,
    @Body() recordPaymentDto: RecordPaymentDto,
    @Request() req,
  ) {
    return this.feesService.recordPayment(id, req.user.universityId, recordPaymentDto);
  }

  // Financial Report Export
  @Get('reports/export')
  @Roles(UserRole.ADMIN, UserRole.FINANCE)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="financial-report.csv"')
  exportFinancialReport(@Request() req, @Query('session') session?: string) {
    return this.feesService.exportFinancialReport(req.user.universityId, session);
  }
}
