const { underwritingQueue } = require('../config/queues');
const { updateApplicationStatus } = require('../services/statusManager');
const underwritingService = require('../services/llm/underwritingService');
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

// Process underwriting check jobs
underwritingQueue.process(async (job) => {
  const { applicationId } = job.data;
  logger.info(`✅ Processing underwriting check for application ${applicationId}`);
  
  try {
    // Wait for the application to be available in MongoDB
    await waitForApplication(applicationId);

    await updateApplicationStatus(applicationId, 'underwriting', 'processing');

    const underwritingData = await underwritingService.run(applicationId);
    logger.info('Underwriting data before WRITE to MONGODB:', underwritingData);
    
    await updateApplicationStatus(applicationId, 'underwriting', 'complete', { underwritingData });
    
    // Emit event to continue workflow instead of directly calling workflow function
    eventBus.emit('step:complete', {
      applicationId,
      currentState: 'underwriting',
      data: underwritingData
    });
    
    return { success: true, data: underwritingData };
  } catch (error) {
    logger.error(`underwriting check failed for application ${applicationId}:`, error);
    
    await updateApplicationStatus(applicationId, 'underwriting', 'failed');
    
    eventBus.emit('step:error', {
      applicationId,
      step: 'underwriting',
      error: error.message
    });
    
    throw error;
  }
});

module.exports = underwritingQueue;
