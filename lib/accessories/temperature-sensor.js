const got = require('got');

module.exports = (Service, Characteristic) => {
  class HomenetTempSensor {
    constructor(log, valueId, name, baseUrl) {
      // device info
      this.domain = 'temperature';
      this.valueId = valueId;
      this.name = name;
      this.baseUrl = baseUrl;
      this.mfg = 'Homenet';
      this.model = 'Lock';
      this.serial = 'temp_sensor_' + valueId;
      this.log = log;
      this.minTemperature = -5;
      this.maxTemperature = 50;
    }

    getState(callback) {
      this.log(`fetching temp sensor state for: ${this.name}`);

      return got.get(`${this.baseUrl}/api/v1/values/${this.valueId}`, { json: true })
        .then(response => response.body)
        .then(result => result.values && result.values.temperature || null)
        .then(value => callback(null, value))
        .catch(err => callback(err));
    }

    getServices() {
      this.service = new Service.TemperatureSensor(this.name);
      const informationService = new Service.AccessoryInformation();

      informationService
        .setCharacteristic(Characteristic.Manufacturer, this.mfg)
        .setCharacteristic(Characteristic.Model, this.model)
        .setCharacteristic(Characteristic.SerialNumber, this.serial);

      this.service
        .getCharacteristic(Characteristic.CurrentTemperature)
        .on('get', this.getState.bind(this))
        .setProps({
          minValue: this.minTemperature,
          maxValue: this.maxTemperature
        });

      return [informationService, this.service];
    }
  };

  return HomenetTempSensor;
};
