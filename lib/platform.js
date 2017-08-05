const got = require('got');

module.exports = (homebridge) => {
  const Service = homebridge.hap.Service;
  const Characteristic = homebridge.hap.Characteristic;

  const HomenetLight = require('./accessories/light')(Service, Characteristic);
  const HomenetLock = require('./accessories/lock')(Service, Characteristic);
  const HomenetTempSensor = require('./accessories/temperature-sensor')(Service, Characteristic);
  // HomeAssistantSwitch = require('./accessories/switch')(Service, Characteristic, communicationError);
  // HomeAssistantLock = require('./accessories/lock')(Service, Characteristic, communicationError);
  // HomeAssistantMediaPlayer = require('./accessories/media_player')(Service, Characteristic, communicationError);
  // HomeAssistantFan = require('./accessories/fan')(Service, Characteristic, communicationError);
  // HomeAssistantCoverFactory = require('./accessories/cover')(Service, Characteristic, communicationError);
  // HomeAssistantSensorFactory = require('./accessories/sensor')(Service, Characteristic, communicationError);
  // HomeAssistantBinarySensorFactory = require('./accessories/binary_sensor')(Service, Characteristic, communicationError);
  // HomeAssistantDeviceTrackerFactory = require('./accessories/device_tracker')(Service, Characteristic, communicationError);
  // HomeAssistantClimate = require('./accessories/climate')(Service, Characteristic, communicationError);
  // HomeAssistantAlarmControlPanel = require('./accessories/alarm_control_panel')(Service, Characteristic, communicationError);

  class HomenetPlatform {
    constructor(log, config, api) {
      // auth info
      this.baseUrl = config.base_url;
      this.supportedTypes = config.supported_types ||
        ['light', 'lock', 'sensor'];
        // ['alarm_control_panel', 'binary_sensor', 'climate', 'cover', 'device_tracker', 'fan', 'group', 'input_boolean', 'light', 'lock', 'media_player', 'remote', 'scene', 'sensor', 'switch'];

      this.foundAccessories = [];
      this.logging = config.logging !== undefined ? config.logging : true;

      this.log = log;

      if (api) {
        // Save the API object as plugin needs to register new accessory via this object.
        this.api = api;
      }
    }

    _getInstances() {
      return got.get(`${this.baseUrl}/api/v1/instances`, { json: true })
      .then(response => response.body);
    }

    _getValues() {
      return got.get(`${this.baseUrl}/api/v1/values`, { json: true })
      .then(response => response.body);
    }

    fetchState(entityID, callback) {
      return this._getInstances()
      .then(instances => instances.find(i => i.key === entityID))
      .then(instance => callback(instance))
      .catch(err => callback(null));
    }

    // callService(domain, service, serviceData, callback) {
    //   const options = {};
    //   options.body = serviceData;

    //   this.request('POST', `/services/${domain}/${service}`, options, (error, response, data) => {
    //     if (error) {
    //       callback(null);
    //     } else {
    //       callback(data);
    //     }
    //   });
    // }

    accessories(callback) {
      this.log('Fetching Homenet instances.');

      Promise.all([
        this._getInstances()
          .then(instances => instances.filter(i => !i.hidden))
          .then(instances => instances.filter(i => !i.homebridgeHidden))
          .then(instances => instances.filter(i => this.supportedTypes.indexOf(i.class) >= 0))
          .then(instances => instances.map(instance => {
            const type = instance.class;

            switch (type) {
              case 'light':
                return new HomenetLight(this.log, instance, this.baseUrl);
              case 'lock':
                return new HomenetLock(this.log, instance, this.baseUrl);
              default:
                return null;
            }
          }))
          .then(accessories => accessories.filter(Boolean)),
        this._getValues()
          .then(values => values.filter(v => v.indexOf('sensor.') === 0))
          .then(values => values.filter(v => v.values.temperature !== undefined))
          .then(values => values.map(v => {
            const name = v.id
              .replace('sensor.', '')
              .replace('-', ' ');

            return new HomenetTempSensor(this.log, v.id, name, this.baseUrl);
          }))
          .then(accessories => accessories.filter(Boolean))
      ])
      .then(([accessoriesA, accessoriesB]) => {
        return [...accessoriesA, ...accessoriesB];
      })
      .then(accessories => {
        this.foundAccessories = accessories;
        try {
          callback(accessories);
        } catch (err) {
          this.log(`Failed calling back: ${err}`);
        }
      })
      .catch(err => {
        this.log(`Failed getting devices: ${err}. Retrying...`);
        setTimeout(() => { this.accessories(callback); }, 5000);
      });
    }
  };


  homebridge.registerPlatform('homebridge-homenet', 'Homenet', HomenetPlatform, false);
};
