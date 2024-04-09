import { jest } from "@jest/globals";
import chalk from "chalk";

export const warning = chalk.bgYellowBright.whiteBright;
export const info = chalk.bgBlueBright.whiteBright;
export const success = chalk.green;
export const secondary = chalk.gray;

export const log = jest.fn();
export const error = jest.fn();
export const logTable = jest.fn();

