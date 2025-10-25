export type Serialize<T> = T extends Date
  ? string
  : T extends Array<infer U>
    ? Serialize<U>[]
    : T extends object
      ? { [K in keyof T]: Serialize<T[K]> }
      : T;
