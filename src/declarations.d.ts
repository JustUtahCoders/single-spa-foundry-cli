declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BASEPLATE_TOKEN: string;
    }
  }
}

export {};
