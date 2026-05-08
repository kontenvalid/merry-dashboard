// Test script to check Composio API directly
const COMPOSIO_API_KEY = 'ck_81LPoF-vaCnWO8LTJ1nF'

async function testComposio() {
  console.log('Testing Composio Meta Ads API...')
  
  try {
    // Test getting ad accounts
    const response = await fetch('https://api.composio.io/v1/tools/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': COMPOSIO_API_KEY
      },
      body: JSON.stringify({
        toolName: 'METAADS_GET_AD_ACCOUNTS',
        input: {
          limit: 10,
          fields: 'id,account_id,name,currency,account_status'
        }
      })
    })

    console.log('Status:', response.status)
    const data = await response.text()
    console.log('Response:', data.substring(0, 500))
    
    const parsed = JSON.parse(data)
    console.log('Parsed:', JSON.stringify(parsed, null, 2).substring(0, 800))
  } catch (e) {
    console.error('Error:', e.message)
  }
}

testComposio()