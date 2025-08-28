const { setTimeout } = require('timers/promises');
const { Pool } = require('pg');
const { Application } = require('../../models/application');
const fs = require('fs');
const path = require('path');

// Load Postgres credentials from JSON
let pgCredsRaw = process.env.POSTGRESQL_BINDING;
if (pgCredsRaw === 'postgresql-credentials.json') {
  pgCredsRaw = fs.readFileSync(path.join(__dirname, 'postgresql-credentials.json'), 'utf8');
}
const pgCreds = JSON.parse(pgCredsRaw);

// Extract connection info
const pgConn = pgCreds.connection.postgres;
const pgCert = Buffer.from(pgConn.certificate.certificate_base64, 'base64').toString('utf8');

const { username, password } = pgConn.authentication;
const { hostname, port } = pgConn.hosts[0];
const database = pgConn.database;

const pool = new Pool({
  host: hostname,
  port: port,
  user: username,
  password: password,
  database: database,
  ssl: {
    ca: pgCert,
    rejectUnauthorized: true // or false for dev
  }
});

pool.connect()
  .then(client => {
    console.log('✅ PostgreSQL connection successful');
    client.release();
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection failed:', err);
  });

// Create accounts table if it doesn't exist  
async function ensureAccountsTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS accounts (
      account_id VARCHAR(64) PRIMARY KEY,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      address VARCHAR(255),
      city VARCHAR(100),
      state VARCHAR(50),
      zipcode VARCHAR(20)
    );
  `;
  await pool.query(createTableSQL);
}

ensureAccountsTable().then(() => {
  console.log('✅ Ensured accounts table exists');
}).catch(console.error);

async function findAccount(fname, lname, address, city, state, zip) {
    const values = [fname, lname, address, city, state, zip]
    const q = `
        SELECT * from accounts WHERE 
        first_name LIKE $1 AND 
        last_name LIKE $2 AND 
        address LIKE $3 AND 
        city LIKE $4 AND 
        state LIKE $5 AND 
        zipcode LIKE $6 
        LIMIT 10;
    `

    try {
        const res = await pool.query(q, values);
        const rows = await res.rows;
        return rows; 
    }
    catch(error) {
        console.log(error);
        return [];
    }
}

async function run(applicationId) {
    let data = { existing: false };

    try {
        // Fetch the application from MongoDB
        const app = await Application.find(applicationId);
        if (!app || !app.userData) {
            throw new Error('Application or user data not found');
        }

        // Extract user info (adjust field names as needed)
        const { firstName, lastName, address, city, state, zipcode } = app.userData;

        // Log the values before insert
        console.log('Attempting to insert account:', {
            applicationId,
            firstName,
            lastName,
            address,
            city,
            state,
            zipcode
        });

        // Call findAccount with real data
        let res = await findAccount(firstName, lastName, address, city, state, zipcode);
        if (!res || res.length === 0) {
            // No match: insert the account
            try {
                await pool.query(
                    `INSERT INTO accounts (account_id, first_name, last_name, address, city, state, zipcode)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        applicationId,
                        firstName,
                        lastName,
                        address,
                        city,
                        state,
                        zipcode
                    ]
                );
                console.log('Account inserted!');
            } catch (insertErr) {
                console.error('Failed to insert account:', insertErr);
            }
            data.existing = false;
            return data;
        }
        data.existing = true;
        return data;
    } catch (err) {
        console.error('Error in policyService.run:', err);
        throw err;
    }
}

module.exports = { run, pool };
