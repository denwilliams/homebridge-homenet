const got = require('got');

module.exports = (Service, Characteristic) => {
  class MacroAccessory {
    constructor(log, config) {
      this.log = log;
      this.name = config.name;
      this.url = `${config.base_url}/api/v1/commands/macro.${config.macro_id}/execute`

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

      this.log('Running macro %s - %s', this.name, this.url);

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
