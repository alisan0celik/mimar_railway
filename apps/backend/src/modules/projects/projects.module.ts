import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { WorkItemsController } from './work-items.controller';
import { FavouriteTasksController } from './favourite-tasks.controller';
import { FavouriteTasksService } from './favourite-tasks.service';
import { FieldReportsController } from './field-reports.controller';
import { FieldReportsService } from './field-reports.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [
    ProjectsController,
    ProgressController,
    WorkItemsController,
    FavouriteTasksController,
    FieldReportsController,
  ],
  providers: [ProjectsService, ProgressService, FavouriteTasksService, FieldReportsService],
  exports: [ProjectsService]
})
export class ProjectsModule {}
