import { prisma } from '../../utils/prisma.js';

class TemplateService {
  async createTemplate(data) {
    const { clientId, name, subject, html, text, variables } = data;
    return await prisma.template.create({
      data: {
        clientId,
        name,
        subject,
        html,
        text,
        variables: variables ? JSON.stringify(variables) : null
      }
    });
  }

  async getTemplate(id) {
    const template = await prisma.template.findUnique({ where: { id } });
    if (!template) throw new Error('Template not found');
    return template;
  }

  async listTemplates(clientId) {
    return await prisma.template.findMany({ where: { clientId } });
  }

  async updateTemplate(id, data) {
    const { name, subject, html, text, variables, status } = data;
    return await prisma.template.update({
      where: { id },
      data: {
        name,
        subject,
        html,
        text,
        variables: variables ? JSON.stringify(variables) : undefined,
        status
      }
    });
  }

  async deleteTemplate(id) {
    await prisma.template.delete({ where: { id } });
    return { success: true };
  }

  async previewTemplate(id, dataVars) {
    const template = await this.getTemplate(id);
    let html = template.html || '';
    let text = template.text || '';
    let subject = template.subject || '';

    // Basic interpolation {{var}}
    for (const [key, value] of Object.entries(dataVars)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      html = html.replace(regex, value);
      text = text.replace(regex, value);
      subject = subject.replace(regex, value);
    }

    return { subject, html, text };
  }
}

export default new TemplateService();
