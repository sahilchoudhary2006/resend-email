import { config } from '../../config/index.js';
import { prisma } from '../../utils/prisma.js';
import { MockProvider } from './providers/MockProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';

class AIReplyService {
  constructor() {
    if (config.openaiApiKey) {
      this.provider = new OpenAIProvider(config.openaiApiKey);
      console.log('[AIReplyService] Initialized with OpenAIProvider');
    } else {
      this.provider = new MockProvider();
      console.log('[AIReplyService] Initialized with MockProvider');
    }
  }

  async generateReply({ client, thread, incomingMessage }) {
    console.log(`[AIReplyService] Generating reply for thread ${thread.id}`);
    
    // Fetch full thread history
    const history = await prisma.emailMessage.findMany({
      where: { threadId: thread.id },
      orderBy: { createdAt: 'asc' }
    });

    const context = {
      client,
      incomingMessage,
      history
    };

    try {
      const replyContent = await this.provider.generateReply(context);
      return replyContent;
    } catch (err) {
      console.error('[AIReplyService] Error generating reply:', err);
      return config.fixedReply || "We have received your message and will get back to you shortly.";
    }
  }
}

export default new AIReplyService();
