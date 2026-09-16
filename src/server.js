import app from './app.js';
import { config } from './config/index.js';
import SimpleModeService from './services/email/SimpleModeService.js';

const PORT = config.port;

const isFullPipeline = config.resendApiKey && config.clientEmail;

const startServer = async () => {
  try {
    if (isFullPipeline) {
      console.log(`\nMode: 🔗 FULL PIPELINE — client domain → your inbox → reply as client\n`);
      app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Webhook endpoint: POST http://localhost:${PORT}/webhooks/resend`);
        console.log(`Health check: http://localhost:${PORT}/health`);
      });
    } else {
      console.log(`\nMode: 📨 SIMPLE — reply directly from your own Gmail\n`);
      await SimpleModeService.start();
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
