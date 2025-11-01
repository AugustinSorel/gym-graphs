type Msg =
  | "duplicate email"
  | "duplicate tag name"
  | "duplicate tile"
  | "internal"
  | "entity not returned"
  | "user not found"
  | "session not found"
  | "exercise not found"
  | "password reset not found"
  | "email verification code not found";

export const buildError = <TMsg extends Msg>(type: TMsg, err?: unknown) => {
  return {
    type,
    cause: err instanceof Error ? err : new Error("database error"),
  };
};

export type DbError = ReturnType<typeof buildError>;
