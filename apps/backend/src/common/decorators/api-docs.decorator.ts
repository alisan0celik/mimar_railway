import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { ApiErrorResponseDto } from "../dto/api-error.dto";
import { SWAGGER_BEARER_AUTH } from "../../config/swagger.config";

export function ApiProtectedController(tag: string) {
  return applyDecorators(
    ApiTags(tag),
    ApiBearerAuth(SWAGGER_BEARER_AUTH),
    ApiUnauthorizedResponse({
      description: "JWT token eksik veya geçersiz",
      type: ApiErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: "Yetki yetersiz veya şirket/onay durumu uygun değil",
      type: ApiErrorResponseDto,
    }),
  );
}
