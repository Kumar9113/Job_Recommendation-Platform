// Express recognizes a middleware as an "error handler" specifically
// because it takes FOUR arguments (err, req, res, next).
// Any time a controller calls next(err), or throws inside an async
// wrapper, execution lands here instead of crashing the server.
function errorHandler(err, req, res, next) {
  console.error(err.stack || err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
  });
}

module.exports = errorHandler;
