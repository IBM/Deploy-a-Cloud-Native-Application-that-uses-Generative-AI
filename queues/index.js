const dmvQueue = require('./dmvQueue');
const licenseQueue = require('./licenseQueue');
const creditQueue = require('./creditQueue');
const underwritingQueue = require('./underwritingQueue');
const logger = require('../utils/logger');
const policyQueue = require('./policyQueue');

/**
 * Set up all queue processors
 */
function setupQueues() {
  logger.info('Setting up queue processors');
  
  // The require statements above automatically set up the processors
  // This function mainly exists to provide a clean export and logging
  
  return {
    policyQueue,
    dmvQueue,
    licenseQueue,
    creditQueue,
    underwritingQueue
  };
}

module.exports = {
  setupQueues
};
