var co= require('co'), 
  coGenFactory= require('co-gen-factory'),
  asyncStash= require('async-stash'),
  dbus= require('./dbus'),
  thunkify= require('thunkify-wrap')

process.on('uncaughtException', function(we){
	console.log('death', we)
	var util= require('util')
	console.log(util.inspect(we))
})

/// represents a org.freedesktop.DBus manager object
var Manager= module.exports= (function Manager(busFactory){
	if(!(this instanceof Manager)){
		return new Manager(bus)
	}

	this.busFactory= busFactory|| dbus
	var self= this
	this.iface= coGenFactory(function*(){
		var bus= self.busFactory()
		var service= bus.getService('org.freedesktop.DBus')
		var getInterface= thunkify.genify(service.getInterface, service)
		var d= yield getInterface('/', 'org.freedesktop.DBus')
		loadDbus(d)
		return d
	})
	this.iface()

	this.names= asyncStash()
	this.owners= asyncStash()

	function loadDbus(master){
		master.ListNames(function(err, names){
			console.log('names', names.join(','))
			var time= 1
			for(var name of names.values()){
				if(name.startsWith(':'))
					continue
				var fn= function(name){
					return function(){
						var bus1= self.busFactory()
						bus1.getService(name).getInterface('/', 'org.freedesktop.DBus.Introspectable', function(err,ok){
							if(err){
								return
							}
							if(!ok){
								console.log('no return', name)
								return
							}
							if(!ok.Introspect){
								console.log("no introspect", name)
								return
							}
							
							ok.Introspect(function(err,i){	
								if(err){
									console.log('introspect failed', err)
									return
								}
								console.log("I", name, i)
								//console.log("I", name)
							})
						})

					}
				}(name)

				setTimeout(fn, (time++)*10)
			}
		})
	}

})

if(require.main == module){
	var manager= new Manager()
	/*
	manager.names.get('org.freedesktop.DBus')(function(names){
		console.log('names!', names)
	})
	*/
}
