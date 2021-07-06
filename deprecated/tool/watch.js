import chokidar from "chokidar";

const ignored = [
  "node_modules/**",
  "bower_components/**",
  ".git",
  ".hg",
  ".svn",
  ".DS_Store",
  "*.swp",
  "thumbs.db",
  "desktop.ini",
];

export default function createWatch(glob, opts = {}) {
  const ignoreFiles = [...ignored, ...(opts.ignored || [])];
  const watcher = chokidar.watch(glob, {
    ...opts,
    ignored: ignoreFiles,
    ignoreInitial: true,
  });
  return watcher;
}
