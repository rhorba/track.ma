import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST'),
      port: config.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: config.get('SMTP_USER'),
        pass: config.get('SMTP_PASS'),
      },
    });
  }

  async sendAlert(to: string, subject: string, body: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"TrackMa Alerts" <${this.config.get('SMTP_USER')}>`,
        to,
        subject,
        html: body,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${err}`);
    }
  }

  async sendInvite(
    to: string,
    orgName: string,
    inviteUrl: string,
  ): Promise<void> {
    await this.sendAlert(
      to,
      `You've been invited to ${orgName} on TrackMa`,
      `<p>You've been invited to join <strong>${orgName}</strong> on TrackMa.</p>
       <p><a href="${inviteUrl}">Accept Invitation</a></p>`,
    );
  }
}
