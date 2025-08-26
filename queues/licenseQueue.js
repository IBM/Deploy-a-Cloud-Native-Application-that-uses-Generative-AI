const { licenseQueue } = require('../config/queues');
const { updateApplicationStatus } = require('../services/statusManager');
const licenseService = require('../services/llm/licenseService');
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

// Process license check jobs
licenseQueue.process(async (job) => {
  console.log('licenseQueue job received:', job.data);
  const { applicationId } = job.data;
  logger.info(`✅ Processing license check for application ${applicationId}`);
  
  try {
    
    // Wait for the application to be available in MongoDB
    await waitForApplication(applicationId);

    await updateApplicationStatus(applicationId, 'license', 'processing');
    
    const licenseData = await licenseService.run(applicationId);
    
    await updateApplicationStatus(applicationId, 'license', 'complete', { licenseData });
    
    // Emit event to continue workflow instead of directly calling workflow function
    eventBus.emit('step:complete', {
      applicationId,
      currentState: 'license',
      data: licenseData
    });
    
    return { success: true, data: licenseData };
  } catch (error) {
    logger.error(`license check failed for application ${applicationId}:`, error);
    
    // Update application status to failed
    await updateApplicationStatus(applicationId, 'license', 'failed');
    
    eventBus.emit('step:error', {
      applicationId,
      step: 'license',
      error: error.message
    });
    
    throw error;
  }
});

module.exports = licenseQueue;
