import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class ScanTicketDto {
  @IsString()
  @IsNotEmpty()
  qrToken: string;

  @IsUUID()
  scannedByUserId: string;

  @IsUUID()
  eventId: string;
}
