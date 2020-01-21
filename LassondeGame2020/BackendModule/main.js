// To Run type in node main.js

var PRESENTATION_PHASE = true;
var app = require("express")();
var fs = require("fs");
var http = require("http").Server(app);
var io = require("socket.io")(http);
var itemsExport = require("./items.js");

var presentationTemplate;
var presentationData;
var items = (PRESENTATION_PHASE ? itemsExport.asteroidItems : itemsExport.designItems);

var roomDim = 24;

var rechargeLocations = {
	STATION_1: {
		x: 4,
		y: 10
	},
	STATION_2: {
		x: 18,
		y: 13
	}
};

var marsLocation = {
	x: 20,
	y: 21
};

var maxFuel = 30;

var presentationKey = "baseInstance";
var instances = {};

instances[presentationKey] = null;

class Error {
	constructor(error, params) {
		this.type = "ERROR";
		this.error = error;
		switch (error) {
			case "INVALID_TOKEN":
				this.message = "Token " + params['host'] + " is not valid. Please contact the administrator for more information.";
				break;
			case "INSTANCE_NOT_ACTIVE":
				this.message = "Token " + params['host'] + " does not have an active instance. Please create a new instance beforehand.";
				break;
			case "INSTANCE_ALREADY_ACTIVE":
				this.message = "Token " + params['host'] + " already has an active instance. If you would like a new instance, please delete the active instance beforehand.";
				break;
			case "INVALID_ID":
				this.message = "Item ID " + params['id'] + " is not valid. Please select a different item.";
				break;
			case "INVALID_DIRECTION":
				this.message = "Invalid direction " + params['direction'] + " is not a cardinal direction. Please use N, S, E, or W.";
				break;
		}
	}
}

class Failure {
	constructor(failure, params) {
		this.type = "FAILURE";
		this.failure = failure;
		switch (failure) {
			case "TURN_NOT_REQUIRED":
				this.message = "You are already facing direction " + params['direction'] + ".";
				break;
			case "EDGE_PRESENT":
				this.message = "The edge of the known map is present immediately in direction " + params['direction'] + ". Please choose another direction or action.";
				break;
			case "NOT_RECHARGE_LOCATION":
				this.message = "There is no recharge location at " + params['x'] + "," + params['y'] + ". Please choose another action.";
				break;
			case "UNABLE_TO_FINISH":
				this.message = "You are not at Mars, currently you are at location: (" + params['x'] + "," + params['y'] + ")";
				break;
			case "ALREADY_FINISHED":
				this.message = "You have already finished. If you would like to start again, please delete this instance.";
				break;
			case "YOU WENT BOOM":
				this.message = "It seems like you have made a fatal error";
				break;
		}
	}
}

class Success {
	constructor(payload) {
		this.type = "SUCCESS";
		this.payload = payload;
		if (payload) {
			populatePresentationData(payload);
		} else {
			populatePresentationTemplate();
		}
	}
}
class Location {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	static isEqual(l1, l2) {
		return (l1.x == l2.x && l1.y == l2.y);
	}

	static isIn(a1, l2) {
		return a1.some(function(l1) {
			return Location.isEqual(l1, l2);
		});
	}
}

class Instance {
	constructor(id) {
		this.id = id;
		this.location = new Location(0, 0);
		this.direction = "N";
		this.finished = false;
		this.timeSpent = 0;
		this.fuelAmount = maxFuel;
		this.didYouGoBoom = false;
		this.fuelNegative = false;
		this.constants = {
			ROOM_DIMENSIONS: {
				X_MIN: 0,
				X_MAX: roomDim - 1,
				Y_MIN: 0,
				Y_MAX: roomDim - 1
			},
		};
	}

	finish() {
		if (!this.didYouGoBoom) {
			if (this.location.x === marsLocation.x && this.location.y === marsLocation.y) {
				if (!this.finished) {
					this.finished = true;
					return new Success(this);
				}
				return new Failure("ALREADY_FINISHED");
			}
			return new Failure("UNABLE_TO_FINISH", {x: this.location.x, y: this.location.y});
		}
			return new Failure("YOU WENT BOOM");
	};
	turn(direction) {
		if (!this.didYouGoBoom) {
			if (this.direction == direction) {
				return new Failure("TURN_NOT_REQUIRED", {direction:direction});
			}
			if (direction != "N" && direction != "S" && direction != "E" && direction != "W") {
				return new Error("INVALID_DIRECTION", {direction:direction});
			}
			this.direction = direction;

			if (!this.finished) {
				this.fuelAmount -= 1;
				if (this.fuelAmount < 0) {
					this.fuelNegative = true;
				}
				this.timeSpent += 1;
			}
			return new Success(this);
		}
		return new Failure("YOU WENT BOOM");
	};
	move() {
		var result = ''
		if (!this.didYouGoBoom) {
			switch (this.direction) {
				case "N":
					if (this.location.y == this.constants.ROOM_DIMENSIONS.Y_MAX) {
						result = new Failure("EDGE_PRESENT", {direction:this.direction});
					}
					items.forEach((item) => {
						if (item.x == this.location.x && item.y == (this.location.y + 1)) {
							this.didYouGoBoom = true;
						}
					})
					this.location.y++;
					break;
				case "S":
					if (this.location.y == this.constants.ROOM_DIMENSIONS.Y_MIN) {
						result = new Failure("EDGE_PRESENT", {direction:this.direction});
					}
					items.forEach((item) => {
						if (item.x == this.location.x && item.y == (this.location.y - 1)) {
							this.didYouGoBoom = true;
						}
					})
					this.location.y--;
					break;
				case "E":
					if (this.location.x == this.constants.ROOM_DIMENSIONS.X_MAX) {
						result = new Failure("EDGE_PRESENT", {direction:this.direction});
					}
					items.forEach((item) => {

						if (item.x == (this.location.x + 1) && item.y == this.location.y) {
							this.didYouGoBoom = true;
						}
					})
					this.location.x++;
					break;
				case "W":
					if (this.location.x == this.constants.ROOM_DIMENSIONS.X_MIN) {
						result = new Failure("EDGE_PRESENT", {direction:this.direction});
					}
					items.forEach((item) => {
						if (item.x == (this.location.x - 1) && item.y == this.location.y) {
							this.didYouGoBoom = true;
						}
					})
					this.location.x--;
					break;
			}
			if (!this.finished) {
				this.fuelAmount -= 1;
				if (this.fuelAmount < 0) {
					this.fuelNegative = true;
				}
				this.timeSpent += 1;
			}
			if (result == '') {
				return new Success(this);
			}
			return result;
		}
		return new Failure("YOU WENT BOOM");
	};
	refuel() {
		if (!this.didYouGoBoom) {
			if((this.location.x === rechargeLocations.STATION_1.x && this.location.y === rechargeLocations.STATION_1.y) ||
			(this.location.x === rechargeLocations.STATION_2.x && this.location.y === rechargeLocations.STATION_2.y)) {
				const refuelAmount = maxFuel - this.fuelAmount;
				this.timeSpent += refuelAmount;
				this.fuelAmount = maxFuel;

				return new Success(this);
			}
			return new Failure("NOT_RECHARGE_LOCATION", {x: this.location.x, y: this.location.y});
		}
		return new Failure("YOU WENT BOOM");
	};

}

populatePresentationTemplate = function() {
	itemSet = []
	items.forEach((item) =>
	{
		itemSet.push(item)
	});

	presentationTemplate = {
		'Mars': {
			'x': marsLocation.x,
			'y': marsLocation.y
		},
		'Station1': {
			'x': rechargeLocations.STATION_1.x,
			'y': rechargeLocations.STATION_1.y
		},
		'Station2': {
			'x': rechargeLocations.STATION_2.x,
			'y': rechargeLocations.STATION_2.y
		},
		'Asteroids': itemSet
	}
}

populatePresentationData = function(instance) {
	presentationData = JSON.parse(JSON.stringify(presentationTemplate));
	io.emit('updateInstance', {"presentationData": presentationData, "presentationInstance": instance});
}

app.get('/instance', function (req, res) {
	var response = new Success(instances[req.headers['host']]);
	presentationData = JSON.parse(JSON.stringify(presentationTemplate));
	response["mapData"] = presentationData;
	setTimeout((function() {res.json(response)}), 0);
});

app.post('/instance', function (req, res) {
	instances[req.headers['host']] = new Instance(req.headers['host']);
	var response = new Success(instances[req.headers['host']]);
	setTimeout((function() {res.json(response)}), 0);
});

app.delete('/instance', function (req, res) {
	instances[req.headers['host']] = null;
	presentationData = null;
	var response = new Success(null);
	setTimeout((function() {res.json(response)}), 0);
});

app.post('/finish', function (req, res) {
	var response = instances[req.headers['host']].finish()
	setTimeout((function() {res.json(response)}), 100);
});

app.post('/turn/:Direction', function (req, res) {
	var response = instances[req.headers['host']].turn(req.params.Direction)
	setTimeout((function() {res.json(response)}), 200);
});

app.post('/move', function (req, res) {
	var response = instances[req.headers['host']].move()
	setTimeout((function() {res.json(response)}), 200);
});

app.post('/refuel', function (req, res) {
	var response = instances[req.headers['host']].refuel();
	setTimeout((function() {res.json(response)}), 1500);
});

app.get('/',  function (req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/style.css', function(req, res) {
	res.sendFile(__dirname + "/style.css");
});

app.get('/updateInstance.js', function(req, res) {
	res.sendFile(__dirname + "/updateInstance.js");
});

io.on('connection', function(socket) {
	io.emit('updateInstance', (presentationData ? {"presentationData": presentationData, "presentationInstance": instances[presentationKey]} : {"presentationData": presentationTemplate, "presentationInstance": null}));
});

var server = http.listen(8081, function(){
	var port = server.address().port;
	populatePresentationTemplate();
	console.log("Lassonde Games 2020 Programming Competition listening at http://127.0.0.1:%s", port);
});
