import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateBankAccountDto {
  @IsString()
  @MaxLength(100)
  bankName: string;

  @IsString()
  @MaxLength(150)
  accountName: string;

  @IsString()
  @MaxLength(100)
  accountNumber: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
