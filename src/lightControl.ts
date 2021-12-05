import { connect, Socket } from 'net';

class Packet {
  static readonly magic = Buffer.from('ccddeeff', 'hex');
  static readonly delimiter = Buffer.from('fabab63bcaf55b01', 'hex');

  data = Buffer.from([]);
  opcode = 0;

  static brightness(brightness: number) {
    const data1 = Buffer.from(new Uint32Array([100, 0x4f9d]).buffer);
    const data2 = Buffer.from(new Uint32Array([100, brightness, 0, 0]).buffer);
    const packet = new Packet();
    packet.data = Buffer.concat([data1, Packet.delimiter, data2]);
    packet.opcode = 0x4fb0;
    return packet;
  }

  generate() {
    const header = Buffer.from(new Uint32Array([this.opcode, 1, 0, 0]).buffer);
    const buf = Buffer.concat([Packet.magic, header, Packet.delimiter, this.data]);
    buf.writeUInt32LE(buf.length, 12);
    return buf;
  }
}

export class LightControl {
  private con: Socket | null = null;
  private destroyHandler: NodeJS.Timeout | undefined;

  public brightness = 0;
  public on = false;

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

  async setOn(on: boolean) {
    this.on = on;
    let brightness = this.brightness;
    if (on) {
      if (brightness === 0) {
        brightness = 100;
        this.brightness = 100;
      }
    } else {
      brightness = 0;
    }

    const buf = Packet.brightness(brightness).generate();
    return this.sendData(buf);
  }

  async setBrightness(brightness: number) {
    this.brightness = brightness;
    const buf = Packet.brightness(brightness).generate();
    return this.sendData(buf);
  }
}
