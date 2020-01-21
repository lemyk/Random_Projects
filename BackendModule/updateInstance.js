locationY_VH = function(currentY, roomDim) {
	var topPos = (94 - currentY * (94/roomDim));
	topPos = topPos + 'vh';

	return topPos;
}

locationX_VW = function(currentX, roomDim) {
	var leftPos = (currentX * (72/roomDim));
	leftPos = leftPos + 'vw';

	return leftPos;
}

updateInstance = function(payload) {
	var data = payload["presentationData"];
	var instance = payload["presentationInstance"];
	var isRunning = instance != null;
	// var displayDim = data.length;
	// var displayDimPerc = 100 / displayDim;
	var roomDim = 24;

	// Rocket Location & Orientation
	var currentX = isRunning ? instance.location.x : 0;
	var currentY = isRunning ? instance.location.y : 0;
	var direction = isRunning ? instance.direction : "N";
	var didYouGoBoom = isRunning ? instance.didYouGoBoom : false;
	var fuelNegative = isRunning ? instance.fuelNegative : false;
	var finished = isRunning ? instance.finished : false;
	var rotation = 0;
	var scaleX = 1;
	if (direction == "S") {
		rotation = 90;
	} else if (direction == "W") {
		rotation = 0;
		scaleX = -1
	} else if (direction == "N"){
		rotation = 270;
	}
	var rocketTopPos = locationY_VH(currentY, roomDim);
	var rocketLeftPos = locationX_VW(currentX, roomDim);

	// Mars Orientation
	var marsX = isRunning ? data["Mars"].x : 20;
	var marsY = isRunning ? data["Mars"].y : 21;
	var marsTopPos = locationY_VH(marsX + 1, roomDim);
	var marsLeftPos = locationX_VW(marsY - 1, roomDim);

	// Station 1 Location
	var station1X = isRunning ? data["Station1"].x : 4;
	var station1Y = isRunning ? data["Station1"].y : 10;
	var station1TopPos = locationY_VH(station1Y, roomDim);
	var station1LeftPos = locationX_VW(station1X, roomDim);

	// Station 2 Location
	var station2X = isRunning ? data["Station2"].x : 18;
	var station2Y = isRunning ? data["Station2"].y : 13;
	var station2TopPos = locationY_VH(station2Y, roomDim);
	var station2LeftPos = locationX_VW(station2X, roomDim);

	var asteroidImages = ["http://icons.iconarchive.com/icons/zairaam/bumpy-planets/256/asteroid-icon.png",
	"https://media.nationalgeographic.org/assets/interactives/433/90b/43390b12-c7c2-450e-94de-ac2e04b52359/public/splash/images/asteroid.png",
	"https://vignette.wikia.nocookie.net/bsgoguide/images/0/0e/Asteroid.png/revision/latest?cb=20140526003102",
	"http://www.pngmart.com/files/4/Asteroid-PNG-Photos.png",
	"https://cdn.shopify.com/s/files/1/1048/8552/products/asteroid_rod1_4559fee5-c3c6-4547-904a-3205eee7d8df_grande.png?v=1527868549"
	];
	
	var asteroids = '';
	data["Asteroids"].forEach((asteroid) => {
		var asteroidTopPos = locationY_VH(asteroid.y, roomDim);
		var asteroidLeftPos = locationX_VW(asteroid.x, roomDim);
		asteroids += '<img class="display-asteroid" src="' + asteroidImages[asteroid.type] + '" style="top: ' + asteroidTopPos +'; left:' + asteroidLeftPos + '"/>';
	});
	var marsImage = '<img class="display-mars" src="https://www.pngkit.com/png/full/4-46060_planet-mars-covered-in-green-vines-planet-mars.png"style="top: ' + marsTopPos +'; left:' + marsLeftPos + '"/>';
	var station1Image = '<img class="display-station" src="http://img.clipartlook.com/tesla-clipart-black-tesla-model-s-clipart-signature-red-model-s-6674.png" style="top: ' + station1TopPos +'; left:' + station1LeftPos + '"/>';
	var station2Image = '<img class="display-station" src="https://i.ya-webdesign.com/images/satellite-clipart-space-technology-8.png" style="top: ' + station2TopPos +'; left:' + station2LeftPos + '"/>';
	var rocketship = didYouGoBoom ? '<img id="explosion" src="https://purepng.com/public/uploads/large/purepng.com-explosion-clipart-pngwarweaponsdanger-401520362385cfudt.png">':
	'<img id="rocketship" src="https://www.stickpng.com/assets/images/5a1887948d421802430d2d07.png" style="transform: rotate(' + rotation +'deg) scaleX('+ scaleX + ') ">';
	var skyBackground = '<img id="display-sky-background" src="https://i.redd.it/1htvyw5zhum11.png"/>'
	var displayBoardHTML = '';
	displayBoardHTML += '<div id="full-screen-display">'
		// Left Screen Display
		displayBoardHTML += '<div id="left-screen">'
			displayBoardHTML += '<div id="image-background">'
				displayBoardHTML += skyBackground;
				displayBoardHTML += marsImage;
				displayBoardHTML += station1Image;
				displayBoardHTML += station2Image;
				displayBoardHTML += asteroids;
			displayBoardHTML += '</div>'
			displayBoardHTML += '<div id="rocket-wrapper" style="top: ' + rocketTopPos +'; left:' + rocketLeftPos + '">'
				displayBoardHTML += rocketship;
			displayBoardHTML += '</div>'
		displayBoardHTML += '</div>'

		// Right Screen Display
		displayBoardHTML += '<div id="right-screen">'
			displayBoardHTML += '<p id="title-content">Spaceship Dashboard</p>'
				displayBoardHTML += '<p id="dashboard-content">Direction: ' + (isRunning ? instance.direction : "N") + '</p>';
				displayBoardHTML += '<div id=line>';
				displayBoardHTML +='<div id="dashboard-content">Landed on Mars: </div>';
				displayBoardHTML += '<div id=square style="background-color: ' + (finished ? 'green': 'red') +'"></div>';
				displayBoardHTML += '</div>';
				displayBoardHTML += '<p id="dashboard-content">Time Spent: ' + (isRunning ? instance.timeSpent.toString() : 0) + '</p>';
				displayBoardHTML += '<p id="dashboard-content">Fuel Amount: ' + (isRunning ? instance.fuelAmount : 0) + '/'+'30</p>';
				displayBoardHTML += '<div id=line>';
				displayBoardHTML +='<div id="dashboard-content">Fuel Above Zero: </div>';
				displayBoardHTML += '<div id=square style="background-color: ' + (fuelNegative ? 'red': 'green') +'"></div>';
				displayBoardHTML += '</div>';
				displayBoardHTML += '<img id="LGLogo" src="https://i.ibb.co/q1BdC9y/lg-logo-white-02.png"/>'
			displayBoardHTML += '</div>';
	displayBoardHTML += '</div>'
	

	return displayBoardHTML;
}