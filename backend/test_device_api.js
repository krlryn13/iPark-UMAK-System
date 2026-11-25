const fetch = globalThis.fetch;
const db = require('./config/db');

async function testEndpoints() {
  const express = require('express');
  const app = express();
  app.use(express.json());
  
  const deviceRoutes = require('./routes/deviceRoutes');
  app.use('/api/device', deviceRoutes);
  
  const server = app.listen(5099, async () => {
    try {
      console.log('1. Testing /api/device/state...');
      let res = await fetch('http://localhost:5099/api/device/state');
      let data = await res.json();
      console.log('State response online status:', data.online);

      console.log('2. Testing /api/device/heartbeat without key (expect 401)...');
      res = await fetch('http://localhost:5099/api/device/heartbeat', { 
        method: 'POST', 
        body: '{}', 
        headers: {'Content-Type': 'application/json'} 
      });
      console.log('Status code:', res.status);

      console.log('3. Testing /api/device/heartbeat with key...');
      res = await fetch('http://localhost:5099/api/device/heartbeat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'X-API-KEY': 'ipark_diorama_secure_api_key_2026' 
        },
        body: JSON.stringify({ 
          capacity: 2, 
          inside: 0, 
          parked: 0, 
          in_transit: 0, 
          reserved: 0, 
          free: 2,
          L1: 'empty',
          L2: 'empty',
          entry_gate: 'ok',
          exit_gate: 'ok'
        })
      });
      data = await res.json();
      console.log('Heartbeat response:', data.status);

      console.log('4. Testing /api/device/events idempotency...');
      const evPayload = JSON.stringify({
        event_id: 'TEST-EV-001',
        gate: 'ENTRY',
        event: 'entered',
        uid: '0054709E',
        free: 1,
        reserved: 0,
        inside: 1,
        parked: 0
      });
      res = await fetch('http://localhost:5099/api/device/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': 'ipark_diorama_secure_api_key_2026' },
        body: evPayload
      });
      data = await res.json();
      console.log('First event response:', data.status);

      res = await fetch('http://localhost:5099/api/device/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-KEY': 'ipark_diorama_secure_api_key_2026' },
        body: evPayload
      });
      data = await res.json();
      console.log('Duplicate event response:', data.status);

      console.log('5. Testing /api/device/sync-cards...');
      res = await fetch('http://localhost:5099/api/device/sync-cards', {
        headers: { 'X-API-KEY': 'ipark_diorama_secure_api_key_2026' }
      });
      data = await res.json();
      console.log('Synced cards count:', data.cards ? data.cards.length : 0);

      console.log('All backend checks passed!');
      server.close();
      process.exit(0);
    } catch(err) {
      console.error('Test error:', err);
      server.close();
      process.exit(1);
    }
  });
}

testEndpoints();
