/*** modules ***/
	var main       = require("../main/logic")
	module.exports = {}

/*** maps ***/
	var CONSTANTS 	= main.getAsset("constants")
	var WALLMAKERS 	= main.getAsset("wallMakers")
	var PATHINGAI 	= main.getAsset("pathingAI")
	var MONSTERS 	= main.getAsset("monsters")

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
								delete request.game.players[request.session.id]
							}
							else if (request.game.observers[request.session.id]) {
								delete request.game.observers[request.session.id]
							}
							callback([request.session.id], {success: true, location: "../../../../"})
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
						case (CONSTANTS.directions.includes(request.post.input)):
							triggerMove(request, callback)
						break

						case (CONSTANTS.actions.includes(request.post.input)):
							triggerAction(request, callback)
						break

						case (request.post.input == "start"):
							triggerPause(request, callback)
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
						case (CONSTANTS.directions.includes(request.post.input)):
							untriggerMove(request, callback)
						break

						case (CONSTANTS.actions.includes(request.post.input)):
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

				switch (request.post.input) {
					case "a":
						hero.state.actions.a = true
					break
					case "b":
						hero.state.actions.b = true
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
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* triggerPause */
		module.exports.triggerPause = triggerPause
		function triggerPause(request, callback) {
			try {
				request.game.data.state.paused = !request.game.data.state.paused
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
					var specialChambers = []
				
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

						// eligible for specials?
							else if (layer) {
								specialChambers.push(coords)
							}

						// get next coords
							var nextCoords = getNextCoords(request, allChambers, x, y, layer, callback)
								x = nextCoords.x
								y = nextCoords.y
								layer = nextCoords.layer
					}

				// pick orbChambers
					orbChambers = main.sortRandom(orbChambers)
					var orbTypes = main.sortRandom(CONSTANTS.rps)
					specialChambers = specialChambers.concat(orbChambers.slice(orbTypes.length))
					orbChambers = orbChambers.slice(0, orbTypes.length)

				// pick shrineChambers
					specialChambers = main.sortRandom(specialChambers)
					var shrineTypes = main.sortRandom(CONSTANTS.rps)
					var shrineChambers = specialChambers.slice(0, shrineTypes.length)

				// pick portalChambers
					var portalChambers = specialChambers.slice(shrineTypes.length, shrineTypes.length + CONSTANTS.portalPairs * 2)
					var portalsNeeded = CONSTANTS.portalPairs * 2
					var portalPairs = {}

					if (portalChambers.length >= 2 && portalsNeeded >= 2) {
						while (portalChambers.length < portalsNeeded) {
							portalsNeeded -= 2
						}

						var portalsPlaced = 0
						while (portalsPlaced < portalsNeeded) {
							portalPairs[portalChambers[portalsPlaced]] = portalChambers[portalsPlaced + 1]
							portalPairs[portalChambers[portalsPlaced + 1]] = portalChambers[portalsPlaced]
							portalsPlaced += 2
						}
					}

				// pick spawnChambers
					var spawnTypes = main.sortRandom(CONSTANTS.rps)
					var spawnChambers = specialChambers.slice(shrineTypes.length + CONSTANTS.portalPairs * 2)

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
							else if (shrineChambers.includes(allChambers[a])) {
								options.shrine = shrineTypes.shift()
							}
							else if (portalPairs[allChambers[a]]) {
								options.portal = portalPairs[allChambers[a]]
							}
							else if (spawnChambers.includes(allChambers[a]) && main.rollRandom(CONSTANTS.spawnChance[0], CONSTANTS.spawnChance[1])) {
								options.spawn = main.chooseRandom(spawnTypes)
							}

						// monsters ?
							if (!(x == 0 && y == 0) && main.rollRandom(CONSTANTS.monsterChance[0], CONSTANTS.monsterChance[1])) {
								var monsterCount = main.rangeRandom(CONSTANTS.monsterCountMin, CONSTANTS.monsterCountMax)
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
						chamber.info.colors = CONSTANTS.colors[main.chooseRandom(Object.keys(CONSTANTS.colors))]

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
						else if (options.shrine) {
							createShrine(request, chamber, options.shrine, callback)
						}
						else if (options.portal) {
							createPortal(request, chamber, options.portal, callback)
						}
						else if (options.spawn) {
							createSpawn(request, chamber, options.spawn, callback)
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
					var possibleDoors = main.duplicateArray(CONSTANTS.directions)
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
						doors = main.duplicateArray(CONSTANTS.directions)
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
							if (neighborLeft && neighborLeft.cells[neighborLeftMaxX] && neighborLeft.cells[neighborLeftMaxX][0] && !neighborLeft.cells[neighborLeftMaxX][0].wall) {
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

/*** creates: tiles ***/
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

							// clear the rest and add heals
								else {
									chamber.cells[x][y].wall = false

									var heal = createItem(request, main.getAsset("heal"), callback)
									main.overwriteObject(heal, {
										state: {
											position: {
												x: CONSTANTS.cellSize * x,
												y: CONSTANTS.cellSize * y
											}
										}
									})
									chamber.items[heal.id] = heal
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
				// clear 3x3 area
					var quarterChamber = Math.floor(CONSTANTS.chamberSize / 4)
					var portalX = main.rangeRandom(-quarterChamber, quarterChamber)
					var portalY = main.rangeRandom(-quarterChamber, quarterChamber)

					for (var x = portalX - 1; x <= portalX + 1; x++) {
						for (var y = portalY - 1; y <= portalY + 1; y++) {
							chamber.cells[x][y].wall = false
						}
					}

				// create portal
					var portal = createItem(request, main.getAsset("portal"), callback)
					main.overwriteObject(portal, {
						state: {
							link: destination,
							position: {
								x: portalX * CONSTANTS.cellSize,
								y: portalY * CONSTANTS.cellSize,
							}
						}
					})

				// add to chamber
					chamber.items[portal.id] = portal
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createShrine */
		module.exports.createShrine = createShrine
		function createShrine(request, chamber, shrineType, callback)  {
			try {
				// clear 3x3 area
					var quarterChamber = Math.floor(CONSTANTS.chamberSize / 4)
					var shrineX = main.rangeRandom(-quarterChamber, quarterChamber)
					var shrineY = main.rangeRandom(-quarterChamber, quarterChamber)

					for (var x = shrineX - 1; x <= shrineX + 1; x++) {
						for (var y = shrineY - 1; y <= shrineY + 1; y++) {
							chamber.cells[x][y].wall = false
						}
					}

				// create shrine
					var shrine = createItem(request, main.getAsset("shrine"), callback)
					main.overwriteObject(shrine, {
						info: {
							subtype: shrineType,
							color: main.getAsset("orbs")[shrineType].info.color
						},
						state: {
							position: {
								x: shrineX * CONSTANTS.cellSize,
								y: shrineY * CONSTANTS.cellSize,
							}
						}
					})
				
				// add to chamber
					chamber.items[shrine.id] = shrine
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createSpawn */
		module.exports.createSpawn = createSpawn
		function createSpawn(request, chamber, spawnType, callback) {
			try {
				// clear 3x3 area
					var quarterChamber = Math.floor(CONSTANTS.chamberSize / 4)
					var spawnX = main.rangeRandom(-quarterChamber, quarterChamber)
					var spawnY = main.rangeRandom(-quarterChamber, quarterChamber)

					for (var x = spawnX - 1; x <= spawnX + 1; x++) {
						for (var y = spawnY - 1; y <= spawnY + 1; y++) {
							chamber.cells[x][y].wall = false
						}
					}

				// get monsterTypes
					var monsterTypes = []
					for (var m in MONSTERS) {
						if (MONSTERS[m].info.rps == spawnType) {
							monsterTypes.push(m)
						}
					}

				// create spawn
					var spawn = createItem(request, main.getAsset("spawn"), callback)
					main.overwriteObject(spawn, {
						info: {
							rps: spawnType,
							subtype: spawnType,
							color: main.getAsset("orbs")[spawnType].info.color,
							monsterTypes: monsterTypes
						},
						state: {
							position: {
								x: spawnX * CONSTANTS.cellSize,
								y: spawnY * CONSTANTS.cellSize,
							}
						}
					})
				
				// add to chamber
					chamber.items[spawn.id] = spawn
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
				// clear 3x3 area
					var quarterChamber = Math.floor(CONSTANTS.chamberSize / 4)
					var orbX = main.rangeRandom(-quarterChamber, quarterChamber)
					var orbY = main.rangeRandom(-quarterChamber, quarterChamber)

					for (var x = orbX - 1; x <= orbX + 1; x++) {
						for (var y = orbY - 1; y <= orbY + 1; y++) {
							chamber.cells[x][y].wall = false
						}
					}

				// create orb
					var orb = createItem(request, main.getAsset("orbs")[orbType], callback)
					main.overwriteObject(orb, {
						state: {
							position: {
								x: orbX * CONSTANTS.cellSize,
								y: orbY * CONSTANTS.cellSize
							}
						}
					})

				// add to chamber
					chamber.items[orb.id] = orb
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createRangeAttack */
		module.exports.createRangeAttack = createRangeAttack
		function createRangeAttack(request, chamber, creature, callback) {
			try {
				// empty attack
					var attack = createItem(request, main.getSchema("attack"), callback)

				// add creature info
					var power = creature.info.statistics.rangePower * (creature.state.effects.rock ? CONSTANTS.rockMultiplier : 1)
					main.overwriteObject(attack, {
						info: {
							type: "rangeAttack",
							attacker: {
								id: creature.id,
								type: creature.info.type,
								subtype: creature.info.subtype
							},
							rps: creature.info.rps,
							subtype: creature.info.subtype,
							size: {
								x: power,
								y: power
							},
							color: creature.info.color,
							statistics: {
								power: power,
								speed: creature.info.statistics.rangeSpeed
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
					chamber.items[attack.id] = attack
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createAreaAttack */
		module.exports.createAreaAttack = createAreaAttack
		function createAreaAttack(request, chamber, creature, callback) {
			try {
				// empty attack
					var attack = createItem(request, main.getSchema("attack"), callback)

				// add creature info
					var power = creature.info.statistics.areaPower * (creature.state.effects.rock ? CONSTANTS.rockMultiplier : 1)
					main.overwriteObject(attack, {
						info: {
							type: "areaAttack",
							attacker: {
								id: creature.id,
								type: creature.info.type,
								subtype: creature.info.subtype
							},
							rps: creature.info.rps,
							subtype: creature.info.subtype,
							size: {
								x: CONSTANTS.areaAttackRadius * power,
								y: CONSTANTS.areaAttackRadius * power
							},
							color: creature.info.color,
							statistics: {
								power: power
							}
						},
						state: {
							position: {
								x: creature.state.position.x,
								y: creature.state.position.y
							}
						}
					})

				// add to items
					chamber.items[attack.id] = attack
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
									return ((x == Math.floor(item.state.position.x / CONSTANTS.cellSize)) && (y == Math.floor(item.state.position.y / CONSTANTS.cellSize)))
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
										x: CONSTANTS.cellSize * x,
										y: CONSTANTS.cellSize * y
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
				// get all heroes
					var heroes = main.getAsset("heroes")

				// get remaining heroes
					var remainingTypes = Object.keys(heroes)
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
					var hero = createCreature(request, heroes[main.chooseRandom(remainingTypes)], callback)
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

	/* getCells */
		module.exports.getCells = getCells
		function getCells(request, chamber, targetCoordinates, callback) {
			try {
				// get x and y
					var leftX 	= Math.round(Math.abs((targetCoordinates.x - targetCoordinates.radiusX + 1) / CONSTANTS.cellSize)) * Math.sign(targetCoordinates.x)
						if (leftX   == -0) { leftX   = 0 }
					var centerX = Math.round(Math.abs( targetCoordinates.x           / CONSTANTS.cellSize)) * Math.sign(targetCoordinates.x)
						if (centerX == -0) { centerX = 0 }
					var rightX 	= Math.round(Math.abs((targetCoordinates.x + targetCoordinates.radiusX - 1) / CONSTANTS.cellSize)) * Math.sign(targetCoordinates.x)
						if (rightX  == -0) { rightX  = 0 }

					var upY 	= Math.round(Math.abs((targetCoordinates.y + targetCoordinates.radiusY - 1) / CONSTANTS.cellSize)) * Math.sign(targetCoordinates.y)
						if (upY     == -0) { upY     = 0 }
					var centerY = Math.round(Math.abs( targetCoordinates.y           / CONSTANTS.cellSize)) * Math.sign(targetCoordinates.y)
						if (centerY == -0) { centerY = 0 }
					var downY 	= Math.round(Math.abs((targetCoordinates.y - targetCoordinates.radiusY + 1) / CONSTANTS.cellSize)) * Math.sign(targetCoordinates.y)
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

	/* getCollisionSide */
		module.exports.getCollisionSide = getCollisionSide
		function getCollisionSide(request, thing, targetCoordinates, callback) {
			try {
				// self?
					if (thing.id == targetCoordinates.id) {
						return false
					}

				// radii / position
					var radiusX = Math.ceil(thing.info.size.x / 2)
					var radiusY = Math.ceil(thing.info.size.y / 2)
					var positionX = thing.state.position.x
					var positionY = thing.state.position.y

				// sides
					var thingUp    = positionY + radiusY
					var thingLeft  = positionX - radiusX
					var thingRight = positionX + radiusX
					var thingDown  = positionY - radiusY
				
				// collision?
					if ((thingUp    > targetCoordinates.y - targetCoordinates.radiusY)
					 && (thingLeft  < targetCoordinates.x + targetCoordinates.radiusX)
					 && (thingRight > targetCoordinates.x - targetCoordinates.radiusX)
					 && (thingDown  < targetCoordinates.y + targetCoordinates.radiusY)) {
						// get deltas
							var deltaUp    = Math.abs(targetCoordinates.y + targetCoordinates.radiusY - thingDown )
							var deltaLeft  = Math.abs(targetCoordinates.x - targetCoordinates.radiusX - thingRight)
							var deltaRight = Math.abs(targetCoordinates.x + targetCoordinates.radiusX - thingLeft )
							var deltaDown  = Math.abs(targetCoordinates.y - targetCoordinates.radiusY - thingUp   )

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
	/* resolveEdges */
		module.exports.resolveEdges = resolveEdges
		function resolveEdges(request, chamber, thing, targetCoordinates, callback) {
			try {
				// get edges
					var chamberUp    =  chamber.info.chamberSize * CONSTANTS.cellSize / 2
					var chamberLeft  = -chamber.info.chamberSize * CONSTANTS.cellSize / 2
					var chamberRight =  chamber.info.chamberSize * CONSTANTS.cellSize / 2
					var chamberDown  = -chamber.info.chamberSize * CONSTANTS.cellSize / 2

				// test each size
					if (targetCoordinates.y + targetCoordinates.radiusY > chamberUp) {
						var edge = "up"
					}
					else if (targetCoordinates.x - targetCoordinates.radiusX < chamberLeft) {
						var edge = "left"
					}
					else if (targetCoordinates.x + targetCoordinates.radiusX > chamberRight) {
						var edge = "right"
					}
					else if (targetCoordinates.y - targetCoordinates.radiusY < chamberDown) {
						var edge = "down"
					}
					else {
						var edge = null
					}

				// resolve edge
					if (!edge) {
						return targetCoordinates
					}
					else {
						return resolveEdge(request, chamber, thing, targetCoordinates, edge, callback)
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* resolveEdge */
		module.exports.resolveEdge = resolveEdge
		function resolveEdge(request, chamber, thing, targetCoordinates, destination, callback) {
			try {
				// is edge? (or portal)
					var isEdge = CONSTANTS.directions.includes(destination)
					var collision = {
						side: null
					}

				// other things are stuck in this chamber
					if (thing.info.type !== "hero") {
						// other things stop at edge
							if (isEdge) {
								collision.side = destination
							}
					}

				// heroes
					else {
						// save edge (or portal)
							thing.state.position.edge = destination

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
										collision.side = destination
									}

								// get nextChamber for portals
									else {
										var coords = destination.split(",")
										var nextChamberX = Number(coords[0])
										var nextChamberY = Number(coords[1])
									}

								// updateNextChamber
									updateNextChamber(request, nextChamberX, nextChamberY, isEdge, callback)

								// reset heroes
									for (var h in request.game.data.heroes) {
										request.game.data.heroes[h].state.position.edge = null
									}
							}

						// disagree? stop at edges
							else if (isEdge) {
								collision.side = destination
							}
					}

				// collision side ?
					if (collision.side) {
						// chamber radius
							var chamberRadius = Math.ceil(chamber.info.cellSize * chamber.info.chamberSize / 2)

						// pseudoWall
							var pseudoWall = {
								info: {
									size: {
										x: (destination == "up"    || destination == "down") ? chamberRadius : 0,
										y: (destination == "right" || destination == "left") ? chamberRadius : 0
									}
								},
								state: {
									position: {
										x: (destination == "left" ? -chamberRadius : chamberRadius),
										y: (destination == "down" ? -chamberRadius : chamberRadius)
									}
								}
							}
						
						// stop
							targetCoordinates = resolveStop(request, targetCoordinates, collision, pseudoWall, callback)
					}

				// return
					return targetCoordinates
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* resolveWalls */
		module.exports.resolveWalls = resolveWalls
		function resolveWalls(request, chamber, thing, targetCoordinates, callback) {
			try {
				// walls
					var occupiedCells = getCells(request, chamber, targetCoordinates, callback)
					for (var o in occupiedCells) {
						var coords = occupiedCells[o].split(",")
						var cellX = Number(coords[0])
						var cellY = Number(coords[1])

						if (chamber.cells[cellX] && chamber.cells[cellX][cellY] && chamber.cells[cellX][cellY].wall) {
							targetCoordinates = resolveWall(request, chamber, thing, targetCoordinates, cellX, cellY, callback)
						}
					}

				// return
					return targetCoordinates
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* resolveWall */
		module.exports.resolveWall = resolveWall
		function resolveWall(request, chamber, thing, targetCoordinates, cellX, cellY, callback) {
			try {
				// wall
					var wall = {
						info: {
							size: {
								x: chamber.info.cellSize,
								y: chamber.info.cellSize
							}
						},
						state: {
							position: {
								x: chamber.info.cellSize * cellX,
								y: chamber.info.cellSize * cellY
							}
						}
					}

				// side
					var collision = {
						side: getCollisionSide(request, wall, targetCoordinates, callback)
					}

				// coordinates
					targetCoordinates = resolveStop(request, targetCoordinates, collision, wall, callback)

				// return
					return targetCoordinates
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* resolveCollisions */
		module.exports.resolveCollisions = resolveCollisions
		function resolveCollisions(request, chamber, thing, targetCoordinates, callback) {
			try {
				// heroes
					for (var h in chamber.heroes) {
						var collisionSide = getCollisionSide(request, chamber.heroes[h], targetCoordinates, callback)
						if (collisionSide) {
							targetCoordinates = resolveCollision(request, chamber, thing, targetCoordinates, {
								side: collisionSide,
								supertype: "hero",
								type: chamber.heroes[h].info.type,
								id: chamber.heroes[h].id
							}, callback)
						}
					}

				// creatures
					for (var c in chamber.creatures) {
						var collisionSide = getCollisionSide(request, chamber.creatures[c], targetCoordinates, callback)
						if (collisionSide) {
							targetCoordinates = resolveCollision(request, chamber, thing, targetCoordinates, {
								side: collisionSide,
								supertype: "creature",
								type: chamber.creatures[c].info.type,
								id: chamber.creatures[c].id
							}, callback)
						}
					}

				// items
					for (var i in chamber.items) {
						if (chamber.items[i].info.type !== "rangeAttack" && chamber.items[i].info.type !== "areaAttack") { // attacks don't interact with other attacks
							var collisionSide = getCollisionSide(request, chamber.items[i], targetCoordinates, callback)
							if (collisionSide) {
								targetCoordinates = resolveCollision(request, chamber, thing, targetCoordinates, {
									side: collisionSide,
									supertype: "item",
									type: chamber.items[i].info.type,
									id: chamber.items[i].id
								}, callback)
							}
						}
					}

				// return
					return targetCoordinates
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* resolveCollision */
		module.exports.resolveCollision = resolveCollision
		function resolveCollision(request, chamber, thing, targetCoordinates, collision, callback) {
			try {
				// items
					if (collision.supertype == "item" && chamber.items[collision.id]) {
						var item = chamber.items[collision.id]
						
						// heal
							if (item.info.type == "heal" && thing.info.type == "hero") {
								thing.state.effects.heal = true
							}

						// shrine
							else if (item.info.type == "shrine" && thing.info.type == "hero" && thing.state.alive) {
								if (!item.state.cooldowns.activate) {
									thing.state.effects[item.info.subtype] = CONSTANTS.effectCooldown
									item.state.cooldowns.activate = CONSTANTS.shrineCooldown
									item.info.size.x = item.info.size.y = 0
								}
							}

						// portal
							else if (item.info.type == "portal" && thing.info.type == "hero" && thing.state.alive) {
								if (!item.state.cooldowns.activate) {
									targetCoordinates = resolveEdge(request, chamber, thing, targetCoordinates, item.state.link, callback)
								}
							}

						// orbs
							else if (item.info.type == "orb" && ["hero", "monster", "creature"].includes(thing.info.type) && thing.state.alive) {
								// collect orb
									if (thing.info.type == "hero" && thing.info.rps == chamber.items[item.id].info.rps) {
										thing.items[item.id] = main.duplicateObject(chamber.items[item.id])
										delete chamber.items[item.id]
									}

								// stop movement
									else {
										targetCoordinates = resolveStop(request, targetCoordinates, collision, item, callback)
									}
							}

						// pedestal
							else if (item.info.type == "pedestal" && ["hero", "monster", "creature"].includes(thing.info.type) && thing.state.alive) {
								// deposit orb
									if (thing.info.type == "hero" && thing.info.rps == chamber.items[item.id].info.rps) {
										var itemKeys = Object.keys(thing.items)
										var orbKey = itemKeys.find(function(id) {
											return thing.items[id].info.type == "orb"
										})

										if (orbKey) {
											chamber.items[item.id].state.active = true
											chamber.items[item.id].info.style = "filled"
											delete thing.items[orbKey]
										}
									}

								// stop movement
									targetCoordinates = resolveStop(request, targetCoordinates, collision, item, callback)
							}
					}

				// bumpAttacks (other heroes / creatures)
					if (["hero", "monster", "creature"].includes(thing.info.type) && thing.state.alive && (collision.supertype == "hero" || collision.supertype == "creature" || collision.type == "spawn")) {
						targetCoordinates = resolveAttackCollision(request, chamber, thing, targetCoordinates, collision, callback)
					}

				// rangeAttacks
					else if (thing.info.type == "rangeAttack" && (collision.supertype == "hero" || collision.supertype == "creature" || collision.type == "spawn")) {
						targetCoordinates = resolveAttackCollision(request, chamber, thing, targetCoordinates, collision, callback)
					}

				// areaAttacks
					else if (thing.info.type == "areaAttack" && (collision.supertype == "hero" || collision.supertype == "creature" || collision.type == "spawn")) {
						targetCoordinates = resolveAttackCollision(request, chamber, thing, targetCoordinates, collision, callback)
					}

				// return
					return targetCoordinates

			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* resolveAttackCollision */
		module.exports.resolveAttackCollision = resolveAttackCollision
		function resolveAttackCollision(request, chamber, attack, targetCoordinates, collision, callback) {
			try {
				// self (for rangeAttack / areaAttack)
					if (attack.info.attacker && collision.id == attack.info.attacker.id) {
						return targetCoordinates
					}

				// others
					else {
						// attacker
							if (attack.info.type == "rangeAttack" || attack.info.type == "areaAttack") {
								var attacker = chamber[attack.info.attacker.type == "hero" ? "heroes" : "creatures"][attack.info.attacker.id]
							}
							else {
								var attacker = attack
							}

						// recipient
							if (collision.supertype == "hero") {
								var recipient = chamber.heroes[collision.id]
							}
							else if (collision.supertype == "creature") {
								var recipient = chamber.creatures[collision.id]
							}
							else if (collision.supertype == "item" && collision.type == "spawn") {
								var recipient = chamber.items[collision.id]
							}

						// already dead?
							if (!recipient || !recipient.state.alive) {
								return targetCoordinates
							}

						// recipient still alive
							else {
								// stop moving
									targetCoordinates = resolveStop(request, targetCoordinates, collision, recipient, callback)

								// damage
									if ((attack.info.type == "rangeAttack" || attack.info.type == "areaAttack") || !Object.keys(attacker.items).length) {
										if (attack.info.type == "rangeAttack" || attack.info.type == "areaAttack") {
											var power = attack.info.statistics.power
										}
										else {
											var power = attacker.info.statistics.bumpPower * (attacker.state.effects.rock ? CONSTANTS.rockMultiplier : 1)
										}

										var alive = resolveDamage(request, chamber, recipient, {
											power: 	power,
											rps: 	attack.info.rps,
											type: 	attacker.info.type
										}, callback)

										if (!alive) {
											attacker.state.kills++
										}
									}									

								// bump
									if (recipient.state.alive && (collision.supertype == "hero" || collision.supertype == "creature")) {
										recipient.state.position.vx = recipient.state.position.vx + (collision.side == "right" ? CONSTANTS.bumpAcceleration : collision.side == "left" ? -CONSTANTS.bumpAcceleration : 0)
										recipient.state.position.vy = recipient.state.position.vy + (collision.side == "up"    ? CONSTANTS.bumpAcceleration : collision.side == "down" ? -CONSTANTS.bumpAcceleration : 0)
									}
							}

						// return
							return targetCoordinates							
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* resolveStop */
		module.exports.resolveStop = resolveStop
		function resolveStop(request, targetCoordinates, collision, obstacle, callback) {
			try {
				// directions
					if (collision.side == "left") {
						targetCoordinates.x = Math.max(targetCoordinates.x, obstacle.state.position.x + (obstacle.info.size.x / 2) + targetCoordinates.radiusX)
						targetCoordinates.collisionX = true
					}
					else if (collision.side == "right") {
						targetCoordinates.x = Math.min(targetCoordinates.x, obstacle.state.position.x - (obstacle.info.size.x / 2) - targetCoordinates.radiusX)
						targetCoordinates.collisionX = true
					}
					else if (collision.side == "up") {
						targetCoordinates.y = Math.min(targetCoordinates.y, obstacle.state.position.y - (obstacle.info.size.y / 2) - targetCoordinates.radiusY)
						targetCoordinates.collisionY = true
					}
					else if (collision.side == "down") {
						targetCoordinates.y = Math.max(targetCoordinates.y, obstacle.state.position.y + (obstacle.info.size.y / 2) + targetCoordinates.radiusY)
						targetCoordinates.collisionY = true
					}

				// return
					return targetCoordinates
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* resolveDamage */
		module.exports.resolveDamage = resolveDamage
		function resolveDamage(request, chamber, recipient, damage, callback) {
			try {
				// friendly fire?
					if (recipient.info.type == damage.type) {
						return recipient.state.alive
					}

				// creature vs. spawn
					else if (recipient.info.type == "spawn" && damage.type !== "hero") {
						return recipient.state.alive
					}

				// already dead?
					else if (!recipient.state.alive) {
						return recipient.state.alive
					}

				// enemy fire
					else {
						// multipliers
							var attackMultiplier = 1
							var armorMultiplier  = 1
							switch (damage.rps) {
								case "rock":
									attackMultiplier = recipient.info.rps == "scissors" ? CONSTANTS.rpsMultiplier : 1
									armorMultiplier  = recipient.info.rps == "paper"    ? CONSTANTS.rpsMultiplier : 1
								break
								case "paper":
									attackMultiplier = recipient.info.rps == "rock"     ? CONSTANTS.rpsMultiplier : 1
									armorMultiplier  = recipient.info.rps == "scissors" ? CONSTANTS.rpsMultiplier : 1
								break
								case "scissors":
									attackMultiplier = recipient.info.rps == "paper"    ? CONSTANTS.rpsMultiplier : 1
									armorMultiplier  = recipient.info.rps == "rock"     ? CONSTANTS.rpsMultiplier : 1
								break
							}

						// damage
							var armor = recipient.info.statistics.armorPower * (recipient.state.effects && recipient.state.effects.paper ? CONSTANTS.paperMultiplier : 1)
							var finalDamage = Math.max(0, Math.floor((damage.power * attackMultiplier) - (armor * armorMultiplier)))

						// reduce health
							recipient.state.health = Math.max(0, Math.min(recipient.state.healthMax, recipient.state.health - finalDamage))

						// dead?
							if (recipient.state.health <= 0) {
								recipient.state.alive = false

								// effects
									if (recipient.state.effects) {
										for (var e in recipient.state.effects) {
											recipient.state.effects[e] = 0
										}
									}

								// recipients shrink
									if (recipient.info.type !== "hero" && !recipient.state.cooldowns.death) {
										recipient.state.cooldowns.death = CONSTANTS.deathCooldown
									}

								// drop items
									if (recipient.state.items) {
										var x = recipient.state.position.x
										var y = recipient.state.position.y

										for (var i in recipient.items) {
											var item = main.duplicateObject(recipient.items[i])
												item.state.position.x = x + Math.floor(Math.random() * 2 * CONSTANTS.itemDropRadius) - CONSTANTS.itemDropRadius
												item.state.position.y = y + Math.floor(Math.random() * 2 * CONSTANTS.itemDropRadius) - CONSTANTS.itemDropRadius
											chamber.items[i] = item

											delete recipient.items[i]
										}
									}
							}

						// return alive
							return recipient.state.alive
					}
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
				if (!request.game.data.state.start) {
					callback(Object.keys(request.game.observers), {success: true, data: null})
				}
				else {
					// chamber
						var chamber = request.game.data.chambers[request.game.data.state.chamber.x][request.game.data.state.chamber.y]

					// paused
						if (request.game.data.state.paused) {
							callback(Object.keys(request.game.observers), {success: true, paused: true, data: chamber})	
						}

					// game over
						else if (request.game.data.state.end) {
							callback(Object.keys(request.game.observers), {success: true, end: true, data: chamber})	
						}

					// play
						else {
							// time
								request.game.data.state.time += CONSTANTS.loopInterval

							// chamber switch
								if (request.game.data.state.nextChamber) {
									if (chamber.state.cooldowns.fade) {
										chamber.state.cooldowns.fade = Math.max(0, chamber.state.cooldowns.fade - 1)
									}
									else {
										updateChamber(request, callback)
										var chamber = request.game.data.chambers[request.game.data.state.chamber.x][request.game.data.state.chamber.y]
									}
								}
								else if (chamber.state.cooldowns.fade) {
									chamber.state.cooldowns.fade = Math.max(0, chamber.state.cooldowns.fade - 1)
								}

							// regular gameplay
								else {
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
								}

							// send data
								callback(Object.keys(request.game.observers), {success: true, data: chamber})

								for (var p in request.game.players) {
									callback([p], {success: true, data: request.game.data.heroes[p]})
								}
						}
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateNextChamber */
		module.exports.updateNextChamber = updateNextChamber
		function updateNextChamber(request, newX, newY, isEdge, callback) {
			try {
				if (request.game.data.chambers[newX] && request.game.data.chambers[newX][newY]) {
					// get old
						var oldX = Number(request.game.data.state.chamber.x)
						var oldY = Number(request.game.data.state.chamber.y)
					
					// set new
						request.game.data.state.nextChamber = {
							x: Number(newX),
							y: Number(newY),
							isEdge: isEdge
						}

					// deactivate portals
						if (!isEdge) {
							// from
								var fromKeys = Object.keys(request.game.data.chambers[oldX][oldY].items)
								var fromKey = fromKeys.find(function(i) {
									return (request.game.data.chambers[oldX][oldY].items[i].info.type == "portal")
								})
								var fromPortal = request.game.data.chambers[oldX][oldY].items[fromKey]
									fromPortal.state.cooldowns.activate = CONSTANTS.portalCooldown
									fromPortal.info.size.x = fromPortal.info.size.y = 0

							// to
								var toKeys = Object.keys(request.game.data.chambers[newX][newY].items)
								var toKey = toKeys.find(function(i) {
									return (request.game.data.chambers[newX][newY].items[i].info.type == "portal")
								})
								var toPortal = request.game.data.chambers[newX][newY].items[toKey]
									toPortal.state.cooldowns.activate = CONSTANTS.portalCooldown
									toPortal.info.size.x = toPortal.info.size.y = 0
						}

					// set cooldown
						request.game.data.chambers[oldX][oldY].state.cooldowns.activate = CONSTANTS.chamberCooldown
						request.game.data.chambers[oldX][oldY].state.fadeout  = true
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateChamber */
		module.exports.updateChamber = updateChamber
		function updateChamber(request, callback) {
			try {
				if (request.game.data.state.nextChamber) {
					// get old
						var oldX = Number(request.game.data.state.chamber.x)
						var oldY = Number(request.game.data.state.chamber.y)
						var oldChamber = request.game.data.chambers[oldX][oldY]

					// remove dead creatures
						for (var c in oldChamber.creatures) {
							if (!oldChamber.creatures[c].state.alive) {
								delete oldChamber.creatures[c]
							}
						}

					// remove attacks
						for (var i in oldChamber.items) {
							if (oldChamber.items[i].info.type == "rangeAttack" || oldChamber.items[i].info.type == "areaAttack") {
								delete oldChamber.items[i]
							}
						}
					
					// get new
						var isEdge = request.game.data.state.nextChamber.isEdge
						var newX = Number(request.game.data.state.nextChamber.x)
						var newY = Number(request.game.data.state.nextChamber.y)
						var newChamber = request.game.data.chambers[newX][newY]
					
					// set new
						request.game.data.state.chamber.x = newX
						request.game.data.state.chamber.y = newY

					// unset next
						request.game.data.state.nextChamber = null

					// edge? flip hero positions
						if (isEdge) {
							var direction = (newX !== oldX) ? "x" : "y"
							for (var h in request.game.data.heroes) {
								request.game.data.heroes[h].state.position[direction] *= -1
							}
						}

					// portal? set new hero positions
						else {
							// old portal
								var oldKey = Object.keys(oldChamber.items).find(function (i) {
									return oldChamber.items[i].info.type == "portal"
								})
								var oldPortal = oldChamber.items[oldKey]

							// new portal
								var newKey = Object.keys(newChamber.items).find(function (i) {
									return newChamber.items[i].info.type == "portal"
								})
								var newPortal = newChamber.items[newKey]

							// get deltas
								var portalDeltaX = oldPortal.state.position.x - newPortal.state.position.x
								var portalDeltaY = oldPortal.state.position.y - newPortal.state.position.y

							// shift x and y by portalDeltaX and portalDeltaY
								for (var h in request.game.data.heroes) {
									request.game.data.heroes[h].state.position.x -= portalDeltaX
									request.game.data.heroes[h].state.position.y -= portalDeltaY
								}
						}

					// set cooldown
						request.game.data.chambers[newX][newY].state.cooldowns.activate = CONSTANTS.chamberCooldown
						request.game.data.chambers[oldX][oldY].state.fadeout  = false
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
				// resets
					hero.state.position.edge = null

				// accelerate
					var maxSpeed = hero.info.statistics.moveSpeed * (hero.state.effects.scissors ? CONSTANTS.scissorsMultiplier : 1)
					if (Math.abs(hero.state.position.vx) > maxSpeed) {
						hero.state.position.vx = (Math.abs(hero.state.position.vx) - CONSTANTS.acceleration) * Math.sign(hero.state.position.vx)
					}
					else {
						hero.state.position.vx = Math.max(-maxSpeed, Math.min(maxSpeed, hero.state.position.vx + (hero.state.movement.left ? -CONSTANTS.acceleration : hero.state.movement.right ? CONSTANTS.acceleration : -CONSTANTS.acceleration * Math.sign(hero.state.position.vx))))
					}

					if (Math.abs(hero.state.position.vy) > maxSpeed) {
						hero.state.position.vy = (Math.abs(hero.state.position.vy) - CONSTANTS.acceleration) * Math.sign(hero.state.position.vy)
					}
					else {
						hero.state.position.vy = Math.max(-maxSpeed, Math.min(maxSpeed, hero.state.position.vy + (hero.state.movement.down ? -CONSTANTS.acceleration : hero.state.movement.up    ? CONSTANTS.acceleration : -CONSTANTS.acceleration * Math.sign(hero.state.position.vy))))
					}

				// get target coordinates
					var newX = hero.state.position.x + hero.state.position.vx
					var newY = hero.state.position.y + hero.state.position.vy
					var radiusX = Math.ceil(hero.info.size.x / 2)
					var radiusY = Math.ceil(hero.info.size.y / 2)

					var targetCoordinates = {
						id: 		hero.id,
						radiusX: 	radiusX,
						radiusY: 	radiusY,
						x: 			newX,
						y: 			newY,
						collisionX: false,
						collisionY: false
					}

				// resolve edges
					targetCoordinates = resolveEdges(request, chamber, hero, targetCoordinates, callback)

				// resolve walls
					targetCoordinates = resolveWalls(request, chamber, hero, targetCoordinates, callback)

				// resolve collisions
					targetCoordinates = resolveCollisions(request, chamber, hero, targetCoordinates, callback)

				// move hero
					hero.state.position.x = targetCoordinates.x
					hero.state.position.y = targetCoordinates.y

				// arrest movement?
					if (targetCoordinates.collisionX) {
						hero.state.position.vx = 0
					}
					if (targetCoordinates.collisionY) {
						hero.state.position.vy = 0
					}

				// healing
					if (hero.state.effects.heal) {
						if (!hero.state.alive) {
							hero.state.alive = true
						}

						hero.state.health = Math.min(hero.state.healthMax, hero.state.health + CONSTANTS.heal)
					}

				// attacks
					if (hero.state.alive && !Object.keys(hero.items).length) {
						// a
							if (hero.state.actions.a && !hero.state.cooldowns.a) {
								hero.state.cooldowns.a = CONSTANTS.aCooldown
								createRangeAttack(request, chamber, hero, callback)
							}

						// b
							if (hero.state.actions.b && !hero.state.cooldowns.b) {
								hero.state.cooldowns.b = CONSTANTS.bCooldown
								createAreaAttack(request, chamber, hero, callback)
							}
					}

				// reduce cooldowns
					for (var c in hero.state.cooldowns) {
						if (hero.state.cooldowns[c]) {
							hero.state.cooldowns[c] = Math.max(0, hero.state.cooldowns[c] - 1)
						}
					}

					for (var e in hero.state.effects) {
						hero.state.effects[e] = Math.max(0, hero.state.effects[e] - 1)
					}

				// image
					updateImage(request, hero, targetCoordinates, callback)
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateCreature */
		module.exports.updateCreature = updateCreature
		function updateCreature(request, chamber, creature, callback) {
			try {
				// dead ?
					if (!creature.state.alive) {
						// reduce cooldown
							creature.state.cooldowns.death = Math.max(0, creature.state.cooldowns.death - CONSTANTS.deathFade)

						// reduce size
							creature.info.size.x = Math.max(0, creature.info.size.x * creature.state.cooldowns.death / CONSTANTS.deathCooldown)
							creature.info.size.y = Math.max(0, creature.info.size.y * creature.state.cooldowns.death / CONSTANTS.deathCooldown)

						// 0 cooldown?
							if (!creature.state.cooldowns.death) {
								delete chamber.creatures[creature.id]
							}
					}

				// alive
					else {
						// resets
							creature.state.position.edge = null

						// get path
							var cellX = Math.round(Math.abs(creature.state.position.x / CONSTANTS.cellSize)) * Math.sign(creature.state.position.x)
								if (cellX == -0) { cellX = 0 }
							var cellY = Math.round(Math.abs(creature.state.position.y / CONSTANTS.cellSize)) * Math.sign(creature.state.position.y)
								if (cellY == -0) { cellY = 0 }
							var path = PATHINGAI[creature.info.pathing](chamber, creature, cellX + "," + cellY, request.game.data.nodemaps[chamber.id])

						// get movement
							var nextCoords = path.split(" > ")[1] || path.split(" > ")[0]
							var nextCellCenterX = Number(nextCoords.split(",")[0]) * CONSTANTS.cellSize
							var nextCellCenterY = Number(nextCoords.split(",")[1]) * CONSTANTS.cellSize
							var deltaX = nextCellCenterX - creature.state.position.x
							var deltaY = nextCellCenterY - creature.state.position.y

							if (deltaY > 0) {
								creature.state.movement.up    = true
								creature.state.movement.down  = false
							}
							else if (deltaY < 0) {
								creature.state.movement.down  = true
								creature.state.movement.up    = false
							}

							if (deltaX > 0) {
								creature.state.movement.right = true
								creature.state.movement.left  = false
							}
							else if (deltaX < 0) {
								creature.state.movement.left  = true
								creature.state.movement.right = false
							}

						// get direction
							if (Math.abs(deltaX) > Math.abs(deltaY)) {
								if (deltaX > 0) {
									creature.state.movement.direction = "right"
								}
								else {
									creature.state.movement.direction = "left"
								}
							}
							else {
								if (deltaY > 0) {
									creature.state.movement.direction = "up"
								}
								else {
									creature.state.movement.direction = "down"
								}
							}

						// accelerate
							var maxSpeed = creature.info.statistics.moveSpeed * (creature.state.effects.scissors ? CONSTANTS.scissorsMultiplier : 1)
							if (Math.abs(creature.state.position.vx) > maxSpeed) {
								creature.state.position.vx = (Math.abs(creature.state.position.vx) - CONSTANTS.acceleration) * Math.sign(creature.state.position.vx)
							}
							else {
								creature.state.position.vx = Math.max(-maxSpeed, Math.min(maxSpeed, creature.state.position.vx + (creature.state.movement.left ? -CONSTANTS.acceleration : creature.state.movement.right ? CONSTANTS.acceleration : -CONSTANTS.acceleration * Math.sign(creature.state.position.vx))))
							}

							if (Math.abs(creature.state.position.vy) > maxSpeed) {
								creature.state.position.vy = (Math.abs(creature.state.position.vy) - CONSTANTS.acceleration) * Math.sign(creature.state.position.vy)
							}
							else {
								creature.state.position.vy = Math.max(-maxSpeed, Math.min(maxSpeed, creature.state.position.vy + (creature.state.movement.down ? -CONSTANTS.acceleration : creature.state.movement.up    ? CONSTANTS.acceleration : -CONSTANTS.acceleration * Math.sign(creature.state.position.vy))))
							}

						// get actual target coordinates
							var newX = creature.state.position.x + creature.state.position.vx
							var newY = creature.state.position.y + creature.state.position.vy
							var radiusX = Math.ceil(creature.info.size.x / 2)
							var radiusY = Math.ceil(creature.info.size.y / 2)

							var targetCoordinates = {
								id: 		creature.id,
								radiusX: 	radiusX,
								radiusY: 	radiusY,
								x: 			newX,
								y: 			newY,
								collisionX:	false,
								collisionY: false
							}

						// resolve edges
							targetCoordinates = resolveEdges(request, chamber, creature, targetCoordinates, callback)

						// resolve walls
							targetCoordinates = resolveWalls(request, chamber, creature, targetCoordinates, callback)

						// resolve collisions
							targetCoordinates = resolveCollisions(request, chamber, creature, targetCoordinates, callback)

						// move creature
							creature.state.position.x = targetCoordinates.x
							creature.state.position.y = targetCoordinates.y

						// arrest movement?
							if (targetCoordinates.collisionX) {
								creature.state.position.vx = 0
							}
							if (targetCoordinates.collisionY) {
								creature.state.position.vy = 0
							}

						// healing
							if (creature.state.effects.heal) {
								if (!creature.state.alive) {
									creature.state.alive = true
								}

								creature.state.health = Math.min(creature.state.healthMax, creature.state.health + CONSTANTS.heal)
							}

						// attacks
							if (creature.state.alive && !Object.keys(creature.items).length) {
								// a
									if (!creature.state.cooldowns.a && main.rollRandom(CONSTANTS.monsterChanceA[0], CONSTANTS.monsterChanceA[1])) {
										creature.state.cooldowns.a = CONSTANTS.aCooldown
										createRangeAttack(request, chamber, creature, callback)
									}

								// b
									if (!creature.state.cooldowns.b && main.rollRandom(CONSTANTS.monsterChanceB[0], CONSTANTS.monsterChanceB[1])) {
										creature.state.cooldowns.b = CONSTANTS.bCooldown
										createAreaAttack(request, chamber, creature, callback)
									}
							}

						// reduce cooldowns
							for (var c in creature.state.cooldowns) {
								if (creature.state.cooldowns[c]) {
									creature.state.cooldowns[c] = Math.max(0, creature.state.cooldowns[c] - 1)
								}
							}

							for (var e in creature.state.effects) {
								creature.state.effects[e] = Math.max(0, creature.state.effects[e] - 1)
							}

						// image
							updateImage(request, creature, targetCoordinates, callback)
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
				// targetCoordinates
					var targetCoordinates = {
						id: 		item.id,
						radiusX: 	Math.ceil(item.info.size.x / 2),
						radiusY: 	Math.ceil(item.info.size.y / 2), 
						x: 			item.state.position.x,
						y: 			item.state.position.y,
						collisionX: false,
						collisionY: false
					}

				// range attacks
					if (item.info.type == "rangeAttack") {
						// no power?
							if (item.info.statistics.power <= 0) {
								delete chamber.items[item.id]
							}

						// still has power
							else {
								// target coordinates
									var speed 		= item.info.statistics.speed
									var direction 	= item.state.movement.direction
									var newX 		= item.state.position.x + (direction == "left" ? -speed : direction == "right" ? speed : 0)
									var newY 		= item.state.position.y + (direction == "down" ? -speed : direction == "up"    ? speed : 0)

									targetCoordinates.x = newX
									targetCoordinates.y = newY

								// resolve edges
									targetCoordinates = resolveEdges(request, chamber, item, targetCoordinates, callback)
									if (targetCoordinates.collision) {
										delete chamber.items[item.id]
									}

								// resolve walls
									targetCoordinates = resolveWalls(request, chamber, item, targetCoordinates, callback)
									if (targetCoordinates.collision) {
										delete chamber.items[item.id]
									}

								// resolve collisions
									targetCoordinates = resolveCollisions(request, chamber, item, targetCoordinates, callback)
									if (targetCoordinates.collisionX || targetCoordinates.collisionY) {
										delete chamber.items[item.id]
									}

								// move & shrink item
									item.state.position.x = targetCoordinates.x
									item.state.position.y = targetCoordinates.y
									item.info.statistics.power = Math.max(0, item.info.statistics.power - CONSTANTS.rangeAttackFade)
									item.info.size.x = Math.max(0, item.info.size.x - CONSTANTS.rangeAttackFade)
									item.info.size.y = Math.max(0, item.info.size.y - CONSTANTS.rangeAttackFade)
							}
					}

				// area attacks
					else if (item.info.type == "areaAttack") {
						// attacker
							var attacker = chamber[item.info.attacker.type == "hero" ? "heroes" : "creatures"][item.info.attacker.id]

						// no power?
							if (item.info.statistics.power <= 0) {
								delete chamber.items[item.id]
							}

						// no attacker?
							else if (!attacker || !attacker.state.alive) {
								delete chamber.items[item.id]
							}

						// still has power
							else {
								// target coordinates
									targetCoordinates.x = attacker.state.position.x
									targetCoordinates.y = attacker.state.position.y

								// resolve collisions
									targetCoordinates = resolveCollisions(request, chamber, item, targetCoordinates, callback)

								// move & shrink item
									item.state.position.x = attacker.state.position.x
									item.state.position.y = attacker.state.position.y
									item.info.statistics.power = Math.max(0, item.info.statistics.power - CONSTANTS.areaAttackFade)
									item.info.size.x = Math.max(0, item.info.size.x - (CONSTANTS.areaAttackFade * CONSTANTS.areaAttackRadius))
									item.info.size.y = Math.max(0, item.info.size.y - (CONSTANTS.areaAttackFade * CONSTANTS.areaAttackRadius))
							}
					}

				// shrine / portal
					else if (item.info.type == "shrine" || item.info.type == "portal" || item.info.type == "spawn") {
						// get max cooldown
							var cooldownMax = CONSTANTS[item.info.type + "Cooldown"]

						// reduce cooldown
							item.state.cooldowns.activate = Math.max(0, item.state.cooldowns.activate - 1)
							item.info.size.x = item.info.size.y = item.info.size.max * ((cooldownMax - item.state.cooldowns.activate) / cooldownMax)

						// portal
							if (item.info.type == "portal") {
								// get destination chamber
									var coords = item.state.link.split(",")
									var cellX = Number(coords[0])
									var cellY = Number(coords[1])
									var destinationChamber = request.game.data.chambers[cellX][cellY]

								// get destination chamber's portal
									var portalKey = Object.keys(destinationChamber.items).find(function(i) {
										return (destinationChamber.items[i].info.type == "portal")
									}) || null

									if (portalKey) {
										// reduce cooldown for destination's portal too
											var portal = destinationChamber.items[portalKey]
												portal.state.cooldowns.activate = Math.max(0, portal.state.cooldowns.activate - 1)
												portal.info.size.x = portal.info.size.y = portal.info.size.max * ((cooldownMax - portal.state.cooldowns.activate) / cooldownMax)
									}
							}

						// spawn
							if (item.info.type == "spawn") {
								// dead?
									if (!item.state.alive) {
										// reduce cooldown
											item.state.cooldowns.death = Math.max(0, item.state.cooldowns.death - CONSTANTS.deathFade)

										// reduce size
											item.info.size.x = Math.max(0, item.info.size.x * item.state.cooldowns.death / CONSTANTS.deathCooldown)
											item.info.size.y = Math.max(0, item.info.size.y * item.state.cooldowns.death / CONSTANTS.deathCooldown)

										// 0 cooldown?
											if (!item.state.cooldowns.death) {
												delete chamber.items[item.id]
											}
									}

								// ready to spawn monster
									else if (!item.state.cooldowns.activate && Object.keys(chamber.creatures).length < CONSTANTS.monsterCountMax) {
										// deactivate
											item.state.cooldowns.activate = CONSTANTS.spawnCooldown
											item.info.size.x = item.info.size.y = 0

										// create creature
											var monster = createCreature(request, main.duplicateObject(MONSTERS[main.chooseRandom(item.info.monsterTypes)]), callback)
											main.overwriteObject(monster, {
												state: {
													position: {
														x: item.state.position.x + Math.floor(Math.random() * 2 * CONSTANTS.itemDropRadius) - CONSTANTS.itemDropRadius,
														y: item.state.position.y + Math.floor(Math.random() * 2 * CONSTANTS.itemDropRadius) - CONSTANTS.itemDropRadius
													}
												}
											})
											chamber.creatures[monster.id] = monster
									}
							}
					}

				// image
					updateImage(request, item, targetCoordinates, callback)
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateImage */
		module.exports.updateImage = updateImage
		function updateImage(request, thing, targetCoordinates, callback) {
			try {
				// heroes && creatures
					if (thing.info.type == "hero" || thing.info.type == "creature" || thing.info.type == "monster") {
						var imageName = []
							imageName.push(thing.info.type)
							imageName.push(thing.info.subtype)
							imageName.push(thing.state.movement ? thing.state.movement.direction : "all")
							imageName.push(thing.state.movement && thing.state.movement[thing.state.movement.direction] ? "moving" : "standing")
							imageName.push(thing.state.actions.a ? "rangeattack" : thing.state.actions.b ? "areaattack" : (targetCoordinates.collisionX || targetCoordinates.collisionY) ? "collision" : Object.keys(thing.items).length ? "holding" : "inactive")
						thing.state.image = imageName.join("_")
					}

				// items
					else {
						var imageName = []
							imageName.push(thing.info.type)
							imageName.push(thing.info.subtype)
							imageName.push(thing.state.movement ? thing.state.movement.direction : "all")
							imageName.push((thing.state.movement && thing.state.movement[thing.state.movement.direction]) ? "moving" : "standing")
							imageName.push((thing.state.active || !thing.state.cooldowns || !thing.state.cooldowns.activate) ? "active" : "inactive")
						thing.state.image = imageName.join("_")
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}
