import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_NOISE_REGEX = /(mongodb\.(net|com)|compute\.amazonaws\.com|\.amazonaws\.com|\.cloudfront\.net|azurefd\.net|azureedge\.net|trafficmanager\.net|cloudapp\.azure\.com|cloudapp\.net|core\.windows\.net|msedge\.net|office\.net|cloud\.microsoft|skype\.com|prod\.do\.dsp\.mp\.microsoft\.com|events\.data\.microsoft\.com|delivery\.mp\.microsoft\.com|windowsupdate\.com|storequality\.microsoft\.com|data\.microsoft\.com|exp-tas\.com|iris\.microsoft\.com|cwsapp|update\.microsoft\.com|wdcp\.microsoft\.com|pki-goog|googleusercontent\.com|googleapis\.com|gvt1\.com|1e100\.net|\.goog$|\.goog\/|\.pki\.goog|wisprflow\.com|sentry\.io|bugsnag\.com|crashlytics\.com|segment\.io|\.akamaiedge\.net|\.edgekey\.net|\.edgesuite\.net|\.akadns\.net|\.akamai\.net|\.akamaized\.net|fastly\.net|gcdn\.co|digicert\.com|msidentity\.com|assets\.msn\.com|ecs\.office\.com|tm-\d+\.office\.com|svc\..*\.office\.com|\.local$|\.arpa$|\.internal$|\.lan$)/i;

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log('Connected to MongoDB Atlas');

  const beforeCount = await mongoose.connection.collection('domainlogs').countDocuments();
  console.log('Total documents before purge:', beforeCount);

  const res = await mongoose.connection.collection('domainlogs').deleteMany({
    domain: { $regex: SYSTEM_NOISE_REGEX }
  });
  console.log('Purged noise documents:', res.deletedCount);

  const afterCount = await mongoose.connection.collection('domainlogs').countDocuments();
  console.log('Total clean documents after purge:', afterCount);

  const remaining = await mongoose.connection.collection('domainlogs').distinct('domain');
  console.log('Remaining clean user domains in Atlas:', remaining);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
