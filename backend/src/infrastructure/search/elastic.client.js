const { Client } = require('@elastic/elasticsearch');

// Load env vars if not loaded
if (!process.env.ELASTIC_NODE) {
  require('dotenv').config();
}

const node = process.env.ELASTIC_NODE || 'http://localhost:9200';

const clientOptions = {
  node: node,
  // Increase request timeout to be robust
  requestTimeout: 3000,
};

// Add authentication if configured in environment variables
if (process.env.ELASTIC_USERNAME && process.env.ELASTIC_PASSWORD) {
  clientOptions.auth = {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD,
  };
}

const client = new Client(clientOptions);

module.exports = client;
