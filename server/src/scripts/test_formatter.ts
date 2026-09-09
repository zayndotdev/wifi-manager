export function formatDeviceMeta(
  ip: string,
  rawHostname: string,
  rawVendor: string,
  isRandomMac: boolean,
  isGateway: boolean,
  isHost: boolean
) {
  if (isGateway) {
    return {
      hostname: rawHostname || 'gateway',
      nickname: 'Main Gateway Router',
      vendor: rawVendor !== 'Unknown' ? rawVendor : 'Wi-Fi Gateway',
      category: 'iot' as const,
    };
  }
  if (isHost) {
    return {
      hostname: rawHostname || 'this-pc',
      nickname: 'Zayn Workstation (This PC)',
      vendor: 'Intel Corporation',
      category: 'laptop' as const,
    };
  }

  let vendor = rawVendor;
  let category: 'phone' | 'laptop' | 'tablet' | 'tv' | 'console' | 'iot' | 'audio' | 'printer' | 'unknown' = 'unknown';

  const hLower = rawHostname.toLowerCase();
  const vLower = rawVendor.toLowerCase();

  // 1. Samsung inference
  if (hLower.includes('galaxy') || hLower.includes('s23') || hLower.includes('s24') || hLower.includes('a05') || hLower.includes('a06') || hLower.includes('ultra')) {
    if (vendor === 'Unknown') vendor = 'Samsung Electronics';
    category = 'phone';
  }
  // 2. Xiaomi inference
  else if (hLower.includes('redmi') || hLower.includes('xiaomi')) {
    if (vendor === 'Unknown') vendor = 'Xiaomi Communications';
    category = 'phone';
  }
  // 3. Vivo inference
  else if (hLower.startsWith('v2') || hLower.includes('vivo')) {
    if (vendor === 'Unknown') vendor = 'Vivo Mobile';
    category = 'phone';
  }
  // 4. Infinix inference
  else if (hLower.includes('infinix')) {
    if (vendor === 'Unknown') vendor = 'Infinix Mobility';
    category = 'phone';
  }
  // 5. TP-Link / Mercusys / Routers
  else if (hLower.includes('tl-wr') || vLower.includes('tp-link')) {
    vendor = 'TP-Link Technologies';
    category = 'iot';
  } else if (hLower.includes('mw325r') || vLower.includes('mercusys')) {
    vendor = 'Mercusys Technologies';
    category = 'iot';
  }
  // 6. Midea / Smart Appliances
  else if (hLower.includes('net_ac') || vLower.includes('midea')) {
    vendor = 'Midea Air Conditioning';
    category = 'iot';
  }
  // 7. Apple
  else if (hLower.includes('iphone') || hLower.includes('ipad') || vLower.includes('apple')) {
    vendor = 'Apple, Inc.';
    category = hLower.includes('ipad') ? 'tablet' : 'phone';
  }

  // Generate clean human-readable name
  let friendlyName = '';
  if (rawHostname) {
    friendlyName = rawHostname
      .replace(/-s-/gi, "'s ")
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    // Specific product branding polishes
    friendlyName = friendlyName
      .replace(/Tl Wr(\w+)/i, 'TP-Link TL-WR$1 Router')
      .replace(/Mw(\w+)/i, 'Mercusys MW$1 Router')
      .replace(/Net Ac (\w+)/i, 'Midea Smart AC ($1)')
      .replace(/V2409/i, 'Vivo V2409 Smartphone')
      .replace(/A06/i, 'Galaxy A06')
      .replace(/A05s/i, 'Galaxy A05s')
      .replace(/Redmi A3/i, 'Xiaomi Redmi A3')
      .replace(/S23 Ultra/i, 'Samsung S23 Ultra');
  } else {
    const octet = ip.split('.')[3];
    if (isRandomMac) {
      friendlyName = `Private Smartphone (.${octet})`;
      if (category === 'unknown') category = 'phone';
    } else if (vendor !== 'Unknown') {
      friendlyName = `${vendor.split(' ')[0]} Device (.${octet})`;
    } else {
      friendlyName = `Network Client (.${octet})`;
    }
  }

  return {
    hostname: rawHostname || `client-${ip.split('.')[3]}`,
    nickname: friendlyName,
    vendor: vendor !== 'Unknown' ? vendor : isRandomMac ? 'Private Wi-Fi Address' : 'Unknown Hardware',
    category,
  };
}

const tests = [
  { ip: '192.168.1.2', host: 'tl-wr840n', vendor: 'TP-LINK TECHNOLOGIES CO.,LTD.', rand: false },
  { ip: '192.168.1.3', host: 'v2409', vendor: 'Unknown', rand: true },
  { ip: '192.168.1.4', host: 'net_ac_fa80', vendor: 'GD Midea Air-Conditioning Equipment Co.,Ltd.', rand: false },
  { ip: '192.168.1.9', host: 'tasaduqe-s-a05s', vendor: 'Unknown', rand: true },
  { ip: '192.168.1.10', host: 'mw325r', vendor: 'MERCUSYS TECHNOLOGIES CO., LTD.', rand: false },
  { ip: '192.168.1.12', host: 'galaxy-a06', vendor: 'Unknown', rand: true },
  { ip: '192.168.1.13', host: 'redmi-a3', vendor: 'Unknown', rand: false },
  { ip: '192.168.1.19', host: 'ali-s-s23-ultra', vendor: 'Unknown', rand: true },
  { ip: '192.168.1.8', host: '', vendor: 'Unknown', rand: true },
];

for (const t of tests) {
  console.log(t.ip, '->', formatDeviceMeta(t.ip, t.host, t.vendor, t.rand, false, false));
}
