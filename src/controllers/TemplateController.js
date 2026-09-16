import TemplateService from '../services/template/TemplateService.js';

class TemplateController {
  async createTemplate(req, res) {
    try {
      const template = await TemplateService.createTemplate(req.body);
      res.status(201).json(template);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async listTemplates(req, res) {
    try {
      const { clientId } = req.query;
      if (!clientId) return res.status(400).json({ error: 'Missing clientId' });
      
      const templates = await TemplateService.listTemplates(clientId);
      res.status(200).json(templates);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getTemplate(req, res) {
    try {
      const template = await TemplateService.getTemplate(req.params.id);
      res.status(200).json(template);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async updateTemplate(req, res) {
    try {
      const template = await TemplateService.updateTemplate(req.params.id, req.body);
      res.status(200).json(template);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteTemplate(req, res) {
    try {
      const result = await TemplateService.deleteTemplate(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async previewTemplate(req, res) {
    try {
      const result = await TemplateService.previewTemplate(req.params.id, req.body.variables || {});
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default new TemplateController();
