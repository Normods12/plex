const path = require('path');
process.chdir(__dirname);
require('dotenv').config({ path: path.join(__dirname, '.env') });

const knex = require('knex')({
  client: 'pg',
  connection: process.env.DATABASE_URL,
});

async function run() {
  try {
    // Print column names of contact_infos
    const columnInfo = await knex('contact_infos').columnInfo();
    console.log('contact_infos columns:', Object.keys(columnInfo));

    // Insert a test contact info if empty
    const rows = await knex('contact_infos').select('*');
    if (rows.length === 0) {
      console.log('Inserting test row...');
      await knex('contact_infos').insert({
        document_id: 'test-doc-id-1234567',
        name: 'Plexonics Office',
        brand: 'plexonics',
        phone: '1800-1200-023',
        email: 'info@plexonics.com',
        address: 'Chandigarh, India',
        created_at: new Date(),
        updated_at: new Date(),
        published_at: new Date(),
      });
      console.log('Test row inserted successfully.');
    } else {
      console.log('contact_infos already has rows:', rows);
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await knex.destroy();
  }
}
run();
