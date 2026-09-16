import ResendService from '../resend/ResendService.js';
import { prisma } from '../../utils/prisma.js';

class DomainService {
  async addDomain({ clientId, name }) {
    if (!ResendService.resend.key) {
      throw new Error('Resend API key missing');
    }

    // 1. Create in Resend
    const { data: resendDomain, error } = await ResendService.resend.domains.create({ name });
    if (error) throw new Error(error.message);

    // 2. Save in our DB
    const domain = await prisma.domain.create({
      data: {
        clientId,
        name: resendDomain.name,
        status: resendDomain.status
      }
    });

    return { domain, resendData: resendDomain };
  }

  async verifyDomain(id) {
    const domain = await prisma.domain.findUnique({ where: { id } });
    if (!domain) throw new Error('Domain not found');

    // Currently Resend verifies by ID, but we only stored name.
    // In a real implementation we'd store Resend's Domain ID in the DB.
    // For this demonstration, we'll assume we fetch the ID from Resend list
    const { data: domains } = await ResendService.resend.domains.list();
    const rd = domains.data.find(d => d.name === domain.name);
    
    if (rd) {
      const { data, error } = await ResendService.resend.domains.verify(rd.id);
      if (error) throw new Error(error.message);
      
      return await prisma.domain.update({
        where: { id },
        data: { status: 'PENDING_VERIFICATION' }
      });
    }
    throw new Error('Domain not found in Resend');
  }

  async listDomains(clientId) {
    return await prisma.domain.findMany({ where: { clientId } });
  }

  async removeDomain(id) {
    const domain = await prisma.domain.findUnique({ where: { id } });
    if (!domain) throw new Error('Domain not found');

    const { data: domains } = await ResendService.resend.domains.list();
    const rd = domains.data.find(d => d.name === domain.name);
    
    if (rd) {
      await ResendService.resend.domains.remove(rd.id);
    }
    
    await prisma.domain.delete({ where: { id } });
    return { success: true };
  }
}

export default new DomainService();
