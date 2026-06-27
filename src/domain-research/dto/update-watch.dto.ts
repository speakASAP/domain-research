import { IsBoolean, IsIn, IsISO8601, IsOptional } from 'class-validator';

export class UpdateWatchDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsIn(['pending', 'accepted', 'declined'])
  dropTrackingConsent?: 'pending' | 'accepted' | 'declined';

  @IsOptional()
  @IsISO8601()
  manualNextCheckAt?: string;
}
