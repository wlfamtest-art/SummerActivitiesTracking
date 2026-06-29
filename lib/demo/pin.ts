import bcrypt from "bcryptjs";

const PIN_PATTERN = /^\d{4}$/;

export function assertValidKidPin(pin: string): void {
  if (!PIN_PATTERN.test(pin)) {
    throw new Error("Kid Mode PIN must be exactly 4 digits.");
  }
}

export function hashKidPin(pin: string): string {
  assertValidKidPin(pin);
  return bcrypt.hashSync(pin, 10);
}

export function verifyKidPin(pin: string, hash: string | null | undefined): boolean {
  assertValidKidPin(pin);

  if (!hash) {
    return false;
  }

  return bcrypt.compareSync(pin, hash);
}
