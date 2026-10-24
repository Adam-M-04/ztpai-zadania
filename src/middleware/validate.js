const { ValidationError } = require("../errors/AppError");

function validate(schemas) {
  return (req, res, next) => {
    const validated = {};
    const errors = [];

    for (const part of ["params", "query", "body"]) {
      if (!schemas[part]) {
        continue;
      }

      const result = schemas[part].safeParse(req[part] ?? {});

      if (result.success) {
        validated[part] = result.data;
      } else {
        for (const issue of result.error.issues) {
          errors.push({
            location: part,
            field: issue.path.join("."),
            message: issue.message,
          });
        }
      }
    }

    if (errors.length > 0) {
      return next(new ValidationError(errors));
    }

    req.validated = validated;
    next();
  };
}

module.exports = validate;
