import fs from "node:fs";
import os from "node:os";
import path from "node:path";

let confInstance;
export async function storageProvider() {
  const __confDir = path.join(os.homedir(), ".baseplate");
  if (!fs.existsSync(__confDir)) {
    fs.mkdirSync(__confDir);
  }

  if (!confInstance) {
    // @ts-ignore
    confInstance = await import("conf");
  }

  return new confInstance.default({
    projectName: "baseplate.cloud",
    configName: ".bpc",
    fileExtension: "",
    cwd: __confDir,
    encryptionKey: "910b01ee3a166b1132a01735ef4e695",
  });
}
