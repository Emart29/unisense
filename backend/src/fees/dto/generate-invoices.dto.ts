import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class GenerateInvoicesDto {
  @IsUUID()
  @IsNotEmpty()
  universityId: string;

  @IsString()
  @IsNotEmpty()
  session: string;
}

export class GenerateInvoicesResultDto {
  successCount: number;
  failureCount: number;
  errors: Array<{
    studentId: string;
    error: string;
  }>;
}
