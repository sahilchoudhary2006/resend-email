import { OpenAI } from 'openai';

export class OpenAIProvider {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateReply(context) {
    const messages = [
      { role: 'system', content: `You are a helpful customer support AI for ${context.client.displayName}. Reply helpfully to the following email thread. Be concise.` }
    ];

    for (const msg of context.history) {
      messages.push({
        role: msg.direction === 'INBOUND' ? 'user' : 'assistant',
        content: msg.text || msg.html || '(No Content)'
      });
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages
    });

    return response.choices[0].message.content;
  }
}
