import dns from 'dns';
import { promisify } from 'util';

const lookupServiceAsync = promisify(dns.lookupService);
const reverseAsync = promisify(dns.reverse);

const ips = [
  '192.168.1.1', '192.168.1.2', '192.168.1.3', '192.168.1.4',
  '192.168.1.8', '192.168.1.9', '192.168.1.10', '192.168.1.12',
  '192.168.1.13', '192.168.1.19'
];

async function testAll() {
  console.log('=== dns.lookupService (OS-level resolver) ===');
  for (const ip of ips) {
    try {
      const result = await lookupServiceAsync(ip, 0);
      console.log(`  ${ip} -> ${result.hostname}`);
    } catch (e: any) {
      console.log(`  ${ip} -> [FAILED: ${e.code || e.message}]`);
    }
  }

  console.log('\n=== dns.reverse (DNS PTR records) ===');
  for (const ip of ips) {
    try {
      const hostnames = await reverseAsync(ip);
      console.log(`  ${ip} -> ${hostnames.join(', ')}`);
    } catch (e: any) {
      console.log(`  ${ip} -> [FAILED: ${e.code || e.message}]`);
    }
  }
}

testAll().catch(console.error);
