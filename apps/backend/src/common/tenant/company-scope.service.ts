import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";

@Injectable()
export class CompanyScopeService {
  constructor(private readonly prisma: PrismaService) {}

  requireCompanyId(companyId: string | null | undefined): string {
    if (!companyId) {
      throw new ForbiddenException("Bu işlem için bir şirkete üye olmanız gerekir");
    }
    return companyId;
  }

  assertSameCompany(
    userCompanyId: string | null | undefined,
    resourceCompanyId: string | null | undefined,
  ): void {
    const companyId = this.requireCompanyId(userCompanyId);
    if (companyId !== resourceCompanyId) {
      throw new ForbiddenException("Bu kaynağa erişim yetkiniz yok");
    }
  }

  async findUserInCompany(userId: string, companyId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, companyId },
    });

    if (!user) {
      throw new NotFoundException("Kullanıcı bu şirkette bulunamadı");
    }

    return user;
  }

  async findRoleInCompany(roleId: string, companyId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, companyId },
    });

    if (!role) {
      throw new NotFoundException("Rol bulunamadı");
    }

    return role;
  }

  async findProjectInCompany(projectId: string, companyId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId },
    });

    if (!project) {
      throw new NotFoundException("Proje bulunamadı");
    }

    return project;
  }
}
