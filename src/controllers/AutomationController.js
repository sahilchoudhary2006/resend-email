import AutomationService from '../services/automation/AutomationService.js';

class AutomationController {
  async createAutomation(req, res) {
    try {
      const auto = await AutomationService.createAutomation(req.body);
      res.status(201).json(auto);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async listAutomations(req, res) {
    try {
      const { clientId } = req.query;
      if (!clientId) return res.status(400).json({ error: 'Missing clientId' });
      
      const autos = await AutomationService.listAutomations(clientId);
      res.status(200).json(autos);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getAutomation(req, res) {
    try {
      const auto = await AutomationService.getAutomation(req.params.id);
      res.status(200).json(auto);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async updateAutomation(req, res) {
    try {
      const auto = await AutomationService.updateAutomation(req.params.id, req.body);
      res.status(200).json(auto);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteAutomation(req, res) {
    try {
      const result = await AutomationService.deleteAutomation(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default new AutomationController();
