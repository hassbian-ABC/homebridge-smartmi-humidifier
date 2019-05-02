
var fs = require('fs');
const miio = require('miio');
var Accessory, Service, Characteristic, UUIDGen;

module.exports = function(homebridge) {
    if(!isConfig(homebridge.user.configPath(), "accessories", "MiHumidifier")) {
        return;
    }

    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    UUIDGen = homebridge.hap.uuid;

    homebridge.registerAccessory('homebridge-smartmi-humidifier', 'MiHumidifier', MiHumidifier);
}

function isConfig(configFile, type, name) {
    var config = JSON.parse(fs.readFileSync(configFile));
    if("accessories" === type) {
        var accessories = config.accessories;
        for(var i in accessories) {
            if(accessories[i]['accessory'] === name) {
                return true;
            }
        }
    } else if("platforms" === type) {
        var platforms = config.platforms;
        for(var i in platforms) {
            if(platforms[i]['platform'] === name) {
                return true;
            }
        }
    } else {
    }
    
    return false;
}

function MiHumidifier(log, config) {
    if(null == config) {
        return;
    }

    this.log = log;
    this.config = config;
	this.model = config.model || 'v1'
    
    this.log.info("[MiHumidifier][INFO]***********************************************************");
    this.log.info("[MiHumidifier][INFO]          MiHumidifierPlatform v%s by hassbian-ABC 0.1.1");
    this.log.info("[MiHumidifier][INFO]  GitHub: https://github.com/hassbian-ABC/homebridge-MiHumidifier ");
    this.log.info("[MiHumidifier][INFO]                                                                  ");
    this.log.info("[MiHumidifier][INFO]***********************************************************");
    this.log.info("[MiHumidifier][INFO]start success...");


    var that = this;
    this.device = new miio.Device({
        address: that.config.ip,
        token: that.config.token

    });
}

MiHumidifier.prototype = {
    identify: function(callback) {
        callback();
    },

    getServices: function() {
        var that = this;
        var services = [];

        var infoService = new Service.AccessoryInformation();
        infoService
            .setCharacteristic(Characteristic.Manufacturer, "SmartMi")
            .setCharacteristic(Characteristic.Model, "Humidifier")
            .setCharacteristic(Characteristic.SerialNumber, this.config.ip);
        services.push(infoService);
		
	    var humidifierService = new Service.HumidifierDehumidifier(this.name);
        var currentHumidityCharacteristic = humidifierService.getCharacteristic(Characteristic.CurrentRelativeHumidity);
        var currentHumidifierDehumidifierStateCharacteristic = humidifierService.getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState);
	    currentHumidifierDehumidifierStateCharacteristic.setProps({
            validValues: [0,2]
        });
        var targetHumidifierDehumidifierStateCharacteristic = humidifierService.getCharacteristic(Characteristic.TargetHumidifierDehumidifierState);
        targetHumidifierDehumidifierStateCharacteristic.setProps({
            validValues: [1]
        });

        var activeCharacteristic = humidifierService.getCharacteristic(Characteristic.Active);
        var lockPhysicalControlsCharacteristic = humidifierService.addCharacteristic(Characteristic.LockPhysicalControls);
	    if (this.model === 'ca1') {
		var waterLevel = humidifierService.getCharacteristic(Characteristic.WaterLevel);
		}
        var rotationSpeedCharacteristic = humidifierService.getCharacteristic(Characteristic.RotationSpeed);
		if (this.model === 'ca1') {
	    rotationSpeedCharacteristic.setProps({
	      minValue: 0,
          maxValue: 100,
          minStep: 25,
	    });
		} else {
		rotationSpeedCharacteristic.setProps({
	      minValue: 0,
          maxValue: 3,
          minStep: 1,
	    });
		}
		   
        
		var swingModeControlsCharacteristic = humidifierService.addCharacteristic(Characteristic.SwingMode);
		
		humidifierService
		  .getCharacteristic(Characteristic.RelativeHumidityHumidifierThreshold)
		  .setProps({
		      minValue: 0,
              maxValue: 100,
              minStep: 10, 
          })
		  .on('get', function(callback) {
			  that.device.call("get_prop", ["power", "humidity", "child_lock", "dry", "depth", "limit_hum"]).then(result => {
				  that.log.debug("[MiHumidifier][DEBUG] - get: " + result);
				  if (result[0] === "on") {
						activeCharacteristic.updateValue(Characteristic.Active.ACTIVE);
						currentHumidifierDehumidifierStateCharacteristic.updateValue(Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING);
					} else if (result[0] === "off") {
						activeCharacteristic.updateValue(Characteristic.Active.INACTIVE);
					    currentHumidifierDehumidifierStateCharacteristic.updateValue(Characteristic.CurrentHumidifierDehumidifierState.INACTIVE);
					}
					if (result[2] === "on") {
						lockPhysicalControlsCharacteristic.updateValue(Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED);
					} else if (result[2] === "off") {
						lockPhysicalControlsCharacteristic.updateValue(Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED);
					}
					if (result[3] === "on") {
						swingModeControlsCharacteristic.updateValue(Characteristic.SwingMode.SWING_ENABLED);
					} else if (result[3] === "off") {
						swingModeControlsCharacteristic.updateValue(Characteristic.SwingMode.SWING_DISABLED);
					}
					if (this.model === 'ca1') {
						waterLevel.updateValue(result[4] / 1.2);
					}
					currentHumidityCharacteristic.updateValue(result[1]);
					callback(null, result[5])
					}).catch(function(err) {
			    that.log.error("[MiHumidifier][DEBUG] - get Error: " + err);
                callback(err);
            });
            }.bind(this))
		.on('set', function(value, callback) {
		    if(value > 0 && value <= 40) {
			    value = 40;
		    } else if(value > 80 && value <= 100) {
                value = 80;
		    }
	        that.device.call("set_limit_hum", [value]).then(result => {
                if(result[0] === "ok") {
				    callback(null);			
                } else {
                    callback(new Error(result[0]));
                }            
            }).catch(function(err) {
                callback(err);
            });
        }.bind(this));
		
		
		
        activeCharacteristic
        .on('set', function(value, callback) {
            that.device.call("set_power", [value ? "on" : "off"]).then(result => {
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }            
            }).catch(function(err) {
				that.log.error("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - setActive Error: " + err);
                callback(err);
            });
        }.bind(this));
		
    targetHumidifierDehumidifierStateCharacteristic.setValue(Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER);

    swingModeControlsCharacteristic
        .on('set', function(value, callback) {
            that.device.call("set_dry", [value ? "on" : "off"]).then(result => {
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }            
            }).catch(function(err) {
                callback(err);
            });
        }.bind(this));

    lockPhysicalControlsCharacteristic
    .on('set', function(value, callback) {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Child Lock - setchildlock: " + value);
        that.device.call("set_child_lock", [value ? "on" : "off"]).then(result => {
            if(result[0] === "ok") {
                callback(null);
            } else {
                callback(new Error(result[0]));
            }            
        }).catch(function(err) {
			that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Child Lock - setchildlock: " + err);
            callback(err);
        });
}.bind(this));

    

rotationSpeedCharacteristic			  
     .on('get', function(callback) {
            that.device.call('get_prop',['mode']).then(result => {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - getMode: " + result);
            if (this.model === 'ca1') {
			   if(result[0] === "auto") {
                        callback(null, 25);
                } else if(result[0] === "silent") { 
                        callback(null, 50);
                } else if(result[0] === "medium") {
                        callback(null, 75);
                } else if(result[0] === "high") {
                        callback(null, 100);
                } else {
                    callback(null, 0);
                }
			} else {
				if(result[0] === "silent") { 
                        callback(null, 1);
                } else if(result[0] === "medium") {
                        callback(null, 2);
                } else if(result[0] === "high") {
                        callback(null, 3);
                } else {
                    callback(null, 0);
                }
			}
            }).catch(function(err) {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - getMode Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
			    that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode: " + value);
			if (this.model === 'ca1') {
			    if(value == 25) {
                    that.device.call("set_mode", ["auto"]).then(result => {
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
					}).catch(function(err) {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Error: " + err);
                        callback(err);
				    });
		        } else if (value == 50) {
                    that.device.call("set_mode", ["silent"]).then(result => {
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
					}).catch(function(err) {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Error: " + err);
                        callback(err);
                    });
                } else if (value == 75) {
                    that.device.call("set_mode", ["medium"]).then(result => {
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
					}).catch(function(err) {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Error: " + err);
                        callback(err);
                    });
                } else if (value == 100) {
                    that.device.call("set_mode", ["high"]).then(result => {
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
					}).catch(function(err) {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Error: " + err);
                        callback(err);
                    });
                } else if (value == 0) {
                    that.device.call("set_power", ["off"]).then(result => {
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
					}).catch(function(err) {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Error: " + err);
                        callback(err);
                    });
				}
			} else {
				if (value == 1) {
                    that.device.call("set_mode", ["silent"]).then(result => {
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
					}).catch(function(err) {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Error: " + err);
                        callback(err);
                    });
                } else if (value == 2) {
                    that.device.call("set_mode", ["medium"]).then(result => {
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
					}).catch(function(err) {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Error: " + err);
                        callback(err);
                    });
                } else if (value == 3) {
                    that.device.call("set_mode", ["high"]).then(result => {
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
					}).catch(function(err) {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Error: " + err);
                        callback(err);
                    });
                } else if (value == 0) {
                    that.device.call("set_power", ["off"]).then(result => {
                        if(result[0] === "ok") {
                            callback(null);
                        } else {
                            callback(new Error(result[0]));
                        }
					}).catch(function(err) {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Error: " + err);
                        callback(err);
                    });
				}
			}
        }.bind(this));  
		
    services.push(humidifierService);
	
    if(!this.config['showTemperatureDisable']) {
	var temperatureSensorService = new Service.TemperatureSensor(this.config['showTemperatureSensorName']);
        temperatureSensorService
		    .getCharacteristic(Characteristic.CurrentTemperature)
			.on('get', function(callback) {
                    that.device.call("get_prop", ["temp_dec"]).then(result => {
					that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - getTemperature: " + result);
                    callback(null, result[0] / 10);
            }).catch(function(err) {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - getTemperature Error: " + err);
				callback(err);
		    });
        }.bind(this));
	services.push(temperatureSensorService);
	
	}
    return services;

	} 
	
}
