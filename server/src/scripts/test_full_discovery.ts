import { execSync, exec } from 'child_process';
import { createRequire } from 'module';
import { promisify } from 'util';

const require = createRequire(import.meta.url);
const ouiData: Record<string, string> = require('oui-data');
const execAsync = promisify(exec);

async function resolveHost(ip: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`nslookup ${ip}`, { timeout: 2000 });
    const match = stdout.match(/Name:\s*([^\r\n]+)/i);
    if (match && match[1]) {
      const name = match[1].trim();
      if (name && name !== ip && !name.includes('***') && !name.includes('UnKnown')) {
        return name;
      }
    }
  } catch {
    // ignore
  }
  return '';
}

async function run() {
  const arpOutput = execSync('arp -a', { encoding: 'utf-8' });
  const lines = arpOutput.split(/\r?\n/);
  const tasks: Promise<void>[] = [];

  for (const line of lines) {
    const m = line.trim().match(/^([0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3})\s+([0-9a-fA-F-]{17})/);
    if (!m) continue;
    const ip = m[1];
    if (ip.startsWith('224.') || ip.startsWith('239.') || ip === '255.255.255.255') continue;
    const mac = m[2].replace(/-/g, ':').toUpperCase();
    const hex6 = mac.replace(/:/g, '').substring(0, 6);
    const vendorRaw = (ouiData as Record<string, string>)[hex6];
    const vendor = vendorRaw ? vendorRaw.split('\n')[0].trim() : 'Unknown';

    tasks.push(
      (async () => {
        const hostname = await resolveHost(ip);
        console.log(`[Device] IP: ${ip.padEnd(15)} | MAC: ${mac} | Hostname: ${(hostname || '[None]').padEnd(20)} | Vendor: ${vendor}`);
      })()
    );
  }

  await Promise.all(tasks);
}

run().catch(console.error);
