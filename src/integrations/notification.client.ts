import { Injectable } from '@nestjs/common';
import { DomainNotification } from '../domain-research/entities/domain-notification.entity';

@Injectable()
export class NotificationClient {
  async sendDomainNotification(notification: DomainNotification): Promise<void> {
    const baseUrl = process.env.NOTIFICATION_SERVICE_URL;
    if (!baseUrl) throw new Error('NOTIFICATION_SERVICE_URL is not configured');
    const message = notificationMessage(notification);
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/notifications/send`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.NOTIFICATION_SERVICE_TOKEN ? { authorization: `Bearer ${process.env.NOTIFICATION_SERVICE_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        channel: notification.channel,
        recipient: notification.recipientRef,
        subject: message.subject,
        message: message.body,
        templateData: {
          notificationId: notification.id,
          watchId: notification.watchId,
          type: notification.type,
          ...(notification.payload || {}),
        },
      }),
    });
    if (!response.ok) {
      throw new Error(`notifications-microservice HTTP ${response.status}`);
    }
  }
}

function notificationMessage(notification: DomainNotification): { subject: string; body: string } {
  const payload = notification.payload || {};
  const fqdn = String(payload.fqdn || 'A watched domain');
  const dropAt = payload.dropCandidateAt ? ` Estimated drop time: ${payload.dropCandidateAt}.` : '';

  switch (notification.type) {
    case 'drop_tracking_prompt':
      return {
        subject: `${fqdn} may drop in about one week`,
        body: `${fqdn} is approaching the end of its estimated post-expiration protection window.${dropAt} Domain Research will keep checking unless you mark this watch as not needed.`,
      };
    case 'drop_24h_warning':
      return {
        subject: `${fqdn} may become available in about 24 hours`,
        body: `${fqdn} is inside the final estimated day before release.${dropAt} Domain Research will recheck hourly and notify you if RDAP shows it is available.`,
      };
    case 'drop_1h_warning':
      return {
        subject: `${fqdn} may become available in about one hour`,
        body: `${fqdn} is inside the final estimated hour before release.${dropAt} Prepare your registrar flow if you still want this domain.`,
      };
    case 'domain_renewed':
      return {
        subject: `${fqdn} appears renewed`,
        body: `${fqdn} no longer looks close to dropping. Domain Research updated the watch schedule from the latest RDAP evidence.`,
      };
    case 'check_failed':
      return {
        subject: `${fqdn} check failed`,
        body: `Domain Research could not verify ${fqdn}. It will retry according to the watch schedule.`,
      };
    case 'domain_available':
    default:
      return {
        subject: `${fqdn} is available`,
        body: `${fqdn} appears to be available based on the latest scheduled provider check. Open your preferred registrar now if you want to buy it.`,
      };
  }
}
