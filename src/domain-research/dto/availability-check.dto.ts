import { ArrayMaxSize, ArrayMinSize, IsArray, IsString } from 'class-validator';

export class AvailabilityCheckDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  domains!: string[];
}
