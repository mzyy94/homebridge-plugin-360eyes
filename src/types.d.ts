export interface Lamp360EyesDevice {
    name: string;
    address: string;
    port: number;
}

export interface Lamp360EyesConfig {
  devices: Lamp360EyesDevice[];
}

export interface Lamp360Context {
  device: Lamp360EyesDevice;
}
