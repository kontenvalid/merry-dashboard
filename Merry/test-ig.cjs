// Check Composio connections and test tool execution
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  const admin = await p.user.findUnique({ where: { email: 'kontenval.id@gmail.com' } });
  if (!admin) { console.log('ADMIN NOT FOUND'); return; }

  const composioKey = await p.apiKey.findFirst({ where: { userId: admin.id, service: 'composio' } });
  if (!composioKey) { console.log('NO KEY'); return; }

  const apiKey = Buffer.from(composioKey.apiKey, 'base64').toString('utf8');
  console.log('API Key:', apiKey.substring(0, 15) + '...');

  // Test executing a tool - try to list connections
  console.log('\n1. Checking Composio connections...');
  try {
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
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'COMPOSIO_MANAGE_CONNECTIONS',
          arguments: { toolkits: ['instagram', 'facebook'], action: 'list' }
        }
      })
    });

    const text = await response.text();
    console.log('Connections response:', text.substring(0, 1000));
  } catch (e) {
    console.log('ERROR:', e.message);
  }

  // Test Instagram tool
  console.log('\n2. Testing Instagram tool...');
  try {
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
        id: Date.now(),
        method: 'tools/call',
        params: {
          name: 'INSTAGRAM_GET_IG_USER_MEDIA',
          arguments: { ig_user_id: 'me', limit: 5 }
        }
      })
    });

    const text = await response.text();
    console.log('Instagram response:', text.substring(0, 1000));

    // Check if error
    if (text.includes('"error"')) {
      console.log('\n⚠️  Instagram error detected');
    } else if (text.includes('data') || text.includes('id')) {
      console.log('\n✅ Instagram data received');
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  }

  await p.$disconnect();
}

test().catch(e => console.log('ERROR:', e.message));