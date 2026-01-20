#!/usr/bin/env bun
/**
 * Validates all spec files in specs/ directory
 * Checks: YAML syntax, required fields, file refs exist
 * Exit code 1 if any validation fails
 */

import { parse } from "yaml";
import { readFileSync, existsSync } from "fs";
import { glob } from "glob";
import { resolve, dirname, basename } from "path";

const REQUIRED_FIELDS = [
  "id",
  "title",
  "tags",
  "status",
  "description",
  "implementation",
  "flows",
  "interactions",
];
const VALID_STATUSES = ["implemented", "partial", "planned"];
const KNOWN_TAGS = [
  "gallery",
  "admin",
  "contact",
  "public",
  "core",
  "security",
  "crud",
  "content",
  "performance",
];

interface ValidationError {
  file: string;
  errors: string[];
}

interface Spec {
  id: string;
  title: string;
  tags: string[];
  status: string;
  description: string;
  implementation: string[];
  verification?: {
    unit?: Array<{ path: string; status: string }>;
    e2e?: Array<{ path: string; status: string }>;
  };
  flows: Record<string, string[]>;
  interactions: Array<{ type: string; element: string; action: string }>;
}

const rootDir = resolve(import.meta.dir, "..");
const specsDir = resolve(rootDir, "specs");

function checkFileRef(ref: string): boolean {
  // Handle file:line#export format
  let filePath = ref.split("#")[0];
  // Remove line number suffix (e.g., :10)
  filePath = filePath.replace(/:\d+$/, "");
  const fullPath = resolve(rootDir, filePath);
  return existsSync(fullPath);
}

function validateSpec(filePath: string): string[] {
  const errors: string[] = [];
  const content = readFileSync(filePath, "utf-8");

  let spec: Spec;
  try {
    spec = parse(content);
  } catch (e) {
    errors.push(`Invalid YAML syntax: ${(e as Error).message}`);
    return errors;
  }

  // Check required fields
  for (const field of REQUIRED_FIELDS) {
    if (!(field in spec)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (errors.length > 0) return errors;

  // Validate status
  if (!VALID_STATUSES.includes(spec.status)) {
    errors.push(
      `Invalid status "${spec.status}". Must be: ${VALID_STATUSES.join(", ")}`
    );
  }

  // Validate tags (warn for unknown)
  for (const tag of spec.tags) {
    if (!KNOWN_TAGS.includes(tag)) {
      errors.push(`Unknown tag: ${tag} (consider adding to KNOWN_TAGS)`);
    }
  }

  // Validate implementation refs exist
  for (const ref of spec.implementation) {
    if (!checkFileRef(ref)) {
      errors.push(`Implementation file not found: ${ref}`);
    }
  }

  // Validate verification refs for implemented tests
  if (spec.verification) {
    const checkTests = (
      tests: Array<{ path: string; status: string }> | undefined,
      type: string
    ) => {
      if (!tests) return;
      for (const test of tests) {
        if (test.status === "implemented" && !checkFileRef(test.path)) {
          errors.push(`${type} test file not found: ${test.path}`);
        }
      }
    };
    checkTests(spec.verification.unit, "Unit");
    checkTests(spec.verification.e2e, "E2E");
  }

  return errors;
}

async function main() {
  console.log("Validating specs...\n");

  const specFiles = await glob("**/*.yaml", {
    cwd: specsDir,
    ignore: ["_index.yaml", "_dictionary.yaml"],
  });

  const results: ValidationError[] = [];

  for (const file of specFiles) {
    const fullPath = resolve(specsDir, file);
    const errors = validateSpec(fullPath);
    if (errors.length > 0) {
      results.push({ file, errors });
    }
  }

  if (results.length === 0) {
    console.log(`✓ All ${specFiles.length} specs valid`);
    process.exit(0);
  }

  console.log(`Found errors in ${results.length} spec(s):\n`);
  for (const { file, errors } of results) {
    console.log(`✗ ${file}`);
    for (const error of errors) {
      console.log(`  - ${error}`);
    }
    console.log();
  }

  process.exit(1);
}

main();
