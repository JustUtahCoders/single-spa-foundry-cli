import fs from "node:fs";
import os from "node:os";

const __confDir = os.homedir() + "/.baseplate";
if (!fs.existsSync(__confDir)) {
  fs.mkdirSync(__confDir);
}

export async function storageProvider() {
  // @ts-ignore
  const conf = await import("conf");
  return new conf.default({
    projectName: "baseplate.cloud",
    configName: ".bpc",
    fileExtension: "",
    cwd: __confDir,
    encryptionKey: "910b01ee3a166b1132a01735ef4e695",
  });
}
