import { IsBoolean } from 'class-validator';

export class ReviewOrganizerDto {
  @IsBoolean()
  approved: boolean;
}
