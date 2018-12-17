# homebridge-MiHumidifier



Thanks for [Mr.Yin](https://github.com/YinHangCode/homebridge-mi-fan/) ,[acc-ua](https://github.com/acc-ua) , [nfarina](https://github.com/nfarina)(the author of [homebridge](https://github.com/nfarina/homebridge)), [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol), [aholstenson](https://github.com/aholstenson)(the author of [miio](https://github.com/aholstenson/miio)), all other developer and testers.   
  
![](https://github.com/hassbian-ABC/homebridge-MiHumidifier/blob/master/images/home.png)
![](https://github.com/hassbian-ABC/homebridge-MiHumidifier/blob/master/images/home1.png)
![](https://github.com/hassbian-ABC/homebridge-MiHumidifier/blob/master/images/home2.png)

 
## Installation
1. Install HomeBridge, please follow it's [README](https://github.com/nfarina/homebridge/blob/master/README.md).   
If you are using Raspberry Pi, please read [Running-HomeBridge-on-a-Raspberry-Pi](https://github.com/nfarina/homebridge/wiki/Running-HomeBridge-on-a-Raspberry-Pi).   
2. Make sure you can see HomeBridge in your iOS devices, if not, please go back to step 1.   
3. Install packages.   
```
npm install -g homebridge-smartmi-humidifier
```

zhimi.humidifier.ca1  ++++   "model": "ca1",
```
"accessories": [
    {
      "accessory": "MiHumidifier",
      "name": "智米加湿器",
      "ip": "192.168.1.77",
      "token": "7251f2fdc5eda606d9125d882c932914",
      "showTemperatureDisable": false,
      "showTemperatureSensorName": "加湿器温度"
    }
  ]
```
## Get token
### Get token by miio2.db
setup MiJia(MiHome) app in your android device or android virtual machine.   
open MiJia(MiHome) app and login your account.   
refresh device list and make sure device display in the device list.   
get miio2.db(path: /data/data/com.xiaomi.smarthome/databases/miio2.db) file from your android device or android virtual machine.   
open website [[Get MiIo Tokens By DataBase File](http://miio2.yinhh.com/)], upload miio2.db file and submit.    
### Get token by network
Open command prompt or terminal. Run following command:
```
miio --discover
```
Wait until you get output similar to this:
```
Device ID: xxxxxxxx   
Model info: Unknown   
Address: 192.168.88.xx   
Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx via auto-token   
Support: Unknown   
```
"xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" is token.   
If token is "???", then reset device and connect device created Wi-Fi hotspot.   
Run following command:   
```
miio --discover --sync
```
Wait until you get output.   
For more information about token, please refer to [OpenMiHome](https://github.com/OpenMiHome/mihome-binary-protocol

) and [miio](https://github.com/aholstenson/miio

).   
