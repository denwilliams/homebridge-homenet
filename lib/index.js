module.exports = function (homebridge) {
  const MacroAccessory = require('./macro')(homebridge.hap.Service, homebridge.hap.Characteristic);
  require('./platform')(homebridge);

  homebridge.registerAccessory('homebridge-homenet-macro', 'HomenetMacro', MacroAccessory);
};
