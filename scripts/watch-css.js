const fs = require('fs');
const path = require('path');
const less = require('less');

const source = path.resolve(__dirname, '../src/less/index.less');
const sourceDir = path.dirname(source);
const destination = path.resolve(__dirname, '../dist/css/main.css');

let timer;
let compiling = false;
let queued = false;

async function compile() {
  if (compiling) {
    queued = true;
    return;
  }
  compiling = true;
  try {
    const input = await fs.promises.readFile(source, 'utf8');
    const result = await less.render(input, { filename: source });
    await fs.promises.mkdir(path.dirname(destination), { recursive: true });
    await fs.promises.writeFile(destination, result.css);
    console.log(`Compiled ${path.relative(process.cwd(), destination)}`);
  } catch (error) {
    console.error(error.message);
  } finally {
    compiling = false;
    if (queued) {
      queued = false;
      compile();
    }
  }
}

function scheduleCompile() {
  clearTimeout(timer);
  timer = setTimeout(compile, 75);
}

compile();
// Watch the LESS entry directory; all current imports live alongside index.less.
// Avoid recursive fs.watch because it is not available on every Node platform.
const watcher = fs.watch(sourceDir, (event, filename) => {
  if (filename && filename.endsWith('.less')) scheduleCompile();
});

process.once('SIGINT', () => {
  watcher.close();
  process.exit(0);
});
