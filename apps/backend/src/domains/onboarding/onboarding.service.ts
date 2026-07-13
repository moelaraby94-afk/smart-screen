import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

const ALL_STEPS = [
  'create_screen',
  'upload_media',
  'create_playlist',
  'schedule_content',
  'invite_team',
] as const;

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(workspaceId: string) {
    let progress = await this.prisma.onboardingProgress.findUnique({
      where: { workspaceId },
    });

    if (!progress) {
      progress = await this.prisma.onboardingProgress.create({
        data: { workspaceId },
      });
    }

    const completedSteps: string[] = JSON.parse(progress.completedSteps);
    const totalSteps = ALL_STEPS.length;
    const doneCount = completedSteps.length;
    const percentage = Math.round((doneCount / totalSteps) * 100);
    const isComplete = doneCount === totalSteps;

    return {
      completedSteps,
      dismissed: progress.dismissed,
      completedAt: progress.completedAt?.toISOString() ?? null,
      totalSteps,
      doneCount,
      percentage,
      isComplete,
      remainingSteps: ALL_STEPS.filter((s) => !completedSteps.includes(s)),
    };
  }

  async completeStep(workspaceId: string, step: string) {
    if (!ALL_STEPS.includes(step as (typeof ALL_STEPS)[number])) {
      throw new NotFoundException('Unknown onboarding step');
    }

    let progress = await this.prisma.onboardingProgress.findUnique({
      where: { workspaceId },
    });

    if (!progress) {
      progress = await this.prisma.onboardingProgress.create({
        data: { workspaceId },
      });
    }

    const completed: string[] = JSON.parse(progress.completedSteps);
    if (!completed.includes(step)) {
      completed.push(step);
    }

    const allDone = completed.length === ALL_STEPS.length;

    const updated = await this.prisma.onboardingProgress.update({
      where: { workspaceId },
      data: {
        completedSteps: JSON.stringify(completed),
        completedAt: allDone && !progress.completedAt ? new Date() : progress.completedAt,
      },
    });

    return {
      completedSteps: completed,
      dismissed: updated.dismissed,
      completedAt: updated.completedAt?.toISOString() ?? null,
      totalSteps: ALL_STEPS.length,
      doneCount: completed.length,
      percentage: Math.round((completed.length / ALL_STEPS.length) * 100),
      isComplete: allDone,
      remainingSteps: ALL_STEPS.filter((s) => !completed.includes(s)),
    };
  }

  async dismiss(workspaceId: string) {
    let progress = await this.prisma.onboardingProgress.findUnique({
      where: { workspaceId },
    });

    if (!progress) {
      progress = await this.prisma.onboardingProgress.create({
        data: { workspaceId, dismissed: true },
      });
      return { dismissed: true };
    }

    await this.prisma.onboardingProgress.update({
      where: { workspaceId },
      data: { dismissed: true },
    });

    return { dismissed: true };
  }

  async reset(workspaceId: string) {
    await this.prisma.onboardingProgress.upsert({
      where: { workspaceId },
      create: { workspaceId },
      update: {
        completedSteps: '[]',
        dismissed: false,
        completedAt: null,
      },
    });

    return this.getProgress(workspaceId);
  }
}
