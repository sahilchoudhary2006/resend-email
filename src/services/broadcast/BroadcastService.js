import { prisma } from '../../utils/prisma.js';
import TemplateService from '../template/TemplateService.js';
import ResendService from '../resend/ResendService.js';

class BroadcastService {
  async createBroadcast(data) {
    const { clientId, name, subject, templateId, sender, contactIds } = data;
    
    // 1. Create broadcast
    const broadcast = await prisma.broadcast.create({
      data: {
        clientId,
        name,
        subject,
        templateId,
        sender,
        status: 'DRAFT'
      }
    });

    // 2. Add recipients
    if (contactIds && contactIds.length > 0) {
      const recipientsData = contactIds.map(contactId => ({
        broadcastId: broadcast.id,
        contactId,
        status: 'PENDING'
      }));
      await prisma.broadcastRecipient.createMany({
        data: recipientsData
      });
    }

    return broadcast;
  }

  async getBroadcast(id) {
    const broadcast = await prisma.broadcast.findUnique({
      where: { id },
      include: { recipients: true }
    });
    if (!broadcast) throw new Error('Broadcast not found');
    return broadcast;
  }

  async listBroadcasts(clientId) {
    return await prisma.broadcast.findMany({ where: { clientId } });
  }

  async sendBroadcast(id) {
    const broadcast = await this.getBroadcast(id);
    if (broadcast.status !== 'DRAFT' && broadcast.status !== 'SCHEDULED') {
      throw new Error(`Cannot send broadcast with status ${broadcast.status}`);
    }

    await prisma.broadcast.update({
      where: { id },
      data: { status: 'SENDING' }
    });

    // Fire off async processing so we don't block the HTTP request
    this._processSending(broadcast).catch(err => {
      console.error(`Error processing broadcast ${id}:`, err);
    });

    return { success: true, message: 'Broadcast queued for sending' };
  }

  async _processSending(broadcast) {
    // In production, this should be handled by a message queue worker (like BullMQ or AWS SQS)
    const recipients = await prisma.broadcastRecipient.findMany({
      where: { broadcastId: broadcast.id, status: 'PENDING' },
      include: { contact: true }
    });

    for (const recipient of recipients) {
      try {
        const contact = recipient.contact;
        // Construct variables for the template
        const variables = {
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          email: contact.email,
          company: contact.company || ''
        };

        const rendered = await TemplateService.previewTemplate(broadcast.templateId, variables);
        
        // Use broadcast subject if provided, else template subject
        const subject = broadcast.subject || rendered.subject;

        const resendData = await ResendService.sendEmail({
          from: broadcast.sender,
          to: [contact.email],
          subject: subject,
          html: rendered.html,
          // Could add custom headers to track broadcast opens/clicks uniquely here
        });

        if (resendData) {
          await prisma.broadcastRecipient.update({
            where: { id: recipient.id },
            data: { status: 'SENT', sentAt: new Date() }
          });
        }
      } catch (err) {
        console.error(`Failed to send to contact ${recipient.contactId}:`, err);
        await prisma.broadcastRecipient.update({
          where: { id: recipient.id },
          data: { status: 'FAILED' }
        });
      }
    }

    await prisma.broadcast.update({
      where: { id: broadcast.id },
      data: { status: 'SENT', sentAt: new Date() }
    });
  }
}

export default new BroadcastService();
