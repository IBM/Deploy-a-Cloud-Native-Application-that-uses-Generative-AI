const { Application } = require('../models/application');
const workflow = require('../services/workflow');
const logger = require('../utils/logger');
const { pool } = require('../services/llm/policyService');
// TODO: submitApplication and getApplication shouldn't be written as express middleware. It couples them to the web server too much

async function submitApplication(req, res, next) {
  try {
    const applicationData = req.body;
    const licensePhotoPath = req.file ? req.file.path : null;

    const application = new Application({
      userData: { ...applicationData, licensePhotoPath },
      submitted: Date.now(),
      status: {
        completed: false,
        percentComplete: 0,
        steps: {
          'license':      { text: 'Checking License...', status: 'pending' },
          'dmv':          { text: 'Checking DMV Records...', status: 'pending' },
          'credit':       { text: 'Fetching Credit Score...', status: 'pending' },
          'policy':       { text: 'Checking for Existing Home & Life Policies...', status: 'pending' },
          'underwriting': { text: 'Performing Underwriting Risk Evaluation...', status: 'pending' },
        },
      },
      results: null
    });

    console.log(`Submitting application to MongoDB with ID: ${application._id}`);
    let insertResult;
    try {
      insertResult = await application.save(); // add application to MongoDB
      if (!insertResult || !insertResult.acknowledged) {
        throw new Error('MongoDB insert not acknowledged');
      }
    } catch (mongoErr) {
      logger.error('MongoDB insert failed:', mongoErr);
      return res.status(500).json({ error: 'Failed to save application to database.' });
    }
    console.log(`Application to MongoDB submitted with ID: ${application._id}`);

    // --- Check if account exists in Postgres, insert if not ---
    console.log(`Checking if account exists in PostgreSQL for application ID: ${application._id}`);
    const { firstName, lastName, address, city, state, zipcode } = application.userData;
    try {
      const checkRes = await pool.query(
        `SELECT account_id FROM accounts WHERE account_id = $1`,
        [application._id]
      );
      if (checkRes.rows.length === 0) {
        console.log(`Saving account information in PostgreSQL for application ID: ${application._id}`);
        await pool.query(
          `INSERT INTO accounts (account_id, first_name, last_name, address, city, state, zipcode)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            application._id,
            firstName,
            lastName,
            address,
            city,
            state,
            zipcode
          ]
        );
      } else {
        logger.info(`Account already exists in PostgreSQL for application ID: ${application._id}`);
      }
    } catch (pgErr) {
      logger.error('PostgreSQL error:', pgErr);
      return res.status(500).json({ error: 'Failed to save account to PostgreSQL.' });
    }
    // ----------------------------------------------------------
    await new Promise(resolve => setTimeout(resolve, 2000)); // add 2 second delay to ensure application is saved before starting workflow in MongoDB
    await workflow.start(application._id);

    res.status(201).json({
      success: true,
      applicationId: application._id,
    });
  } catch (error) {
    logger.error('Error submitting application:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getApplication(req, res) {
  const application = await Application.find(req.params.id);

  if (!application) {
      return res.status(404).json({ error: 'Application not found' });
  }
    
  // Return current status
  res.json(application);   
}

module.exports = {
  submitApplication,
  getApplication
};
