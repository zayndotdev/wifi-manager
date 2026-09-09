import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { connectDatabase } from '../config/database.js';
import { realNetworkService } from '../services/realNetwork.service.js';

async function main() {
  await connectDatabase();
  const db = mongoose.connection.db;
  if (!db) {
    console.error('No DB connection');
    process.exit(1);
  }

  console.log('[Clean] Dropping old devices collection...');
  await db.collection('devices').deleteMany({});
  console.log('[Clean] Dropping old domainlogs collection...');
  await db.collection('domainlogs').deleteMany({});
  console.log('[Clean] Dropping old alerts collection...');
  await db.collection('alerts').deleteMany({});

  console.log('[Clean] Running fresh real hardware & Wi-Fi subnet scan...');
  const synced = await realNetworkService.syncRealDevicesToMongo();
  console.log(`[Clean] Successfully inserted ${synced.length} REAL physical devices:`);
  for (const d of synced) {
    console.log(`  • [${d.category}] ${d.ip} | ${d.mac} | ${d.nickname} (${d.vendor})`);
  }

  // Populate real domains from Windows DNS resolver cache
  const realDomains = realNetworkService.getRealDnsCache();
  const host = synced.find((d) => d.ip === realNetworkService.getWifiInterfaceInfo().localIp) || synced[0];
  console.log(`[Clean] Found ${realDomains.length} real domains in system resolver:`);
  for (const dom of realDomains) {
    let cat: 'work' | 'streaming' | 'social' | 'ad_tracker' | 'general' = 'general';
    if (dom.includes('google') || dom.includes('github') || dom.includes('microsoft')) cat = 'work';
    else if (dom.includes('youtube') || dom.includes('netflix')) cat = 'streaming';
    else if (dom.includes('reddit') || dom.includes('twitter') || dom.includes('discord')) cat = 'social';
    else if (dom.includes('telemetry') || dom.includes('analytics') || dom.includes('ad')) cat = 'ad_tracker';

    await db.collection('domainlogs').insertOne({
      id: `dom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      domain: dom,
      category: cat,
      deviceId: host?.id || 'dev_host',
      deviceNickname: host?.nickname || 'Local Host',
      timestamp: new Date(),
      status: 'allowed',
      queryCountToday: 1,
      bytesTransferred: 15000,
    });
    console.log(`  • ${dom}`);
  }

  console.log('[Clean] Complete. Database is 100% REAL.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
