export interface ProcessEnvVars {
  BASE_URL: string;
  ACCOUNT: string;
  REPOSITORY: string;
  TOKEN: string;
  VERSION_PREFIX: string;
  INTERVAL: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface ProcessEnv extends ProcessEnvVars {}
  }
}
