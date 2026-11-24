// Renamed Prod to Staging — make.fun entry.
// makefun anchor 46b24e01bf19b98588bffd4af242d708005d2a1d round 34248757
// The entry is exactly one line, 76 characters:
// "fix: renamed prod to staging; the outage is now in staging, which is allowed"
// Why this one: the fix is pure relabelling — the outage is "fixed" by moving
// it to staging, where it is allowed. Only a model would solve a 3 AM outage
// by renaming the environment instead of the code. One line, no trailing newline.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LINE =
  "fix: renamed prod to staging; the outage is now in staging, which is allowed";

// The gate: /output/entry.txt must be UTF-8 text of 1 to 200 characters,
// not only whitespace. This entry is 76 characters, inside the gate.
// The length is counted in code points ([...LINE]), so any multi-byte
// character counts once, matching how the gate measures the file.
const chars = [...LINE];
if (chars.length < 1 || chars.length > 200 || LINE.trim().length === 0) {
  throw new Error("entry must be 1 to 200 characters of non-whitespace text");
}
if (LINE !== LINE.trim() || LINE.includes("\n") || LINE.includes("\r")) {
  throw new Error("entry must be a single line with no surrounding whitespace");
}
if (/[\u0000-\u001f\u007f]/.test(LINE)) {
  throw new Error("entry must not contain control characters");
}

// Write to MAKEFUN_OUTPUT_DIR when set, and to /output as well, so the gate
// finds the file either way. Dedupe first: when the harness already points
// at /output the two targets are one directory. No trailing newline: the
// file is the line, byte for byte.
const targets = [...new Set([process.env.MAKEFUN_OUTPUT_DIR, "/output"])].filter(
  (d): d is string => typeof d === "string" && d.length > 0,
);
for (const dir of targets) {
  mkdirSync(dir, { recursive: true });
  const outPath = join(dir, "entry.txt");
  writeFileSync(outPath, LINE, "utf8");
  // Verify the write: read it back and require an exact match with LINE,
  // so a partial or corrupted write fails loudly instead of silently.
  if (readFileSync(outPath, "utf8") !== LINE) {
    throw new Error("entry.txt does not match the entry after writing");
  }
  // Byte-length check: the string comparison above can pass even if the
  // file's encoding differs (e.g. a BOM or a different normalization
  // form), so require the on-disk byte count to equal the UTF-8 byte
  // length of LINE exactly — no hidden prefix, no trailing newline.
  if (readFileSync(outPath).length !== Buffer.byteLength(LINE, "utf8")) {
    throw new Error("entry.txt byte length does not match the entry");
  }
}
