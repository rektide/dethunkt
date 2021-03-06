var dbus= require('dbus-native'),
  memoizee= require('memoizee'),
  genify= require('thunkify-wrap').genify

function readFactory(val, def){
	if(val && val.next){
		return val.next()
	}else if(val){
		return val
	}else{
		return def.next()
	}
}

// buses
var sessionBusFactory= coGenFactory(function*(){
	yield dbus.sessionBus()
})()
var systemBusFactory= coGenFactory(function*(){
	yield dbus.systemBus()
})()

// services
var services= coGenFactory(function*(service, busFactory){
	yield readFactory(busFactory, sessionBusFactory).getService(service)
})

function getService(service, busFactory){
	return {
		interface: (function interface(object, interface){
			var _service= services(service, busFactory)
			var _interface= _service.getInferface(object, interface)
			return genify(_interface)
		}),
		object: (function(objName){
			var _service= services(service, busFactory)
			var _object= _service.getObject(objName)
			return genify(_object)
		})
	}
}

function getSystemService(service){
	return getService(service, systemBusFactory)
}

// objects
function *objectGen(path, name, busFactory){
	var _object
	while(1){
		if(!_object)
			_object= readFactory(busFactory, sessionBusFactory).getObject(path, name)
		yield _object
	}
}
var _objects= memoizee(objectGen)

function getObject(path, name, busFactory){
	return _objects(path, name, busFactory).next()
}

function getSystemObject(path, name){
	return getObject(path, name, systemBusFactory)
}

// interfaces
function *interfaceGen(path, objname, name, busFactory) {
	var _interface
	while(1){
		if(!_interface)
			_interface= readFactory(busFactory, sessionBusFactory).getInterface(path, objname, name)
		yield _interface
	}
}
var _interfaces= memoizee(interfaceGen)

function getInterface(path, objname, name, busFactory){
	return _interfaces(path, objname, name, busFactory).next()
}

function getSystemInterface(path, objname, name){
	return getInterface(path, objname, name, systemBusFactory)
}

// default
module.exports = getService
// default methods
module.exports.getService = getService
module.exports.getObject= getObject
module.exports.getInterface= getInterface
// named session
module.exports.session= getService

// top level system
module.exports.getSystemService= getSystemService
module.exports.getSystemObject= getSystemObject
module.exports.getSystemInterface= getSystemInterface

// named system
module.exports.system= {}
module.exports.system.getService= getSystemService
module.exports.system.getObject= getSystemObject
module.exports.system.getInterface= getSystemInterface
