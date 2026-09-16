import { prisma } from '../../utils/prisma.js';

class MetricsService {
  async processEvent(payload) {
    const { type, data } = payload;
    const messageId = data.email_id || data.message_id || data.headers?.['message-id'];
    
    if (!messageId) return;

    // We try to find if we sent this email
    const emailMessage = await prisma.emailMessage.findFirst({
      where: {
        OR: [
          { resendMessageId: messageId },
          { messageId: messageId }
        ]
      }
    });

    if (!emailMessage) {
      console.log(`Metrics: Received event ${type} but couldn't find matching email for ID ${messageId}`);
      return;
    }

    let newStatus = emailMessage.status;
    switch (type) {
      case 'email.delivered': newStatus = 'DELIVERED'; break;
      case 'email.bounced': newStatus = 'BOUNCED'; break;
      case 'email.opened': newStatus = 'OPENED'; break;
      case 'email.clicked': newStatus = 'CLICKED'; break;
      case 'email.complained': newStatus = 'COMPLAINED'; break;
    }

    if (newStatus !== emailMessage.status) {
      await prisma.emailMessage.update({
        where: { id: emailMessage.id },
        data: { status: newStatus }
      });
      console.log(`Metrics: Updated message ${emailMessage.id} status to ${newStatus}`);
    }

    // If it was part of a broadcast, update the recipient status as well
    const recipient = await prisma.broadcastRecipient.findFirst({
      where: {
        contact: { email: data.to ? data.to[0] : undefined }
        // Would normally match by specific broadcast metadata/headers, simplified here
      }
    });

    if (recipient) {
      const updateData = { status: newStatus };
      if (type === 'email.delivered') updateData.deliveredAt = new Date();
      if (type === 'email.bounced') updateData.bouncedAt = new Date();
      if (type === 'email.opened') updateData.openedAt = new Date();
      if (type === 'email.clicked') updateData.clickedAt = new Date();

      await prisma.broadcastRecipient.update({
        where: { id: recipient.id },
        data: updateData
      });
    }
  }

  async getOverview(clientId) {
    // In production, aggregate query using prisma
    const messages = await prisma.emailMessage.findMany({
      where: { 
        direction: 'OUTBOUND',
        thread: { clientId } 
      }
    });

    const total = messages.length;
    const delivered = messages.filter(m => ['DELIVERED', 'OPENED', 'CLICKED'].includes(m.status)).length;
    const opened = messages.filter(m => ['OPENED', 'CLICKED'].includes(m.status)).length;
    const bounced = messages.filter(m => m.status === 'BOUNCED').length;

    return {
      totalSent: total,
      delivered,
      opened,
      bounced,
      deliveryRate: total ? (delivered / total) * 100 : 0,
      openRate: total ? (opened / total) * 100 : 0
    };
  }
}

export default new MetricsService();
