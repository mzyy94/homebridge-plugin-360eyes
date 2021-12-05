import { connect, Socket } from 'net';
import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { Lamp360EyesPlatform } from './platform';
import type { Lamp360Context } from './types';

// eslint-disable-next-line
const payload = 'ccddeeffb04f0000010000008800000000000000fabab63bcaf55b01640000009d4f0000fabab63bcaf55b016400000064000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

let con: Socket | null = null;
let destroyHandler: NodeJS.Timeout;

export class Lamp360EyesPlatformAccessory {
  private service: Service;

  private state = {
    On: false,
    Brightness: 100,
  };

  constructor(
    private readonly platform: Lamp360EyesPlatform,
    private readonly accessory: PlatformAccessory<Lamp360Context>,
  ) {

    const { device } = accessory.context;

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, device.manufacturer ?? 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, device.model ?? 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, device.serial ?? '0123456789');

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, device.name);

    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this)).onGet(this.getOn.bind(this));

    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));
  }

  async setOn(value: CharacteristicValue) {
    this.state.On = value as boolean;

    let brightness = this.state.Brightness;
    if (this.state.On) {
      if (brightness === 0) {
        brightness = 100;
        this.state.Brightness = 100;
      }
    } else {
      brightness = 0;
    }

    await this.sendData(brightness);

    this.platform.log.debug('Set Characteristic On ->', value);
  }

  async getOn(): Promise<CharacteristicValue> {
    const isOn = this.state.On;

    this.platform.log.debug('Get Characteristic On ->', isOn);

    return isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    this.state.Brightness = value as number;
    await this.sendData(this.state.Brightness);
    this.platform.log.debug('Set Characteristic Brightness -> ', value);
  }

  async sendData(brightness: number) {
    clearTimeout(destroyHandler);

    if (con?.destroyed !== false) {
      con = await new Promise<Socket>((resolve, reject) => {
        const { device } = this.accessory.context;
        const con = connect(device.port ?? 23456, device.address, () => resolve(con));
        setTimeout(reject, 5000);
      });
    }

    const buf = Buffer.from(payload, 'hex');
    buf.writeUInt8(brightness, 48);

    await new Promise((resolve, reject) => {
      con?.write(new Uint8Array(buf), (err) => {
        if (err) {
          return reject(err);
        }
        resolve(null);
      });
    });

    destroyHandler = setTimeout(() => {
      con?.destroy();
    }, 10*1000);
  }

}
