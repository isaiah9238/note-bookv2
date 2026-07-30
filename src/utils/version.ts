/**
 * Python PEP 440 Version Parsing and Comparison module in TypeScript.
 * Dual-licensed under Apache 2.0 / BSD (matching Python packaging.version specification).
 * Includes ReDoS input length mitigation and complete PEP 440 + LegacyVersion support.
 */

export const MAX_VERSION_LENGTH = 512;

export class InvalidVersion extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidVersion";
  }
}

export abstract class BaseVersion {
  abstract readonly key: unknown;
  abstract readonly raw: string;

  abstract get public(): string;
  abstract get baseVersion(): string;
  abstract get epoch(): number;
  abstract get release(): readonly number[] | null;
  abstract get pre(): readonly [string, number] | null;
  abstract get post(): number | null;
  abstract get dev(): number | null;
  abstract get local(): string | null;
  abstract get isPrerelease(): boolean;
  abstract get isPostrelease(): boolean;
  abstract get isDevrelease(): boolean;

  protected abstract compareKey(other: BaseVersion): number;

  eq(other: BaseVersion): boolean {
    return this.compareKey(other) === 0;
  }

  neq(other: BaseVersion): boolean {
    return this.compareKey(other) !== 0;
  }

  lt(other: BaseVersion): boolean {
    return this.compareKey(other) < 0;
  }

  lte(other: BaseVersion): boolean {
    return this.compareKey(other) <= 0;
  }

  gt(other: BaseVersion): boolean {
    return this.compareKey(other) > 0;
  }

  gte(other: BaseVersion): boolean {
    return this.compareKey(other) >= 0;
  }

  toString(): string {
    return this.raw;
  }
}

// Special symbols for infinity sorting in comparison keys
const INFINITY = Symbol("Infinity");
const NEGATIVE_INFINITY = Symbol("NegativeInfinity");

type InfinityType = typeof INFINITY;
type NegativeInfinityType = typeof NEGATIVE_INFINITY;
type PrePostDevKey = InfinityType | NegativeInfinityType | [number, number] | [string, number];
type SubLocalKey = [number, string] | [NegativeInfinityType, string];
type LocalKey = NegativeInfinityType | readonly SubLocalKey[];

export interface VersionKey {
  epoch: number;
  release: readonly number[];
  pre: PrePostDevKey;
  post: InfinityType | NegativeInfinityType | [string, number] | number;
  dev: InfinityType | NegativeInfinityType | [string, number] | number;
  local: LocalKey;
}

// Regex for PEP 440 Version specification
export const VERSION_PATTERN = `
  v?
  (?:
    (?:(?<epoch>[0-9]+)!)?
    (?<release>[0-9]+(?:\\.[0-9]+)*)
    (?<pre>
      [-_\\.]?
      (?<pre_l>a|b|c|rc|alpha|beta|pre|preview)
      [-_\\.]?
      (?<pre_n>[0-9]+)?
    )?
    (?<post>
      (?:-(?<post_n1>[0-9]+))
      |
      (?:
        [-_\\.]?
        (?<post_l>post|rev|r)
        [-_\\.]?
        (?<post_n2>[0-9]+)?
      )
    )?
    (?<dev>
      [-_\\.]?
      (?<dev_l>dev)
      [-_\\.]?
      (?<dev_n>[0-9]+)?
    )?
  )
  (?:\\+(?<local>[a-z0-9]+(?:[-_\\ me.][a-z0-9]+)*))?
`.replace(/\s+/g, "");

const VERSION_REGEX = new RegExp(`^\\s*${VERSION_PATTERN}\\s*$`, "i");

function parseLetterVersion(
  letter?: string,
  numberStr?: string
): [string, number] | null {
  if (letter) {
    let num = numberStr !== undefined && numberStr !== null && numberStr !== "" ? parseInt(numberStr, 10) : 0;
    let l = letter.toLowerCase();
    if (l === "alpha") l = "a";
    else if (l === "beta") l = "b";
    else if (l === "c" || l === "pre" || l === "preview") l = "rc";
    else if (l === "rev" || l === "r") l = "post";
    return [l, num];
  }
  if (!letter && numberStr !== undefined && numberStr !== null && numberStr !== "") {
    return ["post", parseInt(numberStr, 10)];
  }
  return null;
}

function parseLocalVersion(local?: string): readonly (string | number)[] | null {
  if (!local) return null;
  const parts = local.split(/[\._-]/);
  return parts.map((part) => (/^\d+$/.test(part) ? parseInt(part, 10) : part.toLowerCase()));
}

function letterRank(letter: string): number {
  if (letter === "a") return 1;
  if (letter === "b") return 2;
  if (letter === "rc") return 3;
  if (letter === "post") return 4;
  return 0;
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a === NEGATIVE_INFINITY) return -1;
  if (b === NEGATIVE_INFINITY) return 1;
  if (a === INFINITY) return 1;
  if (b === INFINITY) return -1;

  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b);
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      const cmp = compareValues(a[i], b[i]);
      if (cmp !== 0) return cmp;
    }
    return a.length - b.length;
  }

  return String(a).localeCompare(String(b));
}

function computeCmpKey(
  epoch: number,
  release: readonly number[],
  pre: [string, number] | null,
  post: [string, number] | null,
  dev: [string, number] | null,
  local: readonly (string | number)[] | null
): VersionKey {
  // Trim trailing zeros from release for comparison
  let rel = [...release];
  while (rel.length > 0 && rel[rel.length - 1] === 0) {
    rel.pop();
  }

  let _pre: PrePostDevKey;
  if (pre === null && post === null && dev !== null) {
    _pre = NEGATIVE_INFINITY;
  } else if (pre === null) {
    _pre = INFINITY;
  } else {
    _pre = [letterRank(pre[0]), pre[1]];
  }

  let _post: InfinityType | NegativeInfinityType | [string, number] | number;
  if (post === null) {
    _post = NEGATIVE_INFINITY;
  } else {
    _post = post[1];
  }

  let _dev: InfinityType | NegativeInfinityType | [string, number] | number;
  if (dev === null) {
    _dev = INFINITY;
  } else {
    _dev = dev[1];
  }

  let _local: LocalKey;
  if (local === null) {
    _local = NEGATIVE_INFINITY;
  } else {
    _local = local.map((item) =>
      typeof item === "number" ? [item, ""] : [NEGATIVE_INFINITY, item]
    );
  }

  return {
    epoch,
    release: rel,
    pre: _pre,
    post: _post,
    dev: _dev,
    local: _local,
  };
}

export class Version extends BaseVersion {
  readonly raw: string;
  readonly _epoch: number;
  readonly _release: readonly number[];
  readonly _pre: [string, number] | null;
  readonly _post: [string, number] | null;
  readonly _dev: [string, number] | null;
  readonly _local: readonly (string | number)[] | null;
  readonly key: VersionKey;

  constructor(version: string) {
    super();
    // Security / ReDoS Guard: Check max input length
    if (typeof version !== "string") {
      throw new InvalidVersion("Version must be a string");
    }
    if (version.length > MAX_VERSION_LENGTH) {
      throw new InvalidVersion(
        `Version string length (${version.length}) exceeds maximum limit of ${MAX_VERSION_LENGTH} characters.`
      );
    }

    const match = version.match(VERSION_REGEX);
    if (!match || !match.groups) {
      throw new InvalidVersion(`Invalid version: '${version}'`);
    }

    const groups = match.groups;
    this.raw = version.trim();
    this._epoch = groups.epoch ? parseInt(groups.epoch, 10) : 0;
    this._release = groups.release.split(".").map((n) => parseInt(n, 10));
    this._pre = parseLetterVersion(groups.pre_l, groups.pre_n);
    this._post = parseLetterVersion(groups.post_l, groups.post_n1 || groups.post_n2);
    this._dev = parseLetterVersion(groups.dev_l, groups.dev_n);
    this._local = parseLocalVersion(groups.local);

    this.key = computeCmpKey(
      this._epoch,
      this._release,
      this._pre,
      this._post,
      this._dev,
      this._local
    );
  }

  get public(): string {
    return this.toString().split("+")[0];
  }

  get baseVersion(): string {
    const parts: string[] = [];
    if (this._epoch !== 0) {
      parts.push(`${this._epoch}!`);
    }
    parts.push(this._release.join("."));
    return parts.join("");
  }

  get epoch(): number {
    return this._epoch;
  }

  get release(): readonly number[] {
    return this._release;
  }

  get pre(): [string, number] | null {
    return this._pre;
  }

  get post(): number | null {
    return this._post ? this._post[1] : null;
  }

  get dev(): number | null {
    return this._dev ? this._dev[1] : null;
  }

  get local(): string | null {
    return this._local ? this._local.join(".") : null;
  }

  get isPrerelease(): boolean {
    return this._dev !== null || this._pre !== null;
  }

  get isPostrelease(): boolean {
    return this._post !== null;
  }

  get isDevrelease(): boolean {
    return this._dev !== null;
  }

  get major(): number {
    return this._release.length >= 1 ? this._release[0] : 0;
  }

  get minor(): number {
    return this._release.length >= 2 ? this._release[1] : 0;
  }

  get micro(): number {
    return this._release.length >= 3 ? this._release[2] : 0;
  }

  protected compareKey(other: BaseVersion): number {
    if (other instanceof LegacyVersion) {
      // LegacyVersion has epoch -1, so PEP 440 Version > LegacyVersion
      return 1;
    }
    if (!(other instanceof Version)) {
      return 1;
    }

    const k1 = this.key;
    const k2 = other.key;

    let cmp = compareValues(k1.epoch, k2.epoch);
    if (cmp !== 0) return cmp;

    cmp = compareValues(k1.release, k2.release);
    if (cmp !== 0) return cmp;

    cmp = compareValues(k1.pre, k2.pre);
    if (cmp !== 0) return cmp;

    cmp = compareValues(k1.post, k2.post);
    if (cmp !== 0) return cmp;

    cmp = compareValues(k1.dev, k2.dev);
    if (cmp !== 0) return cmp;

    cmp = compareValues(k1.local, k2.local);
    return cmp;
  }

  toString(): string {
    const parts: string[] = [];
    if (this._epoch !== 0) {
      parts.push(`${this._epoch}!`);
    }
    parts.push(this._release.join("."));
    if (this._pre) {
      parts.push(`${this._pre[0]}${this._pre[1]}`);
    }
    if (this._post) {
      parts.push(`.post${this._post[1]}`);
    }
    if (this._dev) {
      parts.push(`.dev${this._dev[1]}`);
    }
    if (this._local) {
      parts.push(`+${this._local.join(".")}`);
    }
    return parts.join("");
  }
}

export class LegacyVersion extends BaseVersion {
  readonly raw: string;
  readonly key: [-1, readonly string[]];

  constructor(version: string) {
    super();
    if (typeof version !== "string") {
      throw new InvalidVersion("Version must be a string");
    }
    if (version.length > MAX_VERSION_LENGTH) {
      throw new InvalidVersion(
        `Version string length (${version.length}) exceeds maximum limit of ${MAX_VERSION_LENGTH} characters.`
      );
    }
    this.raw = version.trim();
    this.key = [-1, parseLegacyParts(this.raw.toLowerCase())];
  }

  get public(): string {
    return this.raw;
  }

  get baseVersion(): string {
    return this.raw;
  }

  get epoch(): number {
    return -1;
  }

  get release(): null {
    return null;
  }

  get pre(): null {
    return null;
  }

  get post(): null {
    return null;
  }

  get dev(): null {
    return null;
  }

  get local(): null {
    return null;
  }

  get isPrerelease(): boolean {
    return false;
  }

  get isPostrelease(): boolean {
    return false;
  }

  get isDevrelease(): boolean {
    return false;
  }

  protected compareKey(other: BaseVersion): number {
    if (!(other instanceof LegacyVersion)) {
      // LegacyVersion has epoch -1, PEP 440 Version has epoch >= 0
      return -1;
    }

    return compareValues(this.key, other.key);
  }

  toString(): string {
    return this.raw;
  }
}

const LEGACY_COMPONENT_REGEX = /(\d+|[a-z]+|\.|-)/gi;
const LEGACY_REPLACEMENT_MAP: Record<string, string> = {
  pre: "c",
  preview: "c",
  "-": "final-",
  rc: "c",
  dev: "@",
};

function parseLegacyParts(s: string): readonly string[] {
  const parts: string[] = [];
  const matches = s.match(LEGACY_COMPONENT_REGEX) || [];

  for (let match of matches) {
    const part = LEGACY_REPLACEMENT_MAP[match] || match;
    if (!part || part === ".") continue;

    if (/^\d/.test(part)) {
      parts.push(part.padStart(8, "0"));
    } else {
      parts.push("*" + part);
    }
  }

  parts.push("*final");

  const cleanParts: string[] = [];
  for (const part of parts) {
    if (part.startsWith("*")) {
      if (part < "*final") {
        while (cleanParts.length > 0 && cleanParts[cleanParts.length - 1] === "*final-") {
          cleanParts.pop();
        }
      }
      while (cleanParts.length > 0 && cleanParts[cleanParts.length - 1] === "00000000") {
        cleanParts.pop();
      }
    }
    cleanParts.push(part);
  }

  return cleanParts;
}

/**
 * Parses the given version string and returns a Version or LegacyVersion object.
 * Enforces MAX_VERSION_LENGTH (512 chars) to prevent ReDoS attack vulnerabilities.
 */
export function parse(version: string): Version | LegacyVersion {
  if (typeof version !== "string") {
    throw new InvalidVersion("Version must be a string");
  }
  if (version.length > MAX_VERSION_LENGTH) {
    throw new InvalidVersion(
      `Version string exceeds maximum allowed length of ${MAX_VERSION_LENGTH} characters.`
    );
  }
  try {
    return new Version(version);
  } catch (err) {
    if (err instanceof InvalidVersion) {
      return new LegacyVersion(version);
    }
    throw err;
  }
}
