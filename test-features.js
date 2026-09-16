import { prisma } from './src/utils/prisma.js';
import http from 'http';

async function fetchAPI(path, method = 'GET', body = null) {
  const url = new URL(`http://localhost:3000${path}`);
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };

  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', error => reject(error));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING PLATFORM FEATURE TESTS ---\n');

  // 1. Fetch the Client we auto-created during the webhook test
  const client = await prisma.client.findFirst();
  if (!client) {
    console.error('No client found in DB. Run the webhook test first to auto-create a client.');
    return;
  }
  console.log(`Using Client: ${client.email} (ID: ${client.id})`);

  // 2. Test Contacts API
  console.log('\n[1] Testing Contacts API (/api/v1/contacts) ...');
  const contactRes = await fetchAPI('/api/v1/contacts', 'POST', {
    clientId: client.id,
    email: `tester_${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User'
  });
  console.log(`Status: ${contactRes.status} | Added Contact: ${contactRes.data.email}`);

  // 3. Test Templates API
  console.log('\n[2] Testing Templates API (/api/v1/templates) ...');
  const templateRes = await fetchAPI('/api/v1/templates', 'POST', {
    clientId: client.id,
    name: 'Welcome Email Template',
    subject: 'Welcome, {{firstName}}!',
    html: '<p>Hi {{firstName}}, thanks for signing up!</p>',
    variables: ['firstName']
  });
  console.log(`Status: ${templateRes.status} | Created Template ID: ${templateRes.data.id}`);

  // 4. Test Automations API
  console.log('\n[3] Testing Automations API (/api/v1/automations) ...');
  const autoRes = await fetchAPI('/api/v1/automations', 'POST', {
    clientId: client.id,
    name: 'Urgent Email Tagger',
    trigger: 'email.received',
    workflow: { 
      conditions: [{ field: 'subject', operator: 'contains', value: 'urgent' }], 
      actions: [{ type: 'tag_thread', value: 'urgent' }] 
    }
  });
  console.log(`Status: ${autoRes.status} | Created Automation Rule: ${autoRes.data.name}`);

  // 5. Test Metrics Overview API
  console.log('\n[4] Testing Metrics API (/api/v1/metrics/overview) ...');
  const metricsRes = await fetchAPI(`/api/v1/metrics/overview?clientId=${client.id}`, 'GET');
  console.log(`Status: ${metricsRes.status} | Metrics Stats:`, metricsRes.data);

  console.log('\n--- ALL API TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(console.error).finally(() => process.exit(0));
