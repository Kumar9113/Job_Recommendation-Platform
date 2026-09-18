// This middleware protects routes. It runs BEFORE the controller.
// It checks for a valid JWT in the Authorization header, and if
// valid, attaches the decoded user info to req.user so controllers
// know WHO is making the request.
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization']; // "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // e.g. { userId: 12, email: '...' }
    next(); // pass control to the next middleware/controller
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = authenticate;
