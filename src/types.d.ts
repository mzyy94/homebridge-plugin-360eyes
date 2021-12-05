export interface Lamp360EyesDevice {
    name: string;
    address: string;
    port?: number;
    manufacturer?: string;
    model?: string;
    serial?: string;
}

export interface Lamp360EyesConfig {
  devices: Lamp360EyesDevice[];
}

export interface Lamp360Context {
  device: Lamp360EyesDevice;
}
