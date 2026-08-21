import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ProjectsController, ProgressController],
  providers: [ProjectsService, ProgressService],
  exports: [ProjectsService]
})
export class ProjectsModule {}
