import { prisma } from '../../utils/prisma.js';

class AutomationService {
  async createAutomation(data) {
    const { clientId, name, status, trigger, workflow } = data;
    return await prisma.automation.create({
      data: {
        clientId,
        name,
        status: status || 'ACTIVE',
        trigger,
        workflow: JSON.stringify(workflow)
      }
    });
  }

  async listAutomations(clientId) {
    return await prisma.automation.findMany({ where: { clientId } });
  }

  async getAutomation(id) {
    const auto = await prisma.automation.findUnique({ where: { id } });
    if (!auto) throw new Error('Automation not found');
    return auto;
  }

  async updateAutomation(id, data) {
    const { name, status, trigger, workflow } = data;
    return await prisma.automation.update({
      where: { id },
      data: {
        name,
        status,
        trigger,
        workflow: workflow ? JSON.stringify(workflow) : undefined
      }
    });
  }

  async deleteAutomation(id) {
    await prisma.automation.delete({ where: { id } });
    return { success: true };
  }

  async processTrigger(triggerType, payload) {
    // Basic Rule Engine execution
    // Find all active automations matching the trigger for the client
    const clientId = payload.client?.id;
    if (!clientId) return;

    const automations = await prisma.automation.findMany({
      where: {
        clientId,
        trigger: triggerType,
        status: 'ACTIVE'
      }
    });

    for (const auto of automations) {
      try {
        const workflow = JSON.parse(auto.workflow);
        await this._executeWorkflow(workflow, payload);
      } catch (err) {
        console.error(`Error executing automation ${auto.id}:`, err);
      }
    }
  }

  async _executeWorkflow(workflow, payload) {
    // Simplistic rule engine
    // workflow = { conditions: [...], actions: [...] }
    
    // 1. Evaluate conditions
    let conditionsMet = true;
    if (workflow.conditions && Array.isArray(workflow.conditions)) {
      for (const cond of workflow.conditions) {
        // e.g. { field: "subject", operator: "contains", value: "urgent" }
        const fieldValue = payload[cond.field]?.toLowerCase() || '';
        if (cond.operator === 'contains') {
          if (!fieldValue.includes(cond.value.toLowerCase())) {
            conditionsMet = false;
            break;
          }
        }
      }
    }

    if (!conditionsMet) return;

    // 2. Execute actions
    if (workflow.actions && Array.isArray(workflow.actions)) {
      for (const action of workflow.actions) {
        if (action.type === 'create_contact') {
          // Add to CRM logic
          await prisma.contact.create({
            data: {
              clientId: payload.client.id,
              email: payload.incomingMessage.from,
              metadata: JSON.stringify({ source: 'automation' })
            }
          });
          console.log(`Automation: Created contact ${payload.incomingMessage.from}`);
        } else if (action.type === 'tag_thread') {
          // Future: add tagging logic
          console.log(`Automation: Tagged thread ${payload.thread.id} with ${action.value}`);
        }
      }
    }
  }
}

export default new AutomationService();
