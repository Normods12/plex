const mysql = require('mysql2/promise');

async function checkJoomlaTables() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3307,
      user: 'root',
      password: 'root',
      database: 'newplexonics',
    });

    console.log('✅ Connected to Joomla MySQL database.');

    // Fetch categories
    const [categories] = await connection.execute(`
      SELECT 
        c.virtuemart_category_id as id, 
        c.category_name as name,
        c.category_description as description
      FROM ri1t6_virtuemart_categories_en_gb c
    `);
    
    console.log('✅ Found', categories.length, 'Categories:');
    categories.forEach(c => console.log(`- [${c.id}] ${c.name}`));

    // Fetch products
    const [products] = await connection.execute(`
      SELECT 
        p.virtuemart_product_id as id,
        p.product_name as name,
        xref.virtuemart_category_id as category_id
      FROM ri1t6_virtuemart_products_en_gb p
      JOIN ri1t6_virtuemart_product_categories xref ON p.virtuemart_product_id = xref.virtuemart_product_id
      LIMIT 10
    `);

    console.log('\n✅ Sample Products:');
    products.forEach(p => console.log(`- [${p.id}] ${p.name} (Cat: ${p.category_id})`));

    await connection.end();
  } catch (error) {
    console.error('❌ Migration Error:', error);
  }
}

checkJoomlaTables();
