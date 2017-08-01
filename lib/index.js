module.exports = function (homebridge) {
  const MacroAccessory = require('./macro')(homebridge.hap.Service, homebridge.hap.Characteristic);
  const HomenetPlatform = require('./platform')(homebridge);

  homebridge.registerAccessory('homebridge-homenet-macro', 'HomenetMacro', MacroAccessory);
  homebridge.registerPlatform('homebridge-homenet', 'Homenet', HomenetPlatform, false);
};
