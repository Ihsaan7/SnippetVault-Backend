const ErrorHandler = (err, req, res, next) => {
  // Terminal Logs.
  console.error(`\n[DEBUGGER] Location: ${err.location || "Unknown"}`);
  console.error(`[STACK]: ${err.stack}\n`);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Only spread Info when in Dev mode
    ...(process.env.NODE_ENV === "development" && {
      location: err.location,
      stack: err.stack,
    }),
  });
};

export default ErrorHandler;
