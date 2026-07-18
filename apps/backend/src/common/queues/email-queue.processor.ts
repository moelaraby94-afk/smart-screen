import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import {
  EmailService,
  type SendMailInput,
} from '../../domains/email/email.service';

@Processor('email', {
  concurrency: 3,
})
export class EmailQueueProcessor extends WorkerHost {
  private readonly log = new Logger(EmailQueueProcessor.name);

  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<SendMailInput>): Promise<void> {
    this.log.debug(`Processing email job ${job.id}: ${job.data.subject}`);
    await this.emailService.sendMail(job.data);
    this.log.debug(`Email job ${job.id} completed`);
  }

  onFailed(job: Job<SendMailInput>, err: Error): void {
    this.log.error(
      `Email job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
    );
  }
}
