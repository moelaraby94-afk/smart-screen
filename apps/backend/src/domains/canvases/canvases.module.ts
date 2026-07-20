import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { CanvasesController } from './canvases.controller';
import { CanvasesService } from './canvases.service';

@Module({
  imports: [PrismaModule],
  controllers: [CanvasesController],
  providers: [CanvasesService],
  exports: [CanvasesService],
})
export class CanvasesModule {}
