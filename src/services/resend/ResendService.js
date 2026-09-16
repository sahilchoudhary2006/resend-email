import { Resend } from 'resend';
import { config } from '../../config/index.js';

class ResendService {
  constructor() {
    this.resend = new Resend(config.resendApiKey);
  }

  async sendEmail({ from, to, subject, html, headers, attachments }) {
    if (!this.resend.key) {
      console.warn('Resend API key missing, skipping email send.');
      return null;
    }
    
    try {
      const { data, error } = await this.resend.emails.send({
        from,
        to,
        subject,
        html,
        headers,
        attachments
      });

      if (error) {
        throw new Error(error.message);
      }
      return data;
    } catch (err) {
      console.error('✗ Resend error:', err);
      throw err;
    }
  }
}

export default new ResendService();
