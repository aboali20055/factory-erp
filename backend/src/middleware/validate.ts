import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Generic Zod schema validation middleware.
 * Parses and replaces the target with the validated/coerced data.
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      res.status(422).json({
        success: false,
        error: 'بيانات غير صالحة',
        details: errors,
      });
      return;
    }

    // Replace with parsed/coerced values
    (req as Record<string, unknown>)[target] = result.data;
    next();
  };
}
