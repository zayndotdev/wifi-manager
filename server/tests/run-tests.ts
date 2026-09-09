import http from 'http';
import { createApp } from '../src/app.js';
import { connectDatabase } from '../src/config/database.js';

async function runAllTests() {
  console.log('\n======================================================');
  console.log('    WI-FI SENTINEL — 100% REAL SYSTEM TEST SUITE      ');
  console.log('======================================================\n');

  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<boolean | string>) {
    const start = Date.now();
    try {
      const res = await fn();
      const elapsed = Date.now() - start;
      if (res === true) {
        console.log(`✅ ${name} (${elapsed}ms)`);
        passed++;
      } else {
        console.error(`❌ ${name} — FAILED: ${res} (${elapsed}ms)`);
        failed++;
      }
    } catch (err: any) {
      console.error(`❌ ${name} — EXCEPTION: ${err.message}`);
      failed++;
    }
  }

  // TST-001: Health Check
  await test('TST-001: Health Check Endpoint', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();
    return res.status === 200 && data.status === 'ok';
  });

  // TST-002: Real Network Scanner Endpoint
  let targetDeviceId = '';
  await test('TST-002: Real Wi-Fi Subnet Scanner (/api/devices/scan)', async () => {
    const res = await fetch(`${baseUrl}/api/devices/scan`, { method: 'POST' });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data.devices) && data.devices.length > 0) {
      targetDeviceId = data.devices[0].id;
      return true;
    }
    return `Expected 200 with devices array, got ${res.status}`;
  });

  // TST-003: List Real Connected Devices
  await test('TST-003: List Real Connected Devices (/api/devices)', async () => {
    const res = await fetch(`${baseUrl}/api/devices`);
    const data = await res.json();
    return res.status === 200 && Array.isArray(data) && data.length > 0;
  });

  // TST-004: System Gateway Status
  await test('TST-004: System Gateway Status Telemetry (/api/system/status)', async () => {
    const res = await fetch(`${baseUrl}/api/system/status`);
    const data = await res.json();
    return res.status === 200 && data.status === 'online';
  });

  // TST-005: Fetch Real Single Device Telemetry
  await test(`TST-005: Fetch Real Single Device (${targetDeviceId})`, async () => {
    const res = await fetch(`${baseUrl}/api/devices/${targetDeviceId}`);
    const data = await res.json();
    return res.status === 200 && data.id === targetDeviceId;
  });

  // TST-006: Update Device Nickname
  await test(`TST-006: Update Real Device Nickname`, async () => {
    const res = await fetch(`${baseUrl}/api/devices/${targetDeviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: 'Verified Physical Hardware' }),
    });
    const data = await res.json();
    return res.status === 200 && data.nickname === 'Verified Physical Hardware';
  });

  // TST-007: Validation Error on Empty Nickname
  await test('TST-007: Nickname Validation (Empty String -> 422)', async () => {
    const res = await fetch(`${baseUrl}/api/devices/${targetDeviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname: '   ' }),
    });
    return res.status === 422;
  });

  // TST-008: 1-Click Internet Pause
  await test('TST-008: 1-Click Internet Pause on Real Device', async () => {
    const res = await fetch(`${baseUrl}/api/devices/${targetDeviceId}/pause`, { method: 'POST' });
    const data = await res.json();
    return res.status === 200 && data.status === 'paused';
  });

  // TST-009: 1-Click Internet Resume
  await test('TST-009: 1-Click Internet Resume on Real Device', async () => {
    const res = await fetch(`${baseUrl}/api/devices/${targetDeviceId}/resume`, { method: 'POST' });
    const data = await res.json();
    return res.status === 200 && data.status === 'active';
  });

  // TST-010: Apply Bandwidth Throttle
  await test('TST-010: Apply Bandwidth Throttle to Real Device', async () => {
    const res = await fetch(`${baseUrl}/api/devices/${targetDeviceId}/throttle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ downloadLimitKbps: 5000, uploadLimitKbps: 1000 }),
    });
    const data = await res.json();
    return res.status === 200 && data.isThrottled === true;
  });

  // TST-011: Remove Bandwidth Throttle
  await test('TST-011: Remove Bandwidth Throttle', async () => {
    const res = await fetch(`${baseUrl}/api/devices/${targetDeviceId}/throttle`, { method: 'DELETE' });
    const data = await res.json();
    return res.status === 200 && data.isThrottled === false;
  });

  // TST-012: Query Domains
  await test('TST-012: Query Domains (/api/domains/recent)', async () => {
    const res = await fetch(`${baseUrl}/api/domains/recent`);
    const data = await res.json();
    return res.status === 200 && typeof data.total === 'number';
  });

  // TST-013: Block Domain
  await test('TST-013: Block Target Domain', async () => {
    const res = await fetch(`${baseUrl}/api/domains/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'malicious-tracker.com' }),
    });
    const data = await res.json();
    return res.status === 201 && data.status === 'blocked';
  });

  // TST-014: Unblock Domain
  await test('TST-014: Unblock Target Domain', async () => {
    const res = await fetch(`${baseUrl}/api/domains/block`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'malicious-tracker.com' }),
    });
    const data = await res.json();
    return res.status === 200 && data.status === 'allowed';
  });

  // TST-015: Create Bedtime Schedule
  let createdSchedId = '';
  await test('TST-015: Create Bedtime Curfew Schedule', async () => {
    const res = await fetch(`${baseUrl}/api/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Real Bedtime Curfew',
        daysOfWeek: [1, 2, 3, 4, 5],
        startTime: '22:00',
        endTime: '06:00',
        deviceIds: [targetDeviceId],
        action: 'pause_wan',
        enabled: true,
      }),
    });
    const data = await res.json();
    if (res.status === 201 && data.id) {
      createdSchedId = data.id;
      return true;
    }
    return `Expected 201, got ${res.status}`;
  });

  // TST-016: Toggle Bedtime Schedule
  await test('TST-016: Toggle Bedtime Curfew Schedule', async () => {
    const res = await fetch(`${baseUrl}/api/schedules/${createdSchedId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: false }),
    });
    const data = await res.json();
    return res.status === 200 && data.enabled === false;
  });

  // TST-017: Global Emergency Pause All
  await test('TST-017: Global Emergency Pause All', async () => {
    const res = await fetch(`${baseUrl}/api/network/pause-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ excludeWhitelisted: true }),
    });
    const data = await res.json();
    return res.status === 200 && data.action === 'pause_all';
  });

  // TST-018: Global Resume All
  await test('TST-018: Global Resume All', async () => {
    const res = await fetch(`${baseUrl}/api/network/resume-all`, { method: 'POST' });
    const data = await res.json();
    return res.status === 200 && data.action === 'resume_all';
  });

  // TST-019: Kick Device
  await test('TST-019: Force Disconnect / Kick Device Off Wi-Fi', async () => {
    const res = await fetch(`${baseUrl}/api/devices/${targetDeviceId}/kick`, { method: 'POST' });
    const data = await res.json();
    return res.status === 200 && data.action === 'deauthenticated';
  });

  // TST-020: Swagger UI Endpoint
  await test('TST-020: Interactive Swagger UI Documentation (/api-docs)', async () => {
    const res = await fetch(`${baseUrl}/api-docs/`);
    const text = await res.text();
    return (res.status === 200 || res.status === 301) && text.includes('swagger-ui');
  });

  // TST-021: OpenAPI 3.0 JSON Specification
  await test('TST-021: OpenAPI 3.0 Raw JSON Spec (/api-docs/swagger.json)', async () => {
    const res = await fetch(`${baseUrl}/api-docs/swagger.json`);
    const spec = await res.json();
    return res.status === 200 && spec.openapi === '3.0.3' && spec.info.title.includes('Wi-Fi Sentinel');
  });

  server.close();

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
