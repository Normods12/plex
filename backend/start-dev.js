#!/usr/bin/env node

const path = require('path');
const envPath = path.join(__dirname, '..', '.env');

// IMPORTANT: Change working directory to the backend folder
// This ensures Strapi 5 finds the local public/uploads directory correctly
process.chdir(__dirname);

// Set ENV_PATH so Strapi's internal dotenv.config() also finds the root .env
process.env.ENV_PATH = envPath;

// Load .env file before starting Strapi
const result = require('dotenv').config({ path: envPath });

// Ensure vars are in process.env (dotenv v17 compatibility)
if (result.parsed) {
  for (const [key, value] of Object.entries(result.parsed)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// Now start Strapi
require('../node_modules/@strapi/strapi/bin/strapi');
