// src/utils/asyncHandler.js
//
// Express doesn't automatically catch errors thrown inside async functions.
// Without this wrapper, every controller would need a repetitive try/catch
// block that calls next(err). Instead, we wrap each controller once:
//
//   export const getProduct = asyncHandler(async (req, res) => { ... });
//
// Any thrown error (including a rejected await) is automatically forwarded
// to errorHandler.js via next(err).

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;
