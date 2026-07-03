/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "../packages/wallet-standard/dist/index.js":
/*!*************************************************!*\
  !*** ../packages/wallet-standard/dist/index.js ***!
  \*************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ATOMIC_SWAP_HEADER_HEX: () => (/* binding */ ATOMIC_SWAP_HEADER_HEX),
/* harmony export */   BANANO_CHAINS: () => (/* binding */ BANANO_CHAINS),
/* harmony export */   BANANO_MAINNET: () => (/* binding */ BANANO_MAINNET),
/* harmony export */   BANANO_TESTNET: () => (/* binding */ BANANO_TESTNET),
/* harmony export */   BURN_ACCOUNTS: () => (/* binding */ BURN_ACCOUNTS),
/* harmony export */   BananoSignAndSendTransaction: () => (/* binding */ BananoSignAndSendTransaction),
/* harmony export */   BananoSignIn: () => (/* binding */ BananoSignIn),
/* harmony export */   BananoSignMessage: () => (/* binding */ BananoSignMessage),
/* harmony export */   BananoSignTransaction: () => (/* binding */ BananoSignTransaction),
/* harmony export */   CANCEL_SUPPLY_REPRESENTATIVE: () => (/* binding */ CANCEL_SUPPLY_REPRESENTATIVE),
/* harmony export */   CANONICAL_BURN_ACCOUNT: () => (/* binding */ CANONICAL_BURN_ACCOUNT),
/* harmony export */   FINISH_SUPPLY_HEADER_HEX: () => (/* binding */ FINISH_SUPPLY_HEADER_HEX),
/* harmony export */   KALIUM_DEFAULT_REPRESENTATIVE: () => (/* binding */ KALIUM_DEFAULT_REPRESENTATIVE),
/* harmony export */   KNOWN_MEGA_REPRESENTATIVES: () => (/* binding */ KNOWN_MEGA_REPRESENTATIVES),
/* harmony export */   PROTOCOL_INIT_EVENT: () => (/* binding */ PROTOCOL_INIT_EVENT),
/* harmony export */   PROTOCOL_SOURCE_EVENT: () => (/* binding */ PROTOCOL_SOURCE_EVENT),
/* harmony export */   PROTOCOL_SOURCE_REQUEST: () => (/* binding */ PROTOCOL_SOURCE_REQUEST),
/* harmony export */   PROTOCOL_SOURCE_RESPONSE: () => (/* binding */ PROTOCOL_SOURCE_RESPONSE),
/* harmony export */   PROVIDER_ERRORS: () => (/* binding */ PROVIDER_ERRORS),
/* harmony export */   SEND_ALL_NFTS_REPRESENTATIVE: () => (/* binding */ SEND_ALL_NFTS_REPRESENTATIVE),
/* harmony export */   SPENDING_SESSION_EVENT: () => (/* binding */ SPENDING_SESSION_EVENT),
/* harmony export */   SUPPLY_HEADER_HEX: () => (/* binding */ SUPPLY_HEADER_HEX),
/* harmony export */   WALLET_STANDARD_APP_READY_EVENT: () => (/* binding */ WALLET_STANDARD_APP_READY_EVENT),
/* harmony export */   WALLET_STANDARD_REGISTER_EVENT: () => (/* binding */ WALLET_STANDARD_REGISTER_EVENT),
/* harmony export */   accountToPublicKeyHex: () => (/* binding */ accountToPublicKeyHex),
/* harmony export */   assessRepresentativeForDelegationChange: () => (/* binding */ assessRepresentativeForDelegationChange),
/* harmony export */   banToRaw: () => (/* binding */ banToRaw),
/* harmony export */   buildBananoUri: () => (/* binding */ buildBananoUri),
/* harmony export */   buildOnlineRepresentativeSet: () => (/* binding */ buildOnlineRepresentativeSet),
/* harmony export */   bytesToHex: () => (/* binding */ bytesToHex),
/* harmony export */   createBananoWalletAccount: () => (/* binding */ createBananoWalletAccount),
/* harmony export */   createProtocolError: () => (/* binding */ createProtocolError),
/* harmony export */   createProtocolSuccess: () => (/* binding */ createProtocolSuccess),
/* harmony export */   createProviderError: () => (/* binding */ createProviderError),
/* harmony export */   createSignInMessageText: () => (/* binding */ createSignInMessageText),
/* harmony export */   decodeBase64: () => (/* binding */ decodeBase64),
/* harmony export */   deserializeSignInOutput: () => (/* binding */ deserializeSignInOutput),
/* harmony export */   encodeBase64: () => (/* binding */ encodeBase64),
/* harmony export */   finishSupplyHeightFromRepresentative: () => (/* binding */ finishSupplyHeightFromRepresentative),
/* harmony export */   formatWeightBan: () => (/* binding */ formatWeightBan),
/* harmony export */   generateNonce: () => (/* binding */ generateNonce),
/* harmony export */   getProtocolTimeoutMs: () => (/* binding */ getProtocolTimeoutMs),
/* harmony export */   hexToBytes: () => (/* binding */ hexToBytes),
/* harmony export */   isAtomicSwapRepresentative: () => (/* binding */ isAtomicSwapRepresentative),
/* harmony export */   isBananoUri: () => (/* binding */ isBananoUri),
/* harmony export */   isBurnAccount: () => (/* binding */ isBurnAccount),
/* harmony export */   isCancelSupplyRepresentative: () => (/* binding */ isCancelSupplyRepresentative),
/* harmony export */   isDelegationChangeBlockedRepresentative: () => (/* binding */ isDelegationChangeBlockedRepresentative),
/* harmony export */   isFinishSupplyRepresentative: () => (/* binding */ isFinishSupplyRepresentative),
/* harmony export */   isMetadataRepresentative: () => (/* binding */ isMetadataRepresentative),
/* harmony export */   isSupplyRepresentative: () => (/* binding */ isSupplyRepresentative),
/* harmony export */   isValidMetadataRepresentative: () => (/* binding */ isValidMetadataRepresentative),
/* harmony export */   maxSupplyFromRepresentative: () => (/* binding */ maxSupplyFromRepresentative),
/* harmony export */   metadataCidFromRepresentative: () => (/* binding */ metadataCidFromRepresentative),
/* harmony export */   normalizeRepresentativeAccount: () => (/* binding */ normalizeRepresentativeAccount),
/* harmony export */   parseAtomicSwapRepresentative: () => (/* binding */ parseAtomicSwapRepresentative),
/* harmony export */   parseBananoUri: () => (/* binding */ parseBananoUri),
/* harmony export */   parseSignInMessage: () => (/* binding */ parseSignInMessage),
/* harmony export */   pickDecentralizedRepresentative: () => (/* binding */ pickDecentralizedRepresentative),
/* harmony export */   rawToBan: () => (/* binding */ rawToBan),
/* harmony export */   representativeMatchesAsset: () => (/* binding */ representativeMatchesAsset),
/* harmony export */   scanOwnedNFTs: () => (/* binding */ scanOwnedNFTs),
/* harmony export */   serializeSignInOutput: () => (/* binding */ serializeSignInOutput),
/* harmony export */   verifySignIn: () => (/* binding */ verifySignIn),
/* harmony export */   weightSharePercent: () => (/* binding */ weightSharePercent)
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
var ATOMIC_SWAP_HEADER_HEX = "23559C159E22C";
var SEND_ALL_NFTS_REPRESENTATIVE = "ban_1senda11nfts1111111111111111111111111111111111111111rtbtxits";
var CANCEL_SUPPLY_REPRESENTATIVE = "ban_1nftsupp1ycance1111oops1111that1111was1111my1111bad1hq5sjhey";
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
  if (hex.startsWith(ATOMIC_SWAP_HEADER_HEX)) return false;
  return true;
}
function isFinishSupplyRepresentative(account) {
  try {
    return accountToPublicKeyHex(account).startsWith(FINISH_SUPPLY_HEADER_HEX);
  } catch {
    return false;
  }
}
function finishSupplyHeightFromRepresentative(account) {
  const hex = accountToPublicKeyHex(account);
  return Number(BigInt(`0x${hex.slice(FINISH_SUPPLY_HEADER_HEX.length)}`));
}
function isCancelSupplyRepresentative(account) {
  if (account === CANCEL_SUPPLY_REPRESENTATIVE) return true;
  try {
    const hex = accountToPublicKeyHex(account);
    return hex.startsWith(SUPPLY_HEADER_HEX) || hex.startsWith(FINISH_SUPPLY_HEADER_HEX) || hex.startsWith(ATOMIC_SWAP_HEADER_HEX);
  } catch {
    return false;
  }
}
function isAtomicSwapRepresentative(account) {
  try {
    return accountToPublicKeyHex(account).startsWith(ATOMIC_SWAP_HEADER_HEX);
  } catch {
    return false;
  }
}
function parseAtomicSwapRepresentative(account) {
  const hex = accountToPublicKeyHex(account);
  const h = ATOMIC_SWAP_HEADER_HEX.length;
  return {
    assetHeight: Number(BigInt(`0x${hex.slice(h, h + 10)}`)),
    receiveHeight: Number(BigInt(`0x${hex.slice(h + 10, h + 20)}`)),
    minRaw: BigInt(`0x${hex.slice(h + 20, 64)}`).toString(10)
  };
}

// src/nftScan.ts
var HEX64 = /^[0-9A-F]{64}$/;
function toHeight(value) {
  return value === void 0 ? -1 : Number(value);
}
function chunk(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
async function loadBlocks(hashes, blocksInfo) {
  const unique = [...new Set([...hashes].filter((h) => HEX64.test(h.toUpperCase())))];
  const merged = /* @__PURE__ */ new Map();
  for (const group of chunk(unique, 500)) {
    if (group.length === 0) continue;
    let result;
    try {
      result = await blocksInfo(group);
    } catch {
      continue;
    }
    for (const [hash, block] of result) merged.set(hash.toUpperCase(), block);
  }
  return merged;
}
var PENDING_ACQUIRED_HEIGHT = Number.MAX_SAFE_INTEGER;
async function scanOwnedNFTs(address, transport) {
  let ownerPubKey;
  try {
    ownerPubKey = accountToPublicKeyHex(address).toUpperCase();
  } catch {
    return [];
  }
  let history;
  try {
    history = await transport.accountHistory(address);
  } catch {
    return [];
  }
  history.sort((a, b) => toHeight(a.height) - toHeight(b.height));
  const byHeight = /* @__PURE__ */ new Map();
  for (const entry of history) byHeight.set(toHeight(entry.height), entry);
  const finishedSupplyHeights = /* @__PURE__ */ new Set();
  for (const entry of history) {
    if (entry.subtype !== "change" || !entry.representative) continue;
    if (!isFinishSupplyRepresentative(entry.representative)) continue;
    finishedSupplyHeights.add(finishSupplyHeightFromRepresentative(entry.representative));
  }
  const owned = /* @__PURE__ */ new Map();
  const mintedCountByCid = /* @__PURE__ */ new Map();
  for (const entry of history) {
    if (entry.subtype !== "change" || !entry.representative) continue;
    if (!isSupplyRepresentative(entry.representative)) continue;
    const supplyHeight = toHeight(entry.height);
    const mint = byHeight.get(supplyHeight + 1);
    if (!mint || mint.subtype !== "send" || !mint.representative) continue;
    if (!isValidMetadataRepresentative(mint.representative)) continue;
    let cid;
    let maxSupply;
    try {
      cid = metadataCidFromRepresentative(mint.representative);
      maxSupply = maxSupplyFromRepresentative(entry.representative);
    } catch {
      continue;
    }
    mintedCountByCid.set(cid, (mintedCountByCid.get(cid) ?? 0) + 1);
    const heldByOwner = (mint.link ?? "").toUpperCase() === ownerPubKey;
    if (!heldByOwner) continue;
    const assetRep = mint.hash.toUpperCase();
    owned.set(assetRep, {
      assetRep,
      metadataCid: cid,
      supplyBlockHash: entry.hash,
      maxSupply,
      finished: finishedSupplyHeights.has(supplyHeight),
      source: "minted",
      acquiredHeight: toHeight(mint.height)
    });
  }
  const incomingToHeight = /* @__PURE__ */ new Map();
  for (const entry of history) {
    if (entry.subtype !== "receive" && entry.subtype !== "open") continue;
    const link = (entry.link ?? "").toUpperCase();
    if (HEX64.test(link)) incomingToHeight.set(link, toHeight(entry.height));
  }
  const pendingSends = /* @__PURE__ */ new Set();
  if (transport.accountReceivable) {
    let receivable = [];
    try {
      receivable = await transport.accountReceivable(address);
    } catch {
      receivable = [];
    }
    for (const raw of receivable) {
      const hash = raw.toUpperCase();
      if (!HEX64.test(hash) || incomingToHeight.has(hash)) continue;
      incomingToHeight.set(hash, PENDING_ACQUIRED_HEIGHT);
      pendingSends.add(hash);
    }
  }
  const sourceSends = await loadBlocks(incomingToHeight.keys(), transport.blocksInfo);
  const candidates = [];
  const evidence = /* @__PURE__ */ new Set();
  for (const [linkHash, acquiredHeight] of incomingToHeight) {
    const send = sourceSends.get(linkHash);
    if (!send || send.subtype !== "send" || !send.representative) continue;
    const rep = send.representative;
    if (rep === SEND_ALL_NFTS_REPRESENTATIVE || isAtomicSwapRepresentative(rep)) continue;
    if (!isValidMetadataRepresentative(rep)) continue;
    const candidate = {
      sendHash: linkHash,
      rep,
      acquiredHeight,
      pending: pendingSends.has(linkHash)
    };
    if (send.previous && HEX64.test(send.previous.toUpperCase())) {
      candidate.previousHash = send.previous.toUpperCase();
      evidence.add(candidate.previousHash);
    }
    try {
      const mintHash = accountToPublicKeyHex(rep).toUpperCase();
      if (HEX64.test(mintHash)) {
        candidate.transferMintHash = mintHash;
        evidence.add(mintHash);
      }
    } catch {
    }
    candidates.push(candidate);
  }
  const evidenceBlocks = await loadBlocks(evidence, transport.blocksInfo);
  const transferSupplyHashes = /* @__PURE__ */ new Set();
  for (const c of candidates) {
    const prev = c.previousHash ? evidenceBlocks.get(c.previousHash) : void 0;
    const isMint = !!prev && prev.subtype === "change" && !!prev.representative && isSupplyRepresentative(prev.representative);
    if (isMint && prev) {
      const assetRep = c.sendHash;
      if (owned.has(assetRep)) continue;
      let cid;
      let maxSupply;
      try {
        cid = metadataCidFromRepresentative(c.rep);
        maxSupply = maxSupplyFromRepresentative(prev.representative);
      } catch {
        continue;
      }
      owned.set(assetRep, {
        assetRep,
        metadataCid: cid,
        supplyBlockHash: c.previousHash,
        maxSupply,
        source: "received",
        acquiredHeight: c.acquiredHeight,
        pending: c.pending
      });
      continue;
    }
    if (c.transferMintHash) {
      const mint = evidenceBlocks.get(c.transferMintHash);
      if (!mint || mint.subtype !== "send" || !mint.representative) continue;
      if (!isValidMetadataRepresentative(mint.representative)) continue;
      const assetRep = c.transferMintHash;
      if (owned.has(assetRep)) continue;
      let cid;
      try {
        cid = metadataCidFromRepresentative(mint.representative);
      } catch {
        continue;
      }
      const supplyHash = mint.previous?.toUpperCase();
      if (supplyHash && HEX64.test(supplyHash)) transferSupplyHashes.add(supplyHash);
      owned.set(assetRep, {
        assetRep,
        metadataCid: cid,
        supplyBlockHash: supplyHash,
        source: "received",
        acquiredHeight: c.acquiredHeight,
        pending: c.pending
      });
    }
  }
  if (transferSupplyHashes.size > 0) {
    const supplyBlocks = await loadBlocks(transferSupplyHashes, transport.blocksInfo);
    for (const asset of owned.values()) {
      if (asset.source !== "received" || asset.maxSupply !== void 0) continue;
      if (!asset.supplyBlockHash) continue;
      const supply = supplyBlocks.get(asset.supplyBlockHash);
      if (!supply || !supply.representative) continue;
      if (!isSupplyRepresentative(supply.representative)) continue;
      try {
        asset.maxSupply = maxSupplyFromRepresentative(supply.representative);
      } catch {
      }
    }
  }
  let sendAllHeight = Infinity;
  for (const entry of history) {
    if (entry.subtype !== "send" || !entry.representative) continue;
    if (entry.representative === SEND_ALL_NFTS_REPRESENTATIVE) {
      sendAllHeight = Math.min(sendAllHeight, toHeight(entry.height));
    }
  }
  for (const entry of history) {
    if (entry.subtype !== "send" || !entry.representative) continue;
    const outHeight = toHeight(entry.height);
    for (const asset of [...owned.values()]) {
      if (outHeight <= asset.acquiredHeight) continue;
      if (representativeMatchesAsset(entry.representative, asset.assetRep)) {
        owned.delete(asset.assetRep);
      }
    }
  }
  if (sendAllHeight !== Infinity) {
    for (const asset of [...owned.values()]) {
      if (asset.acquiredHeight < sendAllHeight) owned.delete(asset.assetRep);
    }
  }
  const groups = /* @__PURE__ */ new Map();
  for (const asset of owned.values()) {
    const key = asset.metadataCid ?? asset.assetRep;
    const existing = groups.get(key);
    if (existing) {
      existing.heldCount += 1;
      if (asset.finished) existing.finished = true;
      if (!asset.pending) existing.allPending = false;
      if (existing.primary.source === "received" && asset.source === "minted") {
        existing.primary = asset;
      }
    } else {
      groups.set(key, {
        primary: asset,
        heldCount: 1,
        finished: Boolean(asset.finished),
        allPending: Boolean(asset.pending)
      });
    }
  }
  const results = [];
  for (const group of groups.values()) {
    const { primary, heldCount } = group;
    const mintedCount = primary.metadataCid ? mintedCountByCid.get(primary.metadataCid) : void 0;
    results.push({
      assetRep: primary.assetRep,
      metadataCid: primary.metadataCid,
      supplyBlockHash: primary.supplyBlockHash,
      maxSupply: primary.maxSupply,
      mintedCount,
      heldCount,
      finished: group.finished,
      source: primary.source,
      pending: group.allPending || void 0
    });
  }
  return results;
}

// src/representatives.ts
var KALIUM_DEFAULT_REPRESENTATIVE = "ban_1ka1ium4pfue3uxtntqkkksy3c3s5xy3q3xr8usayqp2yz3h2msc8jqm7yxs";
var KNOWN_MEGA_REPRESENTATIVES = /* @__PURE__ */ new Set([
  KALIUM_DEFAULT_REPRESENTATIVE,
  "ban_1111111111111111111111111111111111111111111111111111hifc8npp"
]);
function isMetadataRepresentative(account) {
  try {
    return accountToPublicKeyHex(account).startsWith("1220");
  } catch {
    return false;
  }
}
function isDelegationChangeBlockedRepresentative(rep) {
  if (rep === SEND_ALL_NFTS_REPRESENTATIVE) return true;
  if (isSupplyRepresentative(rep)) return true;
  if (isFinishSupplyRepresentative(rep)) return true;
  try {
    if (accountToPublicKeyHex(rep).startsWith(ATOMIC_SWAP_HEADER_HEX)) return true;
  } catch {
  }
  return false;
}
function assessRepresentativeForDelegationChange(rep) {
  if (!rep) {
    return { allowed: true, severity: "ok" };
  }
  if (isDelegationChangeBlockedRepresentative(rep)) {
    return {
      allowed: false,
      severity: "block",
      message: "This account representative is reserved for an NFT protocol operation. Finish or cancel that flow before changing your voting delegate."
    };
  }
  if (isMetadataRepresentative(rep)) {
    return {
      allowed: true,
      severity: "warn",
      message: "Your representative encodes NFT collection metadata. Switching to a node representative is recommended\u2014it prevents accidental extra mints."
    };
  }
  return { allowed: true, severity: "ok" };
}
var RAW_PER_BAN = BigInt("100000000000000000000000000000");
function formatWeightBan(weightRaw) {
  try {
    const raw = BigInt(weightRaw || "0");
    const whole = raw / RAW_PER_BAN;
    const frac = raw % RAW_PER_BAN;
    if (frac === 0n) return whole.toString();
    const fracStr = frac.toString().padStart(29, "0").slice(0, 2).replace(/0+$/, "");
    return fracStr ? `${whole}.${fracStr}` : whole.toString();
  } catch {
    return "0";
  }
}
function weightSharePercent(weightRaw, totalWeightRaw) {
  try {
    const weight = BigInt(weightRaw || "0");
    const total = BigInt(totalWeightRaw || "0");
    if (total === 0n) return 0;
    return Number(weight * 10000n / total) / 100;
  } catch {
    return 0;
  }
}
function normalizeRepresentativeAccount(account) {
  return account.trim();
}
function buildOnlineRepresentativeSet(accounts) {
  const online = /* @__PURE__ */ new Set();
  for (const account of accounts) {
    const normalized = normalizeRepresentativeAccount(account);
    if (normalized) online.add(normalized);
  }
  return online;
}
function pickDecentralizedRepresentative(representatives, online, options = {}) {
  const maxSharePercent = options.maxSharePercent ?? 1;
  const exclude = options.excludeAccounts ?? /* @__PURE__ */ new Set();
  const excluded = /* @__PURE__ */ new Set();
  for (const account of exclude) {
    excluded.add(normalizeRepresentativeAccount(account));
  }
  let totalWeight = 0n;
  for (const entry of representatives) {
    totalWeight += BigInt(entry.weightRaw || "0");
  }
  if (totalWeight === 0n) return null;
  const maxWeight = totalWeight * BigInt(Math.floor(maxSharePercent * 100)) / 10000n;
  const candidates = representatives.filter((entry) => {
    const account = normalizeRepresentativeAccount(entry.account);
    if (!online.has(account)) return false;
    if (excluded.has(account)) return false;
    if (KNOWN_MEGA_REPRESENTATIVES.has(entry.account)) return false;
    const weight = BigInt(entry.weightRaw || "0");
    if (weight <= 0n) return false;
    if (weight > maxWeight) return false;
    return true;
  });
  if (candidates.length === 0) return null;
  const index = Math.floor(Math.random() * candidates.length);
  return candidates[index]?.account ?? null;
}

// src/protocol.ts
var PROTOCOL_SOURCE_REQUEST = "monkeymask-provider";
var PROTOCOL_SOURCE_RESPONSE = "monkeymask-provider-response";
var PROTOCOL_SOURCE_EVENT = "monkeymask-provider-event";
var PROTOCOL_INIT_EVENT = "monkeymask#initialized";
var SPENDING_SESSION_EVENT = "monkeymask:spendingSessionChanged";
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
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
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
/*!********************************!*\
  !*** ./src/content/content.ts ***!
  \********************************/

Object.defineProperty(exports, "__esModule", ({ value: true }));
const wallet_standard_1 = __webpack_require__(/*! @monkeymask/wallet-standard */ "../packages/wallet-standard/dist/index.js");
const PAGE_ORIGIN = window.location.origin;
const isValidProtocolRequest = (data) => {
    if (!data || typeof data !== 'object')
        return false;
    const candidate = data;
    return (candidate.source === wallet_standard_1.PROTOCOL_SOURCE_REQUEST &&
        typeof candidate.id === 'number' &&
        typeof candidate.method === 'string');
};
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function () {
    if (script.parentNode) {
        script.parentNode.removeChild(script);
    }
};
(document.head || document.documentElement).appendChild(script);
window.addEventListener('message', (event) => {
    if (event.source !== window || event.origin !== PAGE_ORIGIN || !event.data) {
        return;
    }
    if (isValidProtocolRequest(event.data)) {
        chrome.runtime
            .sendMessage({
            ...event.data,
            origin: window.location.origin,
        })
            .then((response) => {
            window.postMessage({
                source: wallet_standard_1.PROTOCOL_SOURCE_RESPONSE,
                id: event.data.id,
                response,
            }, PAGE_ORIGIN);
        })
            .catch((error) => {
            window.postMessage({
                source: wallet_standard_1.PROTOCOL_SOURCE_RESPONSE,
                id: event.data.id,
                response: {
                    success: false,
                    error: error.message || 'Unknown error',
                    code: 4900,
                },
            }, PAGE_ORIGIN);
        });
    }
});
chrome.runtime.onMessage.addListener((request) => {
    if (request.source === 'monkeymask-provider-event-broadcast') {
        window.postMessage({
            source: wallet_standard_1.PROTOCOL_SOURCE_EVENT,
            event: request.event,
            data: request.data,
        }, PAGE_ORIGIN);
    }
});

})();

/******/ })()
;
//# sourceMappingURL=content.js.map