// ../../../../../tmp/ng-v718/node_modules/jose/dist/webapi/lib/buffer_utils.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var strictDecoder = new TextDecoder("utf-8", { fatal: true });
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0), buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers)
    buf.set(buffer, i), i += buffer.length;
  return buf;
}
var NON_ASCII = /[^\x00-\x7f]/;
function encode(string) {
  if (typeof string == "string" && string.length >= 128) {
    if (NON_ASCII.test(string))
      throw new TypeError("non-ASCII string encountered in encode()");
    return encoder.encode(string);
  }
  const bytes = new Uint8Array(string.length);
  for (let i = 0; i < string.length; i++) {
    const code = string.charCodeAt(i);
    if (code > 127)
      throw new TypeError("non-ASCII string encountered in encode()");
    bytes[i] = code;
  }
  return bytes;
}
function decodeBase64(encoded, url = false) {
  if (Uint8Array.fromBase64)
    return Uint8Array.fromBase64(encoded, { alphabet: url ? "base64url" : "base64" });
  if (url) {
    if (encoded.includes("+") || encoded.includes("/"))
      throw new TypeError("Invalid base64url");
    encoded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  }
  const binary = atob(encoded), bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ../../../../../tmp/ng-v718/node_modules/jose/dist/webapi/util/errors.js
var JOSEError = class extends Error {
  static code = "ERR_JOSE_GENERIC";
  code = "ERR_JOSE_GENERIC";
  constructor(message2, options) {
    super(message2, options), this.name = this.constructor.name, Error.captureStackTrace?.(this, this.constructor);
  }
};
var JWTClaimValidationFailed = class extends JOSEError {
  static code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } }), this.claim = claim, this.reason = reason, this.payload = payload;
  }
};
var JWTExpired = class extends JOSEError {
  static code = "ERR_JWT_EXPIRED";
  code = "ERR_JWT_EXPIRED";
  claim;
  reason;
  payload;
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } }), this.claim = claim, this.reason = reason, this.payload = payload;
  }
};
var JOSEAlgNotAllowed = class extends JOSEError {
  static code = "ERR_JOSE_ALG_NOT_ALLOWED";
  code = "ERR_JOSE_ALG_NOT_ALLOWED";
};
var JOSENotSupported = class extends JOSEError {
  static code = "ERR_JOSE_NOT_SUPPORTED";
  code = "ERR_JOSE_NOT_SUPPORTED";
};
var JWSInvalid = class extends JOSEError {
  static code = "ERR_JWS_INVALID";
  code = "ERR_JWS_INVALID";
};
var JWTInvalid = class extends JOSEError {
  static code = "ERR_JWT_INVALID";
  code = "ERR_JWT_INVALID";
};
var JWKSInvalid = class extends JOSEError {
  static code = "ERR_JWKS_INVALID";
  code = "ERR_JWKS_INVALID";
};
var JWKSNoMatchingKey = class extends JOSEError {
  static code = "ERR_JWKS_NO_MATCHING_KEY";
  code = "ERR_JWKS_NO_MATCHING_KEY";
  constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSMultipleMatchingKeys = class extends JOSEError {
  [Symbol.asyncIterator] = async function* () {
  };
  static code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
    super(message2, options);
  }
};
var JWKSTimeout = class extends JOSEError {
  static code = "ERR_JWKS_TIMEOUT";
  code = "ERR_JWKS_TIMEOUT";
  constructor(message2 = "request timed out", options) {
    super(message2, options);
  }
};
var JWSSignatureVerificationFailed = class extends JOSEError {
  static code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
  }
};

// ../../../../../tmp/ng-v718/node_modules/jose/dist/webapi/util/base64url.js
var invalid = "The input to be decoded is not correctly encoded.";
function decode(input) {
  try {
    return decodeBase64(typeof input == "string" ? input : decoder.decode(input), true);
  } catch (cause) {
    throw new TypeError(invalid, { cause });
  }
}

// ../../../../../tmp/ng-v718/node_modules/jose/dist/webapi/lib/validate.js
function isObject(input) {
  if (typeof input != "object" || input === null || Object.prototype.toString.call(input) !== "[object Object]")
    return false;
  const prototype = Object.getPrototypeOf(input);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}
function isJwkSet(input) {
  return isObject(input) && Array.isArray(input.keys) && Array.from(input.keys).every(isObject);
}
function isDisjoint(...headers) {
  const parameters = /* @__PURE__ */ new Set();
  for (const header of headers)
    if (header)
      for (const parameter of Object.keys(header)) {
        if (parameters.has(parameter))
          return false;
        parameters.add(parameter);
      }
  return true;
}
function decodeBase64url(value, label, ErrorClass) {
  try {
    return decode(value);
  } catch {
    throw new ErrorClass(`Failed to base64url decode the ${label}`);
  }
}
function encodeBase64url(value, label, ErrorClass) {
  try {
    return encode(value);
  } catch {
    throw new ErrorClass(`The ${label} is not a valid base64url string`);
  }
}
function parseJoseHeader(b64, ErrorClass, message2) {
  let parsed;
  try {
    parsed = JSON.parse(strictDecoder.decode(decode(b64)));
  } catch {
    throw new ErrorClass(message2);
  }
  if (!isObject(parsed))
    throw new ErrorClass(message2);
  return parsed;
}
var JWS_RECOGNIZED = { __proto__: null, b64: true };
function validateAlgorithms(option, algorithms) {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s != "string")))
    throw new TypeError(`"${option}" option must be an array of strings`);
  return algorithms === void 0 ? void 0 : new Set(algorithms);
}
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0)
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  if (!protectedHeader || protectedHeader.crit === void 0)
    return [];
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input != "string" || input.length === 0))
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  const recognized = recognizedOption === void 0 ? recognizedDefault : { __proto__: null, ...recognizedOption, ...recognizedDefault };
  for (const parameter of protectedHeader.crit) {
    if (!(parameter in recognized))
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    if (!Object.hasOwn(joseHeader, parameter) || joseHeader[parameter] === void 0)
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    if (recognized[parameter] && (!Object.hasOwn(protectedHeader, parameter) || protectedHeader[parameter] === void 0))
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
  }
  return protectedHeader.crit;
}
function validateB64(protectedHeader, extensions) {
  if (extensions.includes("b64")) {
    const b64 = protectedHeader.b64;
    if (typeof b64 != "boolean")
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    return b64;
  }
  return true;
}

// ../../../../../tmp/ng-v718/node_modules/jose/dist/webapi/lib/key.js
var tag = (key) => key[Symbol.toStringTag];
var jwkMatchesOp = (entry, key, usage) => {
  const { alg } = entry;
  if (key.use !== void 0) {
    const expected = usage === "sign" || usage === "verify" ? "sig" : "enc";
    if (key.use !== expected)
      throw new TypeError(`Invalid key for this operation, its "use" must be "${expected}" when present`);
  }
  if (key.alg !== void 0 && key.alg !== alg)
    throw new TypeError(`Invalid key for this operation, its "alg" must be "${alg}" when present`);
  if (Array.isArray(key.key_ops)) {
    const expectedKeyOp = usage === "encrypt" || usage === "decrypt" ? entry.ops?.[usage === "encrypt" ? 0 : 1] : usage;
    if (expectedKeyOp && !key.key_ops.includes(expectedKeyOp))
      throw new TypeError(`Invalid key for this operation, its "key_ops" must include "${expectedKeyOp}" when present`);
  }
};
async function prepareKey(entry, key, usage) {
  const { alg, secret } = entry, privateKey = usage === "decrypt" || usage === "sign";
  if (secret && key instanceof Uint8Array)
    return key;
  let normalized, keyObject;
  if (isObject(key)) {
    if (normalized = normalizeJwk(key), typeof normalized.kty != "string")
      throw invalidKeyType(alg, key, secret);
    if (!(secret ? normalized.kty === "oct" && typeof normalized.k == "string" : normalized.kty !== "oct" && (privateKey ? normalized.kty === "AKP" && typeof normalized.priv == "string" || typeof normalized.d == "string" : normalized.d === void 0 && normalized.priv === void 0)))
      throw new TypeError(secret ? 'JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present' : `JSON Web Key for this operation must be a ${privateKey ? "private" : "public"} JWK`);
    if (jwkMatchesOp(entry, normalized, usage), normalized.kty === "oct")
      return decode(normalized.k);
    if (!Object.isFrozen(key)) {
      const { key_ops } = key;
      Array.isArray(key_ops) && Object.freeze(key_ops), Object.freeze(key);
    }
  } else {
    if (!isKeyLike(key))
      throw invalidKeyType(alg, key, secret);
    const expectedType = secret ? "secret" : privateKey ? "private" : "public";
    if (key.type !== expectedType && (secret || ["secret", "public", "private"].includes(key.type)))
      throw new TypeError(`${tag(key)} instances must be of type "${expectedType}" for the ${alg} algorithm`);
    if (isCryptoKey(key))
      return key;
    if (keyObject = key, keyObject.type === "secret")
      return keyObject.export();
  }
  cache ||= /* @__PURE__ */ new WeakMap();
  const cacheKey = key;
  let cached = cache.get(cacheKey);
  if (cached?.[alg])
    return cached[alg];
  if (cached || cache.set(cacheKey, cached = {}), keyObject && typeof keyObject.toCryptoKey == "function") {
    const isPublic = keyObject.type === "public", crv = nist[keyObject.asymmetricKeyDetails?.namedCurve], params = entry.resolve?.({ crv, asymmetricKeyType: keyObject.asymmetricKeyType }) ?? entry.subtle;
    return cached[alg] = keyObject.toCryptoKey(params, isPublic, entry.usages[isPublic ? 0 : 1]);
  }
  return normalized ??= keyObject.export({ format: "jwk" }), normalized.alg = alg, cached[alg] = await jwkToKey(entry, normalized);
}
var cache;
var nist = {
  __proto__: null,
  prime256v1: "P-256",
  secp384r1: "P-384",
  secp521r1: "P-521"
};
var isCryptoKey = (key) => {
  if (key?.[Symbol.toStringTag] === "CryptoKey")
    return true;
  try {
    return key instanceof CryptoKey;
  } catch {
    return false;
  }
};
var isKeyObject = (key) => key?.[Symbol.toStringTag] === "KeyObject";
var isKeyLike = (key) => isCryptoKey(key) || isKeyObject(key);
function message(msg, actual, ...types) {
  if (types.length > 2) {
    const last = types.pop();
    msg += `one of type ${types.join(", ")}, or ${last}.`;
  } else types.length === 2 ? msg += `one of type ${types[0]} or ${types[1]}.` : msg += `of type ${types[0]}.`;
  return actual == null ? msg += ` Received ${actual}` : typeof actual == "function" && actual.name ? msg += ` Received function ${actual.name}` : typeof actual == "object" && actual != null && actual.constructor?.name && (msg += ` Received an instance of ${actual.constructor.name}`), msg;
}
function invalidKeyType(alg, actual, secret) {
  const types = ["CryptoKey", "KeyObject", "JSON Web Key"];
  return secret && types.push("Uint8Array"), new TypeError(message(`Key for the ${alg} algorithm must be `, actual, ...types));
}
var unusable = (name, prop = "algorithm.name") => new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
function checkUsage(key, usage) {
  if (usage && !key.usages.includes(usage))
    throw new TypeError(`CryptoKey does not support this operation, its usages must include ${usage}.`);
}
function checkModulusLength(alg, key) {
  const { modulusLength } = key.algorithm;
  if (typeof modulusLength != "number" || modulusLength < 2048)
    throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
}
function checkCryptoKey(key, expected, usage) {
  const algorithm = key.algorithm;
  if (algorithm.name !== expected.name)
    throw unusable(expected.name);
  if (expected.hash && algorithm.hash?.name !== expected.hash)
    throw unusable(expected.hash, "algorithm.hash");
  if (expected.namedCurve && algorithm.namedCurve !== expected.namedCurve)
    throw unusable(expected.namedCurve, "algorithm.namedCurve");
  if (expected.length !== void 0 && algorithm.length !== expected.length)
    throw unusable(expected.length, "algorithm.length");
  checkUsage(key, usage);
}
function snapshotJwk(jwk) {
  return { __proto__: null, ...jwk };
}
function normalizeJwk(jwk) {
  const normalized = snapshotJwk(jwk);
  if (normalized.ext !== void 0 && typeof normalized.ext != "boolean")
    throw new TypeError('"ext" (Extractable) Parameter must be a boolean');
  if (normalized.key_ops !== void 0) {
    const value = normalized.key_ops, keyOps = Array.isArray(value) ? [...value] : void 0;
    if (!keyOps || keyOps.some((operation) => typeof operation != "string") || new Set(keyOps).size !== keyOps.length)
      throw new TypeError('"key_ops" (Key Operations) Parameter must be an array of unique strings');
    normalized.key_ops = keyOps;
  }
  return normalized;
}
async function jwkToKey(entry, jwk, extractable) {
  if (!entry.kty.includes(jwk.kty))
    throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
  const algorithm = entry.resolve?.({ kty: jwk.kty, crv: jwk.crv }) ?? entry.subtle, isPrivate = !!(jwk.d || jwk.priv), keyData = { ...jwk, ext: extractable ?? jwk.ext };
  return keyData.kty !== "AKP" && delete keyData.alg, delete keyData.use, crypto.subtle.importKey("jwk", keyData, algorithm, keyData.ext ?? !isPrivate, jwk.key_ops ?? entry.usages[isPrivate ? 1 : 0]);
}
async function rawKey(key, expected, usage, extractable = false) {
  return key instanceof Uint8Array && (key = await crypto.subtle.importKey("raw", key, expected, extractable, [usage])), checkCryptoKey(key, expected, usage), key;
}

// ../../../../../tmp/ng-v718/node_modules/jose/dist/webapi/lib/key_descriptor.js
function table(entries) {
  const out = { __proto__: null };
  for (const alg in entries)
    out[alg] = { ...entries[alg], alg };
  return out;
}

// ../../../../../tmp/ng-v718/node_modules/jose/dist/webapi/lib/jws_algorithms.js
var sig = [["verify"], ["sign"]];
function hmac(bits) {
  const subtle = { name: "HMAC", hash: `SHA-${bits}` };
  return { kty: ["oct"], secret: true, subtle, signing: subtle, usages: sig };
}
function rsa(bits, saltLength) {
  const subtle = { name: saltLength ? "RSA-PSS" : "RSASSA-PKCS1-v1_5", hash: `SHA-${bits}` };
  return {
    kty: ["RSA"],
    subtle,
    signing: saltLength ? { ...subtle, saltLength } : subtle,
    usages: sig,
    minRsaBits: 2048
  };
}
function ecdsa(crv, bits) {
  return {
    kty: ["EC"],
    crv,
    subtle: { name: "ECDSA", namedCurve: crv },
    signing: { name: "ECDSA", hash: `SHA-${bits}` },
    usages: sig
  };
}
function eddsa() {
  const subtle = { name: "Ed25519" };
  return {
    kty: ["OKP"],
    crv: "Ed25519",
    subtle,
    signing: subtle,
    usages: sig
  };
}
function mldsa(bits) {
  const subtle = { name: `ML-DSA-${bits}` };
  return {
    kty: ["AKP"],
    subtle,
    signing: subtle,
    usages: sig
  };
}
var JWS = table({
  HS256: hmac(256),
  HS384: hmac(384),
  HS512: hmac(512),
  RS256: rsa(256),
  RS384: rsa(384),
  RS512: rsa(512),
  PS256: rsa(256, 32),
  PS384: rsa(384, 48),
  PS512: rsa(512, 64),
  ES256: ecdsa("P-256", 256),
  ES384: ecdsa("P-384", 384),
  ES512: ecdsa("P-521", 512),
  EdDSA: eddsa(),
  Ed25519: eddsa(),
  "ML-DSA-44": mldsa(44),
  "ML-DSA-65": mldsa(65),
  "ML-DSA-87": mldsa(87)
});
function jwsAlgorithm(alg) {
  const entry = typeof alg == "string" ? JWS[alg] : void 0;
  if (!entry)
    throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  return entry;
}

// ../../../../../tmp/ng-v718/node_modules/jose/dist/webapi/lib/jws_verify.js
function prepareVerify(options) {
  return [options && validateAlgorithms("algorithms", options.algorithms), options?.crit];
}
function parseProtectedHeader(encodedProtected) {
  return encodedProtected === void 0 ? {} : parseJoseHeader(encodedProtected, JWSInvalid, "JWS Protected Header is invalid");
}
function encodeCompactUnencodedPayload(payload) {
  try {
    return encode(payload);
  } catch {
    throw new JWSInvalid("JWS Compact Serialization payload must use only ASCII characters");
  }
}
async function verifySignature(jws, shared, key, encodeUnencodedPayload, parsedProtected) {
  const { protected: encodedProtected, header, payload: inputPayload } = jws, parsedProt = parsedProtected ?? parseProtectedHeader(encodedProtected);
  if (!isDisjoint(parsedProt, header))
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  const joseHeader = { ...parsedProt, ...header }, b64 = validateB64(parsedProt, validateCrit(JWSInvalid, JWS_RECOGNIZED, shared[1], parsedProt, joseHeader)), { alg } = joseHeader;
  if (typeof alg != "string" || !alg)
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  if (shared[0] && !shared[0].has(alg))
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  if (b64) {
    if (typeof inputPayload != "string")
      throw new JWSInvalid("JWS Payload must be a string");
  } else if (typeof inputPayload != "string" && !(inputPayload instanceof Uint8Array))
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  const signingPayload = b64 || typeof inputPayload != "string" ? inputPayload : encodeUnencodedPayload(inputPayload);
  let resolvedKey = false;
  typeof key == "function" && (key = await key(parsedProt, jws), resolvedKey = true);
  const entry = jwsAlgorithm(alg), data = concat(encodedProtected !== void 0 ? encode(encodedProtected) : new Uint8Array(), encode("."), typeof signingPayload == "string" ? shared[2] ??= encodeBase64url(signingPayload, "payload", JWSInvalid) : signingPayload), signature = decodeBase64url(jws.signature, "signature", JWSInvalid), k = await prepareKey(entry, key, "verify"), cryptoKey = await rawKey(k, entry.subtle, "verify");
  entry.minRsaBits && checkModulusLength(entry.alg, cryptoKey);
  let verified = false;
  try {
    verified = await crypto.subtle.verify(entry.signing, cryptoKey, signature, data);
  } catch {
  }
  if (!verified)
    throw new JWSSignatureVerificationFailed();
  const result = { payload: typeof signingPayload == "string" ? decodeBase64url(signingPayload, "payload", JWSInvalid) : signingPayload };
  return encodedProtected !== void 0 && (result.protectedHeader = parsedProt), header !== void 0 && (result.unprotectedHeader = header), resolvedKey ? [{ ...result, key: k }, b64] : [result, b64];
}
async function verifyCompact(jws, shared, key) {
  if (jws instanceof Uint8Array && (jws = decoder.decode(jws)), typeof jws != "string")
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3)
    throw new JWSInvalid("Invalid Compact JWS");
  return verifySignature({ payload, protected: protectedHeader, signature }, shared, key, encodeCompactUnencodedPayload);
}

// ../../../../../tmp/ng-v718/node_modules/jose/dist/webapi/lib/jwt_claims_set.js
var epoch = (date) => Math.floor(date.getTime() / 1e3);
var multipliers = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
  w: 604800,
  y: 31557600
};
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
var checkFailed = "check_failed";
function invalidDuration() {
  throw new TypeError("Invalid time period format");
}
function secs(str) {
  typeof str != "string" && invalidDuration();
  const matched = REGEX.exec(str);
  (!matched || matched[4] && matched[1]) && invalidDuration();
  const value = parseFloat(matched[2]), numericDate2 = Math.round(value * multipliers[matched[3][0].toLowerCase()]);
  return Number.isFinite(numericDate2) || invalidDuration(), matched[1] === "-" || matched[4] === "ago" ? -numericDate2 : numericDate2;
}
function validateInput(label, input) {
  if (!Number.isFinite(input))
    throw new TypeError(`Invalid ${label} input`);
  return input;
}
var normalizeTyp = (value) => {
  const normalized = value.toLowerCase();
  return value.includes("/") ? normalized : `application/${normalized}`;
};
var checkAudiencePresence = (audPayload, audOption) => typeof audPayload == "string" ? audOption.includes(audPayload) : Array.isArray(audPayload) ? audOption.some((aud) => audPayload.includes(aud)) : false;
function validateNumericDate(payload, claim, required = false) {
  const value = payload[claim];
  if (!(value === void 0 && !required)) {
    if (typeof value != "number")
      throw new JWTClaimValidationFailed(`"${claim}" claim must be a number`, payload, claim, "invalid");
    return value;
  }
}
function unexpectedClaim(payload, claim) {
  throw new JWTClaimValidationFailed(`unexpected "${claim}" claim value`, payload, claim, checkFailed);
}
function validateClaimsSet(protectedHeader, encodedPayload, options = {}) {
  let payload;
  try {
    payload = JSON.parse(strictDecoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload))
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  const { typ } = options;
  if (typ !== void 0 && (typeof protectedHeader.typ != "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ)))
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", checkFailed);
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options, presenceCheck = [...requiredClaims];
  maxTokenAge !== void 0 && presenceCheck.push("iat"), audience !== void 0 && presenceCheck.push("aud"), subject !== void 0 && presenceCheck.push("sub"), issuer !== void 0 && presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse()))
    if (!Object.hasOwn(payload, claim))
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
  issuer !== void 0 && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss) && unexpectedClaim(payload, "iss"), subject !== void 0 && payload.sub !== subject && unexpectedClaim(payload, "sub"), audience !== void 0 && !checkAudiencePresence(payload.aud, typeof audience == "string" ? [audience] : audience) && unexpectedClaim(payload, "aud");
  const { clockTolerance } = options;
  let tolerance = 0;
  if (typeof clockTolerance == "string")
    tolerance = secs(clockTolerance);
  else if (clockTolerance !== void 0) {
    if (typeof clockTolerance != "number")
      throw new TypeError("Invalid clockTolerance option type");
    tolerance = clockTolerance;
  }
  validateInput("clockTolerance option", tolerance);
  const { currentDate } = options, now2 = validateInput("currentDate option", epoch(currentDate === void 0 ? /* @__PURE__ */ new Date() : currentDate)), iat = validateNumericDate(payload, "iat", maxTokenAge !== void 0), nbf = validateNumericDate(payload, "nbf");
  if (nbf !== void 0 && nbf > now2 + tolerance)
    throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", checkFailed);
  const exp = validateNumericDate(payload, "exp");
  if (exp !== void 0 && exp <= now2 - tolerance)
    throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", checkFailed);
  if (maxTokenAge !== void 0) {
    const age = now2 - iat, max = validateInput("maxTokenAge option", typeof maxTokenAge == "number" ? maxTokenAge : secs(maxTokenAge));
    if (age - tolerance > max)
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", checkFailed);
    if (age < -tolerance)
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", checkFailed);
  }
  return payload;
}

// ../../../../../tmp/ng-v718/node_modules/jose/dist/webapi/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const [verified, b64] = await verifyCompact(jwt, prepareVerify(options), key);
  if (!b64)
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  const payload = validateClaimsSet(verified.protectedHeader, verified.payload, options);
  return { ...verified, payload };
}

// ../../../../../tmp/ng-v718/node_modules/jose/dist/webapi/jwks/local.js
function isUsableJWK(jwk, entry, alg, kid) {
  const { kty, key_ops: keyOps, ext, kid: jwkKid, alg: jwkAlg, use, crv } = jwk;
  return (ext === void 0 || typeof ext == "boolean") && (keyOps === void 0 || Array.isArray(keyOps) && keyOps.every((operation, index) => typeof operation == "string" && keyOps.indexOf(operation) === index) && keyOps.includes("verify")) && entry.kty.includes(kty) && (kid === void 0 || typeof kid == "string" && kid === jwkKid) && (jwkAlg === void 0 ? kty !== "AKP" : alg === jwkAlg) && (use === void 0 || use === "sig") && (!entry.crv || crv === entry.crv);
}
async function importWithAlgCache(cache2, jwk, entry) {
  const cached = cache2.get(jwk) || cache2.set(jwk, {}).get(jwk), { alg } = entry;
  if (cached[alg] === void 0) {
    const pending = jwkToKey(entry, jwk, true).then((key) => {
      if (key.type !== "public")
        throw new JWKSInvalid("JSON Web Key Set members must be public keys");
      return cached[alg] = key, key;
    }).catch((error) => {
      throw cached[alg] === pending && delete cached[alg], error;
    });
    cached[alg] = pending;
  }
  return cached[alg];
}
function createLocalJWKSet(jwks) {
  let snapshot;
  try {
    snapshot = structuredClone(jwks);
  } catch {
  }
  if (!isJwkSet(snapshot))
    throw new JWKSInvalid("JSON Web Key Set malformed");
  const metadata = snapshot.keys.map((jwk) => {
    const normalized = snapshotJwk(jwk);
    return Array.isArray(normalized.key_ops) && (normalized.key_ops = [...normalized.key_ops]), normalized;
  }), cached = /* @__PURE__ */ new WeakMap();
  return Object.defineProperty(async (protectedHeader, token) => {
    const { alg, kid } = { ...protectedHeader, ...token?.header }, entry = typeof alg == "string" ? JWS[alg] : void 0;
    if (!entry || entry.secret)
      throw new JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
    const candidates = snapshot.keys.filter((_, index) => isUsableJWK(metadata[index], entry, alg, kid)), { 0: jwk, length } = candidates;
    if (!length)
      throw new JWKSNoMatchingKey();
    if (length !== 1) {
      const error = new JWKSMultipleMatchingKeys();
      throw error[Symbol.asyncIterator] = async function* () {
        for (const jwk2 of candidates)
          try {
            yield await importWithAlgCache(cached, jwk2, entry);
          } catch {
          }
      }, error;
    }
    return importWithAlgCache(cached, jwk, entry);
  }, "jwks", {
    value: () => structuredClone(snapshot)
  });
}

// ../../../../../tmp/ng-v718/node_modules/jose/dist/webapi/jwks/remote.js
function isCloudflareWorkers() {
  return typeof WebSocketPair < "u" || typeof navigator < "u" && navigator.userAgent === "Cloudflare-Workers" || typeof EdgeRuntime < "u" && EdgeRuntime === "vercel";
}
var USER_AGENT;
(typeof navigator > "u" || !navigator.userAgent?.startsWith?.("Mozilla/5.0 ")) && (USER_AGENT = "jose/v6.2.12");
var customFetch = /* @__PURE__ */ Symbol();
async function fetchJwks(url, headers, signal, fetchImpl = fetch) {
  const response = await fetchImpl(url, {
    method: "GET",
    signal,
    redirect: "manual",
    headers
  }).catch((err) => {
    throw err.name === "TimeoutError" ? new JWKSTimeout() : err;
  });
  if (response.status !== 200)
    throw new JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");
  try {
    return await response.json();
  } catch {
    throw new JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
  }
}
var jwksCache = /* @__PURE__ */ Symbol();
function isFreshFor(timestamp, duration) {
  return Number.isFinite(timestamp) && Date.now() < timestamp + duration;
}
function validateDuration(value, fallback, option) {
  if (Number.isNaN(value))
    throw new TypeError(`"${option}" option must not be NaN`);
  return typeof value == "number" ? value : fallback;
}
function createRemoteJWKSet(url, options) {
  if (!(url instanceof URL))
    throw new TypeError("url must be an instance of URL");
  const href = new URL(url.href).href, opts = options ?? {}, timeoutOption = opts.timeoutDuration;
  if (typeof timeoutOption == "number" && (!Number.isInteger(timeoutOption) || timeoutOption < 0))
    throw new TypeError('"timeoutDuration" option must be a non-negative integer');
  const timeoutDuration = typeof timeoutOption == "number" ? timeoutOption : 5e3, cooldownDuration = validateDuration(opts.cooldownDuration, 3e4, "cooldownDuration"), cacheMaxAge = validateDuration(opts.cacheMaxAge, 6e5, "cacheMaxAge"), headers = new Headers(opts.headers);
  USER_AGENT && !headers.has("User-Agent") && headers.set("User-Agent", USER_AGENT), headers.has("accept") || headers.set("accept", "application/json, application/jwk-set+json");
  const fetchImpl = opts[customFetch], cache2 = opts[jwksCache];
  let jwksTimestamp, pendingFetch, reloadSequence = 0, appliedSequence = 0, local;
  if (cache2 && typeof cache2 == "object") {
    const { uat, jwks } = cache2;
    isFreshFor(uat, cacheMaxAge) && isJwkSet(jwks) && (jwksTimestamp = uat, local = createLocalJWKSet(jwks));
  }
  const reload = async () => {
    if (pendingFetch && isCloudflareWorkers() && (pendingFetch = void 0), !pendingFetch) {
      const sequence = ++reloadSequence, current2 = pendingFetch = fetchJwks(href, headers, AbortSignal.timeout(timeoutDuration), fetchImpl).then((json2) => {
        const next = createLocalJWKSet(json2);
        if (sequence <= appliedSequence)
          return;
        local = next;
        const updatedAt = Date.now();
        cache2 && (cache2.uat = updatedAt, cache2.jwks = json2), jwksTimestamp = updatedAt, appliedSequence = sequence;
      }).finally(() => {
        pendingFetch === current2 && (pendingFetch = void 0);
      });
    }
    await pendingFetch;
  };
  return Object.defineProperties(async (protectedHeader, token) => {
    (!local || !isFreshFor(jwksTimestamp, cacheMaxAge)) && await reload();
    try {
      return await local(protectedHeader, token);
    } catch (err) {
      if (err instanceof JWKSNoMatchingKey && !isFreshFor(jwksTimestamp, cooldownDuration))
        return await reload(), local(protectedHeader, token);
      throw err;
    }
  }, {
    coolingDown: {
      get: () => isFreshFor(jwksTimestamp, cooldownDuration),
      enumerable: true
    },
    fresh: {
      get: () => isFreshFor(jwksTimestamp, cacheMaxAge),
      enumerable: true
    },
    reload: {
      value: reload,
      enumerable: true
    },
    reloading: {
      get: () => !!pendingFetch,
      enumerable: true
    },
    jwks: {
      value: () => local?.jwks(),
      enumerable: true
    }
  });
}

// lib/editorial-auth.mjs
var resolvers = /* @__PURE__ */ new Map();
var HttpError = class extends Error {
  constructor(status, message2) {
    super(message2);
    this.status = status;
  }
};
function config(env) {
  if (env.EDITORIAL_ENABLED !== "true" || !env.EDITORIAL_DB || !env.ACCESS_AUD || !env.ADMIN_ORIGIN || !/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN || "")) throw new HttpError(503, "Area redazione non ancora attiva. Il portale pubblico rimane disponibile.");
  const origin = new URL(env.ADMIN_ORIGIN);
  if (origin.protocol !== "https:" || origin.origin !== env.ADMIN_ORIGIN) throw new HttpError(503, "Configurazione redazione da completare.");
  return { origin: origin.origin, issuer: env.ACCESS_TEAM_DOMAIN, audience: env.ACCESS_AUD };
}
async function verifyToken(token, cfg, resolver) {
  if (!token || token.length > 16e3) throw new HttpError(401, "Accedi con il tuo account autorizzato.");
  try {
    const { payload } = await jwtVerify(token, resolver, { issuer: cfg.issuer, audience: cfg.audience, algorithms: ["RS256"], requiredClaims: ["exp", "iat", "sub", "email"], clockTolerance: 5 });
    if (payload.type !== "app" || typeof payload.sub !== "string" || !payload.sub || typeof payload.email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) throw Error("identity");
    return { email: payload.email.toLowerCase(), sub: payload.sub };
  } catch (_) {
    throw new HttpError(401, "Sessione scaduta o non valida. Accedi nuovamente.");
  }
}
async function authenticate(request, env) {
  const cfg = config(env);
  if (new URL(request.url).origin !== cfg.origin) throw new HttpError(403, "Questo indirizzo non \xE8 autorizzato per la redazione.");
  const token = request.headers.get("Cf-Access-Jwt-Assertion") || ((request.headers.get("Cookie") || "").match(/(?:^|;\s*)CF_Authorization=([^;]+)/) || [])[1];
  if (!token) throw new HttpError(401, "Accesso riservato. Apri /admin/ attraverso Cloudflare Access.");
  if (!resolvers.has(cfg.issuer)) resolvers.set(cfg.issuer, createRemoteJWKSet(new URL(cfg.issuer + "/cdn-cgi/access/certs"), { timeoutDuration: 5e3, cacheMaxAge: 3e5 }));
  return verifyToken(token, cfg, resolvers.get(cfg.issuer));
}
function protectWrite(request, env) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) return;
  if (request.headers.get("Origin") !== env.ADMIN_ORIGIN || request.headers.get("X-Editorial-Request") !== "1" || request.headers.get("Sec-Fetch-Site") === "cross-site") throw new HttpError(403, "Richiesta non autorizzata. Ricarica la pagina.");
}
var securityHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Vary": "Cookie, Cf-Access-Jwt-Assertion",
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
};
var json = (data, status = 200) => Response.json(data, { status, headers: securityHeaders });
async function bodyJSON(request) {
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) throw new HttpError(415, "Richiesto contenuto JSON.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Richiesta vuota.");
  let size = 0, chunks = [];
  for (; ; ) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 1e5) {
      await reader.cancel();
      throw new HttpError(413, "Richiesta troppo grande.");
    }
    chunks.push(value);
  }
  const all2 = new Uint8Array(size);
  let offset = 0;
  for (const c of chunks) {
    all2.set(c, offset);
    offset += c.length;
  }
  try {
    return JSON.parse(new TextDecoder().decode(all2));
  } catch (_) {
    throw new HttpError(400, "Dati non validi.");
  }
}

// assets/editorial-core-v7-18.mjs
var ROLES = ["admin", "editor", "data_reviewer", "specialist"];
var FIELDS = Object.freeze({
  name: { label: "Nome", raw: "denominazione" },
  address: { label: "Indirizzo", raw: "indirizzo" },
  town: { label: "Comune", raw: "comune" },
  phone: { label: "Telefono", raw: "telefono" },
  email: { label: "Email", raw: "email" },
  website: { label: "Sito web", raw: "sito" },
  hours: { label: "Orari", raw: "orari" },
  access: { label: "Modalit\xE0 di accesso", raw: "accesso" },
  accessibility: { label: "Accessibilit\xE0", raw: "accessibilita" },
  serviceState: { label: "Stato del servizio", raw: "stato_servizio" },
  type: { label: "Tipologia sanitaria", raw: "tipo", sensitive: true },
  subtype: { label: "Tipologia specifica", raw: "modulo", sensitive: true },
  ssn: { label: "Rapporto SSN", raw: "contratto_ssn_stato", sensitive: true },
  accreditation: { label: "Accreditamento", raw: "accreditamento_stato", sensitive: true },
  auth: { label: "Autorizzazione", raw: "autorizzazione_stato", sensitive: true },
  contractedBeds: { label: "Posti contrattualizzati", raw: "posti_contrattualizzati", sensitive: true },
  target: { label: "Destinatari", raw: "destinatari", sensitive: true }
});
var text = (value, max = 2e3) => {
  if (typeof value !== "string" || value.length > max) throw Error("Testo non valido o troppo lungo.");
  return value.trim();
};
function safeURL(value, required = false) {
  const s = text(value || "", 2048);
  if (!s && !required) return "";
  let u;
  try {
    u = new URL(s);
  } catch (_) {
    throw Error("Inserisci un collegamento HTTPS completo.");
  }
  if (u.protocol !== "https:" || u.username || u.password || /[\u0000-\u0020]/.test(s)) throw Error("Il collegamento deve usare HTTPS, senza credenziali.");
  return u.href;
}
function validDay(value) {
  const s = text(value, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0, 10) !== s || s > "9999-12-31" || s < "2000-01-01" || s > (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA", { timeZone: "Europe/Rome" })) throw Error("Data di verifica non valida o futura.");
  return s;
}
function cleanContent(input) {
  if (!input || !["news", "link", "banner"].includes(input.kind)) throw Error("Tipo di contenuto non valido.");
  const out = {
    kind: input.kind,
    title: text(input.title || "", 160),
    summary: text(input.summary || "", 400),
    body: text(input.body || "", 24e3),
    category: text(input.category || "Notizie", 60),
    url: safeURL(input.url || ""),
    image_id: text(input.image_id || "", 64),
    image_alt: text(input.image_alt || "", 250),
    placement: input.placement === "network" ? "network" : input.placement === "home" ? "home" : "both",
    starts_at: input.starts_at || null,
    ends_at: input.ends_at || null,
    featured: input.featured === true
  };
  if (!out.title) throw Error("Il titolo \xE8 obbligatorio.");
  if (out.image_id && !/^[0-9a-f-]{36}$/.test(out.image_id)) throw Error("Immagine non valida.");
  if (out.image_id && !out.image_alt) throw Error("Descrivi l\u2019immagine nel testo alternativo.");
  for (const k of ["starts_at", "ends_at"]) if (out[k]) {
    if (typeof out[k] !== "string" || !Number.isFinite(Date.parse(out[k]))) throw Error("Data di pubblicazione non valida.");
    out[k] = new Date(out[k]).toISOString();
  }
  if (out.starts_at && out.ends_at && out.ends_at <= out.starts_at) throw Error("La scadenza deve essere successiva all\u2019inizio.");
  return out;
}
function readyToPublish(c) {
  if (!c.summary && !c.body) throw Error("Aggiungi una descrizione.");
  if ((c.kind === "banner" || c.kind === "link") && !c.url) throw Error("Aggiungi il link di destinazione prima di pubblicare.");
  return c;
}
function isVisible(c, now2 = (/* @__PURE__ */ new Date()).toISOString()) {
  return !!c && (!c.starts_at || c.starts_at <= now2) && (!c.ends_at || c.ends_at > now2);
}

// lib/editorial-api.mjs
var now = () => (/* @__PURE__ */ new Date()).toISOString();
var uid = () => crypto.randomUUID();
var parse = (s, fallback = {}) => s ? JSON.parse(s) : fallback;
var fail = (status, message2) => {
  throw new HttpError(status, message2);
};
var has = (u, r) => u.roles.includes(r);
var admin = (u) => has(u, "admin");
var editor = (u) => admin(u) || has(u, "editor");
var reviewer = (u) => admin(u) || has(u, "data_reviewer") || has(u, "specialist");
var dbFor = (env) => env.EDITORIAL_DB.withSession ? env.EDITORIAL_DB.withSession("first-primary") : env.EDITORIAL_DB;
var stmt = (db, sql, ...args) => db.prepare(sql).bind(...args);
var one = (db, sql, ...args) => stmt(db, sql, ...args).first();
var all = async (db, sql, ...args) => (await stmt(db, sql, ...args).all()).results || [];
var stable = (x) => JSON.stringify(x, Object.keys(x).sort());
async function digest(value) {
  const data = typeof value === "string" ? new TextEncoder().encode(value) : value;
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", data))].map((x) => x.toString(16).padStart(2, "0")).join("");
}
var audit = (db, user, action, target, before, after) => stmt(db, "INSERT INTO cms_audit(actor,action,target,before_json,after_json,created_at) VALUES(?,?,?,?,?,?)", user.email, action, target, before == null ? null : JSON.stringify(before), after == null ? null : JSON.stringify(after), now());
async function transaction(db, condition, args, statements) {
  const id = uid();
  try {
    return await db.batch([stmt(db, `INSERT INTO cms_guards(id,ok) SELECT ?,CASE WHEN (${condition}) THEN 1 ELSE 0 END`, id, ...args), ...statements, stmt(db, "DELETE FROM cms_guards WHERE id=?", id)]);
  } catch (e) {
    if (/CHECK|constraint|cms_guards/i.test(String(e))) fail(409, "Il contenuto \xE8 cambiato. Ricarica e confronta la versione corrente.");
    throw e;
  }
}
async function requireUser(request, env, verify = authenticate) {
  config(env);
  const identity = await verify(request, env), db = dbFor(env);
  let row = await one(db, "SELECT * FROM cms_users WHERE email=?", identity.email);
  if (!row && identity.email === String(env.BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase()) {
    const done = await one(db, "SELECT value FROM cms_settings WHERE key='bootstrap'");
    if (!done) {
      try {
        await transaction(db, "NOT EXISTS(SELECT 1 FROM cms_settings WHERE key='bootstrap')", [], [
          stmt(db, "INSERT INTO cms_users(email,name,roles,scopes,created_at) VALUES(?,?,?,?,?)", identity.email, "Responsabile", JSON.stringify(["admin"]), "[]", now()),
          stmt(db, "INSERT INTO cms_settings(key,value) VALUES('bootstrap',?)", now()),
          audit(db, identity, "bootstrap", "users", null, { email: identity.email })
        ]);
      } catch (e) {
        if (e.status !== 409) throw e;
      }
      row = await one(db, "SELECT * FROM cms_users WHERE email=?", identity.email);
    }
  }
  if (!row || row.disabled) fail(403, "Questo account non \xE8 autorizzato alla redazione. Contatta un responsabile del progetto.");
  return { db, user: { ...row, roles: parse(row.roles, []), scopes: parse(row.scopes, []) } };
}
async function catalog(request, env) {
  const u = new URL("/data/editorial-catalog-v7-18.json", request.url);
  const r = await env.ASSETS.fetch(new Request(u, { method: "GET" }));
  if (!r.ok) fail(503, "Catalogo tecnico non disponibile.");
  const d = await r.json();
  if (d.schema !== 1 || !Array.isArray(d.records)) fail(503, "Catalogo tecnico non valido.");
  return d.records;
}
function inScope(u, r) {
  return admin(u) || !u.scopes.length || u.scopes.includes(r.asl) || u.scopes.includes(r.entity);
}
function publicOverride(row, base) {
  const values = parse(row.values_json), before = parse(row.base_values), meta = parse(row.meta_json);
  if (!row.addition && (!base || Object.keys(before).some((k) => String(base.fields[k] ?? "") !== String(before[k] ?? "")))) return null;
  const publicValues = Object.fromEntries(Object.entries(values).filter(([k]) => Object.hasOwn(FIELDS, k) || ["origin", "asl", "category"].includes(k)));
  const publicMeta = Object.fromEntries(Object.entries(meta).filter(([k]) => Object.hasOwn(FIELDS, k)).map(([k, m]) => [k, { checked_at: m.checked_at, changed: m.changed === true, uncertain: m.uncertain === true, sources: Array.isArray(m.sources) ? m.sources : [] }]));
  return { key: row.target, entity: row.entity, values: publicValues, meta: publicMeta, addition: !!row.addition, version: row.version };
}
async function current(db, records, key) {
  const base = records.find((r) => r.key === key), over = await one(db, "SELECT * FROM cms_overrides WHERE target=?", key);
  if (!base && !over?.addition) fail(404, "Scheda non trovata.");
  const p = over ? publicOverride(over, base) : null;
  const fields = { ...base?.fields || {}, ...p?.values || {} };
  return { base, over, record: { key, entity: base?.entity || over.entity, origin: base?.origin || fields.origin, asl: base?.asl || fields.asl || "", category: base?.category || fields.category || "", sources: base?.sources || [], fields }, hash: await digest(stable(fields)) };
}
async function publicFeed(db) {
  const rows = await all(db, "SELECT id,kind,live,published_at FROM cms_content WHERE live IS NOT NULL ORDER BY published_at DESC LIMIT 500");
  return rows.map((r) => ({ id: r.id, ...cleanContent(parse(r.live)), published_at: r.published_at })).filter(isVisibleNow);
}
var isVisibleNow = (c) => isVisible(c);
function contentRow(r) {
  return { ...r, draft: parse(r.draft), live: r.live ? parse(r.live) : null };
}
async function imageExists(db, u, c) {
  if (!c.image_id) return;
  const r = await one(db, "SELECT * FROM cms_media WHERE id=?", c.image_id);
  if (!r || !admin(u) && r.owner !== u.email) fail(400, "L\u2019immagine non \xE8 disponibile per questo contenuto.");
}
async function contentAPI(db, u, request, parts) {
  if (!editor(u)) fail(403, "Il tuo ruolo non pu\xF2 gestire i contenuti editoriali.");
  const id = parts[0] || "", action = parts[1] || "";
  if (request.method === "GET") {
    if (id && action === "history") {
      const r2 = await one(db, "SELECT * FROM cms_content WHERE id=?", id);
      if (!r2 || !admin(u) && r2.owner !== u.email) fail(404, "Contenuto non trovato.");
      return json(await all(db, "SELECT * FROM cms_content_history WHERE content_id=? ORDER BY version DESC LIMIT 100", id));
    }
    if (id) {
      const r2 = await one(db, "SELECT * FROM cms_content WHERE id=?", id);
      if (!r2 || !admin(u) && r2.owner !== u.email) fail(404, "Contenuto non trovato.");
      return json(contentRow(r2));
    }
    return json((await all(db, admin(u) ? "SELECT * FROM cms_content ORDER BY updated_at DESC LIMIT 250" : "SELECT * FROM cms_content WHERE owner=? ORDER BY updated_at DESC LIMIT 250", ...admin(u) ? [] : [u.email])).map(contentRow));
  }
  const b = await bodyJSON(request);
  if (!id && request.method === "POST") {
    const c2 = cleanContent(b);
    await imageExists(db, u, c2);
    const key = uid();
    await db.batch([stmt(db, "INSERT INTO cms_content(id,kind,owner,draft,status,version,updated_at) VALUES(?,?,?,?,?,?,?)", key, c2.kind, u.email, JSON.stringify(c2), "draft", 1, now()), audit(db, u, "content.create", key, null, c2)]);
    return json({ id: key, version: 1 }, 201);
  }
  if (!["POST", "PUT"].includes(request.method)) fail(405, "Metodo non consentito.");
  const r = await one(db, "SELECT * FROM cms_content WHERE id=?", id);
  if (!r || !admin(u) && r.owner !== u.email) fail(404, "Contenuto non trovato.");
  if (!Number.isInteger(b.version) || b.version !== r.version) fail(409, "Versione superata. Ricarica il contenuto.");
  let c = parse(r.draft), live = r.live, status = r.status, published = r.published_at;
  if (!action && request.method === "PUT") {
    c = cleanContent(b);
    if (c.kind !== r.kind) fail(400, "Il tipo di un contenuto esistente non pu\xF2 cambiare.");
    await imageExists(db, u, c);
    status = "draft";
  } else if (action === "submit") {
    readyToPublish(c);
    status = "review";
  } else if (action === "publish") {
    if (!admin(u)) fail(403, "Solo un Admin pu\xF2 pubblicare.");
    readyToPublish(c);
    await imageExists(db, u, c);
    live = JSON.stringify(c);
    status = "published";
    published = now();
  } else if (action === "unpublish") {
    if (!admin(u)) fail(403, "Solo un Admin pu\xF2 ritirare un contenuto.");
    if (!text(b.reason || "", 500)) fail(400, "Indica perch\xE9 ritiri il contenuto.");
    live = null;
    status = "draft";
  } else if (action === "restore") {
    if (!admin(u)) fail(403, "Ripristino riservato agli Admin.");
    const h = await one(db, "SELECT snapshot FROM cms_content_history WHERE content_id=? AND version=?", id, Number(b.restore_version) || 0);
    if (!h) fail(404, "Versione non trovata.");
    c = cleanContent(parse(h.snapshot));
    status = "draft";
  } else fail(404, "Operazione non disponibile.");
  await transaction(db, "EXISTS(SELECT 1 FROM cms_content WHERE id=? AND version=?)", [id, b.version], [
    stmt(db, "INSERT INTO cms_content_history(content_id,version,snapshot,actor,created_at) VALUES(?,?,?,?,?)", id, r.version, r.draft, u.email, now()),
    stmt(db, "UPDATE cms_content SET draft=?,live=?,status=?,version=version+1,updated_at=?,published_at=? WHERE id=?", JSON.stringify(c), live, status, now(), published, id),
    audit(db, u, "content." + (action || "edit"), id, { draft: parse(r.draft), live: r.live ? parse(r.live) : null, status: r.status }, { draft: c, status, reason: b.reason || "" })
  ]);
  return json({ id, version: r.version + 1, status });
}
function proposalView(r) {
  return { ...r, base: parse(r.base_json), patch: parse(r.patch), evidence: parse(r.evidence), uncertain: parse(r.uncertain, []) };
}
function sensitiveProposal(p) {
  return p.mode === "add" || Object.keys(parse(p.patch)).some((k) => FIELDS[k]?.sensitive);
}
function validateProposal(b, record, mode) {
  const patch = b.patch;
  if (!patch || Array.isArray(patch) || !Object.keys(patch).length || Object.keys(patch).length > 18) fail(400, "Seleziona almeno un campo.");
  const evidence = {}, values = {};
  for (const [k, v] of Object.entries(patch)) {
    if (!Object.hasOwn(FIELDS, k)) fail(400, "Campo non modificabile: " + k);
    if (record.entity === "support" && FIELDS[k].sensitive) fail(400, "Il campo sanitario non \xE8 applicabile a questa scheda territoriale.");
    values[k] = text(v, 4e3);
    if (k === "website" && values[k]) values[k] = safeURL(values[k], true);
    if (k === "email" && values[k] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[k])) fail(400, "Email non valida.");
    if (mode === "confirm" && String(record.fields[k] ?? "") !== values[k]) fail(400, "La conferma senza modifiche deve mantenere il valore corrente.");
    const e = b.evidence?.[k];
    if (!e || !Array.isArray(e.urls) || !e.urls.length || e.urls.length > 5) fail(400, "Fonte obbligatoria per " + FIELDS[k].label);
    evidence[k] = { urls: e.urls.map((x) => safeURL(x, true)), kind: e.kind === "institutional" ? "institutional" : "publisher" };
    if ((FIELDS[k].sensitive || mode === "add") && evidence[k].kind !== "institutional") fail(400, "Per nuovi servizi e campi sensibili serve una fonte istituzionale.");
  }
  if (mode === "add" && /casa\s+rifugio|sede\s+protetta/i.test(values.name || "")) fail(400, "Le sedi protette non sono ammesse nel catalogo pubblico.");
  for (const k of ["auth", "accreditation"]) if (k in values && !["indicata", "dichiarazione", "da-verificare", "rete-asl"].includes(values[k])) fail(400, "Stato amministrativo non valido.");
  if ("ssn" in values && !["indicata", "dichiarazione", "da-verificare", "rete-asl"].includes(values.ssn)) fail(400, "Stato SSN non valido.");
  if (values.ssn === "rete-asl" && record.origin !== "rete") fail(400, "Un rapporto SSN non modifica la gestione della struttura.");
  if ("contractedBeds" in values && values.contractedBeds && !/^\d{1,5}$/.test(values.contractedBeds)) fail(400, "Indica un numero di posti o lascia il dato vuoto.");
  const uncertain = Array.isArray(b.uncertain) ? b.uncertain.filter((k) => Object.hasOwn(values, k)) : [];
  return { values, evidence, checked: validDay(b.checked_at), uncertain, note: text(b.note || "", 2e3) };
}
async function proposalsAPI(db, u, request, parts, records) {
  if (!reviewer(u)) fail(403, "Il tuo ruolo non pu\xF2 modificare le schede.");
  const id = parts[0] || "", action = parts[1] || "";
  if (request.method === "GET") {
    const rows = id ? await all(db, "SELECT * FROM cms_proposals WHERE id=?", id) : await all(db, "SELECT * FROM cms_proposals ORDER BY updated_at DESC LIMIT 500");
    return json(rows.filter((r2) => (admin(u) || has(u, "specialist") || r2.author === u.email) && inScope(u, records.find((x) => x.key === r2.target) || { entity: r2.entity, asl: parse(r2.base_json).asl })).map(proposalView));
  }
  const b = await bodyJSON(request);
  if (!id && request.method === "POST") {
    if (!["update", "confirm", "add"].includes(b.mode)) fail(400, "Tipo di revisione non valido.");
    let target = b.target, record, hash;
    if (b.mode === "add") {
      if (!["clinical", "support"].includes(b.entity)) fail(400, "Categoria di scheda non valida.");
      if (b.entity === "clinical" && !["rete", "moduli", "privati"].includes(b.origin)) fail(400, "Indica la rete del nuovo servizio.");
      if (b.entity === "support" && !["PUA", "Consultorio", "PIS", "Emergenza sociale"].includes(b.category)) fail(400, "Categoria territoriale non ammessa. Nessuna sede protetta.");
      target = (b.entity === "clinical" ? b.origin : "support") + ":NG-" + uid();
      record = { key: target, entity: b.entity, origin: b.origin || "support", asl: text(b.asl || "", 80), category: b.category || "", fields: {} };
      hash = await digest("{}");
      if (!b.patch?.name || !b.patch?.town) fail(400, "Nome e comune sono obbligatori per una nuova scheda.");
    } else {
      const curr = await current(db, records, target);
      record = curr.record;
      hash = curr.hash;
    }
    if (!inScope(u, record)) fail(403, "Scheda fuori dal territorio assegnato.");
    const p = validateProposal(b, record, b.mode), key = uid();
    if (b.base_hash && b.base_hash !== hash) fail(409, "La scheda \xE8 cambiata. Ricaricala.");
    await db.batch([stmt(db, "INSERT INTO cms_proposals(id,target,entity,mode,base_hash,base_json,patch,evidence,checked_at,uncertain,note,author,status,version,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", key, target, record.entity, b.mode, hash, JSON.stringify(record), JSON.stringify(p.values), JSON.stringify(p.evidence), p.checked, JSON.stringify(p.uncertain), p.note, u.email, "draft", 1, now(), now()), audit(db, u, "data.propose", target, null, { proposal: key, patch: p.values })]);
    return json({ id: key, target, version: 1 }, 201);
  }
  const r = await one(db, "SELECT * FROM cms_proposals WHERE id=?", id);
  if (!r) fail(404, "Proposta non trovata.");
  if (!Number.isInteger(b.version) || b.version !== r.version) fail(409, "La proposta \xE8 cambiata. Ricaricala.");
  const base = parse(r.base_json);
  if (!inScope(u, base)) fail(403, "Scheda fuori dal territorio assegnato.");
  if (!action && request.method === "PUT") {
    if (r.author !== u.email || !["draft", "needs_changes", "rejected"].includes(r.status)) fail(403, "Questa proposta non \xE8 modificabile.");
    const curr = r.mode === "add" ? { record: base, hash: await digest("{}") } : await current(db, records, r.target), p = validateProposal(b, curr.record, r.mode);
    if (b.base_hash && b.base_hash !== curr.hash) fail(409, "La scheda \xE8 cambiata. Riapri la proposta sui dati correnti.");
    await transaction(db, "EXISTS(SELECT 1 FROM cms_proposals WHERE id=? AND version=?)", [id, b.version], [stmt(db, "UPDATE cms_proposals SET patch=?,evidence=?,checked_at=?,uncertain=?,note=?,base_hash=?,base_json=?,status='draft',specialist=NULL,version=version+1,updated_at=? WHERE id=?", JSON.stringify(p.values), JSON.stringify(p.evidence), p.checked, JSON.stringify(p.uncertain), p.note, curr.hash, JSON.stringify(curr.record), now(), id), audit(db, u, "data.edit-proposal", r.target, proposalView(r), p)]);
    return json({ id, version: r.version + 1 });
  }
  if (request.method !== "POST") fail(405, "Metodo non consentito.");
  let status = r.status, specialist = r.specialist, note = text(b.reason || "", 1e3);
  if (action === "submit") {
    if (r.author !== u.email || !["draft", "needs_changes", "rejected"].includes(r.status)) fail(403, "Solo l\u2019autore pu\xF2 inviare questa bozza.");
    status = "submitted";
    specialist = null;
  } else if (action === "specialist") {
    if (!has(u, "specialist") || u.email === r.author || r.status !== "submitted") fail(403, "Serve una verifica specialistica distinta dall\u2019autore.");
    specialist = u.email;
  } else if (["reject", "request_changes"].includes(action)) {
    if (!admin(u) || r.status !== "submitted") fail(403, "Revisione riservata agli Admin.");
    if (!note) fail(400, "Indica una motivazione.");
    status = action === "reject" ? "rejected" : "needs_changes";
    specialist = null;
  } else if (action === "approve") {
    if (!admin(u) || r.status !== "submitted" || r.author === u.email) fail(403, "Serve l\u2019approvazione di un Admin diverso dal proponente.");
    if (sensitiveProposal(r) && !specialist) fail(403, "Questa proposta richiede prima la verifica specialistica.");
    if (specialist) {
      const expert = await one(db, "SELECT * FROM cms_users WHERE email=?", specialist);
      if (!expert || expert.disabled || !parse(expert.roles, []).includes("specialist")) fail(409, "La verifica specialistica deve essere rinnovata.");
    }
    const curr = r.mode === "add" ? { record: base, hash: await digest("{}"), over: null, base: null } : await current(db, records, r.target);
    if (curr.hash !== r.base_hash) fail(409, "I valori correnti differiscono da quelli revisionati. Chiedi una nuova proposta.");
    const old = curr.over, values = { ...parse(old?.values_json), ...parse(r.patch) }, meta = { ...parse(old?.meta_json) }, baseValues = { ...parse(old?.base_values) };
    if (r.mode === "add") {
      values.origin = base.origin;
      values.asl = base.asl;
      values.category = base.category;
    }
    const ev = parse(r.evidence), uncertain = parse(r.uncertain, []);
    for (const k of Object.keys(parse(r.patch))) {
      baseValues[k] = String(curr.base?.fields[k] ?? "");
      meta[k] = { checked_at: r.checked_at, changed: String(curr.record.fields[k] ?? "") !== values[k], uncertain: uncertain.includes(k), sources: ev[k].urls };
    }
    const after = { target: r.target, entity: r.entity, values_json: JSON.stringify(values), meta_json: JSON.stringify(meta), base_values: JSON.stringify(baseValues), addition: old?.addition || Number(r.mode === "add"), version: (old?.version || 0) + 1, published_at: now() };
    const guard = "EXISTS(SELECT 1 FROM cms_proposals WHERE id=? AND version=? AND status='submitted') AND " + (old ? "EXISTS(SELECT 1 FROM cms_overrides WHERE target=? AND version=?)" : "NOT EXISTS(SELECT 1 FROM cms_overrides WHERE target=?)");
    await transaction(db, guard, [id, b.version, r.target, ...old ? [old.version] : []], [
      stmt(db, "INSERT INTO cms_overrides(target,entity,values_json,meta_json,base_values,addition,version,published_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(target) DO UPDATE SET values_json=excluded.values_json,meta_json=excluded.meta_json,base_values=excluded.base_values,version=excluded.version,published_at=excluded.published_at", after.target, after.entity, after.values_json, after.meta_json, after.base_values, after.addition, after.version, after.published_at),
      stmt(db, "UPDATE cms_proposals SET status='approved',approver=?,reviewed_at=?,version=version+1,updated_at=? WHERE id=?", u.email, now(), now(), id),
      stmt(db, "INSERT INTO cms_data_history(target,proposal_id,before_json,after_json,actor,created_at) VALUES(?,?,?,?,?,?)", r.target, id, old ? JSON.stringify(old) : null, JSON.stringify(after), u.email, now()),
      audit(db, u, "data.approve", r.target, old, { proposal: id, values, meta })
    ]);
    return json({ id, status: "approved", version: r.version + 1 });
  } else fail(404, "Operazione non disponibile.");
  await transaction(db, "EXISTS(SELECT 1 FROM cms_proposals WHERE id=? AND version=?)", [id, b.version], [stmt(db, "UPDATE cms_proposals SET status=?,specialist=?,review_note=?,version=version+1,updated_at=? WHERE id=?", status, specialist, note, now(), id), audit(db, u, "data." + action, r.target, { status: r.status }, { proposal: id, status, reason: note })]);
  return json({ id, status, version: r.version + 1 });
}
async function usersAPI(db, u, request) {
  if (!admin(u)) fail(403, "Gestione utenti riservata agli Admin.");
  if (request.method === "GET") return json((await all(db, "SELECT * FROM cms_users ORDER BY email")).map((x) => ({ ...x, roles: parse(x.roles, []), scopes: parse(x.scopes, []) })));
  if (request.method !== "POST") fail(405, "Metodo non consentito.");
  const b = await bodyJSON(request), email = text(b.email || "", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !Array.isArray(b.roles) || !b.roles.length || b.roles.some((r) => !ROLES.includes(r))) fail(400, "Email o ruoli non validi.");
  const roles = [...new Set(b.roles)], name = text(b.name || "", 100), scopes = Array.isArray(b.scopes) ? b.scopes.map((s) => text(s, 80)) : [], disabled = Number(b.disabled === true);
  if (email === u.email && (disabled || !roles.includes("admin"))) fail(400, "Non puoi disabilitare o rimuovere il tuo ruolo Admin da questa schermata.");
  const old = await one(db, "SELECT * FROM cms_users WHERE email=?", email);
  if (old && b.version !== old.version) fail(409, "Utente modificato: ricarica.");
  await transaction(db, old ? "EXISTS(SELECT 1 FROM cms_users WHERE email=? AND version=?)" : "NOT EXISTS(SELECT 1 FROM cms_users WHERE email=?)", [email, ...old ? [b.version] : []], [
    stmt(db, "INSERT INTO cms_users(email,name,roles,scopes,disabled,created_at) VALUES(?,?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,roles=excluded.roles,scopes=excluded.scopes,disabled=excluded.disabled,version=cms_users.version+1", email, name, JSON.stringify(roles), JSON.stringify(scopes), disabled, now()),
    audit(db, u, "users.authorize", email, old, { name, roles, scopes, disabled })
  ]);
  return json({ email, version: (old?.version || 0) + 1, message: "Autorizzazione salvata. Condividi il link dell\u2019area redazione; nessuna email di invito \xE8 stata inviata automaticamente." });
}
function inspectWebP(bytes) {
  if (bytes.length < 30 || bytes.length > 3 * 1024 * 1024) throw Error("Immagine WebP troppo grande o non valida.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), s = (at, n) => String.fromCharCode(...bytes.slice(at, at + n));
  if (s(0, 4) !== "RIFF" || s(8, 4) !== "WEBP" || view.getUint32(4, true) + 8 !== bytes.length) throw Error("Formato immagine non valido.");
  let width = 0, height = 0, hasPixels = false;
  for (let at = 12; at + 8 <= bytes.length; ) {
    const k = s(at, 4), n = view.getUint32(at + 4, true), p = at + 8;
    if (p + n > bytes.length) throw Error("Immagine troncata.");
    if (!["VP8 ", "VP8L", "VP8X", "ALPH"].includes(k)) throw Error("Usa un\u2019immagine statica esportata dal pannello, senza metadati.");
    if (k === "VP8 ") {
      if (n < 10 || s(p + 3, 3) !== "\x9D*") throw Error("WebP non valido.");
      width = view.getUint16(p + 6, true) & 16383;
      height = view.getUint16(p + 8, true) & 16383;
      hasPixels = true;
    }
    if (k === "VP8L") {
      if (n < 5 || bytes[p] !== 47) throw Error("WebP non valido.");
      const b = view.getUint32(p + 1, true);
      width = (b & 16383) + 1;
      height = (b >>> 14 & 16383) + 1;
      hasPixels = true;
    }
    if (k === "VP8X" && n >= 10 && bytes[p] & 2) throw Error("Le immagini animate non sono consentite.");
    at = p + n + n % 2;
  }
  if (!hasPixels || width < 1 || height < 1 || width > 4096 || height > 4096 || width * height > 12e6) throw Error("Dimensioni immagine non consentite.");
  return { width, height };
}
async function mediaAPI(db, u, request, env, id) {
  if (!editor(u)) fail(403, "Caricamento immagini riservato alla redazione.");
  if (!env.EDITORIAL_MEDIA) fail(503, "Archivio immagini non ancora configurato.");
  if (request.method === "GET") {
    if (!id) return json(await all(db, admin(u) ? "SELECT * FROM cms_media ORDER BY created_at DESC LIMIT 100" : "SELECT * FROM cms_media WHERE owner=? ORDER BY created_at DESC LIMIT 100", ...admin(u) ? [] : [u.email]));
    const m = await one(db, "SELECT * FROM cms_media WHERE id=?", id);
    if (!m || !admin(u) && m.owner !== u.email) fail(404, "Immagine non trovata.");
    const o = await env.EDITORIAL_MEDIA.get(m.object_key);
    if (!o) fail(404, "Immagine non trovata.");
    return new Response(o.body, { headers: { ...securityHeaders, "Content-Type": "image/webp" } });
  }
  if (request.method !== "POST" || id) fail(405, "Metodo non consentito.");
  if (request.headers.get("Content-Type") !== "image/webp") fail(415, "Sono accettate solo immagini WebP.");
  const reader = request.body?.getReader();
  if (!reader) fail(400, "Immagine mancante.");
  const chunks = [];
  let size = 0;
  for (; ; ) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 3 * 1024 * 1024) {
      await reader.cancel();
      fail(413, "Immagine troppo grande (massimo 3 MB).");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let off = 0;
  for (const c of chunks) {
    bytes.set(c, off);
    off += c.length;
  }
  const dimensions = inspectWebP(bytes);
  let alt;
  try {
    alt = text(decodeURIComponent(request.headers.get("X-Image-Alt") || ""), 250);
  } catch (_) {
    fail(400, "Descrizione immagine non valida.");
  }
  if (!alt) fail(400, "Il testo alternativo \xE8 obbligatorio.");
  const key = uid(), objectKey = "editorial/" + key + ".webp";
  await env.EDITORIAL_MEDIA.put(objectKey, bytes, { httpMetadata: { contentType: "image/webp" } });
  try {
    await db.batch([stmt(db, "INSERT INTO cms_media(id,object_key,owner,alt,bytes,width,height,sha256,created_at) VALUES(?,?,?,?,?,?,?,?,?)", key, objectKey, u.email, alt, size, dimensions.width, dimensions.height, await digest(bytes), now()), audit(db, u, "media.upload", key, null, { bytes: size, alt })]);
  } catch (e) {
    await env.EDITORIAL_MEDIA.delete(objectKey);
    throw e;
  }
  return json({ id: key, alt, ...dimensions }, 201);
}
async function historyAPI(db, u, request, records) {
  if (!reviewer(u)) fail(403, "Storico riservato ai revisori.");
  const target = new URL(request.url).searchParams.get("target");
  if (!target) fail(400, "Seleziona una scheda.");
  const cur = await current(db, records, target);
  if (!inScope(u, cur.record)) fail(403, "Scheda non assegnata.");
  if (request.method === "GET") return json(await all(db, "SELECT * FROM cms_data_history WHERE target=? ORDER BY id DESC LIMIT 100", target));
  if (request.method !== "POST" || !admin(u)) fail(403, "Ripristino riservato agli Admin.");
  const b = await bodyJSON(request);
  if (!text(b.reason || "", 1e3)) fail(400, "Motivazione del ripristino obbligatoria.");
  const history = await one(db, "SELECT * FROM cms_data_history WHERE target=? AND id=?", target, Number(b.history_id) || 0), old = cur.over;
  if (!history || !old || old.version !== b.version) fail(409, "Versione superata o storico non disponibile.");
  if (!history.before_json && old.addition) fail(400, "Per un nuovo servizio proponi lo stato di cessazione; non cancellare la sua identit\xE0.");
  const previous = parse(history.before_json, { target, entity: cur.record.entity, values_json: "{}", meta_json: "{}", base_values: "{}", addition: 0 }), after = { ...previous, version: old.version + 1, published_at: now() };
  await transaction(db, "EXISTS(SELECT 1 FROM cms_overrides WHERE target=? AND version=?)", [target, b.version], [stmt(db, "UPDATE cms_overrides SET values_json=?,meta_json=?,base_values=?,version=?,published_at=? WHERE target=?", after.values_json, after.meta_json, after.base_values, after.version, after.published_at, target), stmt(db, "INSERT INTO cms_data_history(target,proposal_id,before_json,after_json,actor,created_at) VALUES(?,?,?,?,?,?)", target, null, JSON.stringify(old), JSON.stringify(after), u.email, now()), audit(db, u, "data.rollback", target, old, { ...after, reason: b.reason })]);
  return json({ target, version: after.version });
}
function createAPI(verify = authenticate) {
  return async function handle2(request, env) {
    try {
      const url = new URL(request.url), parts = url.pathname.replace(/^\/api\//, "").split("/").filter(Boolean), area = parts.shift();
      if (area === "public") {
        if (!["GET", "HEAD"].includes(request.method)) fail(405, "Metodo non consentito.");
        if (env.EDITORIAL_ENABLED !== "true" || !env.EDITORIAL_DB) return json({ active: false, items: [] });
        const db2 = dbFor(env), what2 = parts.shift();
        if (what2 === "content") return json({ active: true, items: await publicFeed(db2) });
        if (what2 === "revisions") {
          const records = await catalog(request, env), rows = await all(db2, "SELECT * FROM cms_overrides");
          const items = [], conflicts = [];
          for (const r of rows) {
            const p = publicOverride(r, records.find((x) => x.key === r.target));
            if (p) items.push(p);
            else conflicts.push(r.target);
          }
          return json({ active: true, items, conflicts });
        }
        if (what2 === "media") {
          const id = parts[0], live = (await publicFeed(db2)).some((c) => c.image_id === id);
          if (!live || !env.EDITORIAL_MEDIA) fail(404, "Immagine non pubblicata.");
          const m = await one(db2, "SELECT object_key FROM cms_media WHERE id=?", id);
          if (!m) fail(404, "Immagine non trovata.");
          const o = await env.EDITORIAL_MEDIA.get(m.object_key);
          if (!o) fail(404, "Immagine non trovata.");
          return new Response(request.method === "HEAD" ? null : o.body, { headers: { ...securityHeaders, "Cache-Control": "no-store", "Content-Type": "image/webp" } });
        }
        fail(404, "Risorsa non trovata.");
      }
      if (area !== "admin") fail(404, "Risorsa non trovata.");
      protectWrite(request, env);
      const { db, user: u } = await requireUser(request, env, verify), what = parts.shift();
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
        const rate = await one(db, "SELECT COUNT(*) AS n FROM cms_audit WHERE actor=? AND created_at>?", u.email, new Date(Date.now() - 6e4).toISOString());
        if (rate?.n >= 60) fail(429, "Troppe operazioni. Attendi un minuto.");
      }
      if (what === "me" && request.method === "GET") return json({ email: u.email, name: u.name, roles: u.roles, scopes: u.scopes, media_ready: !!env.EDITORIAL_MEDIA });
      if (what === "content") return await contentAPI(db, u, request, parts);
      if (what === "users") return await usersAPI(db, u, request);
      if (what === "media") return await mediaAPI(db, u, request, env, parts[0]);
      if (what === "audit") {
        if (!admin(u) || request.method !== "GET") fail(403, "Audit riservato agli Admin.");
        return json(await all(db, "SELECT * FROM cms_audit ORDER BY id DESC LIMIT 250"));
      }
      if (["catalog", "proposals", "history"].includes(what)) {
        if (!reviewer(u)) fail(403, "Ruolo revisore richiesto.");
        const records = await catalog(request, env);
        if (what === "proposals") return await proposalsAPI(db, u, request, parts, records);
        if (what === "history") return await historyAPI(db, u, request, records);
        if (request.method !== "GET") fail(405, "Metodo non consentito.");
        if (url.searchParams.has("key")) {
          const c = await current(db, records, url.searchParams.get("key"));
          if (!inScope(u, c.record)) fail(403, "Scheda fuori dal territorio assegnato.");
          return json({ record: c.record, base_hash: c.hash, override_version: c.over?.version || 0 });
        }
        const overs = await all(db, "SELECT * FROM cms_overrides");
        const keys = [...new Set(records.map((r) => r.key).concat(overs.filter((r) => r.addition).map((r) => r.target)))], out = [];
        for (const key of keys) {
          const base = records.find((r2) => r2.key === key), r = overs.find((r2) => r2.target === key), p = r ? publicOverride(r, base) : null, rec = { key, entity: base?.entity || r.entity, origin: base?.origin || p?.values.origin, asl: base?.asl || p?.values.asl || "", category: base?.category || p?.values.category || "", fields: { ...base?.fields || {}, ...p?.values || {} }, needs_reconciliation: !!r && !p };
          if (inScope(u, rec)) out.push(rec);
        }
        return json(out);
      }
      fail(404, "Operazione non trovata.");
    } catch (e) {
      if (e instanceof HttpError) return json({ error: e.message }, e.status);
      if (e?.message && /obbligat|non valid|troppo|HTTPS|scadenza|successiv|Descrivi|Data di|immagine|formato|collegamento|dimension/i.test(e.message)) return json({ error: e.message }, 400);
      return json({ error: "Servizio editoriale non disponibile. Nessuna modifica \xE8 stata confermata; ricarica e verifica lo stato." }, 503);
    }
  };
}
var handle = createAPI();

// worker/editorial-entry.mjs
var escape = (s) => String(s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
var editorial_entry_default = {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith("/api/")) return handle(request, env);
    if (path === "/admin" || path.startsWith("/admin/")) {
      try {
        await requireUser(request, env);
        if (request.method !== "GET" && request.method !== "HEAD") return new Response("Metodo non consentito", { status: 405, headers: securityHeaders });
        const response = await env.ASSETS.fetch(request), headers = new Headers(response.headers);
        for (const [k, v] of Object.entries(securityHeaders)) headers.set(k, v);
        return new Response(response.body, { status: response.status, headers });
      } catch (e) {
        const status = [401, 403, 503].includes(e.status) ? e.status : 503;
        const msg = status === 503 ? "L\u2019area redazione non \xE8 ancora attiva. Il portale pubblico rimane disponibile." : status === 401 ? "Accedi attraverso il sistema di accesso riservato del progetto." : "Il tuo account non \xE8 autorizzato a questa area. Contatta il responsabile del progetto.";
        return new Response('<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Area riservata | Network Giovani</title><link rel="stylesheet" href="/assets/network-v7-18.css"></head><body class="ng-site"><main class="ng-admin"><section class="ng-admin-panel"><p class="ng-kicker">Network Giovani</p><h1>Area redazione</h1><p>' + escape(msg) + '</p><p><a href="/redazione.html">Informazioni sull\u2019accesso</a> \xB7 <a href="/index.html">Torna al portale</a></p></section></main></body></html>', { status, headers: { ...securityHeaders, "Content-Type": "text/html; charset=utf-8" } });
      }
    }
    return env.ASSETS.fetch(request);
  }
};
export {
  editorial_entry_default as default
};
