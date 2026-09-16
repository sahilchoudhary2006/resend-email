import BroadcastService from '../services/broadcast/BroadcastService.js';

class BroadcastController {
  async createBroadcast(req, res) {
    try {
      const broadcast = await BroadcastService.createBroadcast(req.body);
      res.status(201).json(broadcast);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async listBroadcasts(req, res) {
    try {
      const { clientId } = req.query;
      if (!clientId) return res.status(400).json({ error: 'Missing clientId' });
      
      const broadcasts = await BroadcastService.listBroadcasts(clientId);
      res.status(200).json(broadcasts);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  async getBroadcast(req, res) {
    try {
      const broadcast = await BroadcastService.getBroadcast(req.params.id);
      res.status(200).json(broadcast);
    } catch (err) {
      res.status(404).json({ error: err.message });
    }
  }

  async sendBroadcast(req, res) {
    try {
      const result = await BroadcastService.sendBroadcast(req.params.id);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default new BroadcastController();
