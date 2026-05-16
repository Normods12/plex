export default ({ env }: { env: (key: string, defaultValue?: string) => string }) => [
  'strapi::logger',
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", 'https:'],
          'img-src': [
            "'self'",
            'data:',
            'blob:',
            'market-assets.strapi.io',
            env('PUBLIC_URL', 'http://localhost:1337'),
            env('MEDIA_URL', 'https://media.plexonics.com'),
          ],
          'media-src': [
            "'self'",
            'data:',
            'blob:',
            env('PUBLIC_URL', 'http://localhost:1337'),
          ],
          upgradeInsecureRequests: null,
        },
      },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      origin: [
        env('FRONTEND_URL', 'http://localhost:3000'),
        'https://www.plexonics.com',
        'https://plexonics.com',
      ],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
