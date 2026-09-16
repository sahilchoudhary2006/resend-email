import http from 'http';

const baseUrl = 'http://localhost:3000/api/v1';

async function fetchAPI(path, method = 'GET', body = null, headers = {}) {
  const url = new URL(`http://localhost:3000${path}`);
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
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
    if (body) {
      if (typeof body === 'string') {
        req.write(body);
      } else {
        req.write(JSON.stringify(body));
      }
    }
    req.end();
  });
}

async function runTests() {
  console.log('--- STARTING PLATFORM TESTS ---');
  
  // Create a simulated incoming webhook payload
  const webhookPayload = {
    type: 'email.received',
    data: {
      from: 'sahil830261@gmail.com', // Your registered email on Resend
      to: ['onboarding@resend.dev'], // Resend's allowed sandbox sending domain
      subject: 'Test inquiry',
      text: 'Hello, I have a question about pricing.',
      headers: {
        'message-id': `msg_test_${Date.now()}`
      }
    }
  };

  console.log('\n[1] Simulating Webhook: email.received');
  // Send to /webhooks/resend directly
  const whRes = await fetchAPI('/webhooks/resend', 'POST', JSON.stringify(webhookPayload));
  console.log(`Webhook response: ${whRes.status}`, whRes.data);

  // Wait a second for DB processing
  await new Promise(res => setTimeout(res, 2000));
  
  console.log('\n--- TESTS COMPLETED ---');
}

runTests().catch(console.error);
