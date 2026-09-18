const fs = require('fs');
const path = require('path');

const sourceDir = path.resolve(__dirname, '../src/js');
const destination = path.resolve(__dirname, '../dist/js/main.js');
const sourceFiles = ['config.js', 'analytics.js', 'i18n.js', 'main.js'];

const stripModuleSyntax = (source) => source
  .replace(/^import\s.+;\s*$/gm, '')
  .replace(/^export\s+/gm, '');

const bundle = [
  '// Generated deployment bundle. Keep source modules in src/js.',
  ...sourceFiles.map((fileName) => (
    `// --- ${fileName} ---\n${stripModuleSyntax(fs.readFileSync(path.join(sourceDir, fileName), 'utf8'))}`
  ))
].join('\n\n');

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, `${bundle}\n`);
console.log(`Bundled ${path.relative(process.cwd(), destination)}`);
