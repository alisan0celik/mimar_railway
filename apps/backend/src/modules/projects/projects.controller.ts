import { Controller, Get, Post, Body, Patch, Param, Delete } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { UpdateTaskStatusDto } from "./dto/update-task-status.dto";
import { ContentDto } from "./dto/content.dto";
import { UpdateSectionDto } from "./dto/update-section.dto";
import { AddFileDto } from "./dto/add-file.dto";
import { AddTeamMemberDto } from "./dto/add-team-member.dto";
import { AddTeamMembersDto } from "./dto/add-team-members.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { PermissionsAny } from "../../common/decorators/permissions-any.decorator";
import { RequireCompany } from "../../common/tenant/require-company.decorator";
import { RequireApproved } from "../../common/tenant/require-approved.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { CompanyScopeService } from "../../common/tenant/company-scope.service";
import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";

@Controller("projects")
@RequireCompany()
@RequireApproved()
@ApiProtectedController("Projects")
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly companyScope: CompanyScopeService,
  ) {}

  private companyId(user: JwtPayload) {
    return this.companyScope.requireCompanyId(user.companyId);
  }

  @Post()
  @Permissions("project.create")
  @ApiOperation({ summary: "Yeni proje oluştur" })
  create(@CurrentUser() user: JwtPayload, @Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(this.companyId(user), user.sub, createProjectDto);
  }

  @Get()
  @Permissions("project.view")
  @ApiOperation({ summary: "Projeleri listele" })
  findAll(@CurrentUser() user: JwtPayload) {
    return this.projectsService.findAll(this.companyId(user));
  }

  @Get(":id")
  @Permissions("project.view")
  @ApiOperation({ summary: "Proje detayı" })
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.projectsService.findOne(this.companyId(user), id);
  }

  @Patch(":id")
  @Permissions("project.update")
  @ApiOperation({ summary: "Proje bilgilerini güncelle" })
  update(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(this.companyId(user), id, updateProjectDto);
  }

  @Patch(":id/sections/:sectionId")
  @Permissions("project.update")
  @ApiOperation({ summary: "Proje bölümünü güncelle" })
  updateSection(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("sectionId") sectionId: string,
    @Body() body: UpdateSectionDto,
  ) {
    return this.projectsService.updateSection(this.companyId(user), id, sectionId, body, user.sub);
  }

  @Delete(":id")
  @Permissions("project.update")
  @ApiOperation({ summary: "Projeyi sil" })
  remove(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.projectsService.remove(this.companyId(user), id);
  }

  @Get(":id/notes")
  @Permissions("project.view")
  @ApiOperation({ summary: "Proje notlarını listele" })
  getNotes(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.projectsService.getNotes(this.companyId(user), id);
  }

  @Post(":id/notes")
  @PermissionsAny("project.update", "project.view")
  @ApiOperation({ summary: "Projeye not ekle" })
  addNote(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: ContentDto) {
    return this.projectsService.addNote(this.companyId(user), id, user.sub, body.content);
  }

  @Delete(":id/notes/:noteId")
  @Permissions("project.update")
  @ApiOperation({ summary: "Proje notunu sil" })
  removeNote(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Param("noteId") noteId: string) {
    return this.projectsService.removeNote(this.companyId(user), id, noteId);
  }

  @Get(":id/messages")
  @Permissions("project.view")
  @ApiOperation({ summary: "Proje mesajlarını listele" })
  getMessages(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.projectsService.getMessages(this.companyId(user), id);
  }

  @Post(":id/messages")
  @Permissions("project.update")
  @ApiOperation({ summary: "Projeye mesaj ekle" })
  addMessage(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: ContentDto) {
    return this.projectsService.addMessage(this.companyId(user), id, user.sub, body.content);
  }

  @Delete(":id/messages/:messageId")
  @Permissions("project.update")
  @ApiOperation({ summary: "Proje mesajını sil" })
  removeMessage(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Param("messageId") messageId: string) {
    return this.projectsService.removeMessage(this.companyId(user), id, messageId);
  }

  @Get(":id/tasks")
  @Permissions("project.view")
  @ApiOperation({ summary: "Proje görevlerini listele" })
  getTasks(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.projectsService.getTasks(this.companyId(user), id);
  }

  @Post(":id/tasks")
  @PermissionsAny("project.task.manage", "project.update", "project.view")
  @ApiOperation({
    summary: "Projeye görev ekle",
    description:
      "Görev oluşturulduğunda proje ekibindeki tüm üyelere uygulama içi ve push bildirimi gönderilir (ekip boşsa bildirim gönderilmez).",
  })
  addTask(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: CreateTaskDto) {
    return this.projectsService.addTask(this.companyId(user), id, user.sub, body);
  }

  @Patch(":id/tasks/:taskId")
  @Permissions("project.task.manage")
  @ApiOperation({ summary: "Görevi güncelle" })
  updateTask(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Param("taskId") taskId: string, @Body() body: UpdateTaskDto) {
    return this.projectsService.updateTask(this.companyId(user), id, taskId, body);
  }

  @Patch(":id/tasks/:taskId/status")
  @PermissionsAny("project.task.manage", "project.complete", "project.view")
  @ApiOperation({ summary: "Görev durumunu güncelle (todo ↔ completed)" })
  updateTaskStatus(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("taskId") taskId: string,
    @Body() body: UpdateTaskStatusDto,
  ) {
    return this.projectsService.updateTaskStatus(this.companyId(user), id, taskId, body.status);
  }

  @Delete(":id/tasks/:taskId")
  @Permissions("project.task.manage")
  @ApiOperation({ summary: "Görevi sil" })
  removeTask(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Param("taskId") taskId: string) {
    return this.projectsService.removeTask(this.companyId(user), id, taskId);
  }

  @Get(":id/files")
  @Permissions("project.view")
  @ApiOperation({ summary: "Proje dosyalarını listele" })
  getFiles(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.projectsService.getFiles(this.companyId(user), id);
  }

  @Post(":id/files")
  @Permissions("project.update")
  @ApiOperation({ summary: "Projeye dosya ekle" })
  addFile(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: AddFileDto,
  ) {
    return this.projectsService.addFile(this.companyId(user), id, user.sub, body);
  }

  @Delete(":id/files/:fileId")
  @Permissions("project.update")
  @ApiOperation({ summary: "Proje dosyasını sil" })
  removeFile(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Param("fileId") fileId: string) {
    return this.projectsService.removeFile(this.companyId(user), id, fileId);
  }

  @Get(":id/team")
  @Permissions("project.view")
  @ApiOperation({ summary: "Proje ekibini listele" })
  getTeam(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.projectsService.getTeam(this.companyId(user), id);
  }

  @Get(":id/team/available")
  @Permissions("project.update")
  @ApiOperation({
    summary: "Projeye eklenebilecek ofis çalışanlarını listele",
    description: "Onaylı şirket üyelerinden halihazırda proje ekibinde olmayanları döner.",
  })
  getAvailableTeamMembers(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.projectsService.getAvailableTeamMembers(this.companyId(user), id);
  }

  @Post(":id/team")
  @Permissions("project.update")
  @ApiOperation({ summary: "Projeye ekip üyesi ekle" })
  addTeamMember(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: AddTeamMemberDto) {
    return this.projectsService.addTeamMember(this.companyId(user), id, body.userId, body.role);
  }

  @Post(":id/team/bulk")
  @Permissions("project.update")
  @ApiOperation({ summary: "Projeye birden fazla ekip üyesi ekle" })
  addTeamMembers(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Body() body: AddTeamMembersDto) {
    return this.projectsService.addTeamMembers(this.companyId(user), id, body.userIds);
  }

  @Delete(":id/team/:teamId")
  @Permissions("project.update")
  @ApiOperation({ summary: "Ekip üyesini projeden çıkar" })
  removeTeamMember(@CurrentUser() user: JwtPayload, @Param("id") id: string, @Param("teamId") teamId: string) {
    return this.projectsService.removeTeamMember(this.companyId(user), id, teamId);
  }
}
