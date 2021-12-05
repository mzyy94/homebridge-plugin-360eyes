import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { Lamp360EyesPlatform } from './platform';
import type { Lamp360Context } from './types';
import { LightControl } from './lightControl';

export class Lamp360EyesPlatformAccessory {
  private service: Service;
  private light: LightControl;

  private state = {
    On: false,
    Brightness: 100,
  };

  constructor(
    private readonly platform: Lamp360EyesPlatform,
    private readonly accessory: PlatformAccessory<Lamp360Context>,
  ) {

    const { device } = accessory.context;

    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);
    this.service.setCharacteristic(this.platform.Characteristic.Name, device.name);

    this.light = new LightControl(device.address, device.port ?? 23456);

    this.light.init().then(() => {
      // set accessory information
      this.accessory.getService(this.platform.Service.AccessoryInformation)!
        .setCharacteristic(this.platform.Characteristic.Manufacturer, device.manufacturer ?? 'Default-Manufacturer')
        .setCharacteristic(this.platform.Characteristic.Model, device.model ?? 'Default-Model')
        .setCharacteristic(this.platform.Characteristic.SerialNumber, device.serial ?? '0123456789');

      this.service.getCharacteristic(this.platform.Characteristic.On)
        .onSet(this.setOn.bind(this)).onGet(this.getOn.bind(this));

      this.service.getCharacteristic(this.platform.Characteristic.Brightness)
        .onSet(this.setBrightness.bind(this));
    });
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

    await this.light.setBrightness(brightness);

    this.platform.log.debug('Set Characteristic On ->', value);
  }

  async getOn(): Promise<CharacteristicValue> {
    const isOn = this.state.On;

    this.platform.log.debug('Get Characteristic On ->', isOn);

    return isOn;
  }

  async setBrightness(value: CharacteristicValue) {
    this.state.Brightness = value as number;

    await this.light.setBrightness(this.state.Brightness);

    this.platform.log.debug('Set Characteristic Brightness -> ', value);
  }

}
