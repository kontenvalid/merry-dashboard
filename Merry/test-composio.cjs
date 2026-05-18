// Test Composio API key and sync
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  console.log('=== TESTING COMPOSIO SYNC ===\n');

  const admin = await p.user.findUnique({ where: { email: 'kontenval.id@gmail.com' } });
  if (!admin) { console.log('ADMIN NOT FOUND'); return; }
  console.log('Admin:', admin.email);

  // Get API keys
  const keys = await p.apiKey.findMany({ where: { userId: admin.id, isActive: true } });
  console.log('\nAPI Keys:', keys.length);
  for (const k of keys) {
    // Decode
    const decoded = Buffer.from(k.apiKey, 'base64').toString('utf8');
    console.log(' -', k.service, ':', decoded.substring(0, 10) + '...');
  }

  // Find composio key
  const composioKey = keys.find(k => k.service === 'composio');
  if (!composioKey) { console.log('\n❌ No Composio key'); return; }

  const apiKey = Buffer.from(composioKey.apiKey, 'base64').toString('utf8');
  console.log('\n🔑 Testing Composio MCP...');
  console.log('Key:', apiKey);

  // Test MCP endpoint
  try {
    const response = await fetch('https://connect.composio.dev/mcp', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'x-consumer-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method: 'tools/list',
        params: {}
      })
    });

    console.log('\nResponse status:', response.status);
    const text = await response.text();
    console.log('Response:', text.substring(0, 500));
  } catch (e) {
    console.log('\n❌ MCP Error:', e.message);
  }

  await p.$disconnect();
}

test().catch(e => console.log('ERROR:', e.message));