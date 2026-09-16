import ContactService from '../services/audience/ContactService.js';

class ContactController {
  async createContact(req, res) {
    try {
      const contact = await ContactService.createContact(req.body);
      res.status(201).json(contact);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async listContacts(req, res) {
    try {
      const { clientId } = req.query;
      if (!clientId) return res.status(400).json({ error: 'Missing clientId' });
      
      const contacts = await ContactService.listContacts(clientId);
      res.status(200).json(contacts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getContact(req, res) {
    try {
      const contact = await ContactService.getContact(req.params.id);
      res.status(200).json(contact);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async updateContact(req, res) {
    try {
      const contact = await ContactService.updateContact(req.params.id, req.body);
      res.status(200).json(contact);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async deleteContact(req, res) {
    try {
      const result = await ContactService.deleteContact(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default new ContactController();
