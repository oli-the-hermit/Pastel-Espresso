// Writes public/third-party-notices.txt: the license of every package the app ships, with the
// texts each package carries (identical texts printed once). JavaScript packages come from the
// production dependency tree (the app and the web server), Rust crates from the desktop app's
// normal dependencies on Windows. Help → About shows the file; `--check` fails when it's stale.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'public', 'third-party-notices.txt');
const RUST_TARGET = 'x86_64-pc-windows-msvc';
// Short enough not to wrap in Help's narrow panel.
const RULE = 40;

interface Pkg {
  name: string;
  version: string;
  license: string;
  url: string;
  /** The package's own license and notice files, as found in it. */
  texts: string[];
}

const LICENSE_FILE = /^(licen[cs]e|copying|notice|copyright)([-._].*)?$/i;

// About a hundred crates ship their own copy of the Apache License 2.0. It is printed once, at the
// end; a package's copy is replaced by a pointer to it plus any copyright lines filled into it.
const isApache2 = (text: string) => /Apache License\s+Version 2\.0, January 2004/.test(text) && /TERMS AND CONDITIONS/.test(text);
let apache2Text = '';

function apache2Pointer(text: string): string {
  apache2Text ||= text;
  const owners = text
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^(Copyright|COPYRIGHT)\b/.test(line) && !/\[(yyyy|name of copyright owner)\]/i.test(line));
  return ['Apache License 2.0: the full text is at the end of this file.', ...owners].join('\n');
}

function licenseTexts(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && LICENSE_FILE.test(e.name))
    .map(e => e.name)
    .sort()
    .map(name => fs.readFileSync(path.join(dir, name), 'utf8').replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').trim())
    .filter(text => text !== '')
    .map(text => (isApache2(text) ? apache2Pointer(text) : text));
}

const run = (cmd: string, args: string[]) =>
  execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
// npm is a .cmd script on Windows, which only runs through a shell.
const npm = (args: string) =>
  execSync(`npm ${args}`, { cwd: ROOT, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });

function npmPackages(): Pkg[] {
  const dirs = npm('ls --omit=dev --all --parseable').split(/\r?\n/).filter(Boolean).slice(1);
  const seen = new Map<string, Pkg>();
  for (const dir of dirs) {
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
    // Type definitions are read while building; nothing of them ships.
    if (pkg.name.startsWith('@types/')) continue;
    const repo = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
    seen.set(`${pkg.name}@${pkg.version}`, {
      name: pkg.name,
      version: pkg.version,
      license: typeof pkg.license === 'string' ? pkg.license : pkg.license?.type ?? 'see its files',
      url: (repo ?? pkg.homepage ?? '').replace(/^git\+/, '').replace(/\.git$/, ''),
      texts: licenseTexts(dir)
    });
  }
  return [...seen.values()];
}

interface CargoPackage {
  id: string;
  name: string;
  version: string;
  license: string | null;
  license_file: string | null;
  repository: string | null;
  manifest_path: string;
  source: string | null;
}
interface CargoNode {
  id: string;
  deps: { pkg: string; dep_kinds: { kind: string | null }[] }[];
}

function rustCrates(): Pkg[] {
  const meta = JSON.parse(
    run('cargo', ['metadata', '--format-version', '1', '--locked', '--filter-platform', RUST_TARGET, '--manifest-path', path.join('src-tauri', 'Cargo.toml')])
  ) as { packages: CargoPackage[]; resolve: { root: string; nodes: CargoNode[] } };
  const nodes = new Map(meta.resolve.nodes.map(n => [n.id, n]));
  // What `cargo tree -e normal` shows: build scripts' and tests' own dependencies don't ship.
  const shipped = new Set<string>();
  const walk = (id: string) => {
    if (shipped.has(id)) return;
    shipped.add(id);
    for (const dep of nodes.get(id)?.deps ?? []) if (dep.dep_kinds.some(k => k.kind === null)) walk(dep.pkg);
  };
  walk(meta.resolve.root);
  return meta.packages
    .filter(p => shipped.has(p.id) && p.source !== null) // leaves out the app's own crate
    .map(p => {
      const dir = path.dirname(p.manifest_path);
      const texts = licenseTexts(dir);
      if (p.license_file && texts.length === 0) texts.push(...licenseTexts(path.dirname(path.join(dir, p.license_file))));
      return { name: p.name, version: p.version, license: p.license ?? 'see its files', url: p.repository ?? '', texts };
    });
}

function section(title: string, pkgs: Pkg[]): string {
  const sorted = [...pkgs].sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
  // Packages that carry the very same texts share one copy of them.
  const groups = new Map<string, Pkg[]>();
  for (const p of sorted) {
    const key = p.texts.join('\n\n----\n\n');
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  const rule = '='.repeat(RULE);
  const parts = [`${rule}\n${title} (${sorted.length})\n${rule}`];
  for (const [texts, members] of groups) {
    const list = members.map(p => `${p.name} ${p.version} (${p.license})${p.url ? ` ${p.url}` : ''}`).join('\n');
    parts.push(`${'-'.repeat(RULE)}\n${list}\n\n${texts || 'No license file in the package; its license is named above.'}`);
  }
  return parts.join('\n\n');
}

const js = section('JavaScript packages: the app and the web version\'s server', npmPackages());
const rust = section(`Rust crates: the desktop app (${RUST_TARGET})`, rustCrates());
const rule = '='.repeat(RULE);
const notices =
  [
    'Focus Space: third-party notices',
    '',
    'Focus Space is built with the open-source packages below. Each one is listed with its version, license and source, followed by the license and notice files it ships with.',
    'Generated by scripts/licenses/generate.ts.',
    '',
    js,
    '',
    rust,
    ...(apache2Text ? ['', `${rule}\nApache License 2.0\n${rule}`, '', apache2Text] : [])
  ].join('\n') + '\n';

if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : '';
  if (current !== notices) {
    console.log('public/third-party-notices.txt is out of date: run `npm run licenses`.');
    process.exitCode = 1;
  } else {
    console.log('Third-party notices: up to date.');
  }
} else {
  fs.writeFileSync(OUT, notices);
  console.log(`Wrote public/third-party-notices.txt (${(Buffer.byteLength(notices) / 1024).toFixed(0)} kB).`);
}
