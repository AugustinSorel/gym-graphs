import { AppError } from "~/libs/error";
import pg from "pg";

export class AuthInvalidCredentialsError extends AppError {
  constructor() {
    super("email or password is invalid", 403);
  }
}

export class AuthEmailNotVerifiedError extends AppError {
  constructor() {
    super("email address not verified", 403);
  }
}

export class AuthAccountMissingCredentialsError extends AppError {
  constructor() {
    super("this account has been set up using oauth", 403);
  }
}

export class AuthDuplicateEmail extends AppError {
  public static check = (e: unknown) => {
    const dbError = e instanceof pg.DatabaseError;
    const isDuplicate = dbError && e.constraint === "user_email_unique";

    return isDuplicate;
  };

  constructor() {
    super("email is already used", 409);
  }
}

export class EmailVerificationCodeNotFoundError extends AppError {
  constructor() {
    super("email verification code not found", 404);
  }
}

export class EmailVerificationCodeInvalidError extends AppError {
  constructor() {
    super("invalid code", 401);
  }
}

export class EmailVerificationCodeExpiredError extends AppError {
  constructor() {
    super("code expired", 401);
  }
}

export class PasswordResetTokenNotFoundError extends AppError {
  constructor() {
    super("token not found", 404);
  }
}

export class PasswordResetTokenExpiredError extends AppError {
  constructor() {
    super("token expired", 401);
  }
}

export class SessionNotFoundError extends AppError {
  constructor() {
    super("session not found", 404);
  }
}
