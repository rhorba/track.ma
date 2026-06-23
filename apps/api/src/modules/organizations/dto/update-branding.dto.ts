import { IsOptional, IsString, IsUrl, Matches } from 'class-validator';

export class UpdateBrandingDto {
  @IsOptional()
  @IsUrl()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'primaryColor must be a valid hex color (#rrggbb)' })
  primaryColor?: string;
}
