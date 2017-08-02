const got = require('got');

module.exports = (Service, Characteristic) => {
  class HomenetLock {
    constructor(log, instance, baseUrl) {
      // device info
      this.domain = 'lock';
      this.instance = instance;
      this.name = instance.id;
      this.baseUrl = baseUrl;

      // if (data.attributes && data.attributes.friendly_name) {
      //   this.name = data.attributes.friendly_name;
      // } else {
      //   this.name = data.entity_id.split('.').pop().replace(/_/g, ' ');
      // }
      // if (data.attributes && data.attributes.homebridge_mfg) {
      //   this.mfg = String(data.attributes.homebridge_mfg);
      // } else {
        this.mfg = 'Home Assistant';
      // }
      // if (data.attributes && data.attributes.homebridge_model) {
      //   this.model = String(data.attributes.homebridge_model);
      // } else {
        this.model = 'Lock';
      // }
      // if (data.attributes && data.attributes.homebridge_serial) {
      //   this.serial = String(data.attributes.homebridge_serial);
      // } else {
        this.serial = instance.key;
      // }
      // this.client = client;
      this.log = log;
    }

    // onEvent(oldState, newState) {
    //   const lockState = newState.state === 'unlocked' ? 0 : 1;
    //   this.lockService.getCharacteristic(Characteristic.LockCurrentState)
    //       .setValue(lockState, null, 'internal');
    //   this.lockService.getCharacteristic(Characteristic.LockTargetState)
    //       .setValue(lockState, null, 'internal');
    // }

    getLockState(callback) {
      this.log(`fetching lock state for: ${this.name}`);

      return got.get(`${this.baseUrl}/api/v1/switches/${this.instance.switchId}`)
      .then(response => response.body)
      .then(sw => sw.value && sw.value !== 'unlocked')
      .then(value => callback(null, value))
      .catch(err => callback(err));
    }

    setLockState(lockOn, callback, context) {
      if (context === 'internal') {
        callback();
        return;
      }

      this.log(`Setting power state on the '${this.name}' to ${lockOn}`);

      return got.put(`${this.baseUrl}/api/v1/switches/${this.instance.switchId}`, {
        json: true,
        body: { value: lockOn }
      })
      .then(() => callback())
      .catch(err => callback(err));
    }

    getServices() {
      this.lockService = new Service.LockMechanism();
      const informationService = new Service.AccessoryInformation();

      informationService
            .setCharacteristic(Characteristic.Manufacturer, this.mfg)
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, this.serial);

      this.lockService
          .getCharacteristic(Characteristic.LockCurrentState)
          .on('get', this.getLockState.bind(this));

      this.lockService
          .getCharacteristic(Characteristic.LockTargetState)
          .on('get', this.getLockState.bind(this))
          .on('set', this.setLockState.bind(this));

      return [informationService, this.lockService];
    }
  };

  return HomenetLock;
};
