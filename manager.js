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
	this.names= asyncStash()
	this.owners= asyncStash()

	var self= this
	this.iface= coGenFactory(function*(){
		console.log('fact')
		var bus= self.busFactory()
console.log('bus')
		var service= bus.getService('org.freedesktop.DBus')
console.log('srv', service)
		/*
		service.getInterface('/org/freedesktop/DBus', 'org.freedesktop.DBus', function(err,ok){
			if(err){
				console.log('err', err)
			}else{
				console.log('ok', ok)
			}
		})
		*/
		var getInterface= thunkify.genify(service.getInterface)
console.log('int')
		var d = getInterface.call(service, '/org/freedesktop/DBus', 'org.freedesktop.DBus')
console.log('result')
console.log('d', d)
		var p = d(function(err, ok){
			console.log('what we got', err)
			console.log('yeah', ok)
		})
		loadDbus(d)
		console.log('load')
		return d
	})()
	this.iface()
console.log('stashes')

	function loadDbus(master){
		console.log('master is!')
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
console.log('hi')
	var get = manager.names.getter('org.freedesktop.DBus')
console.log('have', get)
	get(function(names){
		console.log('names!', names)
	})
	setInterval(function(){}, 3000)
}
