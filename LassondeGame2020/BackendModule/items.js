class Item {
	constructor(id, x, y, type) {
		this.id = id;
		this.x = x;
		this.y = y;
		this.type = type;
	}
}

exports.itemsCount = function(items, type) {
	return 10;
}

exports.asteroidItems = [
	new Item(0, 2, 3, 0),
	new Item(1, 3, 4, 3),
	new Item(2, 0, 5, 2),
	new Item(3, 6, 16, 4),
	new Item(4, 17, 9, 3),
	new Item(5, 8, 2, 3),
	new Item(6, 9, 7, 0),
	new Item(7, 13, 15, 1),
	new Item(8, 4, 17, 1),
	new Item(9, 18, 15, 0),
	new Item(10, 12, 20, 2),
	new Item(11, 20, 3, 3),
	new Item(12, 14, 7, 4),
	new Item(13, 2, 22, 0)
]
