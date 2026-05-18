// Test Composio MCP with correct headers
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  const admin = await p.user.findUnique({ where: { email: 'kontenval.id@gmail.com' } });
  if (!admin) { console.log('ADMIN NOT FOUND'); return; }

  const composioKey = await p.apiKey.findFirst({ where: { userId: admin.id, service: 'composio' } });
  if (!composioKey) { console.log('NO KEY'); return; }

  const apiKey = Buffer.from(composioKey.apiKey, 'base64').toString('utf8');
  console.log('Testing MCP with key:', apiKey.substring(0, 15) + '...');

  try {
    // Test tools/list with correct headers
    const response = await fetch('https://connect.composio.dev/mcp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-consumer-api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      })
    });

    console.log('Status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 800));

    // Check if tools are returned
    if (text.includes('INSTAGRAM') || text.includes('FACEBOOK')) {
      console.log('\n✅ Composio MCP works! Tools available.');
    } else if (text.includes('error')) {
      console.log('\n⚠️  Error in response');
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  }

  await p.$disconnect();
}

test().catch(e => console.log('ERROR:', e.message));