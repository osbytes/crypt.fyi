/**
 * Frozen interoperability vector for the CFYI streaming container (v1).
 *
 * Generated once and never regenerated: any implementation of the format —
 * browser worker, CLI, or a future port — must open these exact bytes. It is
 * deliberately password-free so the fixture does not depend on Argon2id work
 * factors, which the unit suite lowers.
 *
 * Geometry: frameSizeLog2 = 8 (256-byte frames), 679 plaintext bytes, 3 data
 * frames — two full and one short final frame.
 */

export const GOLDEN_KEY = 'sZq2kR7wTfB9xNvC1mLpYd4HgJ0uEaWt';

export const GOLDEN_TEXT =
  'CFYI streaming container, interoperability vector v1. This payload deliberately spans ' +
  'three 256-byte frames so that a conforming implementation must handle a full first fra' +
  'me, a full second frame, and a short final frame carrying the is-final marker inside i' +
  'ts additional authenticated data. Any implementation of the format must recover this t' +
  'ext byte for byte, together with its metadata, using only the URL key recorded alongsi' +
  'de this fixture. Removing the final frame must fail authentication rather than yieldin' +
  'g a silently shortened payload, and swapping any two frames must fail as well. Frame g' +
  'eometry, nonce derivation, and the header hash are all pinned by these bytes.';

export const GOLDEN_CONTAINER_B64 =
  'Q0ZZSQEACAChssPUAAAGOEhwQjA1eUlGNzFnUmxXelI5bGFEaUpFWkFWT3NWNEVkTEZPbUdrK3VoVWJnOEUxbnB4bFg5eUNM' +
  'NTBvekZuVGZPNDFieDk2Q3JCeWFNK1V3cnJqVDNqR0srOHRBQUlJcWc0SzBhY0dqSnhRVEFJSW5sQ085Szh0YVpzaHJlNE9s' +
  'UUl4RHVsYVpHUkpZa3JqRFRDV0hLVSsydkRQbTlOeituSHlETThsY1hiMDhEYlFYTmpuZXk2VU1pT1hhUC9zNmRXdWtLZWtE' +
  'M0NwbkRkcUZEZkl4YUJ1SHlaWGs5UTBYaStrTHBTSUtiM0djTEpJZTc2Nlo2YUZjczluSE5QRjY5WnpveW04WlZFM0dLeFpY' +
  'dmpGUVZwRjFEUmhUZS8wN3dtVElLb0sxUTlhWGlINXo1K0o5TGNzTGlYL2VvZzJpM0xGY2JGQ0MvU3djRS9VV1QyRTFROHdl' +
  'aVc4SnNNTkhZWG05Z0NPNksyTlJKYkt0bXNGWUdOVUN0TDdKZGpDR0F4cSs1enNXdE01ZUtQZXdmL3hMQmYrbzBZVVhndEZP' +
  'aG1YNjJRaDVNS2lONWc2b1FzTXdOYUhLUmt3bXduaUNZTGR5MkF5REZ6WkEwcmdjMks3U1EwRHlLTUlYaTYybWw0RFljZjlX' +
  'Vk1QMnA3MEwrYnhhbmZTNlJmTlRUTFRkTFJ5dFVFaGFqUnVsYXl6cG9XNFR1UEhKK2lRQ29qdG0vdVRyc1hqNlI2aUhxVDZS' +
  'SXhzMjNuY0lOSm1JcHVRUWZUSThDa0NZZkFjWmF2S1JaOHlIcnhDNEhQVFJMR0tTR2xCZ3QyOGt0bEhPZHE0b08xSlczZUI2' +
  'a2xEdWpHeHA4VWNkd0xVQXBCV29pbmwwRGZXRC9nN21qeXZmb2s1SktVTzhVdXd5MjJhOWExVWlSV3B4Q1dXenRPRVBKNTlD' +
  'NXQ0RytDNVZoMTA4ZElrUGZWV2tpOHl5bFNSMkJkb2Q2SktzUDVDOWtkWUhGSmRCUWh2bWEzMFVId3E1VFJVUUwrM0lUUnBX' +
  'WjVPY1pWcTZaMmh1RXhSN0N5R3ZCbE5wcC9BK0RXS1VpUDZUTmNiT3loeG8rdG9hcjlIem0vdDh2VVRwdGozQUQ4M0c3MGVm' +
  'UE9yR2Y4ZSt3N2F3QjFmY0RYRHA3VTBHWFpEQ1pYTGViZjA4bHA5cWkxYkV6YkxNaFh3aGJBc1FUa3lIQTg2WWNmclFqTjJR' +
  'VjVoYTdSeU4veUJrcFQ4Ung2LytIaXpPbDJVU2lOcllpYVc0YW5KVk84Yk8yeE9ZczkxdDg4VjZ0eWNTVXVsR3VxR1cvd1E3' +
  'Q1NNd3d1bHpNLzhKT09FTnRFbkhoV2FIS1FweXRSbHN6MC9GNG9OYWFYYjkzU1BEQzhpSU1XRmk2TGhvTnZ1ckM2aENQa0tk' +
  'Y2xjemMvZ0g0VXNNbWsyOU1mWGsyV3hocExZTVk5RTFxK0NlbFNONk1VQUZQTEt5eHRFL1JURmNNQVN4OWZRM0dLMitRcHM1' +
  'TzFWSXFOQ3BKTkpvUHMzbXV0eC84YU4weEdFU3huQ3V5Smk5Y0dKZFhlMnNPY1hBZ3ZjcWJENVFGY2Z4Z01vcDdFMTdhV2N4' +
  'cW1wTGtKVW9NWUdISTYwTHkzUGlVcGFqU29ZWUtKVENaS2s2SE92bU01azVNSldPem1oZXdwUjlxaEFVdG1aSHN6bmpVV2dK' +
  'WHd6MlNERmlYeGVybWFwTTU1b1VFRlZoa3JIanp0QXpyNFdzdHFzWXlsTVhTMGkwcFprak9sMTVQN051MzZkYzdtNkpFMC9R' +
  'UnoyM3Z2VE9RS0VjbGRMamYxT3FkZ1praFo3QzZlUFZQNmhxVE00WmUzWlM4RmZmbE41YjBncGpLS2djcXJ5TVBGd3I3UThu' +
  'K0lsL2VYN0lncTUxR0d1dnZHV2p5cTl1L0d1VjYxRmpNSDd6M1ZFUk9jeVRxQ2YzcUZnOWNjaEJEcXJTNlo4VTU2R2NUbTlk' +
  'OVFKUyt4OWhIMWlUZVFOZU1Obi9vSkZsRjY1N0UxcW1lQ2YwK2l6ZmdEUVRuTmQxYXdiM3FjSjY1YWNnZVM2NUMwNlFOakQw' +
  'RkNqb2hxc2tqcEhETGVOWWZDa0g3UT09AAAARAAAAAAAAAKnxAcTqdvIFgS7H9cyw/ahtHITViIjfKDcND2g8/s5WQIe9MvP' +
  'S7bvHbY1pbjl6eUTwuZEOGkee+oSO/oARBcLp/6Y+F16MizIi5Oa+iLVsN8zS7CKJtwj4gH3TbULvEt70TDRnHjL6AT1Tpyr' +
  '+J1tAkzJxF0+3Wyn1mylxqveYI2jG9MxvoEr2Wk4ern8e1K1/u0x3uvVtoEHk1KDl+fkPxxsxkBBOHV3BuIkb/a7eqyEaUWU' +
  'aagqC6EQO46ViGwhDtoWSWva18IZXehj8sYibgjHjtfZDaXr71GlrC4uxOY/uikADa9Z41PMJSVjVWhr4qvz73+IZHH6H4O2' +
  'v0+aZDCRaZM3NaRTYydN5tiGG6jlc/NZJGt2j9tWYUTOIAifnz7xnB4uwGPfeeK11IqCidXU2vjev1OceIBFSeYK9jJQW7oH' +
  'Hfg/2cYoN/xYJo90DfBw7PmX5rdRsCzUTKNi8b8zdsNL9/oVpCaokuTT5a3/J1Kkxu943pZgBcVz0umUHixwCcKgZrs9G3NS' +
  'N2Uq5LLjVCpxFp+y3mST91d7wy1yf4h1gotcxvf08DY1u4sGaCpOFNMWiNAZ29sc/r3Ae0m82Q7uZUSQe7JOXqX8tqSM4zYt' +
  '6n88Orf6UEG40LCgjH9MCQaq3fVRNVoKeKIax2GTWzyn1jiKeIas5lCtqGGiwtOY5GXs9+4+MQquhj/XwhdNCQuAeDVnKnbw' +
  'JKquvE4BBJrEHud0GdqG73eo/PiFD9U7qQWayAK8sIArNE1XTp3l2ByDC3it8Nt5S1WDtPBnZY6FcTqxWL6krxxl+9mf+x2O' +
  '+SE0v93t9qGGsX6bJ1SMzx8z1389P8P0fvAbEB95LJFQpHZEHdI5q+i5UvhMDcHGQIFbjs/v0LKc8nwlBDeUEp1kvUF4H0DB' +
  'GhHQMCRGOY8Iy+CAjDpoqOZAQqpe3jWwFDgvHJBaajNkZbUFCqeHkSpE39WeC1qC02XqCvxOso3L4S1d2PpYFfUfC6EWQHa6' +
  'TOeKFPfiI5OaABQiG1TYMv3SW5+Bi7sMZodK9VDFwr1vayA+hKJG';
