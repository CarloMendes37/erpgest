import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'João Silva' })
  @IsString() @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'joao@empresa.pt' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha@123', minLength: 8 })
  @IsString() @MinLength(8) @MaxLength(100)
  password: string;

  @ApiPropertyOptional({ example: 'empresa-abc' })
  @IsOptional() @IsString() @MaxLength(60)
  tenantSlug?: string;

  @ApiPropertyOptional({ example: 'Empresa ABC Lda' })
  @IsOptional() @IsString() @MaxLength(200)
  tenantName?: string;
}
