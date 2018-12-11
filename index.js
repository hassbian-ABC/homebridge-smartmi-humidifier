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

    homebridge.registerAccessory('homebridge-MiHumidifier', 'MiHumidifier', MiHumidifier);
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
    
    this.log.info("[MiHumidifierPlatform][INFO]***********************************************************");
    this.log.info("[MiHumidifierPlatform][INFO]          MiHumidifierPlatform v%s by hassbian-ABC 0.0.1");
    this.log.info("[MiHumidifierPlatform][INFO]  GitHub: https://github.com/hassbian-ABC/homebridge-MiHumidifier ");
    this.log.info("[MiHumidifierPlatform][INFO]                                                                  ");
    this.log.info("[MiHumidifierPlatform][INFO]***********************************************************");
    this.log.info("[MiHumidifierPlatform][INFO]start success...");


    var that = this;
    this.device = new miio.Device({
        address: that.config.ip,
        token: that.config.token
		//model: that.config.model
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
            .setCharacteristic(Characteristic.Manufacturer, "Xiaoyan Tech")
            .setCharacteristic(Characteristic.Model, "TERNCY-DC01")
            .setCharacteristic(Characteristic.SerialNumber, "000d6f00106855fc-00");
        services.push(infoService);
		
	var humidifierService = new Service.HumidifierDehumidifier(this.name);
        var currentHumidityCharacteristic = humidifierService.getCharacteristic(Characteristic.CurrentRelativeHumidity);
        var currentHumidifierDehumidifierStateCharacteristic = humidifierService.getCharacteristic(Characteristic.CurrentHumidifierDehumidifierState);
	currentHumidifierDehumidifierStateCharacteristic.setProps({
            validValues: [0,2]
        });
	//currentHumidifierDehumidifierStateCharacteristic.value = Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING;
        var targetHumidifierDehumidifierStateCharacteristic = humidifierService.getCharacteristic(Characteristic.TargetHumidifierDehumidifierState);
        targetHumidifierDehumidifierStateCharacteristic.setProps({
            validValues: [1]
        });
	//targetHumidifierDehumidifierStateCharacteristic.value = Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER;

        var activeCharacteristic = humidifierService.getCharacteristic(Characteristic.Active);
        var lockPhysicalControlsCharacteristic = humidifierService.addCharacteristic(Characteristic.LockPhysicalControls);
	    var waterLevel = humidifierService.getCharacteristic(Characteristic.WaterLevel);
        var rotationSpeedCharacteristic = humidifierService.getCharacteristic(Characteristic.RotationSpeed);
	    rotationSpeedCharacteristic.setProps({
	      minValue: 0, // idle (model:zhimi.humidifier.ca1, 0 = auto)
          maxValue: 100, // high
          minStep: 25,
	    });
		var relativeHumidityHumidifierThresholdCharacteristic = humidifierService.addCharacteristic(Characteristic.RelativeHumidityHumidifierThreshold);
		relativeHumidityHumidifierThresholdCharacteristic.setProps({
		  minValue: 0,
          maxValue: 100,
          minStep: 10, 
        });
        
		var swingModeControlsCharacteristic = humidifierService.addCharacteristic(Characteristic.SwingMode);
		
		
		
        activeCharacteristic
        .on('get', function(callback) {
            that.device.call("get_prop", ["power"]).then(result => {
		    that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - getActive: " + result);
                callback(null, result[0] === "on" ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE);
            }).catch(function(err) {
			    that.log.error("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - getActive Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
			that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - setActive: " + value);
            that.device.call("set_power", [value ? "on" : "off"]).then(result => {
			that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - setActive Result: " + result);
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


    currentHumidifierDehumidifierStateCharacteristic
        .on('get', function(callback) {
            that.device.call("get_prop", ["power"]).then(result => {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - getActive: " + result);
                callback(null, result[0] === "on" ? Characteristic.CurrentHumidifierDehumidifierState.HUMIDIFYING : Characteristic.CurrentHumidifierDehumidifierState.INACTIVE);
            }).catch(function(err) {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Active - getActive Error: " + err);
                callback(err);
            });
        }.bind(this));
		

    targetHumidifierDehumidifierStateCharacteristic.setValue(Characteristic.TargetHumidifierDehumidifierState.HUMIDIFIER);


currentHumidityCharacteristic.on('get', function (callback){
        that.device.call("get_prop", ["humidity"]).then(result => {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Humidity - getHumidity: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Humidity - getHumidity Error: " + err);
        callback(err);
    });
}.bind(this)); 


swingModeControlsCharacteristic
    .on('get', function (callback){
    	that.device.call("get_prop", ["dry"]).then(result => {
        callback(null, result[0] === "on" ? Characteristic.SwingMode.SWING_ENABLED : Characteristic.SwingMode.SWING_DISABLED);
        }).catch(function(err) {
           callback(err);
        });
   }.bind(this))
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


		
waterLevel.on('get', function (callback){
	that.device.call("get_prop", ["depth"]).then(result => {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Water Level - getwaterLevel: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Water Level - getwaterLevel: " + err);
        callback(err);
    });
}.bind(this));

lockPhysicalControlsCharacteristic
    .on('get', function(callback) {
        that.device.call("get_prop", ["child_lock"]).then(result => {
			that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Child Lock - getchildlock: " + result);
            callback(null, result[0] === "on" ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED);
        }).catch(function(err) {
			that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Child Lock - getchildlock: " + err);
            callback(err);
        });
    }.bind(this))
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
            }).catch(function(err) {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - getMode Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
			    that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode: " + value);
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
        }.bind(this));  



relativeHumidityHumidifierThresholdCharacteristic
   .on('get', function(callback) {
	   that.device.call("get_prop", ["limit_hum"]).then(result => {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Humidity - getHumidity: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Humidity - getHumidity Error: " + err);
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
                if (value > currentHumidityCharacteristic.value) {
                    that.device.call("set_power", ["on"]).then(result => {
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
                callback(new Error(result[0]));
            }            
            }).catch(function(err) {
                callback(err);
            });
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
