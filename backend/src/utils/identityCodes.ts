import { createHash } from "crypto";
import type { Database } from "sqlite";

function hashSeed(seed: string) {
  return createHash("sha256").update(seed).digest("hex").toUpperCase();
}

function buildDigitCode(seed: string, length: number) {
  const hash = hashSeed(seed);
  let output = "";

  for (let index = 0; output.length < length; index += 1) {
    const source = hash[index % hash.length] ?? "0";
    output += `${parseInt(source, 16) % 10}`;
  }

  return output;
}

function buildAlphaNumericCode(seed: string, length: number) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const hash = hashSeed(seed);
  let output = "";

  for (let index = 0; output.length < length; index += 1) {
    const source = hash[index % hash.length] ?? "0";
    output += alphabet[parseInt(source, 16) % alphabet.length];
  }

  return output;
}

export function deriveStudentNo(seed: string) {
  return `S${buildDigitCode(seed, 8)}`;
}

export function deriveClassCode(seed: string) {
  return buildAlphaNumericCode(seed, 6);
}

export async function ensureUniqueStudentNo(
  db: Database,
  seed: string,
  excludedUserId?: string,
) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = deriveStudentNo(`${seed}:${attempt}`);
    const existing = await db.get<{ user_id: string }>(
      `
        SELECT user_id
        FROM student_profiles
        WHERE student_no = ?
      `,
      candidate,
    );

    if (!existing || existing.user_id === excludedUserId) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique student number.");
}

export async function ensureUniqueClassCode(
  db: Database,
  seed: string,
  excludedClassId?: string,
) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = deriveClassCode(`${seed}:${attempt}`);
    const existing = await db.get<{ id: string }>(
      `
        SELECT id
        FROM teacher_classes
        WHERE class_code = ?
      `,
      candidate,
    );

    if (!existing || existing.id === excludedClassId) {
      return candidate;
    }
  }

  throw new Error("Failed to generate a unique class code.");
}
