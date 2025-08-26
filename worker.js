const { connectDB } = require('./config/database');
const logger = require('./utils/logger');
const { setupQueues } = require('./queues');

(async () => {
  await connectDB();
  setupQueues();
  logger.info('Worker process started');
})();