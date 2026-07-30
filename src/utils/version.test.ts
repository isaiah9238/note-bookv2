import { parse, Version, LegacyVersion, InvalidVersion, MAX_VERSION_LENGTH } from "./version";

export function runVersionTests() {
  const results: { test: string; passed: boolean; message?: string }[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      results.push({ test: testName, passed: true });
    } else {
      results.push({ test: testName, passed: false, message: detail || "Assertion failed" });
    }
  }

  try {
    // 1. Basic PEP 440 Parsing
    const v1 = parse("1.2.3a1");
    assert(v1 instanceof Version, "1.2.3a1 parsed as Version");
    if (v1 instanceof Version) {
      assert(v1.major === 1 && v1.minor === 2 && v1.micro === 3, "1.2.3 release components");
      assert(v1.pre?.[0] === "a" && v1.pre?.[1] === 1, "pre release component a1");
      assert(v1.isPrerelease === true, "isPrerelease = true");
    }

    // 2. Version Comparison Rules (PEP 440)
    const vDev = parse("1.0.dev0");
    const vAlpha = parse("1.0a1");
    const vBeta = parse("1.0b1");
    const vRc = parse("1.0rc1");
    const vFinal = parse("1.0");
    const vPost = parse("1.0.post1");

    assert(vDev.lt(vAlpha), "1.0.dev0 < 1.0a1");
    assert(vAlpha.lt(vBeta), "1.0a1 < 1.0b1");
    assert(vBeta.lt(vRc), "1.0b1 < 1.0rc1");
    assert(vRc.lt(vFinal), "1.0rc1 < 1.0");
    assert(vFinal.lt(vPost), "1.0 < 1.0.post1");

    // 3. Normalized equality
    const vA = parse("1.0.0");
    const vB = parse("1.0");
    assert(vA.eq(vB), "1.0.0 == 1.0");

    // 4. ReDoS Guard (max length check)
    let redosCaught = false;
    try {
      const longString = "1.0." + "0".repeat(MAX_VERSION_LENGTH + 10);
      parse(longString);
    } catch (e) {
      if (e instanceof InvalidVersion) {
        redosCaught = true;
      }
    }
    assert(redosCaught, "ReDoS input length guard (>512 chars) throws InvalidVersion");

    // 5. Legacy Version Fallback
    const vLegacy = parse("2020.1-custom-legacy");
    assert(vLegacy instanceof LegacyVersion, "Legacy format falls back to LegacyVersion");
    assert(vLegacy.epoch === -1, "LegacyVersion epoch is -1");
    assert(vLegacy.lt(vFinal), "LegacyVersion < PEP440 Version");

  } catch (err: any) {
    results.push({ test: "Unhandled Exception", passed: false, message: err?.message || String(err) });
  }

  return results;
}
