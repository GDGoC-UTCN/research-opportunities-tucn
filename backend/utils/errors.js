class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function httpError(status, message) {
  return new HttpError(status, message);
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function notFound(req, res, next) {
  next(httpError(404, 'Not found'));
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  const message = status >= 500 && isProduction ? 'Internal server error' : err.message || 'Internal server error';

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: message,
    ...(status >= 500 || isProduction ? {} : { stack: err.stack }),
  });
}

module.exports = { HttpError, httpError, asyncHandler, notFound, errorHandler };
