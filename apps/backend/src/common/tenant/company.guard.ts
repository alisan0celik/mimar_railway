import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../prisma.service";
import { throwIfCompanySubscriptionBlocked } from "../subscription.util";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { COMPANY_SCOPED_PARAM_KEY } from "./company-scoped.decorator";
import { REQUIRE_COMPANY_KEY } from "./require-company.decorator";
import { REQUIRE_APPROVED_KEY } from "./require-approved.decorator";

@Injectable()
export class CompanyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const requireCompany = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_COMPANY_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requireApproved = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_APPROVED_KEY,
      [context.getHandler(), context.getClass()],
    );
    const companyParam = this.reflector.getAllAndOverride<string>(
      COMPANY_SCOPED_PARAM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireCompany && !companyParam && !requireApproved) return true;

    const request = context.switchToHttp().getRequest<{ user?: JwtPayload; params?: Record<string, string> }>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException("Kimlik doğrulama gerekli");
    }

    if ((requireCompany || requireApproved || companyParam) && !user.companyId) {
      throw new ForbiddenException("Bu işlem için bir şirkete üye olmanız gerekir");
    }

    if (requireApproved && user.approvalStatus !== "approved") {
      throw new ForbiddenException("Bu işlem için şirket üyeliğinizin onaylanması gerekir");
    }

    const company = await this.prisma.company.findUnique({
      where: { id: user.companyId! },
      select: {
        id: true,
        status: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        blockedReason: true,
      },
    });
    if (!company) {
      throw new ForbiddenException("Åirket bulunamadÄ±");
    }

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

    if (requireApproved) {
      await this.prisma.company.update({
        where: { id: company.id },
        data: { lastActivityAt: new Date() },
      });
    }

    if (companyParam) {
      const paramValue = request.params?.[companyParam];
      if (paramValue && user.companyId !== paramValue) {
        throw new ForbiddenException("Bu şirket kaynağına erişim yetkiniz yok");
      }
    }

    return true;
  }
}
