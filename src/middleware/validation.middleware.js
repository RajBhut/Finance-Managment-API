import { ApiError } from "../utils/apiError.js";

export const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return next(new ApiError(400, "Validation failed", details));
    }

    if (property === "query") {
      Object.assign(req.query, value);
    } else if (property === "params") {
      Object.assign(req.params, value);
    } else {
      req[property] = value;
    }

    return next();
  };
};
