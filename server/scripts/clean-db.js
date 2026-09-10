import mongoose from 'mongoose';
import { SYSTEM_NOISE_REGEX } from '../dist/services/traffic.service.js';

const MONGO_URI = 'mongodb+srv://zaynrazadev_db_user:bWduJ3S40STi3kY5@wifi.tro4peh.mongodb.net/wifi_sentinel?retryWrites=true&w=majority&appName=wifi';

async function main() {
  await mongoose.connect(MONGO_URI);
  const collection = mongoose.connection.collection('domainlogs');
  const countBefore = await collection.countDocuments();
  console.log('Count before purge:', countBefore);

  const noiseRes = await collection.deleteMany({ domain: { $regex: SYSTEM_NOISE_REGEX } });
  console.log('Deleted noise docs:', noiseRes.deletedCount);

  // Deduplicate all remaining domains
  const distinctDomains = await collection.distinct('domain');
  console.log('Distinct remaining domains:', distinctDomains);

  for (const dom of distinctDomains) {
    const docs = await collection.find({ domain: dom }).sort({ timestamp: -1 }).toArray();
    if (docs.length > 1) {
      const keep = docs[0];
      let totalQueries = keep.queryCountToday || 1;
      let totalBytes = keep.bytesTransferred || 0;
      const delIds = [];
      for (let i = 1; i < docs.length; i++) {
        totalQueries += (docs[i].queryCountToday || 1);
        totalBytes += (docs[i].bytesTransferred || 0);
        delIds.push(docs[i]._id);
      }
      await collection.deleteMany({ _id: { $in: delIds } });
      await collection.updateOne(
        { _id: keep._id },
        { $set: { queryCountToday: totalQueries, bytesTransferred: totalBytes } }
      );
      console.log(`Deduplicated ${dom}: deleted ${delIds.length} duplicate rows, total queries: ${totalQueries}`);
    }
  }

  const countAfter = await collection.countDocuments();
  console.log('Count after purge and deduplication:', countAfter);
  await mongoose.disconnect();
}

main().catch(console.error);
