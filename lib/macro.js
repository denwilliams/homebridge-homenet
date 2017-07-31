const got = require('got');

module.exports = (Service, Characteristic) => {
  class MacroAccessory {
    constructor(log, config) {
      this.log = log;
      this.name = config.name;
      this.url = `${config.baseUrl}/api/v1/`
      this.baseUrl = config.baseUrl;
      this.commandId = config.commandId;

      this.service = new Service.Switch(this.name);

      this.service
          .getCharacteristic(Characteristic.On)
          .on('get', this.getState.bind(this))
          .on('set', this.setState.bind(this));
    }

    getState(callback) {
      // A macro is always off - you turn it on to toggle
      callback(null, true);
    }

    setState(state, callback) {
      if (!state) return callback(null);

      this.log('Running macro %s', this.name);

      got.post(this.url)
      .then(result => {
        callback(null);
      })
      .catch(err => {
        this.log("Error running macro '%s'. Response: %s", this.name, err);
        callback(err);
      });
    }

    getServices() {
      return [this.service];
    }
  }
  return MacroAccessory;
};
