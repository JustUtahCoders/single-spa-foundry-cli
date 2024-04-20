import chalk from "chalk";

export const warning = chalk.bgYellowBright.whiteBright;
export const info = chalk.bgBlueBright.whiteBright;
export const success = chalk.green;
export const secondary = chalk.gray;

export function error(str: string, indentationLevel = 0) {
  const err = chalk.red;
  let prefix = "";
  for (let i = 0; i < indentationLevel; i++) {
    prefix += "--";
  }
  if (prefix) {
    prefix += "> ";
  }
  // eslint-disable-next-line no-console
  console.error(secondary(prefix) + err.inverse("ERROR") + err(` ${str}`));
}

export function log(str: string, indentationLevel = 0) {
  let prefix = "";
  for (let i = 0; i < indentationLevel; i++) {
    prefix += "--";
  }
  if (prefix) {
    prefix += "> ";
  }
  // eslint-disable-next-line no-console
  console.log(secondary(prefix) + str);
}

export function logTable(data: any[], columns?: string[]) {
  // eslint-disable-next-line no-console
  console.table(data, columns);
}
