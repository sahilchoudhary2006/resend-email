import { prisma } from '../../utils/prisma.js';

class ContactService {
  async createContact(data) {
    const { clientId, email, firstName, lastName, company, metadata, subscribed } = data;
    return await prisma.contact.create({
      data: {
        clientId,
        email,
        firstName,
        lastName,
        company,
        metadata: metadata ? JSON.stringify(metadata) : null,
        subscribed: subscribed ?? true
      }
    });
  }

  async getContact(id) {
    const contact = await prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new Error('Contact not found');
    return contact;
  }

  async listContacts(clientId) {
    return await prisma.contact.findMany({ where: { clientId } });
  }

  async updateContact(id, data) {
    const { email, firstName, lastName, company, metadata, subscribed } = data;
    return await prisma.contact.update({
      where: { id },
      data: {
        email,
        firstName,
        lastName,
        company,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        subscribed
      }
    });
  }

  async deleteContact(id) {
    await prisma.contact.delete({ where: { id } });
    return { success: true };
  }
}

export default new ContactService();
