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
            .setCharacteristic(Characteristic.Manufacturer, "XiaoMi")
            .setCharacteristic(Characteristic.Model, "zhimi.humidifier")
            .setCharacteristic(Characteristic.SerialNumber, "xxxxxxxxxxxx");
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
          maxValue: 3, // high
          minStep: 1,
	    });
		
        var targetHumidityCharacteristic = humidifierService.addCharacteristic(Characteristic.TargetRelativeHumidity);
	    var speedToMode  = {0:'auto',1:'silent', 2:'medium', 3:'high'}; 
        var modeToSpeed = {'auto':0,'silent':1, 'medium':2, 'high':3};
		
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

targetHumidityCharacteristic.on('get', function (callback){
        that.device.call("get_prop", ["target_humidity"]).then(result => {
	    that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Target Humidity - getHumidity: " + result);
        callback(null, result[0]);
    }).catch(function(err) {
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Target Humidity - getHumidity Error: " + err);
        callback(err);
    });
}.bind(this)).on('set', function(value, callback) {
	        that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Target Humidity - set: " + value);
            that.device.call("set_target_humidity", [value]).then(result => {
                if(result[0] === "ok") {
                    callback(null);
                } else {
                    callback(new Error(result[0]));
                }            
            }).catch(function(err) {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Target Humidity - set Error: " + err);
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
		that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - Child Lock - setchildlock: " + result);
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
            that.device.call("get_prop",["mode"]).then(result => {
	        that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - getMode: " + result);
                callback(null, modeToSpeed[result[0]]);
            }).catch(function(err) {
				that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - getMode Error: " + err);
                callback(err);
            });
        }.bind(this))
        .on('set', function(value, callback) {
	    that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode: " + value);
	    if(value > 0) {
                    that.device.call("set_mode", [speedToMode[value]]).then(result => {
						that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMode Result: " + result);
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
	  else
	   {
		        that.log.debug("[MiHumidifier][DEBUG]HumidifierDehumidifier - setMOde=0  then turn OFF: " + value);
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
