const strapiFactory = require('@strapi/strapi');

async function main() {
  const strapi = await strapiFactory().load();
  const tokenName = 'Admin Migration Token ' + Date.now();
  
  try {
    const apiTokenService = strapi.service('admin::api-token');
    
    const token = await apiTokenService.create({
      name: tokenName,
      description: 'Token for migration scripts',
      type: 'full-access',
      lifespan: null,
    });
    
    console.log('---TOKEN_START---');
    console.log(token.accessKey);
    console.log('---TOKEN_END---');
  } catch (err) {
    console.error('Failed to create token:', err);
  } finally {
    process.exit(0);
  }
}

main();
