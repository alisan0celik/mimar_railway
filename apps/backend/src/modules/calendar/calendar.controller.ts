import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiOperation, ApiQuery } from "@nestjs/swagger";
import { CalendarService } from "./calendar.service";
import { CreateCalendarEventDto } from "./dto/create-calendar-event.dto";
import { UpdateCalendarEventDto } from "./dto/update-calendar-event.dto";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequireCompany } from "../../common/tenant/require-company.decorator";
import { RequireApproved } from "../../common/tenant/require-approved.decorator";
import { JwtPayload } from "../../common/interfaces/jwt-payload.interface";
import { ApiProtectedController } from "../../common/decorators/api-docs.decorator";

@Controller("calendar")
@RequireCompany()
@RequireApproved()
@ApiProtectedController("Calendar")
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: "Aylık takvim etkinliklerini getir" })
  @ApiQuery({ name: "year", required: false, example: 2026 })
  @ApiQuery({ name: "month", required: false, example: 5, description: "0-11 arası (Ocak=0)" })
  async getEvents(
    @CurrentUser() user: JwtPayload,
    @Query("year") year: string,
    @Query("month") month: string,
  ) {
    const dYear = year ? parseInt(year, 10) : new Date().getFullYear();
    const dMonth = month ? parseInt(month, 10) : new Date().getMonth();

    return this.calendarService.getEventsForCompany(user.companyId!, dYear, dMonth);
  }

  @Post()
  @ApiOperation({ summary: "Yeni takvim etkinliği oluştur" })
  async createEvent(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.calendarService.createEvent(user.sub, user.companyId!, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Takvim etkinliğini güncelle" })
  async updateEvent(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    return this.calendarService.updateEvent(user.companyId!, id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Takvim etkinliğini sil" })
  async removeEvent(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.calendarService.removeEvent(user.companyId!, id);
  }
}
