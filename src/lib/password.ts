import { hash, verify, type Options } from "argon2";

const ARGON2ID_OPTIONS: Options = {
  type: 2,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string) {
  return hash(password, ARGON2ID_OPTIONS);
}

export function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password);
}
