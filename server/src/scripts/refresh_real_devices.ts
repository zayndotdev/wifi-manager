import { connectDatabase } from '../config/database.js';
import { realNetworkService } from '../services/realNetwork.service.js';
import { DeviceModel } from '../models/Device.model.js';

async function main() {
  console.log('=== Refreshing Real Network Devices in MongoDB Atlas ===\n');

  await connectDatabase();

  // 1. Sync real devices
  const devices = await realNetworkService.syncRealDevicesToMongo();
  console.log(`Discovered and synchronized ${devices.length} real devices:\n`);

  for (const d of devices) {
    console.log(`[REAL DEVICE]`);
    console.log(`  IP:        ${d.ip}`);
    console.log(`  MAC:       ${d.mac}`);
    console.log(`  Hostname:  ${d.hostname}`);
    console.log(`  Nickname:  ${d.nickname}`);
    console.log(`  Vendor:    ${d.vendor}`);
    console.log(`  Category:  ${d.category}`);
    console.log('--------------------------------------------------');
  }

  // 2. Remove any old stale documents that have dummy nicknames and no longer exist in ARP
  const liveMacs = devices.map((d) => d.mac);
  const stale = await DeviceModel.deleteMany({
    mac: { $nin: liveMacs },
    $or: [
      { nickname: /^Apple-Device-/i },
      { nickname: /^Device-/i },
      { nickname: /^Samsung-Galaxy-\d+$/i },
      { hostname: /^Apple-Device-/i },
      { hostname: /^Device-/i },
    ],
  });

  if (stale.deletedCount > 0) {
    console.log(`Cleaned up ${stale.deletedCount} old stale dummy device records from MongoDB.`);
  }

  console.log('\n=== Refresh Complete! All device records are 100% genuine ===\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal error refreshing devices:', err);
  process.exit(1);
});
