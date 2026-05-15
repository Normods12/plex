export default ({ env }: { env: (key: string, defaultValue?: string) => string }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('JWT_SECRET'),
    },
  },
});
