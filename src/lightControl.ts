import { connect, Socket } from 'net';

// eslint-disable-next-line
const payload = 'ccddeeffb04f0000010000008800000000000000fabab63bcaf55b01640000009d4f0000fabab63bcaf55b016400000064000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

export class LightControl {
  private con: Socket | null = null;
  private destroyHandler: NodeJS.Timeout | undefined;

  constructor(private readonly address: string, private readonly port: number) {
  }

  async init() {
    return new Promise<void>((resolve, reject) => {
      this.con = connect(this.port, this.address, resolve);
      setTimeout(reject, 5000);
    });
  }

  private async sendData(buf: Buffer) {
    if (this.destroyHandler) {
      clearTimeout(this.destroyHandler);
    }

    if (this.con?.destroyed !== false) {
      await this.init();
    }

    await new Promise((resolve, reject) => {
      this.con?.write(new Uint8Array(buf), (err) => {
        if (err) {
          return reject(err);
        }
        resolve(null);
      });
    });

    this.destroyHandler = setTimeout(() => {
      this.con?.destroy();
    }, 10*1000);
  }

  async setBrightness(brightness: number) {
    const buf = Buffer.from(payload, 'hex');
    buf.writeUInt32LE(brightness, 48);
    return this.sendData(buf);
  }
}
