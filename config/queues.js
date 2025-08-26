const Queue = require('bull');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

// Use environment variables, fallback to defaults if not set
const REDIS_URL = process.env.REDIS_URL ||
  'redis://redis:6379'; // if using app-docker-compose.yml

// Load TLS cert from env (base64 or plain), or fallback to file
let redisCert;
if (process.env.REDIS_TLS_CERT) {
  // If base64, decode; else use as is
  if (/-----BEGIN/.test(process.env.REDIS_TLS_CERT)) {
    redisCert = process.env.REDIS_TLS_CERT;
  } else {
    redisCert = Buffer.from(process.env.REDIS_TLS_CERT, 'base64').toString('utf8');
  }
} else {
  redisCert = fs.readFileSync(path.join(__dirname, '..', 'redis-cert.pem'), 'utf8');
}

// Queue options
const defaultOptions = {
  attempts: 10,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 100
};
const queueOptions = {
  redis: {
    tls: {
      ca: redisCert,
      // rejectUnauthorized: false // Remove or set to true for production
    }
  },
  defaultJobOptions: defaultOptions,
};

// Create queues
const policyQueue = new Queue('policy', REDIS_URL, queueOptions);
const dmvQueue = new Queue('dmv', REDIS_URL, queueOptions);
const licenseQueue = new Queue('license', REDIS_URL, queueOptions);
const creditQueue = new Queue('credit', REDIS_URL, queueOptions);
const underwritingQueue = new Queue('underwriting', REDIS_URL, queueOptions);

// Set up global error handlers for queues
[policyQueue, dmvQueue, licenseQueue, creditQueue, underwritingQueue].forEach(queue => {
  queue.on('error', error => {
    logger.error(`Queue ${queue.name} error:`, error);
  });

  queue.on('failed', (job, error) => {
    logger.error(`Job ${job.id} in ${queue.name} failed:`, error);
  });

  queue.on('ready', () => {
    console.log(`✅ IBM Cloud Redis connection successful for queue: ${queue.name}`);
  });
});

module.exports = {
  policyQueue,
  dmvQueue,
  licenseQueue,
  creditQueue,
  underwritingQueue
};