export class MockProvider {
  async generateReply(context) {
    console.log('[MockProvider] Generating reply...');
    return "This is a mock AI response. In production, configure an LLM provider and the AI will analyze this thread to generate a response.";
  }
}
