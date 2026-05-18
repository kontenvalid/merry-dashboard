// List ALL available Composio tools
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function listTools() {
  const admin = await p.user.findUnique({ where: { email: 'kontenval.id@gmail.com' } });
  if (!admin) { console.log('ADMIN NOT FOUND'); return; }

  const composioKey = await p.apiKey.findFirst({ where: { userId: admin.id, service: 'composio' } });
  if (!composioKey) { console.log('NO KEY'); return; }

  const apiKey = Buffer.from(composioKey.apiKey, 'base64').toString('utf8');

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
        method: 'tools/list',
        params: {}
      })
    });

    const text = await response.text();
    const dataMatch = text.match(/data: (\{.*\})/);
    if (dataMatch) {
      const data = JSON.parse(dataMatch[1]);
      const tools = data.result?.tools || [];
      
      console.log('=== ALL AVAILABLE TOOLS ===\n');
      tools.forEach(t => console.log(' -', t.name, ':', t.description?.substring(0, 80)));
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  }

  await p.$disconnect();
}

listTools().catch(e => console.log('ERROR:', e.message));