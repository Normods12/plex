export default ({ env }: { env: (key: string, defaultValue?: string) => string }) => {
  const databaseUrl = env('DATABASE_URL', '');

  if (databaseUrl) {
    // Parse DATABASE_URL using the built-in URL API (no external dependency needed)
    const parsed = new URL(databaseUrl);
    return {
      connection: {
        client: 'postgres',
        connection: {
          host: parsed.hostname || 'localhost',
          port: Number(parsed.port) || 5432,
          database: parsed.pathname.replace(/^\//, '') || 'plexonics',
          user: parsed.username || 'postgres',
          password: decodeURIComponent(parsed.password) || '',
          ssl:
            env('DATABASE_SSL', 'false') === 'true'
              ? { rejectUnauthorized: false }
              : false,
        },
        debug: false,
      },
    };
  }

  // Fallback: SQLite for local dev without Postgres
  return {
    connection: {
      client: 'sqlite',
      connection: {
        filename: env('DATABASE_FILENAME', '.tmp/data.db'),
      },
      useNullAsDefault: true,
    },
  };
};
