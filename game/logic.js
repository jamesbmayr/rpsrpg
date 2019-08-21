/*** modules ***/
	var main       = require("../main/logic")
	module.exports = {}

/*** maps ***/
	var DIRECTIONS 		= main.getAsset("directions")
	var ACTIONS 		= main.getAsset("actions")
	var HEROES 			= main.getAsset("heroes")
	var MONSTERS		= main.getAsset("monsters")
	var ORBS 			= main.getAsset("orbs")
	var COLORS 			= main.getAsset("colors")
	var WALLMAKERS 		= main.getAsset("wallMakers")
	var CELLSIZE 		= main.getAsset("cellSize")
	var PORTALCOOLDOWN 	= main.getAsset("portalCooldown")
	var LOOPINTERVAL 	= main.getAsset("loopInterval")
	var MONSTERCHANCE 	= main.getAsset("monsterChance")
	var MONSTERMAX 		= main.getAsset("monsterMax")
	var MONSTERMIN 		= main.getAsset("monsterMin")
	var BUMPDISTANCE 	= main.getAsset("bumpDistance")
	var PATHINGAI 		= main.getAsset("pathingAI")
	var PROJECTILEFADE 	= main.getAsset("projectileFade")
	var ACOOLDOWN 		= main.getAsset("aCooldown")

/*** players ***/
	/* addPlayer */
		module.exports.addPlayer = addPlayer
		function addPlayer(request, callback) {
			try {
				if (!request.game) {
					callback([request.session.id], {success: false, message: "Game not found."})
				}
				else {
					// add player
						if (request.game.players[request.session.id]) {
							request.game.players[request.session.id].connected  = true
							request.game.players[request.session.id].connection = request.connection
							callback(Object.keys(request.game.observers), {success: true, names: [request.game.players[request.session.id].name]})
							callback([request.session.id], {success: true, data: request.game.data.heroes[request.session.id]})
						}

					// add observer
						else {
							request.game.observers[request.session.id] = main.getSchema("player")
							request.game.observers[request.session.id].id = request.session.id
							request.game.observers[request.session.id].connected  = true
							request.game.observers[request.session.id].connection = request.connection
						}
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* removePlayer */
		module.exports.removePlayer = removePlayer
		function removePlayer(request, callback) {
			try {
				main.logStatus("[CLOSED]: " + request.path.join("/") + " @ " + (request.ip || "?"))
				if (request.game) {
					// remove player or observer
						if (request.game.data.state.end || !request.game.data.state.start) {
							if (request.game.players[request.session.id]) {
								var name = request.game.players[request.session.id].name
								delete request.game.players[request.session.id]
							}
							else if (request.game.observers[request.session.id]) {
								delete request.game.observers[request.session.id]
							}
							callback([request.session.id], {success: true, location: "../../../../"})
							callback(Object.keys(request.game.observers), {success: true, names: [false, name]})
						}

					// disable connection
						else {
							if (request.game.players[request.session.id]) {
								request.game.players[request.session.id].connected = false
							}
							else if (request.game.observers[request.session.id]) {
								request.game.observers[request.session.id].connected = false
							}
							callback([request.session.id], {success: true, location: "../../../../"})
						}

					// delete game ?
						var remaining = Object.keys(request.game.players).filter(function (p) {
							return request.game.players[p].connected
						}) || []

						if (!remaining.length) {
							callback(Object.keys(request.game.observers), {success: true, delete: true, location: "../../../../"})
						}
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

/*** submits ***/
	/* pressInput */
		module.exports.pressInput = pressInput
		function pressInput(request, callback) {
			try {
				if (!request.game.data.state.start) {
					callback([request.session.id], {success: false, message: "Game has not started."})
				}
				else if (request.game.data.state.end) {
					callback([request.session.id], {success: false, message: "Game already ended."})
				}
				else {
					switch (true) {
						case (DIRECTIONS.includes(request.post.input)):
							triggerMove(request, callback)
						break

						case (ACTIONS.includes(request.post.input)):
							triggerAction(request, callback)
						break
					}
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* releaseInput */
		module.exports.releaseInput = releaseInput
		function releaseInput(request, callback) {
			try {
				if (!request.game.data.state.start) {
					callback([request.session.id], {success: false, message: "Game has not started."})
				}
				else if (request.game.data.state.end) {
					callback([request.session.id], {success: false, message: "Game already ended."})
				}
				else {
					switch (true) {
						case (DIRECTIONS.includes(request.post.input)):
							untriggerMove(request, callback)
						break

						case (ACTIONS.includes(request.post.input)):
							untriggerAction(request, callback)
						break
					}
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

/*** triggers ***/
	/* triggerMove */
		module.exports.triggerMove = triggerMove
		function triggerMove(request, callback) {
			try {
				var hero = request.game.data.heroes[request.session.id]
					hero.state.movement.direction = request.post.input

				switch (request.post.input) {
					case "up":
						hero.state.movement.up    = true
						hero.state.movement.down  = false
					break
					case "left":
						hero.state.movement.left  = true
						hero.state.movement.right = false
					break
					case "right":
						hero.state.movement.right = true
						hero.state.movement.left  = false
					break
					case "down":
						hero.state.movement.down  = true
						hero.state.movement.up    = false
					break
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}
		
	/* untriggerMove */
		module.exports.untriggerMove = untriggerMove
		function untriggerMove(request, callback) {
			try {
				var hero = request.game.data.heroes[request.session.id]

				switch (request.post.input) {
					case "up":
						hero.state.movement.up    = false
					break
					case "left":
						hero.state.movement.left  = false
					break
					case "right":
						hero.state.movement.right = false
					break
					case "down":
						hero.state.movement.down  = false
					break
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* triggerAction */
		module.exports.triggerAction = triggerAction
		function triggerAction(request, callback) {
			try {
				var hero = request.game.data.heroes[request.session.id]
					hero.state.actions.a = false
					hero.state.actions.b = false
					hero.state.actions.x = false
					hero.state.actions.y = false
					hero.state.actions.start = false

				switch (request.post.input) {
					case "a":
						hero.state.actions.a = true
					break
					case "b":
						hero.state.actions.b = true
					break
					case "x":
						hero.state.actions.x = true
					break
					case "y":
						hero.state.actions.y = true
					break
					case "start":
						hero.state.actions.start = true
					break
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* untriggerAction */
		module.exports.untriggerAction = untriggerAction
		function untriggerAction(request, callback) {
			try {
				var hero = request.game.data.heroes[request.session.id]
					hero.state.actions.a = false
					hero.state.actions.b = false
					hero.state.actions.x = false
					hero.state.actions.y = false
					hero.state.actions.start = false
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

/*** creates: map ***/
	/* createMap */
		module.exports.createMap = createMap
		function createMap(request, callback) {
			try {
				// set starting values
					var layer = 0
					var x = 0
					var y = 0

				// set starting arrays
					var allChambers = []
					var orbChambers = []
					var portalChambers = []
					var orbTypes = main.sortRandom(Object.keys(ORBS))
				
				// spiral to fill coordinate arrays
					while (layer < request.game.data.info.layers) {
						// coords
							var coords = x + "," + y

						// add to all chambers
							allChambers.push(coords)

						// eligible for orbs?
							if (layer == request.game.data.info.layers - 1) {
								orbChambers.push(coords)
							}

						// eligible for portals?
							else if (layer) {
								portalChambers.push(coords)
							}

						// get next coords
							var nextCoords = getNextCoords(request, allChambers, x, y, layer, callback)
								x = nextCoords.x
								y = nextCoords.y
								layer = nextCoords.layer
					}

				// pick orbChambers & portalChambers
					orbChambers = main.sortRandom(orbChambers)
					portalChambers = portalChambers.concat(orbChambers.slice(3))
					orbChambers = orbChambers.slice(0,3)
					portalChambers = main.sortRandom(portalChambers)
					portalChambers = portalChambers.slice(0,2)
					if (portalChambers.length < 2) {
						portalChambers = []
					}

				// loop through spiral to make chambers
					var chambers = request.game.data.chambers
					for (var a in allChambers) {
						// get coords
							var coords = allChambers[a].split(",")
							var x = Number(coords[0])
							var y = Number(coords[1])
							var options = {}

						// special ?
							if (x == 0 && y == 0) {
								options.temple = true
							}
							else if (orbChambers.includes(allChambers[a])) {
								options.orb = orbTypes.shift()
							}
							else if (portalChambers.includes(allChambers[a])) {
								var otherChamber = portalChambers.find(function(c) {
									return c !== allChambers[a]
								})

								options.portal = otherChamber
							}

						// monsters ?
							if (!(x == 0 && y == 0) && main.rollRandom(MONSTERCHANCE[0], MONSTERCHANCE[1])) {
								var monsterCount = main.rangeRandom(MONSTERMIN, MONSTERMAX)
								options.monsters = []

								for (var m = 0; m < monsterCount; m++) {
									var monsterType = main.chooseRandom(Object.keys(MONSTERS))
									options.monsters.push(main.duplicateObject(MONSTERS[monsterType]))
								}
							}

						// create chamber (cells, walls, doors, specials, nodemap)
							createChamber(request, Number(x), Number(y), options, callback)
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createChamber */
		module.exports.createChamber = createChamber
		function createChamber(request, chamberX, chamberY, options, callback) {
			try {
				// create chamber
					var chamber = main.getSchema("chamber")
						chamber.info.x = chamberX
						chamber.info.y = chamberY
						chamber.info.colors = COLORS[main.chooseRandom(Object.keys(COLORS))]

				// attach heroes
					chamber.heroes = request.game.data.heroes

				// add to game
					if (!request.game.data.chambers[chamberX]) {
						request.game.data.chambers[chamberX] = {}
					}
					request.game.data.chambers[chamberX][chamberY] = chamber

				// get cell limits
					var cellMinX = Math.floor(chamber.info.chamberSize / 2) * -1
					var cellMaxX = Math.floor(chamber.info.chamberSize / 2)
					var cellMinY = Math.floor(chamber.info.chamberSize / 2) * -1
					var cellMaxY = Math.floor(chamber.info.chamberSize / 2)

				// create cells
					createCells(request, chamber, cellMinX, cellMaxX, cellMinY, cellMaxY, callback)

				// create walls
					createWalls(request, chamber, cellMinX, cellMaxX, cellMinY, cellMaxY, callback)

				// create doors
					createDoors(request, chamber, cellMinX, cellMaxX, cellMinY, cellMaxY, callback)

				// specials
					if (options) {
						if (options.temple) {
							createTemple(request, chamber, callback)
						}
						else if (options.orb) {
							createOrb(request, chamber, options.orb, callback)
						}
						else if (options.portal) {
							createPortal(request, chamber, options.portal, callback)
						}

						if (options.monsters) {
							createMonsters(request, chamber, options.monsters, callback)
						}
					}

				// create nodemap
					var nodemap = {}
						nodemap.id = chamber.id
					request.game.data.nodemaps[chamber.id] = nodemap

				// neighbor connections
					var connectedCells = ["0,0"]
					var i = 0
					while (i < connectedCells.length) {
						createNeighborConnections(request, chamber, nodemap, connectedCells, connectedCells[i], callback)
						i++
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createCells */
		module.exports.createCells = createCells
		function createCells(request, chamber, cellMinX, cellMaxX, cellMinY, cellMaxY, callback) {
			try {
				// create cells
					for (var cellX = cellMinX; cellX <= cellMaxX; cellX++) {
						chamber.cells[cellX] = {}

						// loop through cells
							for (var cellY = cellMinY; cellY <= cellMaxY; cellY++) {
								// wall the edges
									chamber.cells[cellX][cellY] = {
										wall: (cellX == cellMinX || cellX == cellMaxX || cellY == cellMinY || cellY == cellMaxY)
									}
							}
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createWalls */
		module.exports.createWalls = createWalls
		function createWalls(request, chamber, cellMinX, cellMaxX, cellMinY, cellMaxY, callback) {
			try {
				// up-left
					main.chooseRandom(WALLMAKERS)(chamber.cells, cellMinX, -1, 1, cellMaxY)

				// up-right
					main.chooseRandom(WALLMAKERS)(chamber.cells, 1, cellMaxX, 1, cellMaxY)

				// down-left
					main.chooseRandom(WALLMAKERS)(chamber.cells, cellMinX, -1, cellMinY, -1)

				// down-right
					main.chooseRandom(WALLMAKERS)(chamber.cells, 1, cellMaxX, cellMinY, -1)

			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createDoors */
		module.exports.createDoors = createDoors
		function createDoors(request, chamber, cellMinX, cellMaxX, cellMinY, cellMaxY, callback) {
			try {
				// doors
					var doors = []
					var possibleDoors = main.duplicateArray(DIRECTIONS)
					var layers = request.game.data.info.layers

				// get neighbors
					if (request.game.data.chambers[chamber.info.x] && request.game.data.chambers[chamber.info.x][chamber.info.y + 1]) {
						var neighborUp = request.game.data.chambers[chamber.info.x][chamber.info.y + 1]
						var neighborUpMinY = Math.floor(neighborUp.info.chamberSize / 2) * -1
					}

					if (request.game.data.chambers[chamber.info.x - 1] && request.game.data.chambers[chamber.info.x - 1][chamber.info.y]) {
						var neighborLeft = request.game.data.chambers[chamber.info.x - 1][chamber.info.y]
						var neighborLeftMaxX = Math.floor(neighborLeft.info.chamberSize / 2)
					}

					if (request.game.data.chambers[chamber.info.x + 1] && request.game.data.chambers[chamber.info.x + 1][chamber.info.y]) {
						var neighborRight = request.game.data.chambers[chamber.info.x + 1][chamber.info.y]
						var neighborRightMinX = Math.floor(neighborRight.info.chamberSize / 2) * -1
					}

					if (request.game.data.chambers[chamber.info.x] && request.game.data.chambers[chamber.info.x][chamber.info.y - 1]) {
						var neighborDown = request.game.data.chambers[chamber.info.x][chamber.info.y - 1]
						var neighborDownMaxY = Math.floor(neighborDown.info.chamberSize / 2)
					}

				// center chamber
					if (chamber.info.x == 0 && chamber.info.y == 0) {
						doors = main.duplicateArray(DIRECTIONS)
					}

				// point chamber
					else if ((chamber.info.x == 0 && Math.abs(chamber.info.y) == layers - 1)
						  || (chamber.info.y == 0 && Math.abs(chamber.info.x) == layers - 1)) {
						if (chamber.info.x == (layers - 1)) {
							doors = ["left"]
							possibleDoors = []
						}
						else if (chamber.info.x == -1 * (layers - 1)) {
							doors = ["right"]
							possibleDoors = []
						}
						else if (chamber.info.y == (layers - 1)) {
							doors = ["down"]
							possibleDoors = []
						}
						else if (chamber.info.y == -1 * (layers - 1)) {
							doors = ["up"]
							possibleDoors = []
						}
					}

				// edge chamber
					else if (Math.abs(chamber.info.x) + Math.abs(chamber.info.y) == layers - 1) {
						if (chamber.info.x < 0 && chamber.info.y < 0) {
							doors = ["up", "right"]
							possibleDoors = []
						}
						else if (chamber.info.x > 0 && chamber.info.y < 0) {
							doors = ["up", "left"]
							possibleDoors = []
						}
						else if (chamber.info.x < 0 && chamber.info.y > 0) {
							doors = ["down", "right"]
							possibleDoors = []
						}
						else if (chamber.info.x > 0 && chamber.info.y > 0) {
							doors = ["down", "left"]
							possibleDoors = []
						}
					}

				// match neighbors
					else {
						// up (check up's down)
							if (neighborUp && neighborUp.cells[0] && neighborUp.cells[0][neighborUpMinY] && !neighborUp.cells[0][neighborUpMinY].wall) {
								doors.push("up")
							}

						// left (check left's right)
							if (neighborLeft && neighborLeft.cells[neighborLeftMaxX] && neighborLeft.cells[neighborLeftMaxX][0] && !neighborLeft.cells[0][neighborLeftMaxX].wall) {
								doors.push("left")
							}

						// right (check right's left)
							if (neighborRight && neighborRight.cells[neighborRightMinX] && neighborRight.cells[neighborRightMinX][0] && !neighborRight.cells[neighborRightMinX][0].wall) {
								doors.push("right")
							}

						// down (check down's up)
							if (neighborDown && neighborDown.cells[0] && neighborDown.cells[0][neighborDownMaxY] && !neighborDown.cells[0][neighborDownMaxY].wall) {
								doors.push("down")
							}
					}

				// random
					possibleDoors = possibleDoors.filter(function(d) {
						return (!doors.includes(d))
					})

					if (doors.length < 2 && possibleDoors.length && main.rollRandom(1, doors.length)) {
						doors.push(main.chooseRandom(possibleDoors))
					}

				// remove walls for doors
					// up
						if (doors.includes("up")) {
							chamber.cells["-1"][cellMaxY].wall = false
							chamber.cells[ "0"][cellMaxY].wall = false
							chamber.cells[ "1"][cellMaxY].wall = false

							if (neighborUp) {
								neighborUp.cells["-1"][neighborUpMinY].wall = false
								neighborUp.cells[ "0"][neighborUpMinY].wall = false
								neighborUp.cells[ "1"][neighborUpMinY].wall = false
							}
						}

					// left
						if (doors.includes("left")) {
							chamber.cells[cellMinX]["-1"].wall = false
							chamber.cells[cellMinX][ "0"].wall = false
							chamber.cells[cellMinX][ "1"].wall = false

							if (neighborLeft) {
								neighborLeft.cells[neighborLeftMaxX]["-1"].wall = false
								neighborLeft.cells[neighborLeftMaxX][ "0"].wall = false
								neighborLeft.cells[neighborLeftMaxX][ "1"].wall = false
							}
						}

					// right
						if (doors.includes("right")) {
							chamber.cells[cellMaxX]["-1"].wall = false
							chamber.cells[cellMaxX][ "0"].wall = false
							chamber.cells[cellMaxX][ "1"].wall = false

							if (neighborRight) {
								neighborRight.cells[neighborRightMinX]["-1"].wall = false
								neighborRight.cells[neighborRightMinX][ "0"].wall = false
								neighborRight.cells[neighborRightMinX][ "1"].wall = false
							}
						}

					// down
						if (doors.includes("down")) {
							chamber.cells["-1"][cellMinY].wall = false
							chamber.cells[ "0"][cellMinY].wall = false
							chamber.cells[ "1"][cellMinY].wall = false

							if (neighborDown) {
								neighborDown.cells["-1"][neighborDownMaxY].wall = false
								neighborDown.cells[ "0"][neighborDownMaxY].wall = false
								neighborDown.cells[ "1"][neighborDownMaxY].wall = false
							}
						}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createTemple */
		module.exports.createTemple = createTemple
		function createTemple(request, chamber, callback) {
			try {
				// loop through middle 5x5
					for (var x = -2; x <= 2; x++) {
						for (var y = -2; y <= 2; y++) {
							// wall the corners
								if (Math.abs(x) == 2 && Math.abs(y) == 2) {
									chamber.cells[x][y].wall = true
								}

							// clear the rest and add heal tiles
								else {
									chamber.cells[x][y].wall = false

									var healTile = createItem(request, main.getAsset("healTile"), callback)
									main.overwriteObject(healTile, {
										state: {
											position: {
												x: CELLSIZE * x,
												y: CELLSIZE * y
											}
										}
									})
									chamber.items[healTile.id] = healTile
								}
						}
					}

				// set pedestals
					var pedestals = main.getAsset("pedestals")
					for (var p in pedestals) {
						var pedestal = createItem(request, pedestals[p], callback)
						chamber.items[pedestal.id] = pedestal
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createPortal */
		module.exports.createPortal = createPortal
		function createPortal(request, chamber, destination, callback) {
			try {
				// remove 3x3 walls
					chamber.cells[-1][-1].wall = false
					chamber.cells[ 1][-1].wall = false
					chamber.cells[-1][ 1].wall = false
					chamber.cells[ 1][ 1].wall = false

				// create portal
					var portal = createItem(request, main.getAsset("portalTile"), callback)
					main.overwriteObject(portal, {
						state: {
							link: destination
						}
					})

				// add to chamber
					chamber.items[portal.id] = portal
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createNeighborConnections */
		module.exports.createNeighborConnections = createNeighborConnections
		function createNeighborConnections(request, chamber, nodemap, connectedCells, currentCell, callback) {
			try {
				// get coordinates
					var coords = currentCell.split(",")
					var x = Number(coords[0])
					var y = Number(coords[1])

				// up
					if (chamber.cells[x] && chamber.cells[x][y + 1] && !chamber.cells[x][y + 1].wall) {
						if (!connectedCells.includes((x) + "," + (y + 1))) {
							connectedCells.push((x) + "," + (y + 1))
						}
						createConnectionPaths(request, chamber, nodemap, x, y, x, y + 1, callback)
					}

				// left
					if (chamber.cells[x - 1] && chamber.cells[x - 1][y] && !chamber.cells[x - 1][y].wall) {
						if (!connectedCells.includes((x - 1) + "," + (y))) {
							connectedCells.push((x - 1) + "," + (y))
						}
						createConnectionPaths(request, chamber, nodemap, x, y, x - 1, y, callback)
					}

				// right
					if (chamber.cells[x + 1] && chamber.cells[x + 1][y] && !chamber.cells[x + 1][y].wall) {
						if (!connectedCells.includes((x + 1) + "," + (y))) {
							connectedCells.push((x + 1) + "," + (y))
						}
						createConnectionPaths(request, chamber, nodemap, x, y, x + 1, y, callback)
					}

				// down
					if (chamber.cells[x] && chamber.cells[x][y - 1] && !chamber.cells[x][y - 1].wall) {
						if (!connectedCells.includes((x) + "," + (y - 1))) {
							connectedCells.push((x) + "," + (y - 1))
						}
						createConnectionPaths(request, chamber, nodemap, x, y, x, y - 1, callback)
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}
	
	/* createConnectionPaths */
		module.exports.createConnectionPaths = createConnectionPaths
		function createConnectionPaths(request, chamber, nodemap, aX, aY, bX, bY, callback) {
			try {
				if (chamber.cells[aX] && chamber.cells[aX][aY] && chamber.cells[bX] && chamber.cells[bX][bY]) {
					// get cell A and cell B
						var coordsA = aX + "," + aY
						var coordsB = bX + "," + bY
						if (!nodemap[coordsA]) {
							nodemap[coordsA] = {} 
						}
						if (!nodemap[coordsB]) {
							nodemap[coordsB] = {} 
						}
						var cellA = nodemap[coordsA]
						var cellB = nodemap[coordsB]

					// add this A --> B path
						if (!cellA[coordsB]) {
							cellA[coordsB] = []
						}
						if (!cellA[coordsB].includes(coordsA + " > " + coordsB)) {
							cellA[coordsB].push(coordsA + " > " + coordsB)
						}

					// add this B --> A path
						if (!cellB[coordsA]) {
							cellB[coordsA] = []
						}
						if (!cellB[coordsA].includes(coordsB + " > " + coordsA)) {
							cellB[coordsA].push(coordsB + " > " + coordsA)
						}

					// loop through all Ns connected to A
						for (var coordsN in cellA) {
							if (coordsN !== coordsB) {
								// get N
									if (!nodemap[coordsN]) {
										nodemap[coordsN] = {}
									}
									var cellN = nodemap[coordsN]

								// add empty paths if necessary
									if (!cellB[coordsN]) {
										cellB[coordsN] = []
									}
									if (!cellN[coordsB]) {
										cellN[coordsB] = []
									}

								// loop through all A --> N paths
									for (var i in cellA[coordsN]) {
										var path = cellA[coordsN][i]

										if (!path.includes(coordsB)) {
											// prepend to get B --> A --> N
												path = coordsB + " > " + path
												if (!cellB[coordsN].includes(path)) {
													cellB[coordsN].push(path)
												}

											// reverse to get N --> A --> B
												var reversePath = path.split(" > ").reverse().join(" > ")
												if (!cellN[coordsB].includes(reversePath)) {
													cellN[coordsB].push(reversePath)
												}
										}
									}
							}
						}
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

/*** creates: creatures ***/
	/* createCreature */
		module.exports.createCreature = createCreature
		function createCreature(request, properties, callback) {
			try {
				// create creature
					var creature = main.getSchema("creature")
					main.overwriteObject(creature, properties)

					return creature
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createMonsters */
		module.exports.createMonsters = createMonsters
		function createMonsters(request, chamber, monsters, callback) {
			try {
				// get eligible cells
					var chamberRadius = Math.floor(chamber.info.chamberSize / 2)
					var emptyCells = []
					for (var x = -chamberRadius + 1; x <= chamberRadius - 1; x++) {
						for (var y = -chamberRadius + 1; y <= chamberRadius - 1; y++) {
							if (chamber.cells[x] && chamber.cells[x][y] && !chamber.cells[x][y].wall) {
								var itemKeys = Object.keys(chamber.items)
								if (!itemKeys.find(function(key) {
									var item = chamber.items[key]
									return ((x == Math.floor(item.state.position.x / CELLSIZE)) && (y == Math.floor(item.state.position.y / CELLSIZE)))
								})) {
									emptyCells.push(x + "," + y)
								}
							}
						}
					}
					emptyCells = main.sortRandom(emptyCells)

				// loop through monsters
					for (var m in monsters) {
						// pick a cell
							var cell = emptyCells.shift()
							var coords = cell.split(",")
							var x = Number(coords[0])
							var y = Number(coords[1])

						// create monster
							var monster = createCreature(request, monsters[m], callback)
							main.overwriteObject(monster, {
								state: {
									position: {
										x: CELLSIZE * x,
										y: CELLSIZE * y
									}
								}
							})
							chamber.creatures[monster.id] = monster
					}

			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createHero */
		module.exports.createHero = createHero
		function createHero(request, callback) {
			try {
				// get remaining heroes
					var remainingTypes = Object.keys(HEROES)
					for (var h in request.game.data.heroes) {
						remainingTypes = remainingTypes.filter(function (r) {
							return r !== request.game.data.heroes[h].info.subtype
						})
					}

					if (!remainingTypes.length) {
						callback([request.session.id], {success: false, message: "No unavailable heroes."})
						return
					}

				// create hero & add to game
					var hero = createCreature(request, HEROES[main.chooseRandom(remainingTypes)], callback)
						main.overwriteObject(hero, {
							id: request.session.id,
							info: {
								name: request.game.players[request.session.id].name
							}
						})
					request.game.data.heroes[hero.id] = hero
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

/*** creates: items ***/
	/* createItem */
		module.exports.createItem = createItem
		function createItem(request, properties, callback) {
			try {
				var item = main.getSchema("item")
				main.overwriteObject(item, properties)
				
				return item
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createOrb */
		module.exports.createOrb = createOrb
		function createOrb(request, chamber, orbType, callback) {
			try {
				// add orb to chamber
					var orb = createItem(request, ORBS[orbType], callback)
					chamber.items[orb.id] = orb
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createProjectile */
		module.exports.createProjectile = createProjectile
		function createProjectile(request, chamber, creature, callback) {
			try {
				// empty projectile
					var projectile = createItem(request, main.getSchema("projectile"), callback)

				// add creature info
					main.overwriteObject(projectile, {
						info: {
							shooter: {
								id: creature.id,
								type: creature.info.type,
								subtype: creature.info.subtype
							},
							rps: creature.info.rps,
							subtype: creature.info.subtype,
							size: {
								x: creature.info.statistics.power,
								y: creature.info.statistics.power
							},
							color: creature.info.color,
							statistics: {
								power: creature.info.statistics.power,
								speed: creature.info.statistics.throw
							}
						},
						state: {
							position: {
								x: creature.state.position.x,
								y: creature.state.position.y
							},
							movement: {
								direction: creature.state.movement.direction
							}
						}
					})

				// add to items
					chamber.items[projectile.id] = projectile
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

/*** gets ***/
	/* getNextCoords */
		module.exports.getNextCoords = getNextCoords
		function getNextCoords(request, allChambers, x, y, layer, callback) {
			try {
				// spiral up and out
					if (     !allChambers.includes((x + 1) + "," + (y - 1)) && (Math.abs(x + 1) + Math.abs(y - 1) == layer)) {
						x += 1
						y -= 1
					}
					else if (!allChambers.includes((x - 1) + "," + (y - 1)) && (Math.abs(x - 1) + Math.abs(y - 1) == layer)) {
						x -= 1
						y -= 1
					}
					else if (!allChambers.includes((x - 1) + "," + (y + 1)) && (Math.abs(x - 1) + Math.abs(y + 1) == layer)) {
						x -= 1
						y += 1
					}
					else if (!allChambers.includes((x + 1) + "," + (y + 1)) && (Math.abs(x + 1) + Math.abs(y + 1) == layer)) {
						x += 1
						y += 1
					}
					else {
						layer += 1
						y += 1
					}

				// return values
					return {
						x: x,
						y: y,
						layer: layer
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* getEdge */
		module.exports.getEdge = getEdge
		function getEdge(request, chamber, targetCoordinates, callback) {
			try {
				// get edges
					var chamberUp    =  chamber.info.chamberSize * CELLSIZE / 2
					var chamberLeft  = -chamber.info.chamberSize * CELLSIZE / 2
					var chamberRight =  chamber.info.chamberSize * CELLSIZE / 2
					var chamberDown  = -chamber.info.chamberSize * CELLSIZE / 2

				// test each size
					if (targetCoordinates.up > chamberUp) {
						return "up"
					}
					else if (targetCoordinates.left < chamberLeft) {
						return "left"
					}
					else if (targetCoordinates.right > chamberRight) {
						return "right"
					}
					else if (targetCoordinates.down < chamberDown) {
						return "down"
					}
					else {
						return null
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* getCells */
		module.exports.getCells = getCells
		function getCells(request, chamber, targetCoordinates, callback) {
			try {
				// get x and y
					var leftX 	= Math.round(Math.abs((targetCoordinates.left + 1)  / CELLSIZE)) * Math.sign(targetCoordinates.left )
						if (leftX   == -0) { leftX   = 0 }
					var centerX = Math.round(Math.abs(targetCoordinates.x           / CELLSIZE)) * Math.sign(targetCoordinates.x    )
						if (centerX == -0) { centerX = 0 }
					var rightX 	= Math.round(Math.abs((targetCoordinates.right - 1) / CELLSIZE)) * Math.sign(targetCoordinates.right)
						if (rightX  == -0) { rightX  = 0 }

					var upY 	= Math.round(Math.abs((targetCoordinates.up - 1)    / CELLSIZE)) * Math.sign(targetCoordinates.up   )
						if (upY     == -0) { upY     = 0 }
					var centerY = Math.round(Math.abs(targetCoordinates.y           / CELLSIZE)) * Math.sign(targetCoordinates.y    )
						if (centerY == -0) { centerY = 0 }
					var downY 	= Math.round(Math.abs((targetCoordinates.down + 1)  / CELLSIZE)) * Math.sign(targetCoordinates.down )
						if (downY   == -0) { downY   = 0 }

				// return cell coordinates
					return {
						upLeft: 		leftX   + "," + upY,
						upCenter: 		centerX + "," + upY,
						upRight: 		rightX  + "," + upY,
						centerLeft: 	leftX   + "," + centerY,
						centerCenter: 	centerX + "," + centerY,
						centerRight: 	rightX  + "," + centerY,
						downLeft: 		leftX   + "," + downY,
						downCenter: 	centerX + "," + downY,
						downRight: 		rightX  + "," + downY
					}
				}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* getCollisions */
		module.exports.getCollisions = getCollisions
		function getCollisions(request, chamber, targetCoordinates, callback) {
			try {
				// collisions
					var collisions = []

				// walls
					var occupiedCells = getCells(request, chamber, targetCoordinates, callback)
					for (var o in occupiedCells) {
						var coords = occupiedCells[o].split(",")
						var x = Number(coords[0])
						var y = Number(coords[1])

						if (chamber.cells[x] && chamber.cells[x][y] && chamber.cells[x][y].wall) {
							collisions.push({
								side: o,
								supertype: "wall",
								type: "wall",
								id: occupiedCells[o]
							})
						}
					}

				// heroes
					for (var h in chamber.heroes) {
						var collisionSide = getCollisionSide(request, chamber.heroes[h], targetCoordinates, callback)
						if (collisionSide) {
							collisions.push({
								side: collisionSide,
								supertype: "hero",
								type: chamber.heroes[h].info.type,
								id: chamber.heroes[h].id
							})
						}
					}

				// creatures
					for (var c in chamber.creatures) {
						var collisionSide = getCollisionSide(request, chamber.creatures[c], targetCoordinates)
						if (collisionSide) {
							collisions.push({
								side: collisionSide,
								supertype: "creature",
								type: chamber.creatures[c].info.type,
								id: chamber.creatures[c].id
							})
						}
					}

				// items
					for (var i in chamber.items) {
						var collisionSide = getCollisionSide(request, chamber.items[i], targetCoordinates)
						if (collisionSide) {
							collisions.push({
								side: collisionSide,
								supertype: "item",
								type: chamber.items[i].info.type,
								id: chamber.items[i].id
							})
						}
					}

				return collisions
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* getCollisionSide */
		module.exports.getCollisionSide = getCollisionSide
		function getCollisionSide(request, item, targetCoordinates, callback) {
			try {
				// self?
					if (item.id == targetCoordinates.id) {
						return false
					}

				// radii
					var radiusX = Math.ceil(item.info.size.x / 2)
					var radiusY = Math.ceil(item.info.size.y / 2)

					var itemUp    = item.state.position.y + radiusY
					var itemLeft  = item.state.position.x - radiusX
					var itemRight = item.state.position.x + radiusX
					var itemDown  = item.state.position.y - radiusY
				
				// collision?
					if ((itemUp    > targetCoordinates.down )
					 && (itemLeft  < targetCoordinates.right)
					 && (itemRight > targetCoordinates.left )
					 && (itemDown  < targetCoordinates.up   )) {
						// get deltas
							var deltaUp    = Math.abs(targetCoordinates.up    - itemDown )
							var deltaLeft  = Math.abs(targetCoordinates.left  - itemRight)
							var deltaRight = Math.abs(targetCoordinates.right - itemLeft )
							var deltaDown  = Math.abs(targetCoordinates.down  - itemUp   )

						// get side
							var delta = Math.min(deltaUp, deltaLeft, deltaRight, deltaDown)
							return (delta == deltaUp) ? "up" : (delta == deltaLeft) ? "left" : (delta == deltaRight) ? "right" : "down"
					}
					else {
						return null
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

/*** resolves ***/
	/* resolveEdge */
		module.exports.resolveEdge = resolveEdge
		function resolveEdge(request, chamber, creature, destination, callback) {
			try {
				// assume we keep moving
					var keepMoving = true
					var isEdge = DIRECTIONS.includes(destination)

				// other creatures are stuck in this chamber
					if (creature.info.type !== "hero") {
						// other creatures stop at edge
							if (isEdge) {
								keepMoving = false
							}
					}

				// heroes
					else {
						// save edge (or portal)
							creature.state.position.edge = destination

						// all agreed?
							var agreed = true
							for (var h in request.game.data.heroes) {
								if (request.game.data.heroes[h].state.position.edge !== destination) {
									agreed = false
								}
							}

							if (agreed) {
								// get nextChamber for edges
									if (isEdge) {
										var nextChamberX = Number(chamber.info.x) + (destination == "left" ? -1 : destination == "right" ? 1 : 0)
										var nextChamberY = Number(chamber.info.y) + (destination == "down" ? -1 : destination == "up"    ? 1 : 0)
									}

								// get nextChamber for portals
									else {
										var coords = destination.split(",")
										var nextChamberX = Number(coords[0])
										var nextChamberY = Number(coords[1])
									}

								// updateChamber
									updateChamber(request, nextChamberX, nextChamberY, isEdge, callback)
									keepMoving = false

								// reset heroes
									for (var h in request.game.data.heroes) {
										request.game.data.heroes[h].state.position.edge = null
									}
							}

						// disagree? stop at edges
							else if (isEdge) {
								keepMoving = false
							}
					}

				return keepMoving
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* resolveCollision */
		module.exports.resolveCollision = resolveCollision
		function resolveCollision(request, chamber, creature, collision, callback) {
			try {
				// set defaults
					var keepMoving = true

				// wall
					if (collision.supertype == "wall") {
						keepMoving = false
					}

				// items
					if (collision.supertype == "item" && chamber.items[collision.id]) {
						var item = chamber.items[collision.id]
						
						// tiles
							if (collision.type == "tile") {
								// healTile
									if (creature.info.type == "hero" && chamber.items[collision.id].info.subtype == "heal") {
										creature.state.health = Math.min(creature.state.healthMax, creature.state.health + main.getAsset("heal"))
									}

								// portalTile
									if (creature.info.type == "hero" && chamber.items[collision.id].info.subtype == "portal") {
										var portal = chamber.items[collision.id]
										if (portal.state.active) {
											keepMoving = resolveEdge(request, chamber, creature, portal.state.link, callback)
										}
									}
							}

						// orbs
							else if (collision.type == "orb") {
								if (creature.info.type == "hero" && creature.info.rps == chamber.items[collision.id].info.rps) {
									creature.items[collision.id] = main.duplicateObject(chamber.items[collision.id])
									delete chamber.items[collision.id]
								}
								else {
									keepMoving = false
								}
							}

						// pedestal
							else if (collision.type == "pedestal") {
								keepMoving = false

								if (creature.info.type == "hero" && creature.info.rps == chamber.items[collision.id].info.rps) {
									var itemKeys = Object.keys(creature.items)
									var orbKey = itemKeys.find(function(id) {
										return creature.items[id].info.type == "orb"
									})

									if (orbKey) {
										chamber.items[collision.id].state.active = true
										chamber.items[collision.id].info.style = "filled"
										delete creature.items[orbKey]
									}
								}
							}
					}

				// heroes & creatures
					if (collision.supertype == "hero" || collision.supertype == "creature") {
						keepMoving = false

						// get recipient
							var other = chamber[collision.supertype == "hero" ? "heroes" : "creatures"][collision.id]

						// bump them...
							var newX = other.state.position.x + (collision.side == "right" ? BUMPDISTANCE : collision.side == "left" ? -BUMPDISTANCE : 0)
							var newY = other.state.position.y + (collision.side == "up"    ? BUMPDISTANCE : collision.side == "down" ? -BUMPDISTANCE : 0)
							var radiusX = Math.ceil(other.info.size.x / 2)
							var radiusY = Math.ceil(other.info.size.y / 2)

							var bumpCoordinates = {
								id: 	other.id,
								x: 		newX,
								y: 		newY,
								up: 	newY + radiusY,
								left: 	newX - radiusX,
								right: 	newX + radiusX,
								down: 	newY - radiusY
							}

						// but only if the cells are empty
							var bumpCells = getCells(request, chamber, bumpCoordinates, callback)
							var bump = true
							for (var b in bumpCells) {
								var coords = bumpCells[b].split(",")
								var x = Number(coords[0])
								var y = Number(coords[1])

								if (!chamber.cells[x] || !chamber.cells[x][y] || chamber.cells[x][y].wall) {
									bump = false
								}
							}

							if (bump) {
								other.state.position.x = bumpCoordinates.x
								other.state.position.y = bumpCoordinates.y
							}

					}

				// stop ?
					return keepMoving

			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* resolveProjectileCollision */
		module.exports.resolveProjectileCollision = resolveProjectileCollision
		function resolveProjectileCollision(request, chamber, projectile, collision, callback) {
			try {
				// keep moving
					var keepMoving = true

				// self
					if (collision.id == projectile.info.shooter.id) {
						keepMoving = true
					}

				// wall / edge / dissipation
						else if (collision.supertype == "wall" || collision.supertype == "edge" || collision.supertype == "dissipation") {
						keepMoving = false
					}

				// items
					else if (collision.supertype == "item") {
						// tile
							if (collision.type == "tile") {
								keepMoving = true
							}

						// other
							else {
								keepMoving = false
							}
					}

				// creatures
					else if (collision.supertype == "hero" || collision.supertype == "creature") {
						keepMoving = false

						// recipient
							var recipient = chamber[collision.supertype == "hero" ? "heroes" : "creatures"][collision.id]
							var alive = resolveDamage(request, chamber, recipient, {
								power: projectile.info.statistics.power,
								rps: projectile.info.rps
							}, callback)

						// shooter
							var shooter = chamber[projectile.info.shooter.type == "hero" ? "heroes" : "creatures"][projectile.info.shooter.id]
							if (!alive && shooter) {
								shooter.state.kills++
							}
					}

					return keepMoving

			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* resolveDamage */
		module.exports.resolveDamage = resolveDamage
		function resolveDamage(request, chamber, creature, damage, callback) {
			try {
				// multiplier
					var multiplier = 1
					switch (damage.rps) {
						case "rock":
							multiplier = creature.info.rps == "scissors" ? 2 : creature.info.rps == "paper" ? 0.5 : 1
						break
						case "paper":
							multiplier = creature.info.rps == "rock" ? 2 : creature.info.rps == "scissors" ? 0.5 : 1
						break
						case "scissors":
							multiplier = creature.info.rps == "paper" ? 2 : creature.info.rps == "rock" ? 0.5 : 1
						break
					}

				// damage
					var damage = Math.max(0, Math.floor(damage.power * multiplier))

				// reduce health
					creature.state.health = Math.max(0, Math.min(creature.state.healthMax, creature.state.health - damage))
					if (creature.state.health <= 0) {
						if (creature.info.type == "hero") {
							creature.state.alive = false
						}
						else {
							delete chamber.creatures[creature.id]
						}
					}

				// return alive
					return creature.state.alive
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

/*** updates ***/
	/* updateTime */
		module.exports.updateTime = updateTime
		function updateTime(request, callback) {
			try {
				if (request.game.data.state.start) {
					// time
						request.game.data.state.time += LOOPINTERVAL

					// chamber
						var chamber = request.game.data.chambers[request.game.data.state.chamber.x][request.game.data.state.chamber.y]

					// cooldowns
						// portal
							request.game.data.state.portalCooldown = Math.max(0, request.game.data.state.portalCooldown - 1)
							updatePortals(request, chamber, request.game.data.state.portalCooldown, callback)

					// heroes
						for (var h in chamber.heroes) {
							var hero = chamber.heroes[h]
							updateHero(request, chamber, hero, callback)
						}

					// creatures
						for (var c in chamber.creatures) {
							var creature = chamber.creatures[c]
							updateCreature(request, chamber, creature, callback)
						}

					// items
						for (var i in chamber.items) {
							var item = chamber.items[i]
							updateItem(request, chamber, item, callback)
						}

					// send data
						callback(Object.keys(request.game.observers), {success: true, data: chamber})

						for (var p in request.game.players) {
							callback([p], {success: true, data: request.game.data.heroes[p]})
						}
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateChamber */
		module.exports.updateChamber = updateChamber
		function updateChamber(request, x, y, isEdge, callback) {
			try {
				if (request.game.data.chambers[x] && request.game.data.chambers[x][y]) {
					// get old
						var oldX = Number(request.game.data.state.chamber.x)
						var oldY = Number(request.game.data.state.chamber.y)
					
					// set new
						request.game.data.state.chamber.x = Number(x)
						request.game.data.state.chamber.y = Number(y)

					// flip hero positions
						if (isEdge) {
							var direction = (x !== oldX) ? "x" : "y"
							for (var h in request.game.data.heroes) {
								request.game.data.heroes[h].state.position[direction] *= -1
							}
						}

					// deactivate portals
						else {
							request.game.data.state.portalCooldown = PORTALCOOLDOWN
							updatePortals(request, request.game.data.chambers[oldX][oldY], PORTALCOOLDOWN, callback)
							updatePortals(request, request.game.data.chambers[   x][   y], PORTALCOOLDOWN, callback)
						}
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updatePortals */
		module.exports.updatePortals = updatePortals
		function updatePortals(request, chamber, cooldown, callback) {
			try {
				// loop through items to find portals
					for (var i in chamber.items) {
						var item = chamber.items[i]
						if (item.info.type == "tile" && item.info.subtype == "portal") {
							item.state.active = cooldown ? false : true
							item.info.size.x = item.info.size.y = item.info.size.max * ((PORTALCOOLDOWN - cooldown) / PORTALCOOLDOWN)
						}
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateHero */
		module.exports.updateHero = updateHero
		function updateHero(request, chamber, hero, callback) {
			try {
				// don't stop yet, but reset edge
					var move = true
					hero.state.position.edge = null

				// get target coordinates
					var newX = hero.state.position.x + (hero.state.movement.left ? -hero.info.statistics.speed : hero.state.movement.right ? hero.info.statistics.speed : 0)
					var newY = hero.state.position.y + (hero.state.movement.down ? -hero.info.statistics.speed : hero.state.movement.up    ? hero.info.statistics.speed : 0)
					var radiusX = Math.ceil(hero.info.size.x / 2)
					var radiusY = Math.ceil(hero.info.size.y / 2)

					var targetCoordinates = {
						id: 	hero.id,
						x: 		newX,
						y: 		newY,
						up: 	newY + radiusY,
						left: 	newX - radiusX,
						right: 	newX + radiusX,
						down: 	newY - radiusY
					}

				// get collisions
					var collisions = getCollisions(request, chamber, targetCoordinates, callback)
					if (collisions.length) {
						for (var c in collisions) {
							var keepMoving = resolveCollision(request, chamber, hero, collisions[c], callback)
							if (!keepMoving) { move = false }
						}
					}

				// get edges
					var edge = getEdge(request, chamber, targetCoordinates, callback)
					if (edge) {
						var keepMoving = resolveEdge(request, chamber, hero, edge, callback)
						if (!keepMoving) { move = false }
					}

				// move hero
					if (move) {
						hero.state.position.x = targetCoordinates.x
						hero.state.position.y = targetCoordinates.y
					}

				// create projectiles
					if (hero.state.actions.a && !hero.state.cooldowns.a) {
						hero.state.cooldowns.a = ACOOLDOWN
						createProjectile(request, chamber, hero, callback)
					}

				// reduce cooldowns
					for (var c in hero.state.cooldowns) {
						if (hero.state.cooldowns[c]) {
							hero.state.cooldowns[c] = Math.max(0, hero.state.cooldowns[c] - 1)
						}
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateCreature */
		module.exports.updateCreature = updateCreature
		function updateCreature(request, chamber, creature, callback) {
			try {
				// don't stop yet, but reset edge
					var move = true
					creature.state.position.edge = null

				// get path
					var cellX = Math.round(Math.abs(creature.state.position.x / CELLSIZE)) * Math.sign(creature.state.position.x)
						if (cellX == -0) { cellX = 0 }
					var cellY = Math.round(Math.abs(creature.state.position.y / CELLSIZE)) * Math.sign(creature.state.position.y)
						if (cellY == -0) { cellY = 0 }
					var path = PATHINGAI[creature.info.pathing](chamber, creature, cellX + "," + cellY, request.game.data.nodemaps[chamber.id])

				// get direction of next cell
					var nextCoords = path.split(" > ")[1] || path.split(" > ")[0]
					var nextCellCenterX = Number(nextCoords.split(",")[0]) * CELLSIZE
					var nextCellCenterY = Number(nextCoords.split(",")[1]) * CELLSIZE

					if (nextCellCenterY > creature.state.position.y) {
						creature.state.movement.up    = true
						creature.state.movement.down  = false
						creature.state.movement.direction = "up"
					}
					else if (nextCellCenterY < creature.state.position.y) {
						creature.state.movement.down  = true
						creature.state.movement.up    = false
						creature.state.movement.direction = "down"
					}
					if (nextCellCenterX > creature.state.position.x) {
						creature.state.movement.right = true
						creature.state.movement.left  = false
						creature.state.movement.direction = "right"
					}
					else if (nextCellCenterX < creature.state.position.x) {
						creature.state.movement.left  = true
						creature.state.movement.right = false
						creature.state.movement.direction = "left"
					}

				// get actual target coordinates
					var newX = creature.state.position.x + (creature.state.movement.left ? -creature.info.statistics.speed : creature.state.movement.right ? creature.info.statistics.speed : 0)
					var newY = creature.state.position.y + (creature.state.movement.down ? -creature.info.statistics.speed : creature.state.movement.up    ? creature.info.statistics.speed : 0)
					var radiusX = Math.ceil(creature.info.size.x / 2)
					var radiusY = Math.ceil(creature.info.size.y / 2)

					var targetCoordinates = {
						id: 	creature.id,
						x: 		newX,
						y: 		newY,
						up: 	newY + radiusY,
						left: 	newX - radiusX,
						right: 	newX + radiusX,
						down: 	newY - radiusY
					}

				// get collisions
					var collisions = getCollisions(request, chamber, targetCoordinates, callback)
					if (collisions.length) {
						for (var c in collisions) {
							var keepMoving = resolveCollision(request, chamber, creature, collisions[c], callback)
							if (!keepMoving) { move = false }
						}
					}

				// get edges
					var edge = getEdge(request, chamber, targetCoordinates, callback)
					if (edge) {
						var keepMoving = resolveEdge(request, chamber, creature, edge, callback)
						if (!keepMoving) { move = false }
					}

				// move creature
					if (move) {
						creature.state.position.x = targetCoordinates.x
						creature.state.position.y = targetCoordinates.y
					}

				// create projectiles
					if (!creature.state.cooldowns.a && main.rollRandom(1,3)) {
						creature.state.cooldowns.a = ACOOLDOWN
						createProjectile(request, chamber, creature, callback)
					}

				// reduce cooldowns
					for (var c in creature.state.cooldowns) {
						if (creature.state.cooldowns[c]) {
							creature.state.cooldowns[c] = Math.max(0, creature.state.cooldowns[c] - 1)
						}
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateItem */
		module.exports.updateItem = updateItem
		function updateItem(request, chamber, item, callback) {
			try {
				// no speed
					if (!item.info || !item.info.statistics || !item.info.statistics.speed) {
						return
					}

				// no active direction
					else if (!item.state || !item.state.movement || !item.state.movement.direction) {
						return
					}

				// projectiles
					else if (item.info.type == "projectile") {
						// set move
							var move = true

						// no power?
							if (item.info.statistics.power <= 0) {
								var keepMoving = resolveProjectileCollision(request, chamber, item, {
									side: null,
									supertype: "dissipation",
									type: "dissipation",
									id: null
								}, callback)
								if (!keepMoving) { move = false }
							}

						// still has power
							else {
								// target coordinates
									var speed = item.info.statistics.speed
									var direction = item.state.movement.direction
									var newX = item.state.position.x + (direction == "left" ? -speed : direction == "right" ? speed : 0)
									var newY = item.state.position.y + (direction == "down" ? -speed : direction == "up"    ? speed : 0)
									var radiusX = Math.ceil(item.info.size.x / 2)
									var radiusY = Math.ceil(item.info.size.y / 2)

									var targetCoordinates = {
										id: 	item.id,
										x: 		newX,
										y: 		newY,
										up: 	newY + radiusY,
										left: 	newX - radiusX,
										right: 	newX + radiusX,
										down: 	newY - radiusY
									}

								// collisions
									var collisions = getCollisions(request, chamber, targetCoordinates, callback)
									if (collisions.length) {
										for (var c in collisions) {
											var keepMoving = resolveProjectileCollision(request, chamber, item, collisions[c], callback)
											if (!keepMoving) { move = false }
										}
									}

								// get edges
									var edge = getEdge(request, chamber, targetCoordinates, callback)
									if (edge) {
										var keepMoving = resolveProjectileCollision(request, chamber, item, {
											side: null,
											supertype: "edge",
											type: "edge",
											id: null
										}, callback)
										if (!keepMoving) { move = false }
									}
							}

						// move item & diminish its size
							if (move) {
								item.state.position.x = targetCoordinates.x
								item.state.position.y = targetCoordinates.y
								item.info.statistics.power -= PROJECTILEFADE
								item.info.size.x -= PROJECTILEFADE
								item.info.size.y -= PROJECTILEFADE
							}

						// or else delete it
							else {
								delete chamber.items[item.id]
							}
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}
