import { planParts } from './streamClient';
import { TAG_LENGTH } from './encryption/stream';

const MIN = 5 * 1024 * 1024;
const FRAME = 4 * 1024 * 1024;

describe('part planning', () => {
  it('sends a single part when the payload fits in one', () => {
    const parts = planParts({
      headerLength: 1706,
      frameCount: 1,
      frameSize: FRAME,
      lastFrameSize: 1024,
    });

    // The only part is also the final one, so the storage minimum does not apply.
    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({ firstFrame: 1, lastFrame: 1 });
    expect(parts[0].bytes).toBe(1706 + 1024 + TAG_LENGTH);
  });

  it('groups frames until each part clears the storage minimum', () => {
    const parts = planParts({
      headerLength: 1706,
      frameCount: 4,
      frameSize: FRAME,
      lastFrameSize: 2 * 1024 * 1024,
    });

    expect(parts).toHaveLength(2);
    expect(parts[0]).toMatchObject({ firstFrame: 1, lastFrame: 2 });
    expect(parts[1]).toMatchObject({ firstFrame: 3, lastFrame: 4 });
    // Every part but the last must be at or above the minimum.
    expect(parts[0].bytes).toBeGreaterThanOrEqual(MIN);
  });

  it('folds an undersized tail into the previous part', () => {
    // Frames 1-2 clear the minimum; frame 3 alone would not, and a non-final
    // part below the minimum is rejected by storage.
    const parts = planParts({
      headerLength: 1706,
      frameCount: 3,
      frameSize: FRAME,
      lastFrameSize: 1024,
    });

    expect(parts).toHaveLength(1);
    expect(parts[0]).toMatchObject({ firstFrame: 1, lastFrame: 3 });
  });

  it('covers every frame exactly once, in order', () => {
    const parts = planParts({
      headerLength: 2048,
      frameCount: 9,
      frameSize: FRAME,
      lastFrameSize: FRAME,
    });

    const covered = parts.flatMap((part) =>
      Array.from({ length: part.lastFrame - part.firstFrame + 1 }, (_, i) => part.firstFrame + i),
    );
    expect(covered).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('accounts for the header in the first part only', () => {
    const headerLength = 4096;
    const parts = planParts({
      headerLength,
      frameCount: 4,
      frameSize: FRAME,
      lastFrameSize: 2 * 1024 * 1024,
    });

    const total = parts.reduce((sum, part) => sum + part.bytes, 0);
    const expected = headerLength + 3 * (FRAME + TAG_LENGTH) + (2 * 1024 * 1024 + TAG_LENGTH);
    expect(total).toBe(expected);
  });

  it('honours a caller-supplied minimum', () => {
    const parts = planParts({
      headerLength: 0,
      frameCount: 4,
      frameSize: 256,
      lastFrameSize: 256,
      minPartSize: 512,
    });

    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts.slice(0, -1)) {
      expect(part.bytes).toBeGreaterThanOrEqual(512);
    }
  });
});
