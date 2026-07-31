/**
 * RFC 8785 JSON Canonicalization Scheme.
 *
 * Wraps the `canonicalize` npm package so that the same logical ballot always
 * produces byte-identical output, regardless of property insertion order in the
 * source object. This is critical for reproducible tallies: the tally tool must
 * be able to recompute the exact ciphertext from the decrypted ballot, and that
 * only works if canonicalisation is deterministic down to the byte.
 *
 * We use `TextEncoder` (UTF-8) to go from the canonical JSON string to bytes
 * because UTF-8 encoding is fully specified and identical across every JS
 * runtime (Node, Deno, browsers). No BOM, no platform variation.
 */

import canonicalize from 'canonicalize'

const encoder = new TextEncoder()

/**
 * Produce a deterministic UTF-8 byte representation of any JSON-serialisable
 * value, following RFC 8785 (JSON Canonicalization Scheme).
 *
 * The `canonicalize` package handles:
 * - Sorting object keys lexicographically (Unicode code-point order)
 * - Normalising number representations (no trailing zeros, no positive sign)
 * - Escaping strings per the JSON spec
 *
 * @param value - Any JSON-serialisable value. In practice, always a `Ballot`.
 * @returns Canonical UTF-8 bytes.
 * @throws If `canonicalize` returns `undefined` (input contains `undefined`
 *         at the top level, which is not valid JSON).
 */
export function canonicalJson(value: unknown): Uint8Array {
  const json = canonicalize(value)
  if (json === undefined) {
    throw new Error('canonicalJson: input is not JSON-serialisable')
  }
  return encoder.encode(json)
}
