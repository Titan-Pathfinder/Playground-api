import { V1Client } from '@titanexchange/sdk-ts';

const WS_URL = 'wss://titan-solanam-2284.mainnet.rpcpool.com/806a2750-f53c-4263-b3fd-c4a0cbe54151/titan/api/v1/ws';
const JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjJkNmE5MmI1LTZiMDgtNDVlNC05NjNmLTZiYmM5YmVkNjczZSJ9.eyJpYXQiOjE3NjMzOTQxNTIsImV4cCI6MTc5NDkzMDE1MiwiYXVkIjoiYXBpLnRpdGFuLmFnIiwiaXNzIjoidGl0YW5fZGV2XzIiLCJzdWIiOiJkZXY6YWJoaW5hd19yYXRhbiJ9.Gj_Rso-b3QvZlXkJHDzHC1RlTN-M6NYriIfPx7T1wG4';

// Helper to serialize data with BigInt support
function stringify(data) {
  return JSON.stringify(data, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString() + 'n';
    }
    if (value instanceof Uint8Array) {
      return `<Uint8Array: ${value.length} bytes>`;
    }
    return value;
  }, 2);
}

async function testConnection() {
  console.log('🔌 Testing WebSocket connection...');
  console.log('📍 Endpoint:', WS_URL);
  console.log('');

  try {
    // Add JWT to URL
    const urlWithAuth = `${WS_URL}?auth=${encodeURIComponent(JWT)}`;

    console.log('⏳ Connecting...');
    const client = await V1Client.connect(urlWithAuth);
    console.log('✅ Connected successfully!');
    console.log('');

    // Get server info
    console.log('📊 Fetching server info...');
    const info = await client.getInfo();
    console.log('✅ Server info received:');
    console.log('');
    console.log(stringify(info));
    console.log('');

    // Close connection
    console.log('🔌 Closing connection...');
    await client.close();
    console.log('✅ Connection closed successfully');
    console.log('');
    console.log('🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
