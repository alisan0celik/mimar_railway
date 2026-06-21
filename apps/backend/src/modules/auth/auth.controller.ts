import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { AuthRateLimitGuard } from "../../common/guards/auth-rate-limit.guard";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { SocialLoginDto } from "./dto/social-login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { ApiErrorResponseDto } from "../../common/dto/api-error.dto";
import { SWAGGER_BEARER_AUTH } from "../../config/swagger.config";

@Controller("auth")
@ApiTags("Auth")
@UseGuards(AuthRateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Yeni kullanıcı kaydı" })
  @ApiResponse({ status: 201, description: "Kayıt başarılı — access ve refresh token döner" })
  @ApiResponse({ status: 400, description: "Doğrulama hatası", type: ApiErrorResponseDto })
  @ApiResponse({ status: 409, description: "E-posta zaten kayıtlı", type: ApiErrorResponseDto })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Get("check-email")
  @ApiOperation({ summary: "E-posta adresinin kayıtlı olup olmadığını kontrol et" })
  @ApiResponse({ status: 200, description: "Kontrol sonucu döner" })
  async checkEmail(@Query("email") email: string) {
    const exists = await this.authService.checkEmailExists(email);
    return { exists };
  }

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "E-posta ve şifre ile giriş" })
  @ApiResponse({ status: 200, description: "Giriş başarılı — access ve refresh token döner" })
  @ApiResponse({ status: 401, description: "Geçersiz kimlik bilgileri", type: ApiErrorResponseDto })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post("social")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Google veya Apple ile sosyal giriş" })
  @ApiResponse({ status: 200, description: "Giriş başarılı" })
  @ApiResponse({ status: 401, description: "Sosyal giriş başarısız", type: ApiErrorResponseDto })
  async socialLogin(@Body() dto: SocialLoginDto) {
    return this.authService.socialLogin(dto);
  }

  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Access token yenileme" })
  @ApiResponse({ status: 200, description: "Yeni access ve refresh token döner" })
  @ApiResponse({ status: 401, description: "Geçersiz veya süresi dolmuş refresh token", type: ApiErrorResponseDto })
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Public()
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Şifre sıfırlama bağlantısı iste" })
  @ApiResponse({ status: 200, description: "Sıfırlama e-postası gönderildi (e-posta kayıtlıysa)" })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Yeni şifre belirle" })
  @ApiResponse({ status: 200, description: "Şifre başarıyla güncellendi" })
  @ApiResponse({ status: 400, description: "Geçersiz veya süresi dolmuş token", type: ApiErrorResponseDto })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth(SWAGGER_BEARER_AUTH)
  @ApiOperation({ summary: "Oturumu kapat" })
  @ApiResponse({ status: 200, description: "Çıkış başarılı" })
  async logout(@CurrentUser() user: JwtPayload) {
    return this.authService.logout(user.sub);
  }

  @Get("me")
  @ApiBearerAuth(SWAGGER_BEARER_AUTH)
  @ApiOperation({ summary: "Giriş yapmış kullanıcının profil bilgisi" })
  @ApiResponse({ status: 200, description: "Kullanıcı profili" })
  async getProfile(@CurrentUser() user: JwtPayload) {
    return this.authService.getProfile(user.sub);
  }
}
