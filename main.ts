// Sizzle Rush — main.ts
// The entrypoint for the make.fun cooking-game bounty (Node 22, stdlib only).
// It hands the game in: copies game/ and screenshots/ from beside this file
// into the output directory and writes /output/dossier.json with the
// vendored make.fun library, which must stay byte-for-byte the kit's copy.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The output directory's CONTENTS are cleared (never the directory itself:
// the grader's /output parent is read-only, so removing it fails with EROFS).
// The build is deterministic: the same repository always writes the same
// bytes, because nothing here reads the clock or unseeded randomness.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Clear the output directory's contents, leaving the directory itself in place.
mkdirSync(out, { recursive: true });
for (const entry of readdirSync(out)) {
  rmSync(join(out, entry), { recursive: true, force: true });
}

cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}

// The gate's own caps: only text_max_bytes shapes the dossier's bytes; the
// rest make this program refuse exactly where the scorer would.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
