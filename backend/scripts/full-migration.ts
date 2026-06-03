/**
 * FULL MIGRATION SCRIPT
 * =====================
 * Runs everything in order:
 *   1. Seed all taxonomy (domains, families, categories, series)
 *   2. Scrape www.plexonics.com for all product data
 *   3. Migrate all products + images + PDFs into Strapi
 *
 * Usage:
 *   STRAPI_URL=http://localhost:1337 STRAPI_ADMIN_TOKEN=<token> npx ts-node scripts/full-migration.ts
 *   STRAPI_URL=http://localhost:1337 STRAPI_ADMIN_TOKEN=<token> npx ts-node scripts/full-migration.ts --dry-run
 *   STRAPI_URL=http://localhost:1337 STRAPI_ADMIN_TOKEN=<token> npx ts-node scripts/full-migration.ts --skip-scrape
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// ─── Config ────────────────────────────────────────────────────────────────────

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_ADMIN_TOKEN = process.env.STRAPI_ADMIN_TOKEN || '';
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_SCRAPE = process.argv.includes('--skip-scrape');
const SKIP_SEED = process.argv.includes('--skip-seed');

const OUTPUT_DIR = path.join(__dirname, 'output');
const AUDIT_FILE = path.join(OUTPUT_DIR, 'joomla-audit.json');
const ERROR_LOG = path.join(OUTPUT_DIR, 'migration-errors.log');
const BASE_URL = 'https://www.plexonics.com';

// ─── Taxonomy Data ─────────────────────────────────────────────────────────────

const DOMAINS = [
  { name: 'Enterprise Networking',  slug: 'enterprise-networking',  sortOrder: 1, icon: '🌐', shortDescription: 'Switches, routers, SFP modules, wireless and network infrastructure.' },
  { name: 'Enterprise Surveillance',slug: 'enterprise-surveillance', sortOrder: 2, icon: '📷', shortDescription: 'IP cameras, NVRs, and complete video surveillance systems.' },
  { name: 'Professional Displays',  slug: 'professional-displays',  sortOrder: 3, icon: '🖥️', shortDescription: 'Professional monitors, digital signage, and video wall solutions.' },
  { name: 'Industrial Networking',  slug: 'industrial-networking',  sortOrder: 4, icon: '🏭', shortDescription: 'Ruggedised networking equipment for industrial environments.' },
  { name: 'Networking PA System',   slug: 'networking-pa-system',   sortOrder: 5, icon: '📢', shortDescription: 'IP-based public address and emergency communication systems.' },
  { name: 'Video Conference',       slug: 'video-conference',       sortOrder: 6, icon: '🎥', shortDescription: 'PTZ cameras, all-in-one endpoints, and professional microphones.' },
  { name: 'Servers & Storage',      slug: 'servers-storage',        sortOrder: 7, icon: '🖧', shortDescription: 'Surveillance servers, rack workstations, NAS, and local processing units.' },
  { name: 'Enterprise Software',    slug: 'enterprise-software',    sortOrder: 8, icon: '💻', shortDescription: 'SD-WAN, VMS, AI analytics, ITMS, and cloud solutions.' },
];

const FAMILIES: Record<string, Array<{ name: string; slug: string; sortOrder: number; shortDescription?: string }>> = {
  'enterprise-networking': [
    { name: 'Switches',              slug: 'switches',              sortOrder: 1 },
    { name: 'Routers',               slug: 'routers',               sortOrder: 2 },
    { name: 'SFP Modules',           slug: 'sfp-modules',           sortOrder: 3 },
    { name: 'Media Convertors',      slug: 'media-convertors',      sortOrder: 4 },
    { name: 'Wireless',              slug: 'wireless',              sortOrder: 5 },
    { name: 'Network Infrastructure',slug: 'network-infrastructure',sortOrder: 6 },
  ],
  'enterprise-surveillance': [
    { name: 'MAXECO Series',    slug: 'maxeco-series',    sortOrder: 1 },
    { name: 'MAX360 Series',    slug: 'max360-series',    sortOrder: 2 },
    { name: 'MAXVIEW Series',   slug: 'maxview-series',   sortOrder: 3 },
    { name: 'MAXOBILE Series',  slug: 'maxobile-series',  sortOrder: 4 },
    { name: 'MAXVALUE Series',  slug: 'maxvalue-series',  sortOrder: 5 },
    { name: 'Camera Accessories',slug:'camera-accessories',sortOrder: 6 },
  ],
  'professional-displays': [
    { name: 'Professional Monitors', slug: 'professional-monitors', sortOrder: 1 },
    { name: 'Digital Signage',       slug: 'digital-signage',       sortOrder: 2 },
    { name: 'Video Wall',            slug: 'video-wall',            sortOrder: 3 },
  ],
  'industrial-networking': [
    { name: 'Industrial Switches',    slug: 'industrial-switches',    sortOrder: 1 },
    { name: 'Industrial Cameras',     slug: 'industrial-cameras',     sortOrder: 2 },
    { name: 'Industrial Displays',    slug: 'industrial-displays',    sortOrder: 3 },
    { name: 'Industrial Gateways',    slug: 'industrial-gateways',    sortOrder: 4 },
    { name: 'Industrial Servers',     slug: 'industrial-servers',     sortOrder: 5 },
    { name: 'Industrial Accessories', slug: 'industrial-accessories', sortOrder: 6 },
  ],
  'networking-pa-system': [
    { name: 'Paging Devices',           slug: 'paging-devices',           sortOrder: 1 },
    { name: 'Emergency Call Box',       slug: 'emergency-call-box',       sortOrder: 2 },
    { name: 'IP PA Server',             slug: 'ip-pa-server',             sortOrder: 3 },
    { name: 'Outdoor IP Column Speaker',slug: 'outdoor-ip-column-speaker',sortOrder: 4 },
  ],
  'video-conference': [
    { name: 'USB PTZ Cameras',       slug: 'usb-ptz-cameras',       sortOrder: 1 },
    { name: 'All-in-One PTZ Cameras',slug: 'all-in-one-ptz-cameras',sortOrder: 2 },
    { name: 'All-in-One End Points', slug: 'all-in-one-end-points', sortOrder: 3 },
    { name: 'Enterprise End Points', slug: 'enterprise-end-points', sortOrder: 4 },
    { name: 'Professional Microphone',slug:'professional-microphone',sortOrder: 5 },
  ],
  'servers-storage': [
    { name: 'Surveillance Servers',   slug: 'surveillance-servers',   sortOrder: 1 },
    { name: 'Rack Workstation',       slug: 'rack-workstation',       sortOrder: 2 },
    { name: 'Box Servers',            slug: 'box-servers',            sortOrder: 3 },
    { name: 'Network Attached Storage',slug:'network-attached-storage',sortOrder: 4 },
    { name: 'Local Processing Units', slug: 'local-processing-units', sortOrder: 5 },
  ],
  'enterprise-software': [
    { name: 'SD-WAN',                    slug: 'software-defined-wan',       sortOrder: 1 },
    { name: 'Network Management Software',slug:'network-management-software', sortOrder: 2 },
    { name: 'Video Management Software', slug: 'video-management-software',  sortOrder: 3 },
    { name: 'AI Video Analytics',        slug: 'ai-based-video-analytics',   sortOrder: 4 },
    { name: 'ITMS Solutions',            slug: 'itms-solutions',             sortOrder: 5 },
    { name: 'Vehicle Tracking System',   slug: 'vehicle-tracking-system',    sortOrder: 6 },
    { name: 'Cloud Video Conference',    slug: 'cloud-video-conference-system',sortOrder: 7 },
    { name: 'Cloud Public Addressing',   slug: 'cloud-public-addressing-system',sortOrder: 8 },
  ],
};

const CATEGORIES: Record<string, Array<{ name: string; slug: string; sortOrder: number }>> = {
  'switches': [
    { name: 'Unmanaged Switches',     slug: 'unmanaged-switches',     sortOrder: 1 },
    { name: 'Smart Managed Switches', slug: 'smart-managed-switches', sortOrder: 2 },
    { name: 'L2 Managed Switches',    slug: 'l2-managed-switches',    sortOrder: 3 },
    { name: 'L3 Managed Switches',    slug: 'l3-managed-switches',    sortOrder: 4 },
    { name: 'Datacenter Switches',    slug: 'datacenter-switches',    sortOrder: 5 },
  ],
  'routers': [
    { name: 'Multiservice Edge Routers', slug: 'multiservice-edge-routers', sortOrder: 1 },
    { name: 'Aggregation Routers',       slug: 'aggregation-routers',       sortOrder: 2 },
    { name: 'Core Routers',              slug: 'core-routers',              sortOrder: 3 },
    { name: 'VPN Routers',               slug: 'vpn-routers',               sortOrder: 4 },
    { name: 'Gateway Routers',           slug: 'gateway-routers',           sortOrder: 5 },
  ],
  'sfp-modules': [
    { name: 'Fast Ethernet SFP Modules', slug: 'fast-ethernet-sfp-modules', sortOrder: 1 },
    { name: '1G SFP Modules',            slug: '1g-sfp-modules',            sortOrder: 2 },
    { name: '1G Copper SFP Transceiver', slug: '1g-copper-sfp-transceiver', sortOrder: 3 },
    { name: '10G SFP Modules',           slug: '10g-sfp-modules',           sortOrder: 4 },
    { name: '10G SFP MM Transceiver',    slug: '10g-sfp-mm-transceiver',    sortOrder: 5 },
    { name: '40G QSFP Modules',          slug: '40g-qsfp-modules',          sortOrder: 6 },
    { name: '100G QSFP28 Modules',       slug: '100g-qsfp28-modules',       sortOrder: 7 },
  ],
  'media-convertors': [
    { name: 'Fast Ethernet Media Convertors', slug: 'fast-ethernet-media-convertors', sortOrder: 1 },
    { name: 'Gigabit Media Convertors',       slug: 'gigabit-media-convertors',       sortOrder: 2 },
    { name: '10G Media Convertors',           slug: '10g-media-convertors',           sortOrder: 3 },
    { name: 'Media Convertor Chassis',        slug: 'media-convertor-chassis',        sortOrder: 4 },
  ],
  'wireless': [
    { name: 'Indoor Access Point',  slug: 'indoor-access-point',  sortOrder: 1 },
    { name: 'Outdoor Access Point', slug: 'outdoor-access-point', sortOrder: 2 },
    { name: 'Wireless Controllers', slug: 'wireless-controllers', sortOrder: 3 },
    { name: 'Wireless Adaptor',     slug: 'wireless-adaptor',     sortOrder: 4 },
  ],
  'network-infrastructure': [
    { name: 'Copper Cables',     slug: 'copper-cables',     sortOrder: 1 },
    { name: 'Fiber Cables',      slug: 'fiber-cables',      sortOrder: 2 },
    { name: 'Copper Accessories',slug: 'copper-accessories',sortOrder: 3 },
    { name: 'Fiber Accessories', slug: 'fiber-accessories', sortOrder: 4 },
    { name: 'Network Racks',     slug: 'network-racks',     sortOrder: 5 },
    { name: 'Server Racks',      slug: 'server-racks',      sortOrder: 6 },
  ],
  'maxeco-series': [
    { name: 'Indoor Dome Cameras',  slug: 'indoor-dome-cameras',  sortOrder: 1 },
    { name: 'Outdoor Dome Cameras', slug: 'outdoor-dome-cameras', sortOrder: 2 },
    { name: 'Outdoor Bullet Cameras',slug:'outdoor-bullet-cameras',sortOrder: 3 },
    { name: 'Outdoor PTZ Cameras',  slug: 'outdoor-ptz-cameras',  sortOrder: 4 },
    { name: 'Network Video Recorder',slug:'network-video-recorder',sortOrder: 5 },
  ],
  'max360-series': [
    { name: 'Indoor Dome Cameras 360',    slug: 'indoor-dome-cameras-360',    sortOrder: 1 },
    { name: 'Outdoor Dome Cameras 360',   slug: 'outdoor-dome-cameras-360',   sortOrder: 2 },
    { name: 'Outdoor Bullet Cameras 360', slug: 'outdoor-bullet-cameras-360', sortOrder: 3 },
    { name: 'Outdoor PTZ Cameras 360',    slug: 'outdoor-ptz-cameras-360',    sortOrder: 4 },
    { name: 'Outdoor Fisheye Cameras',    slug: 'outdoor-fisheye-cameras',    sortOrder: 5 },
    { name: 'Panoramic Tracking Cameras', slug: 'panoramic-tracking-cameras', sortOrder: 6 },
    { name: 'Network Video Recorder 360', slug: 'network-video-recorder-360', sortOrder: 7 },
    { name: 'Outdoor Thermal Camera',     slug: 'outdoor-thermal-camera',     sortOrder: 8 },
  ],
  'maxview-series': [
    { name: 'Indoor Dome Cameras MV',    slug: 'indoor-dome-cameras-mv',    sortOrder: 1 },
    { name: 'Outdoor Dome Cameras MV',   slug: 'outdoor-dome-cameras-mv',   sortOrder: 2 },
    { name: 'Outdoor Bullet Cameras MV', slug: 'outdoor-bullet-cameras-mv', sortOrder: 3 },
    { name: 'Outdoor PTZ Cameras MV',    slug: 'outdoor-ptz-cameras-mv',    sortOrder: 4 },
    { name: 'Panoramic View Cameras',    slug: 'panoramic-view-cameras',    sortOrder: 5 },
    { name: 'Network Video Recorder MV', slug: 'network-video-recorder-mv', sortOrder: 6 },
  ],
  'maxobile-series': [
    { name: 'Mobile Indoor Cameras',  slug: 'mobile-indoor-cameras',  sortOrder: 1 },
    { name: 'Mobile Outdoor Cameras', slug: 'mobile-outdoor-cameras', sortOrder: 2 },
    { name: 'Mobile PTZ Cameras',     slug: 'mobile-ptz-cameras',     sortOrder: 3 },
    { name: 'Vehicle Tracking Device',slug: 'vehicle-tracking-device',sortOrder: 4 },
    { name: 'Mobile NVR',             slug: 'mobile-nvr',             sortOrder: 5 },
    { name: 'Body Worn Cameras',      slug: 'body-worn-cameras',      sortOrder: 6 },
    { name: 'Medical Equipment',      slug: 'medical-equipment',      sortOrder: 7 },
  ],
  'maxvalue-series': [
    { name: 'Indoor Dome Cameras VAL',       slug: 'indoor-dome-cameras-val',       sortOrder: 1 },
    { name: 'Outdoor Dome Cameras VAL',      slug: 'outdoor-dome-cameras-val',      sortOrder: 2 },
    { name: 'NDAA AI Outdoor Dome Cameras',  slug: 'ndaa-ai-outdoor-dome-cameras',  sortOrder: 3 },
    { name: 'Outdoor PTZ Cameras VAL',       slug: 'outdoor-ptz-cameras-val',       sortOrder: 4 },
    { name: 'NDAA AI Outdoor PTZ Cameras',   slug: 'ndaa-ai-outdoor-ptz-cameras',   sortOrder: 5 },
    { name: 'Outdoor FR Cameras',            slug: 'outdoor-fr-cameras',            sortOrder: 6 },
    { name: 'Outdoor ANPR Cameras',          slug: 'outdoor-anpr-cameras',          sortOrder: 7 },
    { name: 'Network Video Recorder VAL',    slug: 'network-video-recorder-val',    sortOrder: 8 },
    { name: 'Outdoor Bullet Cameras VAL',    slug: 'outdoor-bullet-cameras-val',    sortOrder: 9 },
    { name: 'NDAA AI Outdoor Bullet Cameras',slug: 'ndaa-ai-outdoor-bullet-cameras',sortOrder: 10 },
    { name: 'NDAA AI Outdoor Box Cameras',   slug: 'ndaa-ai-outdoor-box-cameras',   sortOrder: 11 },
  ],
  'camera-accessories': [
    { name: 'Network Joystick', slug: 'network-joystick', sortOrder: 1 },
    { name: 'Cameras Lens',     slug: 'cameras-lens',     sortOrder: 2 },
    { name: 'Camera Housing',   slug: 'camera-housing',   sortOrder: 3 },
    { name: 'Camera Mic',       slug: 'camera-mic',       sortOrder: 4 },
    { name: 'IR Illuminator',   slug: 'ir-illuminator',   sortOrder: 5 },
  ],
  'professional-monitors': [{ name: 'Professional Monitors', slug: 'professional-monitors-cat', sortOrder: 1 }],
  'digital-signage': [
    { name: 'Indoor Digital Signage', slug: 'indoor-digital-signage', sortOrder: 1 },
    { name: 'Outdoor Digital Signage',slug: 'outdoor-digital-signage',sortOrder: 2 },
    { name: 'Interactive Displays',   slug: 'interactive-displays',   sortOrder: 3 },
  ],
  'video-wall': [
    { name: 'LCD Video Wall',        slug: 'lcd-video-wall',        sortOrder: 1 },
    { name: 'LED Video Wall',        slug: 'led-video-wall',        sortOrder: 2 },
    { name: 'Video Wall Controllers',slug: 'video-wall-controllers',sortOrder: 3 },
  ],
  'industrial-switches': [
    { name: 'Unmanaged Industrial Switches',  slug: 'unmanaged-industrial-switches',  sortOrder: 1 },
    { name: 'L2 Managed Industrial Switches', slug: 'l2-managed-industrial-switches', sortOrder: 2 },
    { name: 'L3 Managed Industrial Switches', slug: 'l3-managed-industrial-switches', sortOrder: 3 },
    { name: 'Industrial Power Supply',        slug: 'industrial-power-supply',        sortOrder: 4 },
  ],
  'industrial-cameras': [
    { name: 'Corrosion Proof Cameras',       slug: 'corrosion-proof-cameras',       sortOrder: 1 },
    { name: 'Explosion Proof Cameras',       slug: 'explosion-proof-cameras',       sortOrder: 2 },
    { name: 'Thermal Cameras',               slug: 'thermal-cameras',               sortOrder: 3 },
    { name: 'Industrial Cameras Accessories',slug: 'industrial-cameras-accessories',sortOrder: 4 },
  ],
  'industrial-displays':    [{ name: 'Panel PCs', slug: 'panel-pcs', sortOrder: 1 }, { name: 'Industrial Monitors', slug: 'industrial-monitors', sortOrder: 2 }],
  'industrial-gateways':    [{ name: 'IoT Gateways', slug: 'iot-gateways', sortOrder: 1 }, { name: 'Protocol Converters', slug: 'protocol-converters', sortOrder: 2 }],
  'industrial-servers':     [{ name: 'Fanless Servers', slug: 'fanless-servers', sortOrder: 1 }, { name: 'Ruggedised Servers', slug: 'ruggedised-servers', sortOrder: 2 }],
  'industrial-accessories': [{ name: 'Industrial Power Supplies', slug: 'industrial-power-supplies', sortOrder: 1 }, { name: 'Industrial Enclosures', slug: 'industrial-enclosures', sortOrder: 2 }],
  'paging-devices':         [{ name: 'IP Paging Adapters', slug: 'ip-paging-adapters', sortOrder: 1 }, { name: 'Paging Controllers', slug: 'paging-controllers', sortOrder: 2 }],
  'emergency-call-box':     [{ name: 'Emergency Intercom', slug: 'emergency-intercom', sortOrder: 1 }, { name: 'Emergency Call Stations', slug: 'emergency-call-stations', sortOrder: 2 }],
  'ip-pa-server':           [{ name: 'IP PA Servers', slug: 'ip-pa-servers', sortOrder: 1 }],
  'outdoor-ip-column-speaker': [{ name: 'IP Column Speakers', slug: 'ip-column-speakers', sortOrder: 1 }, { name: 'IP Horn Speakers', slug: 'ip-horn-speakers', sortOrder: 2 }],
  'usb-ptz-cameras':        [{ name: 'USB PTZ Cameras', slug: 'usb-ptz-cameras-cat', sortOrder: 1 }],
  'all-in-one-ptz-cameras': [{ name: 'All-in-One PTZ Cameras', slug: 'all-in-one-ptz-cameras-cat', sortOrder: 1 }],
  'all-in-one-end-points':  [{ name: 'Huddle Room Systems', slug: 'huddle-room-systems', sortOrder: 1 }, { name: 'Meeting Room Systems', slug: 'meeting-room-systems', sortOrder: 2 }],
  'enterprise-end-points':  [{ name: 'Enterprise Video Endpoints', slug: 'enterprise-video-endpoints', sortOrder: 1 }],
  'professional-microphone':[{ name: 'Beamforming Microphones', slug: 'beamforming-microphones', sortOrder: 1 }, { name: 'Array Microphones', slug: 'array-microphones', sortOrder: 2 }],
  'surveillance-servers':   [{ name: 'NVR Servers', slug: 'nvr-servers', sortOrder: 1 }, { name: 'AI Surveillance Servers', slug: 'ai-surveillance-servers', sortOrder: 2 }],
  'rack-workstation':       [{ name: '1U Rack Workstations', slug: '1u-rack-workstations', sortOrder: 1 }, { name: '2U Rack Workstations', slug: '2u-rack-workstations', sortOrder: 2 }],
  'box-servers':            [{ name: 'Tower Servers', slug: 'tower-servers', sortOrder: 1 }, { name: 'Mini Tower Servers', slug: 'mini-tower-servers', sortOrder: 2 }],
  'network-attached-storage':[{ name: 'Desktop NAS', slug: 'desktop-nas', sortOrder: 1 }, { name: 'Rack NAS', slug: 'rack-nas', sortOrder: 2 }],
  'local-processing-units': [{ name: 'Edge AI Units', slug: 'edge-ai-units', sortOrder: 1 }, { name: 'Local Processing Units', slug: 'local-processing-units-cat', sortOrder: 2 }],
  'software-defined-wan':   [{ name: 'SD-WAN Appliances', slug: 'sd-wan-appliances', sortOrder: 1 }, { name: 'SD-WAN Software', slug: 'sd-wan-software', sortOrder: 2 }],
  'network-management-software': [{ name: 'Network Monitoring', slug: 'network-monitoring', sortOrder: 1 }, { name: 'Network Configuration', slug: 'network-configuration', sortOrder: 2 }],
  'video-management-software':   [{ name: 'VMS Licenses', slug: 'vms-licenses', sortOrder: 1 }, { name: 'VMS Appliances', slug: 'vms-appliances', sortOrder: 2 }],
  'ai-based-video-analytics':    [{ name: 'AI Analytics Software', slug: 'ai-analytics-software', sortOrder: 1 }, { name: 'AI Analytics Appliances', slug: 'ai-analytics-appliances', sortOrder: 2 }],
  'itms-solutions':         [{ name: 'Traffic Management', slug: 'traffic-management', sortOrder: 1 }, { name: 'Parking Management', slug: 'parking-management', sortOrder: 2 }],
  'vehicle-tracking-system':[{ name: 'GPS Trackers', slug: 'gps-trackers', sortOrder: 1 }, { name: 'Fleet Management Software', slug: 'fleet-management-software', sortOrder: 2 }],
  'cloud-video-conference-system':  [{ name: 'Cloud VC Licenses', slug: 'cloud-vc-licenses', sortOrder: 1 }],
  'cloud-public-addressing-system': [{ name: 'Cloud PA Licenses', slug: 'cloud-pa-licenses', sortOrder: 1 }],
};

const SERIES = [
  { name: 'MAXECO',   slug: 'maxeco',   seriesCode: 'MAXECO',   familySlug: 'maxeco-series',   sortOrder: 1 },
  { name: 'MAX360',   slug: 'max360',   seriesCode: 'MAX360',   familySlug: 'max360-series',   sortOrder: 2 },
  { name: 'MAXVIEW',  slug: 'maxview',  seriesCode: 'MAXVIEW',  familySlug: 'maxview-series',  sortOrder: 3 },
  { name: 'MAXOBILE', slug: 'maxobile', seriesCode: 'MAXOBILE', familySlug: 'maxobile-series', sortOrder: 4 },
  { name: 'MAXVALUE', slug: 'maxvalue', seriesCode: 'MAXVALUE', familySlug: 'maxvalue-series', sortOrder: 5 },
];

// ─── URL Mapping ───────────────────────────────────────────────────────────────

const URL_DOMAIN_MAP: Record<string, string> = {
  'enterprise-networking': 'enterprise-networking',
  'enterprise-surveillance': 'enterprise-surveillance',
  'professional-displays': 'professional-displays',
  'industrial-networking': 'industrial-networking',
  'networking-pa-system': 'networking-pa-system',
  'video-conference': 'video-conference',
  'servers-storage': 'servers-storage',
  'enterprise-software': 'enterprise-software',
  'servers-and-storage': 'servers-storage',
  'networking': 'enterprise-networking',
  'surveillance': 'enterprise-surveillance',
  'displays': 'professional-displays',
  'industrial': 'industrial-networking',
  'pa-system': 'networking-pa-system',
  'video-conferencing': 'video-conference',
  'servers': 'servers-storage',
  'software': 'enterprise-software',
};

const URL_FAMILY_MAP: Record<string, string> = {
  'cameras-accessories': 'camera-accessories',
  'software-defined-wan': 'software-defined-wan',
  'ai-based-video-analytics': 'ai-based-video-analytics',
  'cloud-video-conference-system': 'cloud-video-conference-system',
  'cloud-public-addressing-system': 'cloud-public-addressing-system',
};

const URL_CATEGORY_MAP: Record<string, string> = {
  'l2-managed-industrial-switches': 'l2-managed-industrial-switches',
  'l3-managed-industrial-switches': 'l3-managed-industrial-switches',
  'industrial-power-supply': 'industrial-power-supply',
  'corrosion-proof-cameras': 'corrosion-proof-cameras',
  'industrial-cameras-accessories': 'industrial-cameras-accessories',
};

function extractTaxonomyFromUrl(url: string) {
  const urlPath = url.replace(/^https?:\/\/[^/]+/, '');
  const segments = urlPath
    .replace('/index.php/products/', '')
    .replace('/products/', '')
    .split('/').filter(Boolean);
  return {
    domainSlug:   URL_DOMAIN_MAP[segments[0] ?? '']   ?? (segments[0] ?? ''),
    familySlug:   URL_FAMILY_MAP[segments[1] ?? '']   ?? (segments[1] ?? ''),
    categorySlug: URL_CATEGORY_MAP[segments[2] ?? ''] ?? (segments[2] ?? ''),
  };
}

function isPdfManual(filename: string): boolean {
  const l = filename.toLowerCase();
  return l.includes('manual') || l.includes('guide') || l.includes('installation') || l.includes('user');
}

// ─── HTTP Helpers ──────────────────────────────────────────────────────────────

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

function fetchUrl(url: string, retries = 3): Promise<string> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, {
      headers: { 'User-Agent': 'PlexonicsMigrationBot/1.0 (contact info@plexonics.com)', Accept: 'text/html' },
    }, (res) => {
      if (res.statusCode && [301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        const next = res.headers.location.startsWith('http') ? res.headers.location : `${BASE_URL}${res.headers.location}`;
        resolve(fetchUrl(next, retries));
        return;
      }
      if (res.statusCode && res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode} for ${url}`)); return; }
      let data = ''; res.setEncoding('utf8');
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', async (err) => {
      if (retries > 0) { await sleep(1000); resolve(fetchUrl(url, retries - 1)); }
      else reject(err);
    });
    req.setTimeout(20000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

function fetchBuffer(url: string, retries = 3): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    const req = lib.get(url, { headers: { 'User-Agent': 'PlexonicsMigrationBot/1.0' } }, (res) => {
      if (res.statusCode && [301,302,303,307,308].includes(res.statusCode) && res.headers.location) {
        resolve(fetchBuffer(res.headers.location, retries)); return;
      }
      if (res.statusCode && res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
      const chunks: Buffer[] = [];
      res.on('data', c => chunks.push(Buffer.from(c)));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', async (err) => {
      if (retries > 0) { await sleep(1000); resolve(fetchBuffer(url, retries - 1)); }
      else reject(err);
    });
    req.setTimeout(30000, () => { req.destroy(); reject(new Error(`Timeout buffer: ${url}`)); });
  });
}

async function strapiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
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
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          if (res.statusCode && res.statusCode >= 400) reject(new Error(`HTTP ${res.statusCode}: ${d.slice(0,200)}`));
          else resolve(parsed as T);
        } catch { reject(new Error(`Parse error: ${d.slice(0,200)}`)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function uploadFileToStrapi(fileBuffer: Buffer, filename: string, mimeType: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const boundary = `----FormBoundary${Date.now()}`;
    const url = new URL(`${STRAPI_URL}/api/upload`);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    const header = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`);
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const body = Buffer.concat([header, fileBuffer, footer]);
    const options = {
      hostname: url.hostname, port: url.port || (isHttps ? 443 : 80),
      path: url.pathname, method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length, Authorization: `Bearer ${STRAPI_ADMIN_TOKEN}` },
    };
    const req = lib.request(options, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(d);
          if (res.statusCode && res.statusCode >= 400) { reject(new Error(`Upload failed ${res.statusCode}: ${d.slice(0,200)}`)); return; }
          const fileId = Array.isArray(parsed) ? parsed[0]?.id : parsed?.id;
          if (!fileId) reject(new Error(`No file ID: ${d.slice(0,200)}`));
          else resolve(fileId);
        } catch { reject(new Error(`Upload parse error: ${d.slice(0,200)}`)); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function findBySlug(endpoint: string, slug: string): Promise<number | null> {
  const res = await strapiRequest<{ data: Array<{ id: number }> }>('GET', `/${endpoint}?filters[slug][$eq]=${encodeURIComponent(slug)}&pagination[pageSize]=1`);
  return res.data[0]?.id ?? null;
}

async function findProductByModelCode(modelCode: string): Promise<number | null> {
  if (!modelCode) return null;
  const res = await strapiRequest<{ data: Array<{ id: number }> }>('GET', `/products?filters[modelCode][$eq]=${encodeURIComponent(modelCode)}&pagination[pageSize]=1`);
  return res.data[0]?.id ?? null;
}

function logError(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(ERROR_LOG, line);
  console.error(`  ✗ ${msg}`);
}

// ─── HTML Parsing ──────────────────────────────────────────────────────────────

function extractPdfLinks(html: string): string[] {
  const links: string[] = [];
  const re = /href=["']([^"']*\.pdf[^"']*)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1];
    if (href.startsWith('http')) links.push(href);
    else if (href.startsWith('/')) links.push(`${BASE_URL}${href}`);
  }
  return [...new Set(links)];
}

function extractImageLinks(html: string): string[] {
  const links: string[] = [];
  const re = /src=["']([^"']*\.(jpg|jpeg|png|webp)[^"']*)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const src = m[1];
    if (src.startsWith('http')) links.push(src);
    else if (src.startsWith('/')) links.push(`${BASE_URL}${src}`);
  }
  return [...new Set(links)].filter(u => !u.includes('/templates/') && !u.includes('/media/system/'));
}

function extractText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim();
}

function extractTitle(html: string): string {
  const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1) return h1[1].trim();
  const title = html.match(/<title>([^<]+)<\/title>/i);
  if (title) return title[1].replace(/\s*[-|]\s*Plexonics.*/i, '').trim();
  return '';
}

function extractModelCode(text: string): string {
  const patterns = [
    /\b(PL-[A-Z0-9-]{3,})\b/,
    /\b(MAXECO-[A-Z0-9-]+)\b/i,
    /\b(MAX360-[A-Z0-9-]+)\b/i,
    /\b(MAXVIEW-[A-Z0-9-]+)\b/i,
    /\b([A-Z]{2,3}-[A-Z0-9]{2,}-[A-Z0-9-]+)\b/,
    /Model[:\s]+([A-Z0-9-]{4,})/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[1];
  }
  return '';
}

// ─── Scraper ───────────────────────────────────────────────────────────────────

interface ProductEntry {
  url: string; name: string; modelCode: string;
  pdfLinks: string[]; imageLinks: string[]; rawText: string;
}

async function discoverProductUrls(): Promise<string[]> {
  console.log('\n🔍 Discovering product URLs...');
  const urls = new Set<string>();

  // Try sitemap
  try {
    const sitemap = await fetchUrl(`${BASE_URL}/sitemap.xml`);
    for (const m of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      if (m[1].includes('/products/')) urls.add(m[1]);
    }
    console.log(`  Sitemap: ${urls.size} product URLs`);
  } catch { console.log('  No sitemap, crawling nav...'); }

  // Crawl nav from homepage
  try {
    const html = await fetchUrl(BASE_URL);
    const hrefRe = /href=["']([^"']*\/products\/[^"']+)["']/gi;
    let m;
    while ((m = hrefRe.exec(html)) !== null) {
      const href = m[1].startsWith('http') ? m[1] : `${BASE_URL}${m[1]}`;
      if (href.includes(BASE_URL)) urls.add(href);
    }
  } catch (e) { console.warn('  Homepage crawl failed:', e); }

  // Also crawl the products page directly to get all nav links
  try {
    const html = await fetchUrl(`${BASE_URL}/index.php/products`);
    const hrefRe = /href=["']([^"']*\/products\/[^"']+)["']/gi;
    let m;
    while ((m = hrefRe.exec(html)) !== null) {
      const href = m[1].startsWith('http') ? m[1] : `${BASE_URL}${m[1]}`;
      if (href.includes(BASE_URL)) urls.add(href);
    }
    console.log(`  After nav crawl: ${urls.size} URLs`);
  } catch (e) { console.warn('  Products page crawl failed:', e); }

  // Filter to only leaf product pages (5 segments deep: /products/domain/family/category/product)
  const productUrls = Array.from(urls).filter(url => {
    const path = url.replace(/^https?:\/\/[^/]+/, '').replace('/index.php', '');
    const segments = path.split('/').filter(Boolean);
    return segments.length >= 5; // /products/domain/family/category/product-slug
  });

  console.log(`  Found ${productUrls.length} product detail URLs`);
  return productUrls;
}

async function scrapeProduct(url: string): Promise<ProductEntry> {
  const html = await fetchUrl(url);
  const rawText = extractText(html);
  const name = extractTitle(html);
  const modelCode = extractModelCode(rawText);
  return {
    url, name, modelCode,
    pdfLinks: extractPdfLinks(html),
    imageLinks: extractImageLinks(html),
    rawText: rawText.slice(0, 2000),
  };
}

// ─── STEP 1: Seed Taxonomy ─────────────────────────────────────────────────────

async function seedTaxonomy(): Promise<{ domainIds: Map<string,number>; familyIds: Map<string,number> }> {
  console.log('\n━━━ STEP 1: Seeding Taxonomy ━━━');
  const domainIds = new Map<string, number>();
  const familyIds = new Map<string, number>();

  // Domains
  console.log('\n📦 Domains...');
  for (const domain of DOMAINS) {
    const existing = await findBySlug('product-domains', domain.slug);
    if (existing) {
      console.log(`  ✓ ${domain.name}`);
      domainIds.set(domain.slug, existing);
    } else {
      const res = await strapiRequest<{ data: { id: number } }>('POST', '/product-domains', { data: domain });
      console.log(`  + ${domain.name} (id: ${res.data.id})`);
      domainIds.set(domain.slug, res.data.id);
    }
  }

  // Families
  console.log('\n📁 Families...');
  for (const [domainSlug, families] of Object.entries(FAMILIES)) {
    const domainId = domainIds.get(domainSlug);
    if (!domainId) { console.warn(`  ⚠ Domain not found: ${domainSlug}`); continue; }
    for (const family of families) {
      const existing = await findBySlug('product-families', family.slug);
      if (existing) {
        console.log(`  ✓ ${family.name}`);
        familyIds.set(family.slug, existing);
      } else {
        const res = await strapiRequest<{ data: { id: number } }>('POST', '/product-families', { data: { ...family, domain: domainId } });
        console.log(`  + ${family.name} (id: ${res.data.id})`);
        familyIds.set(family.slug, res.data.id);
      }
    }
  }

  // Categories
  console.log('\n🗂  Categories...');
  let catCount = 0;
  for (const [familySlug, categories] of Object.entries(CATEGORIES)) {
    const familyId = familyIds.get(familySlug);
    if (!familyId) { console.warn(`  ⚠ Family not found: ${familySlug}`); continue; }
    for (const cat of categories) {
      const existing = await findBySlug('product-categories', cat.slug);
      if (!existing) {
        await strapiRequest('POST', '/product-categories', { data: { ...cat, family: familyId } });
        catCount++;
      }
    }
  }
  console.log(`  Created ${catCount} new categories`);

  // Series
  console.log('\n🏷  Series...');
  for (const series of SERIES) {
    const familyId = familyIds.get(series.familySlug);
    if (!familyId) continue;
    const existing = await findBySlug('product-series', series.slug);
    if (!existing) {
      await strapiRequest('POST', '/product-series', { data: { name: series.name, slug: series.slug, seriesCode: series.seriesCode, sortOrder: series.sortOrder, family: familyId } });
      console.log(`  + ${series.name}`);
    } else {
      console.log(`  ✓ ${series.name}`);
    }
  }

  console.log('\n✅ Taxonomy seeded');
  return { domainIds, familyIds };
}

// ─── STEP 2: Scrape Live Site ──────────────────────────────────────────────────

async function scrapeSite(): Promise<ProductEntry[]> {
  console.log('\n━━━ STEP 2: Scraping www.plexonics.com ━━━');

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const productUrls = await discoverProductUrls();
  if (productUrls.length === 0) {
    console.log('⚠ No product URLs found. Check if site is accessible.');
    return [];
  }

  const products: ProductEntry[] = [];
  const errors: Array<{ url: string; error: string }> = [];
  const BATCH = 3;

  for (let i = 0; i < productUrls.length; i += BATCH) {
    const batch = productUrls.slice(i, i + BATCH);
    const results = await Promise.allSettled(batch.map(url => scrapeProduct(url)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        products.push(r.value);
        process.stdout.write(`\r  Scraped ${products.length}/${productUrls.length} — ${r.value.name.slice(0,40)}`);
      } else {
        errors.push({ url: batch[idx], error: String(r.reason) });
      }
    });
    if (i + BATCH < productUrls.length) await sleep(300);
  }

  console.log(`\n  Done: ${products.length} products, ${errors.length} errors`);

  // Save audit file
  fs.writeFileSync(AUDIT_FILE, JSON.stringify({ crawledAt: new Date().toISOString(), totalProducts: products.length, products }, null, 2));

  // Save CSV
  const csv = ['productUrl,pdfUrl,filename', ...products.flatMap(p => p.pdfLinks.map(pdf => `"${p.url}","${pdf}","${pdf.split('/').pop()}"`))]
  fs.writeFileSync(path.join(OUTPUT_DIR, 'pdf-links.csv'), csv.join('\n'));

  console.log(`  Saved to ${AUDIT_FILE}`);
  return products;
}

// ─── STEP 3: Migrate Products ──────────────────────────────────────────────────

async function migrateProducts(products: ProductEntry[]): Promise<void> {
  console.log(`\n━━━ STEP 3: Migrating ${products.length} Products ━━━`);
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!DRY_RUN) fs.writeFileSync(ERROR_LOG, '');

  let created = 0, skipped = 0, failed = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    process.stdout.write(`\r  [${i+1}/${products.length}] ${product.name.slice(0,50).padEnd(50)}`);

    if (!product.name || product.name.length < 2) { skipped++; continue; }

    // Skip if already exists
    if (product.modelCode) {
      const existing = await findProductByModelCode(product.modelCode);
      if (existing) { skipped++; continue; }
    }

    const { domainSlug, familySlug, categorySlug } = extractTaxonomyFromUrl(product.url);
    const domainId   = domainSlug   ? await findBySlug('product-domains',    domainSlug)   : null;
    const familyId   = familySlug   ? await findBySlug('product-families',   familySlug)   : null;
    const categoryId = categorySlug ? await findBySlug('product-categories', categorySlug) : null;

    if (!domainId || !familyId) {
      logError(`Taxonomy not found for: ${product.url} (domain:${domainSlug}, family:${familySlug})`);
      failed++; continue;
    }

    // Upload main image
    let mainImageId: number | null = null;
    if (!DRY_RUN && product.imageLinks.length > 0) {
      // Pick the most likely product image (not icons/logos)
      const imgUrl = product.imageLinks.find(u => u.includes('/images/') && !u.includes('logo') && !u.includes('icon')) || product.imageLinks[0];
      try {
        const buf = await fetchBuffer(imgUrl);
        const filename = imgUrl.split('/').pop()?.split('?')[0] ?? 'product.jpg';
        const mime = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
        mainImageId = await uploadFileToStrapi(buf, filename, mime);
      } catch (e) { logError(`Image upload failed for ${product.url}: ${e}`); }
    }

    // Upload PDFs
    const datasheetIds: number[] = [];
    const manualIds: number[] = [];
    if (!DRY_RUN) {
      for (const pdfUrl of product.pdfLinks.slice(0, 5)) { // max 5 PDFs per product
        const filename = pdfUrl.split('/').pop()?.split('?')[0] ?? 'doc.pdf';
        try {
          const buf = await fetchBuffer(pdfUrl);
          const fileId = await uploadFileToStrapi(buf, filename, 'application/pdf');
          const docRes = await strapiRequest<{ data: { id: number } }>('POST', '/documents', {
            data: { title: filename.replace(/\.pdf$/i, '').replace(/[-_]/g, ' '), type: isPdfManual(filename) ? 'manual' : 'datasheet', file: fileId, language: 'EN' }
          });
          if (isPdfManual(filename)) manualIds.push(docRes.data.id);
          else datasheetIds.push(docRes.data.id);
        } catch (e) { logError(`PDF upload failed ${pdfUrl}: ${e}`); }
      }
    }

    // Create product
    const productData: Record<string, unknown> = {
      name: product.name,
      ...(product.modelCode ? { modelCode: product.modelCode } : {}),
      shortDescription: product.rawText.slice(0, 300) || undefined,
      status: 'active',
      domain: domainId,
      family: familyId,
      ...(categoryId ? { category: categoryId } : {}),
      ...(mainImageId ? { mainImage: mainImageId } : {}),
      ...(datasheetIds.length > 0 ? { datasheets: datasheetIds } : {}),
      ...(manualIds.length > 0 ? { manuals: manualIds } : {}),
    };

    if (DRY_RUN) {
      console.log(`\n  [DRY RUN] Would create: ${product.name} → ${domainSlug}/${familySlug}/${categorySlug}`);
      created++;
    } else {
      try {
        await strapiRequest('POST', '/products', { data: productData });
        created++;
      } catch (e) {
        logError(`Product create failed "${product.name}": ${e}`);
        failed++;
      }
    }

    // Small delay to avoid overwhelming Strapi
    if (!DRY_RUN && i % 10 === 0) await sleep(200);
  }

  console.log(`\n\n  ✅ Migration complete`);
  console.log(`     Created: ${created} | Skipped: ${skipped} | Failed: ${failed}`);
  if (failed > 0) console.log(`     Error log: ${ERROR_LOG}`);
}

// ─── MAIN ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Plexonics Full Migration Script            ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log(`  Strapi: ${STRAPI_URL}`);
  console.log(`  Mode:   ${DRY_RUN ? '🔍 DRY RUN' : '⚡ LIVE'}`);
  console.log(`  Scrape: ${SKIP_SCRAPE ? 'SKIP (using existing audit file)' : 'YES'}`);
  console.log(`  Seed:   ${SKIP_SEED ? 'SKIP' : 'YES'}`);

  if (!STRAPI_ADMIN_TOKEN) {
    console.error('\n❌ STRAPI_ADMIN_TOKEN is not set.');
    console.error('   Get it from: Strapi Admin → Settings → API Tokens → Create (Full Access)');
    console.error('   Then run: set STRAPI_ADMIN_TOKEN=your-token-here');
    process.exit(1);
  }

  // Verify Strapi is reachable
  try {
    await strapiRequest('GET', '/product-domains?pagination[pageSize]=1');
    console.log('\n  ✅ Strapi is reachable');
  } catch (e) {
    console.error(`\n❌ Cannot reach Strapi at ${STRAPI_URL}`);
    console.error('   Make sure Strapi is running: npm run dev --workspace=backend');
    process.exit(1);
  }

  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Step 1: Seed taxonomy
  if (!SKIP_SEED) {
    await seedTaxonomy();
  } else {
    console.log('\n⏭  Skipping taxonomy seed');
  }

  // Step 2: Scrape or load existing
  let products: ProductEntry[] = [];
  if (SKIP_SCRAPE && fs.existsSync(AUDIT_FILE)) {
    console.log('\n⏭  Loading existing audit file...');
    const audit = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
    products = audit.products;
    console.log(`   Loaded ${products.length} products from ${AUDIT_FILE}`);
  } else {
    products = await scrapeSite();
  }

  if (products.length === 0) {
    console.log('\n⚠  No products to migrate. Exiting.');
    process.exit(0);
  }

  // Step 3: Migrate
  await migrateProducts(products);

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   All done! Open Strapi admin to verify.     ║');
  console.log('║   http://localhost:1337/admin                ║');
  console.log('╚══════════════════════════════════════════════╝\n');
}

main().catch(err => { console.error('\n❌ Fatal error:', err); process.exit(1); });
