// List all available Composio tools
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function listTools() {
  const admin = await p.user.findUnique({ where: { email: 'kontenval.id@gmail.com' } });
  if (!admin) { console.log('ADMIN NOT FOUND'); return; }

  const composioKey = await p.apiKey.findFirst({ where: { userId: admin.id, service: 'composio' } });
  if (!composioKey) { console.log('NO KEY'); return; }

  const apiKey = Buffer.from(composioKey.apiKey, 'base64').toString('utf8');
  console.log('API Key:', apiKey.substring(0, 15) + '...\n');

  // Get all tools
  console.log('Fetching available tools...\n');
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
    
    // Parse JSON from SSE
    const dataMatch = text.match(/data: (\{.*\})/);
    if (dataMatch) {
      const data = JSON.parse(dataMatch[1]);
      const tools = data.result?.tools || [];
      
      console.log('Total tools:', tools.length, '\n');
      
      // Filter Instagram and Facebook tools
      const igTools = tools.filter(t => t.name.includes('INSTAGRAM') || t.name.includes('instagram'));
      const fbTools = tools.filter(t => t.name.includes('FACEBOOK') || t.name.includes('facebook'));
      const ytTools = tools.filter(t => t.name.includes('YOUTUBE') || t.name.includes('youtube'));
      const metaTools = tools.filter(t => t.name.includes('META') || t.name.includes('meta'));
      const gdriveTools = tools.filter(t => t.name.includes('GOOGLE') || t.name.includes('google'));
      
      console.log('=== INSTAGRAM TOOLS ===');
      igTools.forEach(t => console.log(' -', t.name));
      
      console.log('\n=== FACEBOOK TOOLS ===');
      fbTools.forEach(t => console.log(' -', t.name));
      
      console.log('\n=== YOUTUBE TOOLS ===');
      ytTools.forEach(t => console.log(' -', t.name));
      
      console.log('\n=== META TOOLS ===');
      metaTools.forEach(t => console.log(' -', t.name));
      
      console.log('\n=== GOOGLE TOOLS ===');
      gdriveTools.forEach(t => console.log(' -', t.name));
    }
  } catch (e) {
    console.log('ERROR:', e.message);
  }

  await p.$disconnect();
}

listTools().catch(e => console.log('ERROR:', e.message));