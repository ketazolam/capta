import crypto from "crypto"

export function verifyInternalSecret(supplied: string | null): boolean {
  const expected = process.env.INTERNAL_SECRET
  if (!supplied || !expected) return false
  if (supplied.length !== expected.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  } catch {
    return false
  }
}
