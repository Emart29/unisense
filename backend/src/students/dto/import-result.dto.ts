export class ImportResultDto {
  successCount: number;
  failureCount: number;
  errors: ImportErrorDto[];
}

export class ImportErrorDto {
  row: number;
  studentId: string;
  error: string;
}
