const { Application } = require('../models/application');
const logger = require('../utils/logger');

async function updateApplicationStatus(applicationId, state, status, data=null) {
  try {
    logger.info(`Updating application ${applicationId} status`, state, status, data);
    
    const application = await Application.update(applicationId, state, status, data);
    
    if (!application) {
      logger.error(`Application ${applicationId} not found for status update`);
      throw new Error('Application not found');
    }
    
    return application;
  } catch (error) {
    logger.error(`Error updating status for application ${applicationId}:`, error);
    throw error;
  }
}

/**
 * Get the current status of an application
 * @param {string} applicationId - The application ID
 * @returns {Promise<Object>} The application status
 */
async function getApplicationStatus(applicationId) {
  try {
    const application = await Application.find(applicationId);
    
    if (!application) {
      logger.error(`Application ${applicationId} not found for status check`);
      throw new Error('Application not found');
    }
    
    // Return only the necessary status fields
    return application.status;
  } catch (error) {
    logger.error(`Error getting status for application ${applicationId}:`, error);
    throw error;
  }
}

/**
 * Mark an application as failed
 * @param {string} applicationId - The application ID
 * @param {string} errorMessage - The error message
 * @returns {Promise<Object>} The updated application
 */
async function markApplicationFailed(applicationId, errorMessage) {
  try {
    logger.error(`Marking application ${applicationId} as failed: ${errorMessage}`);
    
    return await updateApplicationStatus(applicationId, 'ERROR', 'Verification Failure');
  } catch (error) {
    logger.error(`Error marking application ${applicationId} as failed:`, error);
    throw error;
  }
}

module.exports = {
  updateApplicationStatus,
  getApplicationStatus,
  markApplicationFailed,
};