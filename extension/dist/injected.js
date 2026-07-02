/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../node_modules/@wallet-standard/features/lib/cjs/connect.js":
/*!********************************************************************!*\
  !*** ../node_modules/@wallet-standard/features/lib/cjs/connect.js ***!
  \********************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Connect = exports.StandardConnect = void 0;
/** Name of the feature. */
exports.StandardConnect = 'standard:connect';
/**
 * @deprecated Use {@link StandardConnect} instead.
 *
 * @group Deprecated
 */
exports.Connect = exports.StandardConnect;
//# sourceMappingURL=connect.js.map

/***/ }),

/***/ "../node_modules/@wallet-standard/features/lib/cjs/disconnect.js":
/*!***********************************************************************!*\
  !*** ../node_modules/@wallet-standard/features/lib/cjs/disconnect.js ***!
  \***********************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Disconnect = exports.StandardDisconnect = void 0;
/** Name of the feature. */
exports.StandardDisconnect = 'standard:disconnect';
/**
 * @deprecated Use {@link StandardDisconnect} instead.
 *
 * @group Deprecated
 */
exports.Disconnect = exports.StandardDisconnect;
//# sourceMappingURL=disconnect.js.map

/***/ }),

/***/ "../node_modules/@wallet-standard/features/lib/cjs/events.js":
/*!*******************************************************************!*\
  !*** ../node_modules/@wallet-standard/features/lib/cjs/events.js ***!
  \*******************************************************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Events = exports.StandardEvents = void 0;
/** Name of the feature. */
exports.StandardEvents = 'standard:events';
/**
 * @deprecated Use {@link StandardEvents} instead.
 *
 * @group Deprecated
 */
exports.Events = exports.StandardEvents;
//# sourceMappingURL=events.js.map

/***/ }),

/***/ "../node_modules/@wallet-standard/features/lib/cjs/index.js":
/*!******************************************************************!*\
  !*** ../node_modules/@wallet-standard/features/lib/cjs/index.js ***!
  \******************************************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./connect.js */ "../node_modules/@wallet-standard/features/lib/cjs/connect.js"), exports);
__exportStar(__webpack_require__(/*! ./disconnect.js */ "../node_modules/@wallet-standard/features/lib/cjs/disconnect.js"), exports);
__exportStar(__webpack_require__(/*! ./events.js */ "../node_modules/@wallet-standard/features/lib/cjs/events.js"), exports);
//# sourceMappingURL=index.js.map

/***/ }),

/***/ "../packages/wallet-standard/dist/index.js":
/*!*************************************************!*\
  !*** ../packages/wallet-standard/dist/index.js ***!
  \*************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   BANANO_CHAINS: () => (/* binding */ BANANO_CHAINS),
/* harmony export */   BANANO_MAINNET: () => (/* binding */ BANANO_MAINNET),
/* harmony export */   BANANO_TESTNET: () => (/* binding */ BANANO_TESTNET),
/* harmony export */   BURN_ACCOUNTS: () => (/* binding */ BURN_ACCOUNTS),
/* harmony export */   BananoSignAndSendTransaction: () => (/* binding */ BananoSignAndSendTransaction),
/* harmony export */   BananoSignIn: () => (/* binding */ BananoSignIn),
/* harmony export */   BananoSignMessage: () => (/* binding */ BananoSignMessage),
/* harmony export */   BananoSignTransaction: () => (/* binding */ BananoSignTransaction),
/* harmony export */   CANONICAL_BURN_ACCOUNT: () => (/* binding */ CANONICAL_BURN_ACCOUNT),
/* harmony export */   FINISH_SUPPLY_HEADER_HEX: () => (/* binding */ FINISH_SUPPLY_HEADER_HEX),
/* harmony export */   PROTOCOL_INIT_EVENT: () => (/* binding */ PROTOCOL_INIT_EVENT),
/* harmony export */   PROTOCOL_SOURCE_EVENT: () => (/* binding */ PROTOCOL_SOURCE_EVENT),
/* harmony export */   PROTOCOL_SOURCE_REQUEST: () => (/* binding */ PROTOCOL_SOURCE_REQUEST),
/* harmony export */   PROTOCOL_SOURCE_RESPONSE: () => (/* binding */ PROTOCOL_SOURCE_RESPONSE),
/* harmony export */   PROVIDER_ERRORS: () => (/* binding */ PROVIDER_ERRORS),
/* harmony export */   SEND_ALL_NFTS_REPRESENTATIVE: () => (/* binding */ SEND_ALL_NFTS_REPRESENTATIVE),
/* harmony export */   SUPPLY_HEADER_HEX: () => (/* binding */ SUPPLY_HEADER_HEX),
/* harmony export */   WALLET_STANDARD_APP_READY_EVENT: () => (/* binding */ WALLET_STANDARD_APP_READY_EVENT),
/* harmony export */   WALLET_STANDARD_REGISTER_EVENT: () => (/* binding */ WALLET_STANDARD_REGISTER_EVENT),
/* harmony export */   accountToPublicKeyHex: () => (/* binding */ accountToPublicKeyHex),
/* harmony export */   banToRaw: () => (/* binding */ banToRaw),
/* harmony export */   buildBananoUri: () => (/* binding */ buildBananoUri),
/* harmony export */   bytesToHex: () => (/* binding */ bytesToHex),
/* harmony export */   createBananoWalletAccount: () => (/* binding */ createBananoWalletAccount),
/* harmony export */   createProtocolError: () => (/* binding */ createProtocolError),
/* harmony export */   createProtocolSuccess: () => (/* binding */ createProtocolSuccess),
/* harmony export */   createProviderError: () => (/* binding */ createProviderError),
/* harmony export */   createSignInMessageText: () => (/* binding */ createSignInMessageText),
/* harmony export */   decodeBase64: () => (/* binding */ decodeBase64),
/* harmony export */   deserializeSignInOutput: () => (/* binding */ deserializeSignInOutput),
/* harmony export */   encodeBase64: () => (/* binding */ encodeBase64),
/* harmony export */   generateNonce: () => (/* binding */ generateNonce),
/* harmony export */   getProtocolTimeoutMs: () => (/* binding */ getProtocolTimeoutMs),
/* harmony export */   hexToBytes: () => (/* binding */ hexToBytes),
/* harmony export */   isBananoUri: () => (/* binding */ isBananoUri),
/* harmony export */   isBurnAccount: () => (/* binding */ isBurnAccount),
/* harmony export */   isSupplyRepresentative: () => (/* binding */ isSupplyRepresentative),
/* harmony export */   isValidMetadataRepresentative: () => (/* binding */ isValidMetadataRepresentative),
/* harmony export */   maxSupplyFromRepresentative: () => (/* binding */ maxSupplyFromRepresentative),
/* harmony export */   metadataCidFromRepresentative: () => (/* binding */ metadataCidFromRepresentative),
/* harmony export */   parseBananoUri: () => (/* binding */ parseBananoUri),
/* harmony export */   parseSignInMessage: () => (/* binding */ parseSignInMessage),
/* harmony export */   rawToBan: () => (/* binding */ rawToBan),
/* harmony export */   representativeMatchesAsset: () => (/* binding */ representativeMatchesAsset),
/* harmony export */   serializeSignInOutput: () => (/* binding */ serializeSignInOutput),
/* harmony export */   verifySignIn: () => (/* binding */ verifySignIn)
/* harmony export */ });
// src/chains.ts
var BANANO_MAINNET = "banano:mainnet";
var BANANO_TESTNET = "banano:testnet";
var BANANO_CHAINS = [BANANO_MAINNET, BANANO_TESTNET];

// src/errors.ts
var PROVIDER_ERRORS = {
  USER_REJECTED: { code: 4001, message: "User rejected the request" },
  UNAUTHORIZED: { code: 4100, message: "Unauthorized - not connected to MonkeyMask" },
  UNSUPPORTED_METHOD: { code: 4200, message: "Unsupported method" },
  DISCONNECTED: { code: 4900, message: "Provider is disconnected" },
  CHAIN_DISCONNECTED: { code: 4901, message: "Chain is disconnected" },
  INVALID_PARAMS: { code: -32602, message: "Invalid method parameters" },
  INTERNAL_ERROR: { code: -32603, message: "Internal error" },
  PARSE_ERROR: { code: -32700, message: "Parse error" },
  INVALID_REQUEST: { code: -32600, message: "Invalid request" },
  METHOD_NOT_FOUND: { code: -32601, message: "Method not found" }
};
function createProviderError(message, code = PROVIDER_ERRORS.INTERNAL_ERROR.code, data) {
  const error = new Error(message);
  error.code = code;
  error.data = data;
  return error;
}

// src/features.ts
var BananoSignMessage = "banano:signMessage";
var BananoSignIn = "banano:signIn";
var BananoSignTransaction = "banano:signTransaction";
var BananoSignAndSendTransaction = "banano:signAndSendTransaction";
function createBananoWalletAccount(address, publicKey, features = [
  BananoSignMessage,
  BananoSignIn,
  BananoSignTransaction,
  BananoSignAndSendTransaction
], label) {
  return {
    address,
    publicKey,
    chains: [BANANO_MAINNET],
    features,
    ...label ? { label } : {}
  };
}
function hexToBytes(hex) {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
function bytesToHex(bytes) {
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function encodeBase64(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}
function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// src/nft.ts
var NANO_ALPHABET = "13456789abcdefghijkmnopqrstuwxyz";
var BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
var SUPPLY_HEADER_HEX = "51BACEED6078000000";
var FINISH_SUPPLY_HEADER_HEX = "3614865E0051BA0033BB581E";
var SEND_ALL_NFTS_REPRESENTATIVE = "ban_1senda11nfts1111111111111111111111111111111111111111rtbtxits";
var CANONICAL_BURN_ACCOUNT = "ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w";
var BURN_ACCOUNTS = /* @__PURE__ */ new Set([
  CANONICAL_BURN_ACCOUNT,
  "ban_1uo1cano1bot1a1pha1616161616161616161616161616161616p3s5tifp",
  "ban_1ban116su1fur16uo1cano16su1fur16161616161616161616166a1sf7xw",
  "ban_1111111111111111111111111111111111111111111111111111hifc8npp"
]);
function isBurnAccount(account) {
  return BURN_ACCOUNTS.has(account);
}
var INVALID_MINT_REPRESENTATIVES = /* @__PURE__ */ new Set([
  "ban_1burnbabyburndiscoinferno111111111111111111111111111aj49sw3w",
  "ban_1uo1cano1bot1a1pha1616161616161616161616161616161616p3s5tifp",
  "ban_1ban116su1fur16uo1cano16su1fur16161616161616161616166a1sf7xw",
  "ban_1111111111111111111111111111111111111111111111111111hifc8npp",
  "ban_1nftsupp1ycance1111oops1111that1111was1111my1111bad1hq5sjhey"
]);
function accountToPublicKeyHex(account) {
  const underscore = account.indexOf("_");
  const body = underscore >= 0 ? account.slice(underscore + 1) : account;
  const encoded = body.slice(0, 52);
  if (encoded.length !== 52) {
    throw new Error("Invalid account: unexpected length");
  }
  let bits = "";
  for (const char of encoded) {
    const value = NANO_ALPHABET.indexOf(char);
    if (value < 0) throw new Error(`Invalid account character: ${char}`);
    bits += value.toString(2).padStart(5, "0");
  }
  const pubBits = bits.slice(4);
  let hex = "";
  for (let i = 0; i < pubBits.length; i += 4) {
    hex += parseInt(pubBits.slice(i, i + 4), 2).toString(16);
  }
  return hex.toUpperCase();
}
function base58Encode(bytes) {
  let value = 0n;
  for (const byte of bytes) value = value * 256n + BigInt(byte);
  let out = "";
  while (value > 0n) {
    const rem = Number(value % 58n);
    value /= 58n;
    out = BASE58_ALPHABET[rem] + out;
  }
  for (const byte of bytes) {
    if (byte === 0) out = "1" + out;
    else break;
  }
  return out;
}
function metadataCidFromRepresentative(account) {
  const pubHex = accountToPublicKeyHex(account);
  const cidBytes = hexToBytes(`1220${pubHex}`);
  return base58Encode(cidBytes);
}
function representativeMatchesAsset(representative, mintHash) {
  if (representative === SEND_ALL_NFTS_REPRESENTATIVE) return true;
  try {
    return accountToPublicKeyHex(representative) === mintHash.toUpperCase();
  } catch {
    return false;
  }
}
function isSupplyRepresentative(account) {
  try {
    return accountToPublicKeyHex(account).startsWith(SUPPLY_HEADER_HEX);
  } catch {
    return false;
  }
}
function maxSupplyFromRepresentative(account) {
  const hex = accountToPublicKeyHex(account);
  return Number(BigInt(`0x${hex.slice(48)}`));
}
function isValidMetadataRepresentative(account) {
  if (INVALID_MINT_REPRESENTATIVES.has(account)) return false;
  let hex;
  try {
    hex = accountToPublicKeyHex(account);
  } catch {
    return false;
  }
  if (hex.startsWith(SUPPLY_HEADER_HEX)) return false;
  if (hex.startsWith(FINISH_SUPPLY_HEADER_HEX)) return false;
  return true;
}

// src/protocol.ts
var PROTOCOL_SOURCE_REQUEST = "monkeymask-provider";
var PROTOCOL_SOURCE_RESPONSE = "monkeymask-provider-response";
var PROTOCOL_SOURCE_EVENT = "monkeymask-provider-event";
var PROTOCOL_INIT_EVENT = "monkeymask#initialized";
var WALLET_STANDARD_REGISTER_EVENT = "wallet-standard:register-wallet";
var WALLET_STANDARD_APP_READY_EVENT = "wallet-standard:app-ready";
function createProtocolSuccess(data) {
  return { success: true, data };
}
function createProtocolError(error, code = PROVIDER_ERRORS.INTERNAL_ERROR.code) {
  return { success: false, error, code };
}
function getProtocolTimeoutMs(method) {
  switch (method) {
    case "standard:connect":
      return 5 * 60 * 1e3;
    case "banano:signMessage":
    case "banano:signIn":
    case "banano:signTransaction":
    case "banano:signAndSendTransaction":
    case "banano:requestSpendingSession":
      return 15 * 60 * 1e3;
    case "banano:reverseResolveBNS":
      return 60 * 1e3;
    default:
      return 30 * 1e3;
  }
}

// src/siwb.ts
var SIWB_HEADER = " wants you to sign in with your Banano account:";
function createSignInMessageText(input) {
  if (!input.domain || !input.address) {
    throw new Error("SIWB message requires domain and address");
  }
  let message = `${input.domain}${SIWB_HEADER}
`;
  message += input.address;
  if (input.statement) {
    message += `

${input.statement}`;
  }
  const fields = [];
  if (input.uri) fields.push(`URI: ${input.uri}`);
  if (input.version) fields.push(`Version: ${input.version}`);
  if (input.chainId) fields.push(`Chain ID: ${input.chainId}`);
  if (input.nonce) fields.push(`Nonce: ${input.nonce}`);
  if (input.issuedAt) fields.push(`Issued At: ${input.issuedAt}`);
  if (input.expirationTime) fields.push(`Expiration Time: ${input.expirationTime}`);
  if (input.notBefore) fields.push(`Not Before: ${input.notBefore}`);
  if (input.requestId) fields.push(`Request ID: ${input.requestId}`);
  if (input.resources?.length) {
    fields.push("Resources:");
    for (const resource of input.resources) {
      fields.push(`- ${resource}`);
    }
  }
  if (fields.length) {
    message += `

${fields.join("\n")}`;
  }
  return message;
}
function parseSignInMessage(text) {
  const headerIndex = text.indexOf(SIWB_HEADER);
  if (headerIndex === -1) {
    throw new Error("Invalid SIWB message format");
  }
  const domain = text.slice(0, headerIndex);
  const remainder = text.slice(headerIndex + SIWB_HEADER.length).replace(/^\n/, "");
  const lines = remainder.split("\n");
  const address = lines[0]?.trim();
  if (!domain || !address) {
    throw new Error("Invalid SIWB message: missing domain or address");
  }
  const parsed = { domain, address };
  const isFieldLine = (line) => line.startsWith("URI: ") || line.startsWith("Version: ") || line.startsWith("Chain ID: ") || line.startsWith("Nonce: ") || line.startsWith("Issued At: ") || line.startsWith("Expiration Time: ") || line.startsWith("Not Before: ") || line.startsWith("Request ID: ") || line === "Resources:";
  let fieldStartIndex = lines.findIndex((line, index) => index > 0 && isFieldLine(line));
  if (fieldStartIndex === -1) {
    fieldStartIndex = lines.length;
  }
  const statementBlock = lines.slice(1, fieldStartIndex).join("\n").trim();
  if (statementBlock) {
    parsed.statement = statementBlock;
  }
  let inResources = false;
  for (let i = fieldStartIndex; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("URI: ")) {
      inResources = false;
      parsed.uri = line.slice(5);
      continue;
    }
    if (line.startsWith("Version: ")) {
      inResources = false;
      parsed.version = line.slice(9);
      continue;
    }
    if (line.startsWith("Chain ID: ")) {
      inResources = false;
      parsed.chainId = line.slice(10);
      continue;
    }
    if (line.startsWith("Nonce: ")) {
      inResources = false;
      parsed.nonce = line.slice(7);
      continue;
    }
    if (line.startsWith("Issued At: ")) {
      inResources = false;
      parsed.issuedAt = line.slice(11);
      continue;
    }
    if (line.startsWith("Expiration Time: ")) {
      inResources = false;
      parsed.expirationTime = line.slice(17);
      continue;
    }
    if (line.startsWith("Not Before: ")) {
      inResources = false;
      parsed.notBefore = line.slice(12);
      continue;
    }
    if (line.startsWith("Request ID: ")) {
      inResources = false;
      parsed.requestId = line.slice(12);
      continue;
    }
    if (line === "Resources:") {
      inResources = true;
      parsed.resources = [];
      continue;
    }
    if (inResources && line.startsWith("- ")) {
      parsed.resources.push(line.slice(2));
    }
  }
  return {
    domain,
    address,
    ...parsed.statement ? { statement: parsed.statement } : {},
    ...parsed.uri ? { uri: parsed.uri } : {},
    ...parsed.version ? { version: parsed.version } : {},
    ...parsed.chainId ? { chainId: parsed.chainId } : {},
    ...parsed.nonce ? { nonce: parsed.nonce } : {},
    ...parsed.issuedAt ? { issuedAt: parsed.issuedAt } : {},
    ...parsed.expirationTime ? { expirationTime: parsed.expirationTime } : {},
    ...parsed.notBefore ? { notBefore: parsed.notBefore } : {},
    ...parsed.requestId ? { requestId: parsed.requestId } : {},
    ...parsed.resources ? { resources: parsed.resources } : {}
  };
}
function normalizeSignInOutput(output) {
  return {
    account: {
      ...output.account,
      publicKey: output.account.publicKey instanceof Uint8Array ? output.account.publicKey : new Uint8Array(output.account.publicKey)
    },
    signedMessage: output.signedMessage instanceof Uint8Array ? output.signedMessage : new Uint8Array(output.signedMessage),
    signature: output.signature instanceof Uint8Array ? output.signature : new Uint8Array(output.signature),
    signatureType: output.signatureType
  };
}
function verifySignIn(input, output, util, options = {}) {
  const normalized = normalizeSignInOutput(output);
  const messageText = new TextDecoder().decode(normalized.signedMessage);
  const parsed = parseSignInMessage(messageText);
  const expectedDomain = options.expectedDomain ?? input.domain;
  if (expectedDomain && parsed.domain !== expectedDomain) return false;
  if (input.address && parsed.address !== input.address) return false;
  if (input.statement !== void 0 && parsed.statement !== input.statement) return false;
  if (input.uri !== void 0 && parsed.uri !== input.uri) return false;
  if (input.version !== void 0 && parsed.version !== input.version) return false;
  if (input.chainId !== void 0 && parsed.chainId !== input.chainId) return false;
  if (input.nonce !== void 0 && parsed.nonce !== input.nonce) return false;
  if (input.issuedAt !== void 0 && parsed.issuedAt !== input.issuedAt) return false;
  if (input.expirationTime !== void 0 && parsed.expirationTime !== input.expirationTime) {
    return false;
  }
  if (input.notBefore !== void 0 && parsed.notBefore !== input.notBefore) return false;
  if (input.requestId !== void 0 && parsed.requestId !== input.requestId) return false;
  if (input.resources !== void 0) {
    const expected = input.resources.join("\n");
    const actual = (parsed.resources ?? []).join("\n");
    if (expected !== actual) return false;
  }
  const reconstructed = createSignInMessageText(parsed);
  if (reconstructed !== messageText) return false;
  const now = Date.now();
  const threshold = options.issuedAtThresholdMs ?? 10 * 60 * 1e3;
  if (parsed.issuedAt) {
    const issued = Date.parse(parsed.issuedAt);
    if (Number.isNaN(issued) || Math.abs(issued - now) > threshold) return false;
  }
  if (parsed.expirationTime) {
    const exp = Date.parse(parsed.expirationTime);
    if (Number.isNaN(exp) || exp <= now) return false;
  }
  if (parsed.notBefore) {
    const nbf = Date.parse(parsed.notBefore);
    if (Number.isNaN(nbf) || nbf > now) return false;
  }
  const hexPublicKey = util.getAccountPublicKey(parsed.address);
  const signatureHex = bytesToHex(normalized.signature);
  return util.verifyMessage(hexPublicKey, messageText, signatureHex);
}
function serializeSignInOutput(output) {
  return {
    account: {
      address: output.account.address,
      publicKey: encodeBase64(
        output.account.publicKey instanceof Uint8Array ? output.account.publicKey : new Uint8Array(output.account.publicKey)
      ),
      chains: output.account.chains,
      features: output.account.features,
      label: output.account.label,
      icon: output.account.icon
    },
    signedMessage: encodeBase64(
      output.signedMessage instanceof Uint8Array ? output.signedMessage : new Uint8Array(output.signedMessage)
    ),
    signature: encodeBase64(
      output.signature instanceof Uint8Array ? output.signature : new Uint8Array(output.signature)
    ),
    signatureType: output.signatureType ?? "ed25519"
  };
}
function deserializeSignInOutput(raw) {
  const account = raw.account;
  return {
    account: {
      address: account.address,
      publicKey: decodeBase64(account.publicKey),
      chains: account.chains ?? [],
      features: account.features ?? [],
      ...account.label ? { label: account.label } : {},
      ...account.icon ? { icon: account.icon } : {}
    },
    signedMessage: decodeBase64(raw.signedMessage),
    signature: decodeBase64(raw.signature),
    signatureType: raw.signatureType ?? "ed25519"
  };
}
function generateNonce(length = 12) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

// src/uri.ts
var RAW_DECIMALS = 29;
var BANANO_ADDRESS = /^ban_[13][0-9a-z]{59}$/;
function banToRaw(amountBan) {
  const trimmed = amountBan.trim();
  if (!/^\d*(\.\d*)?$/.test(trimmed) || trimmed === "" || trimmed === ".") {
    throw new Error(`Invalid BAN amount: ${amountBan}`);
  }
  const [whole, frac = ""] = trimmed.split(".");
  const fracPadded = (frac + "0".repeat(RAW_DECIMALS)).slice(0, RAW_DECIMALS);
  return BigInt((whole || "0") + fracPadded).toString();
}
function rawToBan(raw) {
  const value = BigInt(raw);
  const base = 10n ** BigInt(RAW_DECIMALS);
  const whole = value / base;
  const frac = value % base;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(RAW_DECIMALS, "0").replace(/0+$/, "");
  return `${whole.toString()}.${fracStr}`;
}
function buildBananoUri(req) {
  if (!BANANO_ADDRESS.test(req.address)) {
    throw new Error(`Invalid Banano address: ${req.address}`);
  }
  const params = new URLSearchParams();
  if (req.amount && req.amount.trim() !== "" && req.amount.trim() !== "0") {
    params.set("amount", banToRaw(req.amount));
  }
  if (req.label) params.set("label", req.label);
  if (req.message) params.set("message", req.message);
  const qs = params.toString();
  return `ban:${req.address}${qs ? `?${qs}` : ""}`;
}
function isBananoUri(value) {
  return /^ban:/i.test(value.trim());
}
function parseBananoUri(uri) {
  const match = uri.trim().match(/^ban:([^?]+)(?:\?(.*))?$/i);
  if (!match) return null;
  const address = match[1];
  if (!BANANO_ADDRESS.test(address)) return null;
  const params = new URLSearchParams(match[2] ?? "");
  const rawAmount = params.get("amount");
  let amount;
  if (rawAmount) {
    try {
      amount = rawToBan(rawAmount);
    } catch {
      amount = void 0;
    }
  }
  return {
    address,
    amount,
    label: params.get("label") ?? void 0,
    message: params.get("message") ?? void 0
  };
}



/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
var exports = __webpack_exports__;
/*!*********************************!*\
  !*** ./src/content/injected.ts ***!
  \*********************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const wallet_standard_1 = __webpack_require__(/*! @monkeymask/wallet-standard */ "../packages/wallet-standard/dist/index.js");
const features_1 = __webpack_require__(/*! @wallet-standard/features */ "../node_modules/@wallet-standard/features/lib/cjs/index.js");
const MONKEYMASK_ICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iNjQiIGN5PSI2NCIgcj0iNjQiIGZpbGw9IiNGRkQ3MDAiLz48dGV4dCB4PSI2NCIgeT0iNzgiIGZvbnQtc2l6ZT0iNjQiIHRleHRLYW5jaG9yPSJtaWRkbGUiPjwvdGV4dD48L3N2Zz4=';
function registerWallet(wallet) {
    const callback = (api) => {
        api.register(wallet);
    };
    window.dispatchEvent(new CustomEvent(wallet_standard_1.WALLET_STANDARD_REGISTER_EVENT, { detail: callback }));
}
function listenForWalletStandardAppReady(wallet) {
    window.addEventListener(wallet_standard_1.WALLET_STANDARD_APP_READY_EVENT, (event) => {
        const detail = event.detail;
        detail.register(wallet);
    });
}
class ProtocolBridge {
    constructor() {
        this.requestId = 0;
        this.pending = new Map();
        window.addEventListener('message', (event) => {
            if (event.source !== window ||
                event.origin !== window.location.origin ||
                !event.data ||
                event.data.source !== wallet_standard_1.PROTOCOL_SOURCE_RESPONSE) {
                return;
            }
            const { id, response } = event.data;
            const pending = this.pending.get(id);
            if (!pending)
                return;
            this.pending.delete(id);
            if (response.success) {
                pending.resolve(response.data);
            }
            else {
                pending.reject((0, wallet_standard_1.createProviderError)(response.error, response.code));
            }
        });
    }
    async request(method, params = {}) {
        return new Promise((resolve, reject) => {
            const id = ++this.requestId;
            this.pending.set(id, { resolve: resolve, reject });
            window.postMessage({ source: wallet_standard_1.PROTOCOL_SOURCE_REQUEST, id, method, params }, window.location.origin);
            setTimeout(() => {
                if (!this.pending.has(id))
                    return;
                this.pending.delete(id);
                reject((0, wallet_standard_1.createProviderError)('Request timeout', wallet_standard_1.PROVIDER_ERRORS.INTERNAL_ERROR.code));
            }, (0, wallet_standard_1.getProtocolTimeoutMs)(method));
        });
    }
}
class MonkeyMaskWallet {
    constructor() {
        this.version = '1.0.0';
        this.name = 'MonkeyMask';
        this.icon = MONKEYMASK_ICON;
        this.chains = wallet_standard_1.BANANO_CHAINS;
        this.accounts = [];
        this.bridge = new ProtocolBridge();
        this.eventListeners = new Map();
        this.features = {
            [features_1.StandardConnect]: {
                version: '1.0.0',
                connect: async ({ silent } = {}) => {
                    const result = await this.bridge.request('standard:connect', {
                        silent,
                    });
                    this.accounts = result.accounts;
                    this.emitConnect();
                    return { accounts: this.accounts };
                },
            },
            [features_1.StandardDisconnect]: {
                version: '1.0.0',
                disconnect: async () => {
                    await this.bridge.request('standard:disconnect');
                    this.accounts = [];
                    this.emitDisconnect();
                },
            },
            [features_1.StandardEvents]: {
                version: '1.0.0',
                on: (event, listener) => {
                    if (!this.eventListeners.has(event)) {
                        this.eventListeners.set(event, new Set());
                    }
                    this.eventListeners.get(event).add(listener);
                    return () => this.eventListeners.get(event)?.delete(listener);
                },
            },
            [wallet_standard_1.BananoSignMessage]: {
                version: '1.0.0',
                signMessage: async (...inputs) => {
                    const outputs = [];
                    for (const input of inputs) {
                        outputs.push(await this.bridge.request('banano:signMessage', {
                            address: input.account.address,
                            message: (0, wallet_standard_1.encodeBase64)(input.message),
                        }));
                    }
                    return outputs;
                },
            },
            [wallet_standard_1.BananoSignIn]: {
                version: '1.0.0',
                signIn: async (...inputs) => {
                    const outputs = [];
                    for (const input of inputs) {
                        const output = await this.bridge.request('banano:signIn', { input });
                        outputs.push({
                            account: {
                                ...output.account,
                                publicKey: (0, wallet_standard_1.decodeBase64)(output.account.publicKey),
                            },
                            signedMessage: (0, wallet_standard_1.decodeBase64)(output.signedMessage),
                            signature: (0, wallet_standard_1.decodeBase64)(output.signature),
                            signatureType: 'ed25519',
                        });
                    }
                    return outputs;
                },
            },
            [wallet_standard_1.BananoSignTransaction]: {
                version: '1.0.0',
                signTransaction: async (...inputs) => {
                    const outputs = [];
                    for (const input of inputs) {
                        outputs.push(await this.bridge.request('banano:signTransaction', {
                            address: input.account.address,
                            chain: input.chain,
                            transaction: input.transaction,
                        }));
                    }
                    return outputs;
                },
            },
            [wallet_standard_1.BananoSignAndSendTransaction]: {
                version: '1.0.0',
                signAndSendTransaction: async (...inputs) => {
                    const outputs = [];
                    for (const input of inputs) {
                        outputs.push(await this.bridge.request('banano:signAndSendTransaction', {
                            address: input.account.address,
                            chain: input.chain,
                            transaction: input.transaction,
                        }));
                    }
                    return outputs;
                },
            },
        };
        this.setupEventRelay();
        this.attemptSilentConnect();
        listenForWalletStandardAppReady(this);
        registerWallet(this);
    }
    setupEventRelay() {
        window.addEventListener('message', (event) => {
            if (event.source !== window ||
                event.origin !== window.location.origin ||
                event.data?.source !== wallet_standard_1.PROTOCOL_SOURCE_EVENT) {
                return;
            }
            const { event: eventName, data } = event.data;
            if (eventName === 'connect' && data) {
                const connectData = data;
                this.accounts = [
                    (0, wallet_standard_1.createBananoWalletAccount)(connectData.publicKey, connectData.publicKeyHex
                        ? (0, wallet_standard_1.hexToBytes)(connectData.publicKeyHex)
                        : new Uint8Array(32), undefined, connectData.label),
                ];
                this.emitConnect();
                return;
            }
            if (eventName === 'disconnect') {
                this.accounts = [];
                this.emitDisconnect();
                return;
            }
            if (eventName === 'change' && data) {
                const changeData = data;
                this.accounts = changeData.accounts.map((acc) => (0, wallet_standard_1.createBananoWalletAccount)(acc.address, (0, wallet_standard_1.hexToBytes)(acc.publicKeyHex), undefined, acc.label));
                this.eventListeners.get('change')?.forEach((listener) => listener({ accounts: this.accounts }));
            }
        });
    }
    emitConnect() {
        const account = this.accounts[0];
        if (!account)
            return;
        this.eventListeners.get('connect')?.forEach((listener) => listener({ accounts: this.accounts }));
        legacyProvider.syncFromWallet(account.address);
    }
    emitDisconnect() {
        this.eventListeners.get('disconnect')?.forEach((listener) => listener());
        // Wallet Standard consumers track accounts via the `change` event, so also
        // notify them that there are no more connected accounts (e.g. auto-lock).
        this.eventListeners.get('change')?.forEach((listener) => listener({ accounts: this.accounts }));
        legacyProvider.clear();
    }
    async attemptSilentConnect() {
        try {
            await new Promise((r) => setTimeout(r, 500));
            const result = await this.bridge.request('standard:connect', {
                silent: true,
            });
            if (result.accounts.length) {
                this.accounts = result.accounts;
                this.emitConnect();
            }
        }
        catch {
            // Expected when not yet authorized.
        }
    }
}
class LegacyBananoProvider {
    constructor() {
        this.bridge = new ProtocolBridge();
        this.isMonkeyMask = true;
        this.isBanano = true;
        this._publicKey = null;
    }
    get isConnected() {
        return !!this._publicKey;
    }
    get publicKey() {
        return this._publicKey;
    }
    syncFromWallet(address) {
        this._publicKey = address;
    }
    clear() {
        this._publicKey = null;
    }
    async request(args) {
        const { method, params = {} } = args;
        switch (method) {
            case 'connect':
                return this.bridge.request('standard:connect', params);
            case 'disconnect':
                await this.bridge.request('standard:disconnect');
                this.clear();
                return null;
            case 'getAccounts': {
                const result = await this.bridge.request('standard:connect', {
                    silent: true,
                });
                return result.accounts.map((a) => a.address);
            }
            case 'getAccountInfo':
                return this.bridge.request('banano:getAccountInfo', params);
            case 'getReceivable':
                return this.bridge.request('banano:getReceivable', params);
            case 'getAccountHistory':
                return this.bridge.request('banano:getAccountHistory', params);
            case 'resolveBNS': {
                const result = await this.bridge.request('banano:resolveBNS', params);
                return result.address;
            }
            case 'reverseResolveBNS': {
                const result = await this.bridge.request('banano:reverseResolveBNS', params);
                return result.names;
            }
            case 'requestSpendingSession':
                return this.bridge.request('banano:requestSpendingSession', {
                    address: this._publicKey,
                    ...params,
                });
            case 'getSpendingSession':
                return this.bridge.request('banano:getSpendingSession', params);
            case 'revokeSpendingSession':
                return this.bridge.request('banano:revokeSpendingSession', params);
            case 'signMessage': {
                const message = params.message;
                const bytes = new TextEncoder().encode(message);
                const output = await this.bridge.request('banano:signMessage', {
                    address: this._publicKey,
                    message: (0, wallet_standard_1.encodeBase64)(bytes),
                });
                return { signature: (0, wallet_standard_1.encodeBase64)(output.signature), publicKey: this._publicKey };
            }
            case 'signIn':
                return this.bridge.request('banano:signIn', params);
            case 'signAndSendTransaction':
                return this.bridge.request('banano:signAndSendTransaction', {
                    address: this._publicKey,
                    chain: wallet_standard_1.BANANO_MAINNET,
                    transaction: params.transaction,
                });
            default:
                throw (0, wallet_standard_1.createProviderError)(`${wallet_standard_1.PROVIDER_ERRORS.UNSUPPORTED_METHOD.message}: ${method}`, wallet_standard_1.PROVIDER_ERRORS.UNSUPPORTED_METHOD.code);
        }
    }
    on() { }
    off() { }
    removeAllListeners() { }
}
const legacyProvider = new LegacyBananoProvider();
const wallet = new MonkeyMaskWallet();
if (!window.banano) {
    Object.defineProperty(window, 'banano', {
        value: legacyProvider,
        writable: false,
        configurable: false,
    });
    window.dispatchEvent(new CustomEvent(wallet_standard_1.PROTOCOL_INIT_EVENT, { detail: { wallet, provider: legacyProvider } }));
}

})();

/******/ })()
;
//# sourceMappingURL=injected.js.map