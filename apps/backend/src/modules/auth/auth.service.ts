import { createHash, randomBytes } from "crypto";
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../common/prisma.service";
import { FirebaseConfig } from "../../config/firebase.config";
import { getJwtRefreshSecret } from "../../config/jwt.config";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { SocialLoginDto } from "./dto/social-login.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { PasswordResetEmailService } from "./password-reset-email.service";
import { GoogleAuthService } from "./social/google-auth.service";
import { AppleAuthService } from "./social/apple-auth.service";
import { MicrosoftAuthService } from "./social/microsoft-auth.service";
import {
  isPlatformAdminEmail,
  throwIfCompanySubscriptionBlocked,
} from "../../common/subscription.util";

const DEFAULT_USER_PERMISSIONS = ["company.join", "notification.view"];
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly firebaseConfig: FirebaseConfig,
    private readonly googleAuthService: GoogleAuthService,
    private readonly appleAuthService: AppleAuthService,
    private readonly microsoftAuthService: MicrosoftAuthService,
    private readonly passwordResetEmailService: PasswordResetEmailService,
  ) { }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException("Bu e-posta adresi zaten kayıtlı");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        fullName: dto.fullName,
        authProvider: "EMAIL",
        approvalStatus: "approved",
        permissions: {
          create: DEFAULT_USER_PERMISSIONS.map((permission) => ({ permission })),
        },
      },
      include: {
        roles: { include: { role: true } },
        permissions: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, null);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      ...tokens,
      user: this.mapUserResponse(user),
    };
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    return !!user;
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        company: true,
        roles: { include: { role: { include: { permissions: true } } } },
        permissions: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("E-posta veya şifre hatalı");
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(
        "Bu hesap sosyal giriş ile oluşturulmuştur. Lütfen sosyal giriş kullanın.",
      );
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("E-posta veya şifre hatalı");
    }

    await this.assertCompanyAccess(user);

    const tokens = await this.generateTokens(user.id, user.email, user.companyId);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      ...tokens,
      user: this.mapUserResponse(user),
    };
  }

  async socialLogin(dto: SocialLoginDto) {
    let socialUser: { email: string; fullName: string; socialId: string };

    if (dto.provider === "GOOGLE") {
      socialUser = await this.googleAuthService.verifyToken(dto.idToken);
    } else if (dto.provider === "APPLE") {
      socialUser = await this.appleAuthService.verifyToken(dto.idToken);
    } else if (dto.provider === "MICROSOFT") {
      socialUser = await this.microsoftAuthService.verifyToken(dto.idToken);
    } else {
      throw new BadRequestException("Geçersiz sosyal giriş sağlayıcısı");
    }

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: socialUser.email },
          { authProvider: dto.provider, socialId: socialUser.socialId },
        ],
      },
      include: {
        company: true,
        roles: { include: { role: true } },
        permissions: true,
      },
    });

    if (user) {
      if (user.authProvider !== dto.provider) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { authProvider: dto.provider, socialId: socialUser.socialId },
        });
      }
    } else {
      user = await this.prisma.user.create({
        data: {
          email: socialUser.email,
          fullName: socialUser.fullName,
          authProvider: dto.provider,
          socialId: socialUser.socialId,
          approvalStatus: "approved",
          permissions: {
            create: DEFAULT_USER_PERMISSIONS.map((permission) => ({ permission })),
          },
        },
      include: {
        company: true,
        roles: { include: { role: true } },
        permissions: true,
      },
      });
    }

    await this.assertCompanyAccess(user);

    const tokens = await this.generateTokens(user.id, user.email, user.companyId);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      ...tokens,
      user: this.mapUserResponse(user),
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          company: true,
          roles: { include: { role: true } },
          permissions: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException("Geçersiz refresh token");
      }

      const tokenHash = this.hashRefreshToken(refreshToken);
      const session = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

      // Oturum tablosunda kayıt varsa onu doğrula; yoksa eski tek alanlı yapıyla
      // giriş yapmış istemciler için geriye dönük uyumluluk sağla.
      const sessionValid = Boolean(
        session && !session.revokedAt && session.userId === user.id && session.expiresAt > new Date(),
      );
      const legacyValid = !session && user.refreshToken === refreshToken;

      if (!sessionValid && !legacyValid) {
        throw new UnauthorizedException("Geçersiz refresh token");
      }

      await this.assertCompanyAccess(user);

      // Refresh token'ı DÖNDÜRMÜYORUZ: arka plan senkronu ile ön yüz aynı anda
      // yenileme yaptığında biri eski token ile 401 alıp oturumu düşürüyordu.
      // Mevcut refresh token süresi bitene ya da kullanıcı çıkış yapana kadar geçerli.
      const accessToken = await this.generateAccessToken(user.id, user.email, user.companyId);

      if (session) {
        await this.prisma.refreshToken
          .update({ where: { tokenHash }, data: { lastUsedAt: new Date() } })
          .catch(() => undefined);
      }

      return {
        accessToken,
        refreshToken,
        user: this.mapUserResponse(user),
      };
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new UnauthorizedException("Geçersiz veya süresi dolmuş refresh token");
    }
  }

  /**
   * Çıkış. refreshToken verilirse yalnızca o cihazın oturumu kapatılır;
   * verilmezse (eski istemciler) kullanıcının tüm oturumları kapatılır.
   */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashRefreshToken(refreshToken);
      await this.prisma.refreshToken.deleteMany({ where: { userId, tokenHash } });
      // Eski tek alanlı yapıyla açılmış oturumsa onu da temizle
      await this.prisma.user.updateMany({
        where: { id: userId, refreshToken },
        data: { refreshToken: null },
      });
      return { message: "Başarıyla çıkış yapıldı" };
    }

    await this.prisma.refreshToken.deleteMany({ where: { userId } });
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: "Başarıyla çıkış yapıldı" };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException("Girdiğiniz e-posta adresi sistemde kayıtlı değil");
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        "Bu hesap sosyal giriş ile oluşturulmuştur. Şifre sıfırlayamazsınız.",
      );
    }

    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      },
    });

    const resetUrl = await this.passwordResetEmailService.sendResetLink(email, rawToken);
    if (process.env.NODE_ENV !== "production") {
      this.logger.log(`Password reset link for ${email}: ${resetUrl}`);
    }

    return { message: "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi" };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = createHash("sha256").update(dto.token).digest("hex");

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException("Geçersiz veya süresi dolmuş sıfırlama bağlantısı");
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash, refreshToken: null },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
      // Şifre değişince tüm cihazlardaki oturumlar kapanmalı
      this.prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } }),
      this.prisma.passwordResetToken.updateMany({
        where: { userId: resetToken.userId, usedAt: null },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: "Şifreniz başarıyla sıfırlandı" };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        roles: { include: { role: { include: { permissions: true } } } },
        permissions: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException("Kullanıcı bulunamadı");
    }

    await this.assertCompanyAccess(user);

    return this.mapUserResponse(user);
  }

  /** Used by CompaniesService to issue fresh tokens after company creation/join */
  async refreshTokensForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: { include: { permissions: true } } } },
        permissions: true,
        company: true,
      },
    });

    if (!user) throw new Error('User not found');

    const tokens = await this.generateTokens(user.id, user.email, user.companyId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      ...tokens,
      user: this.mapUserResponse(user),
    };
  }

  private async assertCompanyAccess(user: any) {
    if (!user.companyId || user.approvalStatus !== "approved" || isPlatformAdminEmail(user.email)) {
      return;
    }

    const company = user.company ?? await this.prisma.company.findUnique({
      where: { id: user.companyId },
    });
    if (!company) return;

    try {
      throwIfCompanySubscriptionBlocked(company);
    } catch (error) {
      if (
        company.subscriptionEndsAt &&
        company.subscriptionEndsAt < new Date() &&
        company.subscriptionStatus !== "expired"
      ) {
        await this.prisma.company.update({
          where: { id: company.id },
          data: { subscriptionStatus: "expired" },
        });
      }
      throw error;
    }

    await this.prisma.company.update({
      where: { id: company.id },
      data: { lastActivityAt: new Date() },
    });
  }

  private hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private async generateAccessToken(userId: string, email: string, companyId: string | null) {
    return this.jwtService.signAsync({ sub: userId, email, companyId });
  }

  private async generateTokens(userId: string, email: string, companyId: string | null) {
    const payload: Record<string, unknown> = { sub: userId, email, companyId };

    // Oturum ömrü env'den; mobilde kullanıcı elle çıkış yapmadıkça atılmasın diye uzun.
    const refreshExpiresIn =
      this.configService.get<string>("JWT_REFRESH_EXPIRATION")?.trim() || "90d";

    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(userId, email, companyId),
      this.jwtService.signAsync(payload, {
        secret: getJwtRefreshSecret(this.configService),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    // Her oturumu ayrı satırda tut: aynı hesapla farklı cihazlardan girmek
    // birbirinin oturumunu düşürmesin.
    const decoded = this.jwtService.decode(refreshToken) as { exp?: number } | null;
    const expiresAt = decoded?.exp
      ? new Date(decoded.exp * 1000)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash: this.hashRefreshToken(refreshToken), expiresAt },
    });

    // Süresi geçmiş oturum kayıtlarını fırsat buldukça temizle
    await this.prisma.refreshToken
      .deleteMany({ where: { userId, expiresAt: { lt: new Date() } } })
      .catch(() => undefined);

    return { accessToken, refreshToken };
  }

  private mapUserResponse(user: any) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider,
      approvalStatus: user.approvalStatus,
      title: user.title,
      companyId: user.companyId,
      companyName: user.company?.name || null,
      isPlatformAdmin: isPlatformAdminEmail(user.email),
      companySubscription: user.company ? {
        status: user.company.subscriptionStatus ?? null,
        startedAt: user.company.subscriptionStartedAt?.toISOString?.() ?? null,
        endsAt: user.company.subscriptionEndsAt?.toISOString?.() ?? null,
        blockedReason: user.company.blockedReason ?? null,
        lastActivityAt: user.company.lastActivityAt?.toISOString?.() ?? null,
      } : null,
      roles: user.roles?.map((ur: any) => ({
        id: ur.role.id,
        name: ur.role.name,
        code: ur.role.code,
      })) || [],
      permissions: Array.from(new Set([
        ...(user.permissions?.map((up: any) => up.permission) || []),
        ...(user.roles?.flatMap((ur: any) => ur.role.permissions?.map((rp: any) => rp.permission) || []) || [])
      ])),
      notificationPreferences: user.notificationPreferences ?? null,
      createdAt: user.createdAt?.toISOString(),
    };
  }
}
