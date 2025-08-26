console.log("Starting server.js...");
process.on('exit', (code) => {
  console.log(`Process exiting with code: ${code}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

const path = require('path');
const fs = require('fs');

require('dotenv').config(); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const { errorHandler, notFound, asyncHandler } = require('./middleware/errorHandler');

const uploads = require('./config/uploads');
const { submitApplication, getApplication } = require('./controllers/applicationController');
const workflow = require('./services/workflow');

const app = express();
const port = process.env.PORT || 3001; // Use port from .env or default to 3001

// --- Middleware ---

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger.requestLogger);  // Adds request ID and request-specific logger
app.use(logger.httpLogger);     // Logs HTTP requests

// --- API Endpoint ---

// Status check endpoint
app.get('/api/application-status/:id', asyncHandler(async (req, res) => {
    console.log(`[API] Checking status for application ID: ${req.params.id}`);
    res.set('Cache-Control', 'no-store'); // Prevent caching
    getApplication(req, res);
}));

// Handle form submission
app.post('/api/submit-application', uploads.single('driversLicenseImage'), asyncHandler(async (req, res) => {
    console.log(`[API] Received application submission from IP: ${req.ip}`);
    submitApplication(req, res);
}));

// --- Serve Frontend Static Files ---

const buildPath = path.join(__dirname, 'public');
app.use(express.static(buildPath));
console.log(`[Server] Serving static files from: ${buildPath}`);

// error handling middleware has to be AFTER static file middleware
app.use(notFound);
app.use(errorHandler);
console.log(`Serving static files from: ${buildPath}`);

// Handle SPA routing: For any request that doesn't match an API route or a static file,
// serve the main index.html file. This allows any client-side routing in the SPA to work.
app.get('*param', (req, res) => {
    const indexPath = path.join(buildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Index file not found. Did you build the frontend (`npm run build`)?');
    }
});


// --- Global Error Handler (Optional but Recommended) ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    // Handle Multer errors specifically
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: `File upload error: ${err.message}` });
    } else if (err.message === 'Not an image! Please upload an image file.') {
         return res.status(400).json({ error: err.message });
    }
    // Generic error handler
    res.status(500).json({ error: 'Something went wrong on the server!' });
});

// --- initialize workflow manager ---

workflow.initialize();

// --- Start Server ---

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

