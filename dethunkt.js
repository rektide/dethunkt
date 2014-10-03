var dbus= require('dbus-native'),
  memoizee= require('memoizee'),
  genify= require('thunkify-wrap').genify

function factoryGen(fn){
	var _private;
	function *_fnGen(){
		while(1){
			yield _private|| (_private= fn());
		}
	}
	return _fnGen()
}

var sessionBus= factoryGen(function(){
	return dbus.sessionBus()
})

var systemBus= factoryGen(function(){
	return dbus.systemBus()
})

function *serviceGen(service, busFactory){
	busFactory= busFactory|| sessionBus
	var _service
	while(1){
		if(!_service)
			_service= busFactory.next().getService(service)
		yield service
	}
}

var _services= memoizee(serviceGen)

function service(service, bus){
	_service(service, bus).next()
}

function getService(service, bus){
	var interface= (function interface(object, interface){
		var _service = services(service, bus)
		var _interface= _service.getInferface(object, interface)
		return genify(_interface)
	})
	return interface
}

function getSystemService(service){
	return getService(service, dbus.systemBus())
}

module.exports = getService
module.exports.getSessionService = getService
module.exports.getSystemService = getSystemService
