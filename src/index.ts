import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { Lamp360EyesPlatform } from './platform';

export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, Lamp360EyesPlatform);
};
