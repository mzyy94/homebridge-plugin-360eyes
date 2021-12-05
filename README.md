# Homebridge 360Eyes Light Plugin

This is a plugin to control Light of 360Eyes camera via Homebridge.

## Configuration

```json
  "platforms": [
    {
      "platform": "Lamp360Eyes",
      "name": "Lamp360Eyes Config",
      "devices": [
        {
          "name": "Living",
          "address": "192.168.2.151"
        }
      ]
    }
  ]
```
See [config.schema.json](config.schema.json) for checking all options. Setup with [Homebridge Config UI X](https://github.com/oznu/homebridge-config-ui-x) is recommended.

## License

[Apache-2.0](LICENSE)