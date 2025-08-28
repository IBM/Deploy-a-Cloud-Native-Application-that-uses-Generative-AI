const { policyQueue } = require('../config/queues');
const { updateApplicationStatus } = require('../services/statusManager');
const policyService = require('../services/llm/policyService');
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

// Process policy check jobs
policyQueue.process(async (job) => {
  const { applicationId } = job.data;
  logger.info(`✅ Processing policy check for application ${applicationId}`);
  
  try {
    // Wait for the application to be available in MongoDB
    await waitForApplication(applicationId);

    await updateApplicationStatus(applicationId, 'policy', 'processing');

    const policyData = await policyService.run(applicationId);
    
    await updateApplicationStatus(applicationId, 'policy', 'complete', { policyData });
    
    // Emit event to continue workflow instead of directly calling workflow function
    eventBus.emit('step:complete', {
      applicationId,
      currentState: 'policy',
      data: policyData
    });
    
    return { success: true, data: policyData };
  } catch (error) {
    logger.error(`policy check failed for application ${applicationId}:`, error);
    
    // Update application status to failed
    await updateApplicationStatus(applicationId, 'policy', 'failed');
    
    eventBus.emit('step:error', {
      applicationId,
      step: 'policy',
      error: error.message
    });
    
    throw error;
  }
});

module.exports = policyQueue;
