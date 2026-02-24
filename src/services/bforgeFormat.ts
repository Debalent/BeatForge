/**
 * .bforge file format serializer / deserializer.
 *
 * magic: 'BFRG', version, exportedAt, project, assets[]
 */

import type { BForgeProject, BForgeFile, BForgeAsset } from '@/types';

export const BFORGE_VERSION = '1.0.0';
export const BFORGE_MIME = 'application/json';
export const BFORGE_EXT = '.bforge';

// ─── Serialize ────────────────────────────────────────────────

export interface SerializeOptions {
  embedAssets?: boolean;
  assetBlobs?: Record<string, { blob: Blob; type: BForgeAsset['type'] }>;
}

export async function serializeProject(
  project: BForgeProject,
  opts: SerializeOptions = {}
): Promise<BForgeFile> {
  const assets: BForgeAsset[] = [];

  if (opts.embedAssets && opts.assetBlobs) {
    for (const [name, { blob, type }] of Object.entries(opts.assetBlobs)) {
      const data = await blobToBase64(blob);
      assets.push({
        id: name,
        name,
        type,
        mimeType: blob.type || 'audio/wav',
        hash: await sha256Base64(data),
        size: blob.size,
        embedded: true,
        data,
      });
    }
  }

  return {
    magic: 'BFRG',
    version: BFORGE_VERSION,
    exportedAt: new Date().toISOString(),
    project,
    assets,
  };
}

export function serializeToJson(file: BForgeFile, pretty = false): string {
  return JSON.stringify(file, null, pretty ? 2 : undefined);
}

export function serializeToBlob(file: BForgeFile): Blob {
  return new Blob([serializeToJson(file, true)], { type: BFORGE_MIME });
}

// ─── Deserialize ─────────────────────────────────────────────

export interface DeserializeResult {
  file: BForgeFile;
  project: BForgeProject;
  assets: BForgeAsset[];
  warnings: string[];
}

export function deserializeJson(json: string): DeserializeResult {
  const warnings: string[] = [];
  let parsed: unknown;

  try {
    parsed = JSON.parse(json);
  } catch (e) {
    throw new Error(`Invalid .bforge file: could not parse JSON. ${String(e)}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid .bforge file: root is not an object.');
  }

  const raw = parsed as Record<string, unknown>;

  if (raw['magic'] !== 'BFRG') {
    warnings.push('Missing magic "BFRG" — loading anyway.');
  }

  const version = (raw['version'] as string) || BFORGE_VERSION;
  const [major] = version.split('.').map(Number);
  const [curMajor] = BFORGE_VERSION.split('.').map(Number);
  if (major > curMajor) {
    warnings.push(`File version ${version} is newer than this build.`);
  }

  if (!raw['project']) throw new Error('Invalid .bforge file: missing project data.');

  const project = raw['project'] as BForgeProject;
  const assets = (raw['assets'] as BForgeAsset[] | undefined) ?? [];

  const file: BForgeFile = {
    magic: 'BFRG',
    version,
    exportedAt: (raw['exportedAt'] as string) || new Date().toISOString(),
    project,
    assets,
  };

  return { file, project, assets, warnings };
}

export async function deserializeBlob(blob: Blob): Promise<DeserializeResult> {
  return deserializeJson(await blob.text());
}

// ─── Utilities ───────────────────────────────────────────────

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function sha256Base64(data: string): Promise<string> {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    return btoa(String.fromCharCode(...new Uint8Array(buf)));
  } catch { return 'no-hash'; }
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}
