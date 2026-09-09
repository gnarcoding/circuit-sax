import { createHash } from 'node:crypto';
export function inspectSTL(bytes) {
  if (bytes.subarray(0, 150).toString().includes('version https://git-lfs.github.com/spec')) throw Error('Git LFS pointer; actual mesh is missing');
  if (bytes.length < 84) throw Error('Truncated STL header');
  const triangles = bytes.readUInt32LE(80);
  if (!triangles || bytes.length !== 84 + triangles * 50) throw Error('Malformed binary STL records');
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (let t = 0; t < triangles; t++) for (let v = 0; v < 3; v++) for (let a = 0; a < 3; a++) {
    const n = bytes.readFloatLE(84 + t * 50 + 12 + v * 12 + a * 4);
    if (!Number.isFinite(n)) throw Error('Non-finite STL vertex');
    min[a] = Math.min(min[a], n); max[a] = Math.max(max[a], n);
  }
  // Socket/stem reference at the underside, before any display transforms.
  const stemMin = [Infinity, Infinity], stemMax = [-Infinity, -Infinity];
  for (let t = 0; t < triangles; t++) for (let v = 0; v < 3; v++) {
    const p = 84 + t * 50 + 12 + v * 12;
    if (bytes.readFloatLE(p + 8) < min[2] + 0.35) for (let a = 0; a < 2; a++) {
      const n = bytes.readFloatLE(p + a * 4); stemMin[a] = Math.min(stemMin[a], n); stemMax[a] = Math.max(stemMax[a], n);
    }
  }
  return { triangles, min, max, extent: max.map((n,i) => n-min[i]), center: max.map((n,i) => (n+min[i])/2), stem: [(stemMin[0]+stemMax[0])/2,(stemMin[1]+stemMax[1])/2,min[2]], sha256: createHash('sha256').update(bytes).digest('hex') };
}
