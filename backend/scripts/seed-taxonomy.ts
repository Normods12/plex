/**
 * Seed script: Populates all product domains, families, categories, and series.
 * Idempotent — checks if slug exists before creating.
 *
 * Usage:
 *   STRAPI_URL=http://localhost:1337 STRAPI_ADMIN_TOKEN=<token> npx ts-node scripts/seed-taxonomy.ts
 */

import * as https from 'https';
import * as http from 'http';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_ADMIN_TOKEN = process.env.STRAPI_ADMIN_TOKEN || '';

// ─── Taxonomy data ─────────────────────────────────────────────────────────────

const DOMAINS = [
  { name: 'Enterprise Networking', slug: 'enterprise-networking', sortOrder: 1, icon: '🌐', shortDescription: 'Switches, routers, SFP modules, wireless and network infrastructure solutions.' },
  { name: 'Enterprise Surveillance', slug: 'enterprise-surveillance', sortOrder: 2, icon: '📷', shortDescription: 'IP cameras, NVRs, and complete video surveillance systems.' },
  { name: 'Professional Displays', slug: 'professional-displays', sortOrder: 3, icon: '🖥️', shortDescription: 'Professional monitors, digital signage, and video wall solutions.' },
  { name: 'Industrial Networking', slug: 'industrial-networking', sortOrder: 4, icon: '🏭', shortDescription: 'Ruggedised networking equipment for industrial environments.' },
  { name: 'Networking PA System', slug: 'networking-pa-system', sortOrder: 5, icon: '📢', shortDescription: 'IP-based public address and emergency communication systems.' },
  { name: 'Video Conference', slug: 'video-conference', sortOrder: 6, icon: '🎥', shortDescription: 'PTZ cameras, all-in-one endpoints, and professional microphones.' },
  { name: 'Servers & Storage', slug: 'servers-storage', sortOrder: 7, icon: '🖧', shortDescription: 'Surveillance servers, rack workstations, NAS, and local processing units.' },
  { name: 'Enterprise Software', slug: 'enterprise-software', sortOrder: 8, icon: '💻', shortDescription: 'SD-WAN, VMS, AI analytics, ITMS, and cloud solutions.' },
];

const FAMILIES: Record<string, Array<{ name: string; slug: string; sortOrder: number; shortDescription?: string }>> = {
  'enterprise-networking': [
    { name: 'Switches', slug: 'switches', sortOrder: 1, shortDescription: 'Unmanaged, smart-managed, L2/L3 managed, and datacenter switches.' },
    { name: 'Routers', slug: 'routers', sortOrder: 2, shortDescription: 'Enterprise and SMB routers.' },
    { name: 'SFP Modules', slug: 'sfp-modules', sortOrder: 3, shortDescription: 'Fibre and copper SFP/SFP+ transceivers.' },
    { name: 'Media Convertors', slug: 'media-convertors', sortOrder: 4, shortDescription: 'Fibre to copper media converters.' },
    { name: 'Wireless', slug: 'wireless', sortOrder: 5, shortDescription: 'Access points and wireless controllers.' },
    { name: 'Network Infrastructure', slug: 'network-infrastructure', sortOrder: 6, shortDescription: 'Patch panels, cabinets, and structured cabling.' },
  ],
  'enterprise-surveillance': [
    { name: 'MAXECO Series', slug: 'maxeco-series', sortOrder: 1, shortDescription: 'Cost-effective IP cameras for standard deployments.' },
    { name: 'MAX360 Series', slug: 'max360-series', sortOrder: 2, shortDescription: '360° panoramic IP cameras.' },
    { name: 'MAXVIEW Series', slug: 'maxview-series', sortOrder: 3, shortDescription: 'High-resolution cameras for critical surveillance.' },
    { name: 'MAXOBILE Series', slug: 'maxobile-series', sortOrder: 4, shortDescription: 'Mobile and vehicle-mounted cameras.' },
    { name: 'MAXVALUE Series', slug: 'maxvalue-series', sortOrder: 5, shortDescription: 'Value-range IP cameras.' },
    { name: 'Camera Accessories', slug: 'camera-accessories', sortOrder: 6, shortDescription: 'Mounts, housings, and surveillance accessories.' },
  ],
  'professional-displays': [
    { name: 'Professional Monitors', slug: 'professional-monitors', sortOrder: 1, shortDescription: 'High-brightness professional-grade monitors.' },
    { name: 'Digital Signage', slug: 'digital-signage', sortOrder: 2, shortDescription: 'Commercial digital signage displays.' },
    { name: 'Video Wall', slug: 'video-wall', sortOrder: 3, shortDescription: 'Narrow-bezel video wall panels and controllers.' },
  ],
  'industrial-networking': [
    { name: 'Industrial Switches', slug: 'industrial-switches', sortOrder: 1, shortDescription: 'DIN-rail and rack-mount industrial Ethernet switches.' },
    { name: 'Industrial Cameras', slug: 'industrial-cameras', sortOrder: 2, shortDescription: 'Ruggedised cameras for industrial environments.' },
    { name: 'Industrial Displays', slug: 'industrial-displays', sortOrder: 3, shortDescription: 'Panel PCs and industrial monitors.' },
    { name: 'Industrial Gateways', slug: 'industrial-gateways', sortOrder: 4, shortDescription: 'Protocol converters and IoT gateways.' },
    { name: 'Industrial Servers', slug: 'industrial-servers', sortOrder: 5, shortDescription: 'Fanless and ruggedised industrial servers.' },
    { name: 'Industrial Accessories', slug: 'industrial-accessories', sortOrder: 6, shortDescription: 'Power supplies, enclosures, and accessories.' },
  ],
  'networking-pa-system': [
    { name: 'Paging Devices', slug: 'paging-devices', sortOrder: 1, shortDescription: 'IP paging adapters and controllers.' },
    { name: 'Emergency Call Box', slug: 'emergency-call-box', sortOrder: 2, shortDescription: 'Emergency intercom and call stations.' },
    { name: 'IP PA Server', slug: 'ip-pa-server', sortOrder: 3, shortDescription: 'Centralised IP public address servers.' },
    { name: 'Outdoor IP Column Speaker', slug: 'outdoor-ip-column-speaker', sortOrder: 4, shortDescription: 'Weatherproof IP column speakers.' },
  ],
  'video-conference': [
    { name: 'USB PTZ Cameras', slug: 'usb-ptz-cameras', sortOrder: 1, shortDescription: 'USB-connected PTZ cameras for huddle rooms.' },
    { name: 'All-in-One PTZ Cameras', slug: 'all-in-one-ptz-cameras', sortOrder: 2, shortDescription: 'Integrated PTZ cameras with built-in codec.' },
    { name: 'All-in-One End Points', slug: 'all-in-one-end-points', sortOrder: 3, shortDescription: 'Complete video conferencing endpoints.' },
    { name: 'Enterprise End Points', slug: 'enterprise-end-points', sortOrder: 4, shortDescription: 'Enterprise-grade video conferencing systems.' },
    { name: 'Professional Microphone', slug: 'professional-microphone', sortOrder: 5, shortDescription: 'Beamforming and array microphones.' },
  ],
  'servers-storage': [
    { name: 'Surveillance Servers', slug: 'surveillance-servers', sortOrder: 1, shortDescription: 'Purpose-built servers for video surveillance.' },
    { name: 'Rack Workstation', slug: 'rack-workstation', sortOrder: 2, shortDescription: 'Rack-mount workstations for demanding workloads.' },
    { name: 'Box Servers', slug: 'box-servers', sortOrder: 3, shortDescription: 'Tower and mini-tower servers.' },
    { name: 'Network Attached Storage', slug: 'network-attached-storage', sortOrder: 4, shortDescription: 'NAS solutions for enterprise storage.' },
    { name: 'Local Processing Units', slug: 'local-processing-units', sortOrder: 5, shortDescription: 'Edge computing and local AI processing units.' },
  ],
  'enterprise-software': [
    { name: 'SD-WAN', slug: 'sd-wan', sortOrder: 1, shortDescription: 'Software-defined WAN solutions.' },
    { name: 'Network Management Software', slug: 'network-management-software', sortOrder: 2, shortDescription: 'Centralised network monitoring and management.' },
    { name: 'Video Management Software', slug: 'video-management-software', sortOrder: 3, shortDescription: 'VMS for IP surveillance systems.' },
    { name: 'AI Video Analytics', slug: 'ai-video-analytics', sortOrder: 4, shortDescription: 'AI-powered video analytics and intelligence.' },
    { name: 'ITMS Solutions', slug: 'itms-solutions', sortOrder: 5, shortDescription: 'Intelligent traffic management systems.' },
    { name: 'Vehicle Tracking System', slug: 'vehicle-tracking-system', sortOrder: 6, shortDescription: 'GPS-based fleet and vehicle tracking.' },
    { name: 'Cloud Video Conference', slug: 'cloud-video-conference', sortOrder: 7, shortDescription: 'Cloud-hosted video conferencing platform.' },
    { name: 'Cloud Public Addressing', slug: 'cloud-public-addressing', sortOrder: 8, shortDescription: 'Cloud-based PA system management.' },
  ],
};

const CATEGORIES: Record<string, Array<{ name: string; slug: string; sortOrder: number }>> = {
  'switches': [
    { name: 'Unmanaged Switches', slug: 'unmanaged-switches', sortOrder: 1 },
    { name: 'Smart Managed Switches', slug: 'smart-managed-switches', sortOrder: 2 },
    { name: 'L2 Managed Switches', slug: 'l2-managed-switches', sortOrder: 3 },
    { name: 'L3 Managed Switches', slug: 'l3-managed-switches', sortOrder: 4 },
    { name: 'Datacenter Switches', slug: 'datacenter-switches', sortOrder: 5 },
  ],
  'routers': [
    { name: 'Enterprise Routers', slug: 'enterprise-routers', sortOrder: 1 },
    { name: 'SMB Routers', slug: 'smb-routers', sortOrder: 2 },
  ],
  'sfp-modules': [
    { name: 'SFP Transceivers', slug: 'sfp-transceivers', sortOrder: 1 },
    { name: 'SFP+ Transceivers', slug: 'sfp-plus-transceivers', sortOrder: 2 },
    { name: 'QSFP Transceivers', slug: 'qsfp-transceivers', sortOrder: 3 },
  ],
  'media-convertors': [
    { name: 'Fast Ethernet Media Converters', slug: 'fast-ethernet-media-converters', sortOrder: 1 },
    { name: 'Gigabit Media Converters', slug: 'gigabit-media-converters', sortOrder: 2 },
  ],
  'wireless': [
    { name: 'Indoor Access Points', slug: 'indoor-access-points', sortOrder: 1 },
    { name: 'Outdoor Access Points', slug: 'outdoor-access-points', sortOrder: 2 },
    { name: 'Wireless Controllers', slug: 'wireless-controllers', sortOrder: 3 },
  ],
  'network-infrastructure': [
    { name: 'Patch Panels', slug: 'patch-panels', sortOrder: 1 },
    { name: 'Network Cabinets', slug: 'network-cabinets', sortOrder: 2 },
    { name: 'Structured Cabling', slug: 'structured-cabling', sortOrder: 3 },
  ],
  'maxeco-series': [
    { name: 'MAXECO Bullet Cameras', slug: 'maxeco-bullet-cameras', sortOrder: 1 },
    { name: 'MAXECO Dome Cameras', slug: 'maxeco-dome-cameras', sortOrder: 2 },
    { name: 'MAXECO PTZ Cameras', slug: 'maxeco-ptz-cameras', sortOrder: 3 },
  ],
  'max360-series': [
    { name: 'MAX360 Fisheye Cameras', slug: 'max360-fisheye-cameras', sortOrder: 1 },
    { name: 'MAX360 Panoramic Cameras', slug: 'max360-panoramic-cameras', sortOrder: 2 },
  ],
  'maxview-series': [
    { name: 'MAXVIEW 4K Cameras', slug: 'maxview-4k-cameras', sortOrder: 1 },
    { name: 'MAXVIEW IR Cameras', slug: 'maxview-ir-cameras', sortOrder: 2 },
    { name: 'MAXVIEW PTZ Cameras', slug: 'maxview-ptz-cameras', sortOrder: 3 },
  ],
  'maxobile-series': [
    { name: 'MAXOBILE Vehicle Cameras', slug: 'maxobile-vehicle-cameras', sortOrder: 1 },
    { name: 'MAXOBILE Body Cameras', slug: 'maxobile-body-cameras', sortOrder: 2 },
  ],
  'maxvalue-series': [
    { name: 'MAXVALUE Bullet Cameras', slug: 'maxvalue-bullet-cameras', sortOrder: 1 },
    { name: 'MAXVALUE Dome Cameras', slug: 'maxvalue-dome-cameras', sortOrder: 2 },
  ],
  'camera-accessories': [
    { name: 'Camera Mounts', slug: 'camera-mounts', sortOrder: 1 },
    { name: 'Camera Housings', slug: 'camera-housings', sortOrder: 2 },
    { name: 'PoE Injectors', slug: 'poe-injectors', sortOrder: 3 },
  ],
  'professional-monitors': [
    { name: '4K Professional Monitors', slug: '4k-professional-monitors', sortOrder: 1 },
    { name: 'Full HD Professional Monitors', slug: 'full-hd-professional-monitors', sortOrder: 2 },
  ],
  'digital-signage': [
    { name: 'Indoor Digital Signage', slug: 'indoor-digital-signage', sortOrder: 1 },
    { name: 'Outdoor Digital Signage', slug: 'outdoor-digital-signage', sortOrder: 2 },
    { name: 'Interactive Displays', slug: 'interactive-displays', sortOrder: 3 },
  ],
  'video-wall': [
    { name: 'LCD Video Wall', slug: 'lcd-video-wall', sortOrder: 1 },
    { name: 'LED Video Wall', slug: 'led-video-wall', sortOrder: 2 },
    { name: 'Video Wall Controllers', slug: 'video-wall-controllers', sortOrder: 3 },
  ],
  'industrial-switches': [
    { name: 'Unmanaged Industrial Switches', slug: 'unmanaged-industrial-switches', sortOrder: 1 },
    { name: 'Managed Industrial Switches', slug: 'managed-industrial-switches', sortOrder: 2 },
    { name: 'PoE Industrial Switches', slug: 'poe-industrial-switches', sortOrder: 3 },
  ],
  'industrial-cameras': [
    { name: 'Explosion-Proof Cameras', slug: 'explosion-proof-cameras', sortOrder: 1 },
    { name: 'Thermal Cameras', slug: 'thermal-cameras', sortOrder: 2 },
    { name: 'Ruggedised IP Cameras', slug: 'ruggedised-ip-cameras', sortOrder: 3 },
  ],
  'industrial-displays': [
    { name: 'Panel PCs', slug: 'panel-pcs', sortOrder: 1 },
    { name: 'Industrial Monitors', slug: 'industrial-monitors', sortOrder: 2 },
  ],
  'industrial-gateways': [
    { name: 'IoT Gateways', slug: 'iot-gateways', sortOrder: 1 },
    { name: 'Protocol Converters', slug: 'protocol-converters', sortOrder: 2 },
  ],
  'industrial-servers': [
    { name: 'Fanless Servers', slug: 'fanless-servers', sortOrder: 1 },
    { name: 'Ruggedised Servers', slug: 'ruggedised-servers', sortOrder: 2 },
  ],
  'industrial-accessories': [
    { name: 'Industrial Power Supplies', slug: 'industrial-power-supplies', sortOrder: 1 },
    { name: 'Industrial Enclosures', slug: 'industrial-enclosures', sortOrder: 2 },
  ],
  'paging-devices': [
    { name: 'IP Paging Adapters', slug: 'ip-paging-adapters', sortOrder: 1 },
    { name: 'Paging Controllers', slug: 'paging-controllers', sortOrder: 2 },
  ],
  'emergency-call-box': [
    { name: 'Emergency Intercom', slug: 'emergency-intercom', sortOrder: 1 },
    { name: 'Emergency Call Stations', slug: 'emergency-call-stations', sortOrder: 2 },
  ],
  'ip-pa-server': [
    { name: 'IP PA Servers', slug: 'ip-pa-servers', sortOrder: 1 },
  ],
  'outdoor-ip-column-speaker': [
    { name: 'IP Column Speakers', slug: 'ip-column-speakers', sortOrder: 1 },
    { name: 'IP Horn Speakers', slug: 'ip-horn-speakers', sortOrder: 2 },
  ],
  'usb-ptz-cameras': [
    { name: 'USB PTZ Cameras', slug: 'usb-ptz-cameras-cat', sortOrder: 1 },
  ],
  'all-in-one-ptz-cameras': [
    { name: 'All-in-One PTZ Cameras', slug: 'all-in-one-ptz-cameras-cat', sortOrder: 1 },
  ],
  'all-in-one-end-points': [
    { name: 'Huddle Room Systems', slug: 'huddle-room-systems', sortOrder: 1 },
    { name: 'Meeting Room Systems', slug: 'meeting-room-systems', sortOrder: 2 },
  ],
  'enterprise-end-points': [
    { name: 'Enterprise Video Endpoints', slug: 'enterprise-video-endpoints', sortOrder: 1 },
  ],
  'professional-microphone': [
    { name: 'Beamforming Microphones', slug: 'beamforming-microphones', sortOrder: 1 },
    { name: 'Array Microphones', slug: 'array-microphones', sortOrder: 2 },
  ],
  'surveillance-servers': [
    { name: 'NVR Servers', slug: 'nvr-servers', sortOrder: 1 },
    { name: 'AI Surveillance Servers', slug: 'ai-surveillance-servers', sortOrder: 2 },
  ],
  'rack-workstation': [
    { name: '1U Rack Workstations', slug: '1u-rack-workstations', sortOrder: 1 },
    { name: '2U Rack Workstations', slug: '2u-rack-workstations', sortOrder: 2 },
  ],
  'box-servers': [
    { name: 'Tower Servers', slug: 'tower-servers', sortOrder: 1 },
    { name: 'Mini Tower Servers', slug: 'mini-tower-servers', sortOrder: 2 },
  ],
  'network-attached-storage': [
    { name: 'Desktop NAS', slug: 'desktop-nas', sortOrder: 1 },
    { name: 'Rack NAS', slug: 'rack-nas', sortOrder: 2 },
  ],
  'local-processing-units': [
    { name: 'Edge AI Units', slug: 'edge-ai-units', sortOrder: 1 },
    { name: 'Local Processing Units', slug: 'local-processing-units-cat', sortOrder: 2 },
  ],
  'sd-wan': [
    { name: 'SD-WAN Appliances', slug: 'sd-wan-appliances', sortOrder: 1 },
    { name: 'SD-WAN Software', slug: 'sd-wan-software', sortOrder: 2 },
  ],
  'network-management-software': [
    { name: 'Network Monitoring', slug: 'network-monitoring', sortOrder: 1 },
    { name: 'Network Configuration', slug: 'network-configuration', sortOrder: 2 },
  ],
  'video-management-software': [
    { name: 'VMS Licenses', slug: 'vms-licenses', sortOrder: 1 },
    { name: 'VMS Appliances', slug: 'vms-appliances', sortOrder: 2 },
  ],
  'ai-video-analytics': [
    { name: 'AI Analytics Software', slug: 'ai-analytics-software', sortOrder: 1 },
    { name: 'AI Analytics Appliances', slug: 'ai-analytics-appliances', sortOrder: 2 },
  ],
  'itms-solutions': [
    { name: 'Traffic Management', slug: 'traffic-management', sortOrder: 1 },
    { name: 'Parking Management', slug: 'parking-management', sortOrder: 2 },
  ],
  'vehicle-tracking-system': [
    { name: 'GPS Trackers', slug: 'gps-trackers', sortOrder: 1 },
    { name: 'Fleet Management Software', slug: 'fleet-management-software', sortOrder: 2 },
  ],
  'cloud-video-conference': [
    { name: 'Cloud VC Licenses', slug: 'cloud-vc-licenses', sortOrder: 1 },
  ],
  'cloud-public-addressing': [
    { name: 'Cloud PA Licenses', slug: 'cloud-pa-licenses', sortOrder: 1 },
  ],
};

const SERIES = [
  { name: 'MAXECO', slug: 'maxeco', seriesCode: 'MAXECO', familySlug: 'maxeco-series', sortOrder: 1 },
  { name: 'MAX360', slug: 'max360', seriesCode: 'MAX360', familySlug: 'max360-series', sortOrder: 2 },
  { name: 'MAXVIEW', slug: 'maxview', seriesCode: 'MAXVIEW', familySlug: 'maxview-series', sortOrder: 3 },
  { name: 'MAXOBILE', slug: 'maxobile', seriesCode: 'MAXOBILE', familySlug: 'maxobile-series', sortOrder: 4 },
  { name: 'MAXVALUE', slug: 'maxvalue', seriesCode: 'MAXVALUE', familySlug: 'maxvalue-series', sortOrder: 5 },
];

// ─── HTTP helper ───────────────────────────────────────────────────────────────

async function strapiRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${STRAPI_URL}/api${path}`);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const data = body ? JSON.stringify(body) : undefined;
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}`,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => (responseData += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
          } else {
            resolve(parsed as T);
          }
        } catch {
          reject(new Error(`Failed to parse response: ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function findBySlug(endpoint: string, slug: string): Promise<number | null> {
  const res = await strapiRequest<{ data: Array<{ id: number }> }>(
    'GET',
    `/${endpoint}?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`
  );
  return res.data[0]?.id ?? null;
}

async function createEntry(
  endpoint: string,
  data: Record<string, unknown>
): Promise<number> {
  const res = await strapiRequest<{ data: { id: number } }>('POST', `/${endpoint}`, {
    data,
  });
  return res.data.id;
}

// ─── Seed functions ────────────────────────────────────────────────────────────

async function seedDomains(): Promise<Map<string, number>> {
  console.log('\n📦 Seeding product domains...');
  const domainIds = new Map<string, number>();

  for (const domain of DOMAINS) {
    const existing = await findBySlug('product-domains', domain.slug);
    if (existing) {
      console.log(`  ✓ Domain already exists: ${domain.name} (id: ${existing})`);
      domainIds.set(domain.slug, existing);
    } else {
      const id = await createEntry('product-domains', domain);
      console.log(`  + Created domain: ${domain.name} (id: ${id})`);
      domainIds.set(domain.slug, id);
    }
  }

  return domainIds;
}

async function seedFamilies(domainIds: Map<string, number>): Promise<Map<string, number>> {
  console.log('\n📁 Seeding product families...');
  const familyIds = new Map<string, number>();

  for (const [domainSlug, families] of Object.entries(FAMILIES)) {
    const domainId = domainIds.get(domainSlug);
    if (!domainId) {
      console.warn(`  ⚠ Domain not found: ${domainSlug}`);
      continue;
    }

    for (const family of families) {
      const existing = await findBySlug('product-families', family.slug);
      if (existing) {
        console.log(`  ✓ Family already exists: ${family.name}`);
        familyIds.set(family.slug, existing);
      } else {
        const id = await createEntry('product-families', {
          ...family,
          domain: domainId,
        });
        console.log(`  + Created family: ${family.name} (id: ${id})`);
        familyIds.set(family.slug, id);
      }
    }
  }

  return familyIds;
}

async function seedCategories(familyIds: Map<string, number>): Promise<void> {
  console.log('\n🗂  Seeding product categories...');

  for (const [familySlug, categories] of Object.entries(CATEGORIES)) {
    const familyId = familyIds.get(familySlug);
    if (!familyId) {
      console.warn(`  ⚠ Family not found: ${familySlug}`);
      continue;
    }

    for (const category of categories) {
      const existing = await findBySlug('product-categories', category.slug);
      if (existing) {
        console.log(`  ✓ Category already exists: ${category.name}`);
      } else {
        const id = await createEntry('product-categories', {
          ...category,
          family: familyId,
        });
        console.log(`  + Created category: ${category.name} (id: ${id})`);
      }
    }
  }
}

async function seedSeries(familyIds: Map<string, number>): Promise<void> {
  console.log('\n🏷  Seeding product series...');

  for (const series of SERIES) {
    const familyId = familyIds.get(series.familySlug);
    if (!familyId) {
      console.warn(`  ⚠ Family not found: ${series.familySlug}`);
      continue;
    }

    const existing = await findBySlug('product-series', series.slug);
    if (existing) {
      console.log(`  ✓ Series already exists: ${series.name}`);
    } else {
      const id = await createEntry('product-series', {
        name: series.name,
        slug: series.slug,
        seriesCode: series.seriesCode,
        sortOrder: series.sortOrder,
        family: familyId,
      });
      console.log(`  + Created series: ${series.name} (id: ${id})`);
    }
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Plexonics Taxonomy Seed Script');
  console.log(`   Strapi URL: ${STRAPI_URL}`);

  if (!STRAPI_ADMIN_TOKEN) {
    console.error('❌ STRAPI_ADMIN_TOKEN is not set. Exiting.');
    process.exit(1);
  }

  try {
    const domainIds = await seedDomains();
    const familyIds = await seedFamilies(domainIds);
    await seedCategories(familyIds);
    await seedSeries(familyIds);

    console.log('\n✅ Taxonomy seed complete!');
    console.log(`   Domains: ${domainIds.size}`);
    console.log(`   Families: ${familyIds.size}`);
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  }
}

main();
