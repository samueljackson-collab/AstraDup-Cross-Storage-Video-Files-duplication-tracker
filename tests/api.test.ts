import { describe, it, expect } from 'vitest';
import {
  getDashboardStats,
  startScan,
  getFileDetails,
  getDuplicatesForFile,
} from '../services/api';

describe('getDashboardStats', () => {
  it('returns stats with expected shape', async () => {
    const stats = await getDashboardStats();
    expect(stats.filesScanned).toBeGreaterThan(0);
    expect(stats.videoDuplicates).toBeGreaterThanOrEqual(0);
    expect(stats.imageDuplicates).toBeGreaterThanOrEqual(0);
    expect(stats.documentDuplicates).toBeGreaterThanOrEqual(0);
    expect(stats.storageSavedTB).toBeGreaterThan(0);
    expect(stats.scannedPerType).toBeDefined();
    expect(stats.savedPerTypeTB).toBeDefined();
  });

  it('scannedPerType totals approximate filesScanned', async () => {
    const stats = await getDashboardStats();
    const total =
      stats.scannedPerType.video +
      stats.scannedPerType.image +
      stats.scannedPerType.document;
    expect(total).toBe(stats.filesScanned);
  });
});

describe('startScan', () => {
  it('returns video duplicate pairs for video scan type', async () => {
    const result = await startScan(['Local Drive'], 'video');
    expect(result.scanType).toBe('video');
    expect(Array.isArray(result.duplicatePairs)).toBe(true);
    expect(result.duplicatePairs.length).toBeGreaterThan(0);
    result.duplicatePairs.forEach(pair => {
      expect(pair.file1.fileType).toBe('video');
    });
  });

  it('returns image duplicate pairs for image scan type', async () => {
    const result = await startScan(['Local Drive'], 'image');
    expect(result.scanType).toBe('image');
    expect(Array.isArray(result.duplicatePairs)).toBe(true);
    result.duplicatePairs.forEach(pair => {
      expect(pair.file1.fileType).toBe('image');
    });
  });

  it('returns summary with totalFiles and duplicatesFound', async () => {
    const result = await startScan(['Local Drive'], 'document');
    expect(result.summary.totalFiles).toBeGreaterThan(0);
    expect(result.summary.duplicatesFound).toBe(result.duplicatePairs.length);
    expect(result.summary.potentialSavingsMB).toBeGreaterThanOrEqual(0);
  });
});

describe('getFileDetails', () => {
  it('returns a video file for vid1', async () => {
    const file = await getFileDetails('vid1');
    expect(file).toBeDefined();
    expect(file!.id).toBe('vid1');
    expect(file!.fileType).toBe('video');
    expect(file!.name).toBeTruthy();
  });

  it('returns an image file for img1', async () => {
    const file = await getFileDetails('img1');
    expect(file).toBeDefined();
    expect(file!.fileType).toBe('image');
  });

  it('returns undefined for unknown file id', async () => {
    const file = await getFileDetails('unknown_file_xyz');
    expect(file).toBeUndefined();
  });
});

describe('getDuplicatesForFile', () => {
  it('returns the duplicate partner for vid1', async () => {
    const duplicates = await getDuplicatesForFile('vid1');
    expect(Array.isArray(duplicates)).toBe(true);
    expect(duplicates.length).toBeGreaterThan(0);
    const ids = duplicates.map(f => f.id);
    expect(ids).toContain('vid2');
  });

  it('returns the duplicate partner for vid2', async () => {
    const duplicates = await getDuplicatesForFile('vid2');
    const ids = duplicates.map(f => f.id);
    expect(ids).toContain('vid1');
  });

  it('returns empty array for file with no duplicates', async () => {
    const duplicates = await getDuplicatesForFile('nonexistent_id');
    expect(duplicates).toEqual([]);
  });
});
