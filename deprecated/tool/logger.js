import chalk from "chalk";

export function warn(msg) {
  console.warn(chalk.yellow(msg));
}

export function error(msg) {
  console.error(chalk.red(msg));
}

export function log(msg) {
  console.log(msg);
}

export function connect(uri) {
  console.log("Server running on " + chalk.bold(chalk.cyan(uri)));
}
