#!/usr/bin/env bun
/**
 * Generates specs/_index.yaml from all spec files
 * Creates a searchable index with tags for quick lookup
 */

import { parse, stringify } from "yaml";
import { readFileSync, writeFileSync } from "fs";
import { glob } from "glob";
import { resolve } from "path";

interface SpecSummary {
  id: string;
  path: string;
  title: string;
  tags: string[];
  status: string;
}

interface SpecIndex {
  generated: string;
  specs: SpecSummary[];
  by_tag: Record<string, string[]>;
}

const rootDir = resolve(import.meta.dir, "..");
const specsDir = resolve(rootDir, "specs");

async function main() {
  console.log("Generating spec index...\n");

  const specFiles = await glob("**/*.yaml", {
    cwd: specsDir,
    ignore: ["_index.yaml", "_dictionary.yaml"],
  });

  const specs: SpecSummary[] = [];
  const byTag: Record<string, string[]> = {};

  for (const file of specFiles) {
    const fullPath = resolve(specsDir, file);
    const content = readFileSync(fullPath, "utf-8");

    try {
      const spec = parse(content);
      const summary: SpecSummary = {
        id: spec.id,
        path: `specs/${file}`,
        title: spec.title,
        tags: spec.tags || [],
        status: spec.status,
      };
      specs.push(summary);

      // Build tag index
      for (const tag of summary.tags) {
        if (!byTag[tag]) {
          byTag[tag] = [];
        }
        byTag[tag].push(summary.id);
      }
    } catch (e) {
      console.error(`Error parsing ${file}: ${(e as Error).message}`);
    }
  }

  // Sort specs by id
  specs.sort((a, b) => a.id.localeCompare(b.id));

  // Sort tag arrays
  for (const tag of Object.keys(byTag)) {
    byTag[tag].sort();
  }

  const index: SpecIndex = {
    generated: new Date().toISOString(),
    specs,
    by_tag: byTag,
  };

  const indexPath = resolve(specsDir, "_index.yaml");
  const yaml = stringify(index, { lineWidth: 0 });

  // Add header comment
  const output = `# Auto-generated spec index - do not edit manually
# Regenerate with: bun run scripts/generate-spec-index.ts

${yaml}`;

  writeFileSync(indexPath, output);
  console.log(`✓ Generated index with ${specs.length} specs`);
  console.log(`  Tags: ${Object.keys(byTag).join(", ")}`);
}

main();
