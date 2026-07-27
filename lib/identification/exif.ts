import sharp from "sharp";

// Unconditional EXIF strip: sharp's output never carries source metadata
// unless .withMetadata() is called, so re-encoding is inherently stripping,
// not a flag we could get wrong. .rotate() applies the EXIF orientation
// before it's dropped, so images don't end up sideways.
export async function stripExif(image: Buffer): Promise<Buffer> {
  return sharp(image).rotate().jpeg().toBuffer();
}
