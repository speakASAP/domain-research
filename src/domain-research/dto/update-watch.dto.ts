import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateWatchDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
