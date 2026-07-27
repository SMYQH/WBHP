declare module "crx3" {
  interface Crx3Options {
    keyPath?: string;
    crxPath?: string;
    zipPath?: string;
    xmlPath?: string;
    appVersion?: string;
    crxURL?: string;
    browserVersion?: string;
  }

  function crx3(files: string[], options?: Crx3Options): Promise<void>;

  export default crx3;
}
