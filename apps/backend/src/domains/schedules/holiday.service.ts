import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class HolidayService {
  constructor(private readonly prisma: PrismaService) {}

  async list(workspaceId: string) {
    return this.prisma.holiday.findMany({
      where: { workspaceId },
      orderBy: { date: 'asc' },
    });
  }

  async create(workspaceId: string, data: {
    name: string;
    date: Date;
    endDate?: Date;
    isRecurring?: boolean;
  }) {
    return this.prisma.holiday.create({
      data: {
        workspaceId,
        name: data.name,
        date: data.date,
        endDate: data.endDate,
        isRecurring: data.isRecurring ?? false,
      },
    });
  }

  async remove(workspaceId: string, id: string): Promise<void> {
    await this.prisma.holiday.deleteMany({ where: { id, workspaceId } });
  }

  async isHoliday(workspaceId: string, date: Date): Promise<boolean> {
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const holidays = await this.prisma.holiday.findMany({
      where: { workspaceId },
    });
    return holidays.some((h) => {
      const hDate = new Date(h.date.getFullYear(), h.date.getMonth(), h.date.getDate());
      if (h.isRecurring) {
        if (hDate.getMonth() === dateOnly.getMonth() && hDate.getDate() === dateOnly.getDate()) {
          return true;
        }
      } else {
        if (h.endDate) {
          const hEnd = new Date(h.endDate.getFullYear(), h.endDate.getMonth(), h.endDate.getDate());
          return dateOnly >= hDate && dateOnly <= hEnd;
        }
        return hDate.getTime() === dateOnly.getTime();
      }
      return false;
    });
  }
}
