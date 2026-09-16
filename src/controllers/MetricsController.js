import MetricsService from '../services/metrics/MetricsService.js';

class MetricsController {
  async getOverview(req, res) {
    try {
      const { clientId } = req.query;
      if (!clientId) return res.status(400).json({ error: 'Missing clientId' });

      const overview = await MetricsService.getOverview(clientId);
      res.status(200).json(overview);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
}

export default new MetricsController();
