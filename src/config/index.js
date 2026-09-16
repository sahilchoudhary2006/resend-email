import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  resendApiKey: process.env.RESEND_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  clientEmail: process.env.CLIENT_EMAIL,
  clientDisplayName: process.env.CLIENT_DISPLAY_NAME || 'Support',
  fixedReply: process.env.FIXED_REPLY || 'Hi, thanks for your email! We will get back to you soon.',
  webhookSecret: process.env.WEBHOOK_SECRET,
  resendFromEmail: process.env.RESEND_FROM_EMAIL,
  riteshEmail: process.env.RITESH_EMAIL,
  inboundEmail: process.env.INBOUND_EMAIL,
  simpleMode: {
    email: process.env.YOUR_EMAIL,
    appPassword: process.env.YOUR_APP_PASSWORD,
  }
};
