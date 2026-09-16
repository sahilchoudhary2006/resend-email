import nodemailer from 'nodemailer';
import { ImapFlow } from 'imapflow';
import { config } from '../../config/index.js';

class SimpleModeService {
  constructor() {
    this.email = config.simpleMode.email;
    this.appPassword = config.simpleMode.appPassword;
    this.fixedReply = config.fixedReply;
    this.repliedIds = new Set();
  }

  async start() {
    if (!this.email || !this.appPassword) {
      console.warn('Missing YOUR_EMAIL or YOUR_APP_PASSWORD in config/env. Simple mode disabled.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: this.email, pass: this.appPassword }
    });

    this.imap = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: { user: this.email, pass: this.appPassword },
      logger: false
    });

    try {
      await this.imap.connect();
      console.log(`Connected to Gmail as ${this.email}`);
      console.log(`Watching inbox... fixed reply: "${this.fixedReply}"\n`);
      
      let mailbox = await this.imap.mailboxOpen('INBOX');
      
      this.imap.on('exists', async () => {
        for await (const msg of this.imap.fetch({ seen: false }, { envelope: true, uid: true })) {
          const from = msg.envelope.from?.[0]?.address;
          const subject = msg.envelope.subject || '(no subject)';
          const messageId = msg.envelope.messageId;

          if (!from || this.repliedIds.has(messageId)) continue;
          if (from === this.email) continue;

          console.log(`New email from: ${from} | Subject: ${subject}`);
          this.repliedIds.add(messageId);

          try {
            await this.transporter.sendMail({
              from: this.email,
              to: from,
              subject: `Re: ${subject}`,
              inReplyTo: messageId,
              references: messageId,
              html: `<p>${this.fixedReply}</p>`
            });
            console.log(`✓ Reply sent to ${from}\n`);
            
            // Mark as seen only after successful send
            await this.imap.messageFlagsAdd({ uid: msg.uid }, ['\\Seen'], { uid: true });
          } catch (err) {
            console.error(`✗ Failed to process msg:`, err.message);
          }
        }
      });

      this.imap.on('close', () => {
        console.log('IMAP connection closed. Reconnecting in 5s...');
        setTimeout(() => this.start(), 5000);
      });

      this.imap.on('error', (err) => {
        console.error('IMAP error:', err);
      });

      await this.imap.idle();
    } catch (err) {
      console.error('Simple mode error:', err.message);
    }
  }
}

export default new SimpleModeService();
