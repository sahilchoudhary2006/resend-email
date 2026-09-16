import { prisma } from '../../utils/prisma.js';
import AIReplyService from '../ai/AIReplyService.js';
import ResendService from '../resend/ResendService.js';
import AutomationService from '../automation/AutomationService.js';
import { config } from '../../config/index.js';

class IncomingEmailService {
  async handleIncomingEmail(data) {
    const from = data.from;
    const to = Array.isArray(data.to) ? data.to[0] : data.to;
    const subject = data.subject || '(no subject)';
    const text = data.text || '';
    const html = data.html || '';
    const messageId = data.headers?.['message-id'] || data.id || `msg_${Date.now()}`;
    const threadIdHeader = data.headers?.['in-reply-to'] || null;

    let client = await prisma.client.findUnique({
      where: { email: to }
    });

    if (!client) {
      client = await prisma.client.create({
        data: {
          name: 'Auto Created Client',
          email: to,
          domain: to.split('@')[1] || 'unknown.com',
          displayName: config.clientDisplayName || 'Support'
        }
      });
      console.log(`Created default client for ${to}`);
    }

    if (from === client.email) {
      console.log('Skipping email from self to prevent loop.');
      return;
    }

    let thread;
    if (threadIdHeader) {
      const previousMessage = await prisma.emailMessage.findFirst({
        where: { messageId: threadIdHeader }
      });
      if (previousMessage) {
        thread = await prisma.emailThread.findUnique({
          where: { id: previousMessage.threadId }
        });
      }
    }

    if (!thread) {
      thread = await prisma.emailThread.create({
        data: {
          clientId: client.id,
          subject: subject,
          status: 'OPEN'
        }
      });
    }

    const incomingMessage = await prisma.emailMessage.create({
      data: {
        threadId: thread.id,
        direction: 'INBOUND',
        from,
        to,
        subject,
        text,
        html,
        messageId
      }
    });
    console.log(`Saved incoming message from ${from}`);

    // Forward to Ritesh
    if (config.riteshEmail && config.resendFromEmail) {
      try {
        const forwardSubject = `[A2A Inbound] ${subject}`;
        const forwardHtml = `
          <div style="font-family: sans-serif; padding: 20px; background-color: #f4f4f5; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #3f3f46;">A2A / AI Email System - Inbound Message</h3>
            <p><strong>Original Sender:</strong> <a href="mailto:${from}">${from}</a></p>
            <p><strong>Original Recipient:</strong> <a href="mailto:${to}">${to}</a></p>
            <p><strong>Subject:</strong> ${subject}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
          <div>
            ${html || `<pre style="white-space: pre-wrap;">${text}</pre>`}
          </div>
        `;
        
        await ResendService.sendEmail({
          from: config.resendFromEmail,
          to: [config.riteshEmail],
          subject: forwardSubject,
          html: forwardHtml,
          attachments: data.attachments || []
        });
        console.log(`Forwarded inbound email to ${config.riteshEmail}`);
      } catch (err) {
        console.error('Failed to forward email to Ritesh:', err);
      }
    }

    // Trigger automations (non-blocking)
    AutomationService.processTrigger('email.received', {
      client,
      thread,
      incomingMessage
    }).catch(err => console.error('Automation error:', err));

    // 4. Delegate to AIReplyService
    const replyContent = await AIReplyService.generateReply({
      client,
      thread,
      incomingMessage
    });

    // 5. Send reply via Resend
    if (replyContent) {
      const outboundSubject = subject.toLowerCase().startsWith('re:') ? subject : `Re: ${subject}`;
      
      const resendData = await ResendService.sendEmail({
        from: `${client.displayName} <${client.email}>`,
        to: [from],
        subject: outboundSubject,
        html: `<p>${replyContent}</p>`,
        headers: {
          'In-Reply-To': messageId,
          'References': messageId
        }
      });

      if (resendData) {
        // 6. Save Outbound message
        await prisma.emailMessage.create({
          data: {
            threadId: thread.id,
            direction: 'OUTBOUND',
            from: client.email,
            to: from,
            subject: outboundSubject,
            html: `<p>${replyContent}</p>`,
            resendMessageId: resendData.id,
            status: 'SENT'
          }
        });
        console.log(`Saved and sent outbound reply to ${from}`);
      }
    }
  }
}

export default new IncomingEmailService();
