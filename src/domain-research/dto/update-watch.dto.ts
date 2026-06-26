import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export class UpdateWatchDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsIn(['pending', 'accepted', 'declined'])
  dropTrackingConsent?: 'pending' | 'accepted' | 'declined';
}
