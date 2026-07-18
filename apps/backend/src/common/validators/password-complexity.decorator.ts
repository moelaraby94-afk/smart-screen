import { registerDecorator, ValidationOptions } from 'class-validator';

/**
 * Validates that a password meets OWASP Authentication Cheat Sheet
 * complexity requirements:
 * - Minimum 8 characters (enforced separately via @MinLength(8))
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 *
 * Official source: OWASP Authentication Cheat Sheet
 * https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
 */
export function MatchesPasswordComplexity(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'matchesPasswordComplexity',
      target: object.constructor,
      propertyName,
      options: validationOptions ?? {
        message:
          'password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      },
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          return (
            /[A-Z]/.test(value) &&
            /[a-z]/.test(value) &&
            /[0-9]/.test(value) &&
            /[^a-zA-Z0-9]/.test(value)
          );
        },
      },
    });
  };
}
