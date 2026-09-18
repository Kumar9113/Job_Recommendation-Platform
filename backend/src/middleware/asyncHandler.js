// Wraps an async controller so any rejected promise / thrown error
// is automatically forwarded to next(err) -> errorHandler.js.
// Without this, every controller would need its own try/catch.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
