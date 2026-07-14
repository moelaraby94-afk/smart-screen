import { Injectable, Logger } from '@nestjs/common';
import { ConfigHelper } from '../../common/config/config.helper';
import { EmailService } from './email.service';
import { subscriptionReminderEmail } from './email-templates';

@Injectable()
export class SubscriptionEmailService {
  private readonly log = new Logger(SubscriptionEmailService.name);

  constructor(
    private readonly email: EmailService,
    private readonly configHelper: ConfigHelper,
  ) {}

  async sendRenewalReminder(toEmail: string, fullName: string): Promise<void> {
    const base = this.configHelper.getFrontendBaseUrl();
    const dashboardUrl = `${base}/en/overview`;
    const { subject, html, text } = subscriptionReminderEmail({
      fullName,
      dashboardUrl,
    });
    if (!this.email.isConfigured()) {
      this.log.warn(
        `[subscription reminder] Email not configured; would send to ${toEmail}`,
      );
      return;
    }
    await this.email.sendMail({ to: toEmail, subject, html, text });
  }
}
