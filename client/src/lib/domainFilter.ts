/**
 * Domain filter utility for Approach A: Clean User Browsing
 * Filters out background cloud infrastructure, CDNs, desktop daemons, and OS telemetry.
 */

export const NOISE_DOMAIN_REGEX =
  /(mongodb\.(net|com)|compute\.amazonaws\.com|\.amazonaws\.com|\.cloudfront\.net|azurefd\.net|azureedge\.net|trafficmanager\.net|cloudapp\.azure\.com|cloudapp\.net|core\.windows\.net|msedge\.net|office\.net|cloud\.microsoft|skype\.com|prod\.do\.dsp\.mp\.microsoft\.com|events\.data\.microsoft\.com|delivery\.mp\.microsoft\.com|windowsupdate\.com|storequality\.microsoft\.com|data\.microsoft\.com|exp-tas\.com|iris\.microsoft\.com|cwsapp|update\.microsoft\.com|wdcp\.microsoft\.com|pki-goog|googleusercontent\.com|googleapis\.com|gvt1\.com|1e100\.net|\.goog$|\.goog\/|\.pki\.goog|wisprflow\.com|sentry\.io|bugsnag\.com|crashlytics\.com|segment\.io|\.akamaiedge\.net|\.edgekey\.net|\.edgesuite\.net|\.akadns\.net|\.akamai\.net|\.akamaized\.net|fastly\.net|gcdn\.co|digicert\.com|msidentity\.com|assets\.msn\.com|ecs\.office\.com|tm-\d+\.office\.com|svc\..*\.office\.com|\.local$|\.arpa$|\.internal$|\.lan$)/i;

/**
 * Returns true if domain is a legitimate user browsing destination,
 * and false if it is background cloud/CDN/daemon noise.
 */
export function isUserFacingDomain(domain: string | undefined | null): boolean {
  if (!domain) return false;
  const d = domain.toLowerCase().trim();

  // Too short or invalid
  if (d.length < 4) return false;

  // Local IP addresses and link-local artifacts
  if (
    d.startsWith('192.') ||
    d.startsWith('127.') ||
    d.startsWith('10.') ||
    d.startsWith('172.16.') ||
    d.startsWith('fe80:') ||
    d.includes('::') ||
    d.endsWith('.local') ||
    d.endsWith('.arpa') ||
    d.endsWith('.internal') ||
    d.endsWith('.lan')
  ) {
    return false;
  }

  // Check against background noise regex
  return !NOISE_DOMAIN_REGEX.test(d);
}

export function isSystemNoiseDomain(domain: string | undefined | null): boolean {
  return !isUserFacingDomain(domain);
}
