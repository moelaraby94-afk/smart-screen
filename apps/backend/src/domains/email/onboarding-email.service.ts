import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigHelper } from '../../common/config/config.helper';
import { onboardingTipsEmail, welcomeEmail } from '../email/email-templates';

@Injectable()
export class OnboardingEmailService {
  private readonly logger = new Logger(OnboardingEmailService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly configHelper: ConfigHelper,
  ) {}

  async sendWelcome(
    userId: string,
    email: string,
    fullName: string,
  ): Promise<void> {
    if (!this.email.isConfigured()) {
      this.logger.warn(
        `[welcome] Email not configured; would send to ${email}`,
      );
      return;
    }
    const base = this.configHelper.getFrontendBaseUrl();
    const dashboardUrl = `${base}/en/overview`;
    const { subject, html, text } = welcomeEmail({ fullName, dashboardUrl });
    await this.email.enqueue({ to: email, subject, html, text });
  }

  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendOnboardingTips(): Promise<void> {
    if (!this.email.isConfigured()) return;

    const now = new Date();
    const days = [1, 3, 7];
    for (const day of days) {
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() - day);
      const startOfDay = new Date(
        targetDate.getFullYear(),
        targetDate.getMonth(),
        targetDate.getDate(),
      );
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const users = await this.prisma.user.findMany({
        where: {
          createdAt: { gte: startOfDay, lt: endOfDay },
          isActive: true,
          emailVerified: true,
        },
        select: { id: true, email: true, fullName: true },
      });

      for (const user of users) {
        const alreadySent = await this.prisma.notification.findFirst({
          where: {
            userId: user.id,
            type: `onboarding_day_${day}`,
          },
          select: { id: true },
        });
        if (alreadySent) continue;

        const base = this.configHelper.getFrontendBaseUrl();
        const dashboardUrl = `${base}/en/overview`;
        const { subject, html, text } = onboardingTipsEmail({
          fullName: user.fullName,
          day,
          dashboardUrl,
        });

        try {
          await this.email.enqueue({ to: user.email, subject, html, text });
          await this.prisma.notification.create({
            data: {
              userId: user.id,
              type: `onboarding_day_${day}`,
              title: subject,
              message: text,
              read: true,
            },
          });
          this.logger.log(`Sent onboarding day ${day} email to ${user.email}`);
        } catch (err) {
          this.logger.error(
            `Failed to send onboarding day ${day} to ${user.email}: ${err}`,
          );
        }
      }
    }
  }
}
