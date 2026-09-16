import DomainService from '../services/domain/DomainService.js';

class DomainController {
  async addDomain(req, res) {
    try {
      const { clientId, name } = req.body;
      if (!clientId || !name) return res.status(400).json({ error: 'Missing clientId or name' });
      
      const result = await DomainService.addDomain({ clientId, name });
      res.status(201).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async verifyDomain(req, res) {
    try {
      const { id } = req.params;
      const result = await DomainService.verifyDomain(id);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async listDomains(req, res) {
    try {
      const { clientId } = req.query;
      if (!clientId) return res.status(400).json({ error: 'Missing clientId' });
      
      const result = await DomainService.listDomains(clientId);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async removeDomain(req, res) {
    try {
      const { id } = req.params;
      const result = await DomainService.removeDomain(id);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default new DomainController();
