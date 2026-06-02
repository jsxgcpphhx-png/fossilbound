import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const dist = join(root, 'dist');
const outDir = join(dist, 'assets', 'src');
const offlineConfig = join(root, 'tsconfig.offline.json');

rmSync(dist, { force: true, recursive: true });
mkdirSync(outDir, { recursive: true });

writeFileSync(
  offlineConfig,
  JSON.stringify(
    {
      extends: './tsconfig.json',
      compilerOptions: {
        noEmit: false,
        declaration: false,
        rootDir: 'src',
        outDir: 'dist/assets/src',
        module: 'ES2022',
        moduleResolution: 'bundler'
      }
    },
    null,
    2
  )
);

try {
  execFileSync('tsc', ['-p', offlineConfig], { stdio: 'inherit' });
} finally {
  rmSync(offlineConfig, { force: true });
}

function walk(directory) {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = join(directory, entry);
    return statSync(fullPath).isDirectory() ? walk(fullPath) : [fullPath];
  });
}

for (const file of walk(outDir).filter((path) => extname(path) === '.js')) {
  let contents = readFileSync(file, 'utf8');
  contents = contents.replace(/^import ['"]\.\/style\.css['"];\n?/m, '');
  contents = contents.replace(/from ['"](\.{1,2}\/[^'"]+?)(?<!\.js)['"]/g, "from '$1.js'");
  writeFileSync(file, contents);
}

mkdirSync(join(dist, 'assets'), { recursive: true });
copyFileSync(join(root, 'src', 'style.css'), join(dist, 'assets', 'style.css'));

const sourceHtml = readFileSync(join(root, 'index.html'), 'utf8');
const html = sourceHtml
  .replace('<script type="module" src="/src/main.ts"></script>', '<link rel="stylesheet" href="/fossilbound/assets/style.css" />\n    <script type="importmap">{"imports":{"phaser":"https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.esm.js"}}</script>\n    <script type="module" src="/fossilbound/assets/src/main.js"></script>')
  .replaceAll('href="/', 'href="/fossilbound/')
  .replaceAll('src="/', 'src="/fossilbound/');
writeFileSync(join(dist, 'index.html'), html);

console.log(`Offline Vite fallback created ${relative(root, dist)} using TypeScript emit because the vite binary is unavailable.`);
