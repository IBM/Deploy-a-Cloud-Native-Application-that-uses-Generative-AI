const logger = require('../utils/logger');

/**
 * Custom API error class
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  // Get the request-specific logger if available, otherwise use the global logger
  const log = req.logger || logger;
  
  // Set default values
  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Something went wrong';
  let errorDetails = err.details || null;
  let errorStack = process.env.NODE_ENV === 'production' ? undefined : err.stack;
  
  // Log different levels based on status code
  if (statusCode >= 500) {
    log.error(`Server error: ${errorMessage}`, {
      error: err,
      stack: err.stack
    });
  } else if (statusCode >= 400) {
    log.warn(`Client error: ${errorMessage}`, {
      error: err
    });
  }
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    // MongoDB/Mongoose validation error
    statusCode = 400;
    errorMessage = 'Validation Error';
    errorDetails = Object.values(err.errors).map(e => e.message);
  } else if (err.name === 'CastError' && err.kind === 'ObjectId') {
    // MongoDB bad ObjectId
    statusCode = 400;
    errorMessage = 'Resource not found';
  } else if (err.code === 11000) {
    // MongoDB duplicate key
    statusCode = 409;
    errorMessage = 'Duplicate resource';
    const field = Object.keys(err.keyValue)[0];
    errorDetails = `The ${field} is already in use`;
  } else if (err.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    errorMessage = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorMessage = 'Token expired';
  }
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: errorMessage,
      details: errorDetails,
      stack: errorStack
    }
  });
}

/**
 * 404 Not Found middleware
 */
function notFound(req, res, next) {
  const err = new ApiError(404, `Resource not found - ${req.originalUrl}`);
  next(err);
}

/**
 * Async request handler wrapper to eliminate try-catch boilerplate
 * @param {Function} fn - The async request handler function
 * @returns {Function} Express middleware function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// Export middleware and utility functions
module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
  ApiError
};
