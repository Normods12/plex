const fs = require('fs');
const path = require('path');

const apiDir = path.join(__dirname, 'backend', 'src', 'api');

const dirs = fs.readdirSync(apiDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

dirs.forEach(name => {
  const contentTypesDir = path.join(apiDir, name, 'content-types');
  if (!fs.existsSync(contentTypesDir)) return;

  const contentTypes = fs.readdirSync(contentTypesDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  contentTypes.forEach(ctName => {
    const ctPath = `api::${name}.${ctName}`;

    // Create routes
    const routesDir = path.join(apiDir, name, 'routes');
    if (!fs.existsSync(routesDir)) fs.mkdirSync(routesDir, { recursive: true });
    fs.writeFileSync(path.join(routesDir, `${ctName}.ts`), `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreRouter('${ctPath}');\n`);

    // Create controllers
    const controllersDir = path.join(apiDir, name, 'controllers');
    if (!fs.existsSync(controllersDir)) fs.mkdirSync(controllersDir, { recursive: true });
    fs.writeFileSync(path.join(controllersDir, `${ctName}.ts`), `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreController('${ctPath}');\n`);

    // Create services
    const servicesDir = path.join(apiDir, name, 'services');
    if (!fs.existsSync(servicesDir)) fs.mkdirSync(servicesDir, { recursive: true });
    fs.writeFileSync(path.join(servicesDir, `${ctName}.ts`), `import { factories } from '@strapi/strapi';\n\nexport default factories.createCoreService('${ctPath}');\n`);
  });
});
console.log('Generated routes, controllers, and services.');
