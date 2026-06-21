import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ApiErrorDetailDto {
  @ApiProperty({ example: "email" })
  field!: string;

  @ApiProperty({ example: "Geçerli bir e-posta adresi giriniz" })
  message!: string;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: "Doğrulama hatası" })
  message!: string;

  @ApiProperty({ example: "Bad Request" })
  error!: string;

  @ApiProperty({ example: "2026-06-12T10:00:00.000Z" })
  timestamp!: string;

  @ApiProperty({ example: "/api/auth/login" })
  path!: string;

  @ApiPropertyOptional({ type: [ApiErrorDetailDto] })
  details?: ApiErrorDetailDto[];
}
