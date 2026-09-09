import { inspectSTL } from './stl.mjs';
import { readFile, writeFile, mkdir, copyFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const app = fileURLToPath(new URL('..', import.meta.url));
const repo = resolve(app, '..');
const output = join(app, 'public/assets');
await mkdir(join(output, 'models'), { recursive: true });
await mkdir(join(output, 'references'), { recursive: true });
const expected = ['1_Gs','2_B','3_Cs','4_Bb','5_Eb','6_C','7_PK1','8_PK23','9_FF','10_K1','11_Bis','12_K2','13_Standard','14_SK1','15_SK2','16_SK3','17_Oct_Lower','18_OctRest_Angle_PLA','19_ThumbRest'];
let revision = 'unknown';
try { revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8', stdio:['ignore','pipe','ignore'] }).trim(); } catch {
  // A read-only fallback for sandboxed Windows environments where Git cannot spawn.
  try {
    const head=(await readFile(join(repo,'.git/HEAD'),'utf8')).trim();
    if(head.startsWith('ref: ')) {
      const ref=head.slice(5);
      try { revision=(await readFile(join(repo,'.git',ref),'utf8')).trim(); }
      catch { const packed=await readFile(join(repo,'.git/packed-refs'),'utf8');revision=packed.split('\n').find(line=>line.endsWith(` ${ref}`))?.split(' ')[0]??'unknown'; }
    } else if(/^[0-9a-f]{40}$/.test(head)) revision=head;
  } catch { /* keep explicit unknown, never invent a revision */ }
}
const assets = [];
for (const name of expected) {
  const file = `${name}.stl`;
  try {
    const bytes = await readFile(join(repo, 'models', file));
    const info = inspectSTL(bytes);
    await writeFile(join(output, 'models', file), bytes);
    assets.push({ id: name, file, url: `/assets/models/${file}`, ...info });
  } catch (error) {
    assets.push({ id: name, file, url: `/assets/models/${file}`, error: String(error.message) });
    console.error(`${file}: ${error.message}`);
  }
}
const references = ['v2/images/front.png','v2/images/pcb.png','v2/images/neck.png','v2/images/thumb_rest.png','README.md','docs/build/BUILD_PLAN.md','v2/Circuit Sax v2/platformio.ini','v2/Circuit Sax v2/src/circuit_sax_v2.cpp','v2/Circuit Sax v2/src/patches.h','v2/Circuit Sax v2/src/waveforms.h'];
const sourceFiles = [];
for (const path of references) {
  const target = path.replaceAll('/', '__');
  try {
    const b = await readFile(join(repo, path));
    if (b.subarray(0,150).toString().includes('version https://git-lfs.github.com/spec')) throw Error('Git LFS pointer');
    await copyFile(join(repo,path), join(output,'references',target));
    sourceFiles.push({path, url:`/assets/references/${target}`,sha256:createHash('sha256').update(b).digest('hex')});
  } catch(error) { sourceFiles.push({path,error:String(error.message)}); }
}
const extraFiles = (await readdir(join(repo,'models'))).filter(f => /\.stl$/i.test(f) && !expected.includes(f.replace(/\.stl$/i,'')));
await writeFile(join(output, 'inventory.json'), JSON.stringify({ revision, assets, sourceFiles, extraFiles }, null, 2));
console.log(`Curated ${assets.filter(a => !a.error).length}/${expected.length} original STLs and ${sourceFiles.length} references. Revision ${revision}.`);
if (extraFiles.length) console.warn('Additional STL files require manifest review:', extraFiles);
