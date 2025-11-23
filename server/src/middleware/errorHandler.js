/* eslint-disable no-unused-vars */
const ApiError = require('../utils/apiError');

const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
};

module.exports = errorHandler;



