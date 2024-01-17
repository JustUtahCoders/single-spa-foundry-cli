export let s3ObjectsPut = {};
export function resetS3Mocks() {
  s3ObjectsPut = {};
}

export class S3Client {
  async send(command) {
    if (command instanceof PutObjectCommand) {
      s3ObjectsPut[command.Key] = command;
    }
  }
}

export class PutObjectCommand {
  constructor(opts) {
    this.Bucket = opts.Bucket;
    this.Key = opts.Key;
    this.Body = opts.Body;
  }
  Key: string;
  Bucket: string;
  Body: ReadableStream;
}
