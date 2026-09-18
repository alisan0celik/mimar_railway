import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { WorkItemsController } from './work-items.controller';
import { FavouriteTasksController } from './favourite-tasks.controller';
import { FavouriteTasksService } from './favourite-tasks.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ProjectsController, ProgressController, WorkItemsController, FavouriteTasksController],
  providers: [ProjectsService, ProgressService, FavouriteTasksService],
  exports: [ProjectsService]
})
export class ProjectsModule {}
