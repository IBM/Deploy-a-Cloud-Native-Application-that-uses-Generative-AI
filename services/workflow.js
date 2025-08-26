const { policyQueue, dmvQueue, licenseQueue, creditQueue, underwritingQueue } = require('../queues').setupQueues();
const { updateApplicationStatus } = require('./statusManager');
const eventBus = require('./eventBus');
const logger = require('../utils/logger');

function next(state) {
  if (state == 'START') return 'policy'
  else if (state == 'policy') return 'license';
  else if (state == 'license') return 'dmv';
  else if (state == 'dmv') return 'credit';
  else if (state == 'credit') return 'underwriting';
  else if (state == 'underwriting') return 'STOP';
  else return 'ERROR';
}

async function start(applicationId) {
  logger.info(`Starting workflow for application ${applicationId}`);
  
  try {
    await executeStep(applicationId, next('START'));    
    return true;
  } catch (error) {
    logger.error(`❌ Error starting workflow for application ${applicationId}:`, error);
    throw error;
  }
}

async function executeStep(applicationId, state, data=null) {   
  switch (state) {
    case 'START':
    case 'policy':
      await policyQueue.add({ applicationId });
      break;

    case 'license':
      await licenseQueue.add({ applicationId });
      break;

    case 'dmv':
      await dmvQueue.add({ applicationId });
      break;
      
    case 'credit':
      await creditQueue.add({ applicationId });
      break;
      
    case 'underwriting':
      await underwritingQueue.add({ applicationId });
      break;
      
    case 'STOP':
      await updateApplicationStatus(applicationId, state, data);    
      break;
      
    default:
      logger.warn(`Unknown workflow step: ${state}`);
  }
}

function initialize() {
  logger.info('initializing event handlers');

  // Listen for step completions
  eventBus.on('step:complete', async ({ applicationId, currentState, data }) => {
    try {
      const nextState = next(currentState);
      await executeStep(applicationId, nextState, data);
    } catch (error) {
      logger.error(`Error continuing workflow for application ${applicationId}:`, error);
      eventBus.emit('step:error', {
        applicationId,
        step: currentState,
        error: error.message
      });
    }
  });
  
  // Listen for step errors
  eventBus.on('step:error', ({ applicationId, step, error }) => {
    logger.error(`Error in workflow step ${step} for application ${applicationId}: ${error}`);
    // Additional error handling could be added here
  });
}

module.exports = {
  start,
  initialize
};
