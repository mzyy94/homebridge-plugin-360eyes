import { connect, Socket } from 'net';

export interface Information {
  serialnumber: string;
  model: string;
  manufacturer: string;
  version: string;
}

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

  static information() {
    const packet = new Packet();
    packet.data = Packet.delimiter;
    packet.opcode = 0x4f66;
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

  async init(): Promise<Information> {
    await new Promise<void>((resolve, reject) => {
      this.con = connect(this.port, this.address, resolve);
      setTimeout(reject, 5000);
    });

    const buf = Packet.information().generate();
    const data = await this.sendRecv(buf);

    let serialnumber = '0123456789';
    let model = 'Default-Model';
    let manufacturer = 'Default-Manufacturer';
    let version = '1.0';

    if (data.readUInt32LE(4) !== 0x4f67) {
      return { serialnumber, model, manufacturer, version };
    }

    serialnumber = data.slice(36, 54).toString().trim();
    model = data.slice(54, 118).toString().trim();
    const parts = model.split('_');
    if (parts.length === 3) {
      manufacturer = parts[0];
      model = parts[1];
      version = parts[2].replace(/[^0-9.]/g, '');
    }

    return { serialnumber, model, manufacturer, version };
  }

  private async sendData(buf: Buffer) {
    if (this.destroyHandler) {
      clearTimeout(this.destroyHandler);
    }

    if (this.con?.destroyed !== false) {
      await new Promise<void>((resolve, reject) => {
        this.con = connect(this.port, this.address, resolve);
        setTimeout(reject, 5000);
      });
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

  private async sendRecv(buf: Buffer) {
    if (this.destroyHandler) {
      clearTimeout(this.destroyHandler);
    }

    if (this.con?.destroyed !== false) {
      await this.init();
    }

    return new Promise<Buffer>((resolve, reject) => {
      this.con?.once('data', resolve);

      this.con?.write(new Uint8Array(buf), (err) => {
        if (err) {
          reject(err);
        }
      });
    });
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
