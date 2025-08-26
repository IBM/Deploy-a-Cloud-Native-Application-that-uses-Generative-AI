const { creditQueue } = require('../config/queues');
const { updateApplicationStatus } = require('../services/statusManager');
const creditService = require('../services/llm/creditService');
const eventBus = require('../services/eventBus');
const logger = require('../utils/logger');
const { Application } = require('../models/application');

// Polling function to wait for the application to appear in MongoDB
async function waitForApplication(id, maxTries = 40, interval = 500) {
  for (let i = 0; i < maxTries; i++) {
    console.log(`Polling for application ${id}... Attempt ${i + 1}/${maxTries}`);
    console.log(`Waiting for ${interval}ms before next attempt...`);
    const app = await Application.find(id);
    if (app) return app;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error(`Application not found in MongoDB after polling for id=${id}`);
}

// Process credit check jobs
creditQueue.process(async (job) => {
  const { applicationId } = job.data;
  logger.info(`✅ Processing credit check for application ${applicationId}`);
  
  try {
    // Wait for the application to be available in MongoDB
    await waitForApplication(applicationId);

    await updateApplicationStatus(applicationId, 'credit', 'processing');

    const creditData = await creditService.run(applicationId);
    
    await updateApplicationStatus(applicationId, 'credit', 'complete', { creditData });
    
    // Emit event to continue workflow instead of directly calling workflow function
    eventBus.emit('step:complete', {
      applicationId,
      currentState: 'credit',
      data: creditData
    });
    
    return { success: true, data: creditData };
  } catch (error) {
    logger.error(`credit check failed for application ${applicationId}:`, error);
    
    // Update application status to failed
    await updateApplicationStatus(applicationId, 'credit', 'failed');
    
    eventBus.emit('step:error', {
      applicationId,
      step: 'credit',
      error: error.message
    });
    
    throw error;
  }
});

module.exports = creditQueue;
