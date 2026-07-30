# @veratalley/ballot

Turns a ballot into sealed bytes, and back again.

A ballot is canonicalised to JSON (RFC 8785), then encrypted with X25519 + XChaCha20-Poly1305.
Each seal generates a fresh ephemeral keypair, so two seals of the same ballot always produce different ciphertext.
The ballot also carries a random 32-byte nonce inside its JSON body.
Without that nonce, two voters who chose identically would produce identical ciphertext — revealing they voted the same way without decrypting anything.
The nonce is the difference between real ballot secrecy and the illusion of it.

```ts
import { sealBallot, generateElectionKeypair, open } from '@veratalley/ballot'
```
