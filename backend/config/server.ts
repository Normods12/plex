export default ({ env }: { env: (key: string, defaultValue?: string) => string }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env('PORT', '1337'),
  url: env('PUBLIC_URL', 'http://localhost:1337'),
  app: {
    keys: env('APP_KEYS', '').split(','),
  },
});

