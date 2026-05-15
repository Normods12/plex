import { parse } from 'pg-connection-string';

export default ({ env }: { env: (key: string, defaultValue?: string) => string }) => {
  const databaseUrl = env('DATABASE_URL', '');

  if (databaseUrl) {
    const { host, port, database, user, password } = parse(databaseUrl);
    return {
      connection: {
        client: 'postgres',
        connection: {
          host: host || 'localhost',
          port: Number(port) || 5432,
          database: database || 'plexonics',
          user: user || 'postgres',
          password: password || '',
          ssl: env('DATABASE_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
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
