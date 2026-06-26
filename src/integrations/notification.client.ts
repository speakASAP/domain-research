import { Injectable } from '@nestjs/common';
import { DomainNotification } from '../domain-research/entities/domain-notification.entity';

@Injectable()
export class NotificationClient {
  async sendDomainNotification(notification: DomainNotification): Promise<void> {
    const baseUrl = process.env.NOTIFICATION_SERVICE_URL;
    if (!baseUrl) throw new Error('NOTIFICATION_SERVICE_URL is not configured');
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/notifications/send`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.NOTIFICATION_SERVICE_TOKEN ? { authorization: `Bearer ${process.env.NOTIFICATION_SERVICE_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        channel: notification.channel,
        recipient: notification.recipientRef,
        subject: 'Domain is available',
        message: 'A watched domain appears to be available. Open Domain Research to review and buy it with your preferred registrar.',
        templateData: {
          notificationId: notification.id,
          watchId: notification.watchId,
          type: notification.type,
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`notifications-microservice HTTP ${response.status}`);
    }
  }
}
