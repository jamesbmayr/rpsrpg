/*** modules ***/
	var main       = require("../main/logic")
	module.exports = {}

/*** maps ***/
	var DIRECTIONS 	= main.getAsset("directions")
	var ACTIONS 	= main.getAsset("actions")
	var HEROES 		= main.getAsset("heroes")
	var COLORS 		= main.getAsset("colors")
	var WALLMAKERS 	= main.getAsset("wallMakers")
	var CELLSIZE 	= main.getAsset("cellSize")

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
						}

					// add observer
						else {
							request.game.observers[request.session.id] = main.getSchema("player")
							request.game.observers[request.session.id].id = request.session.id
							request.game.observers[request.session.id].connected  = true
							request.game.observers[request.session.id].connection = request.connection
						}

					// message
						if (!request.game.data.state.start) {
							callback([request.session.id], {success: true,
								id:           request.game.id,
								names:        Object.keys(request.game.players).length ? Object.keys(request.game.players).map(function(id) { return request.game.players[id].name }) : []
							})
						}
						else if (request.game.data.state.end) {
							callback([request.session.id], {success: true, location: "../../../../"})
						}
						else {
							callback([request.session.id], {success: true,
								id:           request.game.id,
								data:         request.game.data
							})
						}
				}
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

/*** triggers ***/
	/* triggerMove */
		module.exports.triggerMove = triggerMove
		function triggerMove(request, callback) {
			try {
				var hero = request.game.data.heroes[request.session.id]
					hero.state.movement.facing = request.post.input

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
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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

				switch (request.post.input) {
					case "a":
						hero.state.movement.a = true
					break
					case "b":
						hero.state.movement.b = true
					break
					case "x":
						hero.state.movement.x = true
					break
					case "y":
						hero.state.movement.y = true
					break
				}
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

/*** creates ***/
	/* createMap */
		module.exports.createMap = createMap
		function createMap(request, callback) {
			try {
				// chambers
					var chambers = request.game.data.chambers
					var layer = 0
					var x = 0
					var y = 0

				// spiral loop
					while (layer < request.game.data.info.layers) {
						createChamber(request, x, y, callback)

						if (     (!chambers[x + 1] || !chambers[x + 1][y - 1]) && Math.abs(x + 1) + Math.abs(y - 1) == layer) {
							x += 1
							y -= 1
						}
						else if ((!chambers[x - 1] || !chambers[x - 1][y - 1]) && Math.abs(x - 1) + Math.abs(y - 1) == layer) {
							x -= 1
							y -= 1
						}
						else if ((!chambers[x - 1] || !chambers[x - 1][y + 1]) && Math.abs(x - 1) + Math.abs(y + 1) == layer) {
							x -= 1
							y += 1
						}
						else if ((!chambers[x + 1] || !chambers[x + 1][y + 1]) && Math.abs(x + 1) + Math.abs(y + 1) == layer) {
							x += 1
							y += 1
						}
						else {
							layer += 1
							y += 1
						}
					}
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* createChamber */
		module.exports.createChamber = createChamber
		function createChamber(request, chamberX, chamberY, callback) {
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

					console.log("DONE")
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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

					if (doors.length < 2 && possibleDoors.length && !Math.floor(Math.random() * doors.length)) {
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
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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

				console.log("connecting [" + x + "," + y + "]")

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
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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
							return r !== request.game.data.heroes[h].info.species
						})
					}

					if (!remainingTypes.length) {
						callback([request.session.id], {success: false, message: "No unavailable heroes."})
						return
					}

				// create hero & add to game
					var hero = main.getSchema("creature")
						hero.id = request.session.id
						hero.info.name = request.game.players[request.session.id].name
						main.overwriteObject(hero, HEROES[main.chooseRandom(remainingTypes)])
					request.game.data.heroes[hero.id] = hero
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* createCreature */
		module.exports.createCreature = createCreature
		function createCreature(request, chamber, callback) {
			try {
				// create creature
					var creature = main.getSchema("creature")
					chamber.creatures.push(creature)
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* createObject */
		module.exports.createObject = createObject
		function createObject(request, callback) {
			try {
				//
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

/*** gets ***/
	/* getEdge */
		module.exports.getEdge = getEdge
		function getEdge(request, chamber, targetCoordinates, callback) {
			try {
				// get edges
					var chamberUp    =  chamber.info.chamberSize * chamber.info.cellSize / 2
					var chamberLeft  = -chamber.info.chamberSize * chamber.info.cellSize / 2
					var chamberRight =  chamber.info.chamberSize * chamber.info.cellSize / 2
					var chamberDown  = -chamber.info.chamberSize * chamber.info.cellSize / 2

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
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
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
								type: "wall",
								id: occupiedCells[o]
							})
						}
					}

				// heroes
					for (var h in chamber.heroes) {
						var collisionSide = getCollision(request, chamber.heroes[h], targetCoordinates, callback)
						if (collisionSide) {
							collisions.push({
								side: collisionSide,
								type: "hero",
								id: chamber.heroes[h].id
							})
						}
					}

				// creatures
					for (var c in chamber.creatures) {
						var collisionSide = getCollision(request, chamber.creatures[c], targetCoordinates)
						if (collisionSide) {
							collisions.push({
								side: collisionSide,
								type: "creature",
								id: chamber.creatures[c].id
							})
						}
					}

				// objects
					for (var o in chamber.objects) {
						var collisionSide = getCollision(request, chamber.objects[o], targetCoordinates)
						if (collisionSide) {
							collisions.push({
								side: collisionSide,
								type: "object",
								id: chamber.objects[o].id
							})
						}
					}

				return collisions
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* getCollision */
		module.exports.getCollision = getCollision
		function getCollision(request, object, targetCoordinates, callback) {
			try {
				// self?
					if (object.id == targetCoordinates.id) {
						return false
					}

				// radii
					var radiusX = Math.ceil(object.info.size.x / 2)
					var radiusY = Math.ceil(object.info.size.y / 2)

					var objectUp    = object.state.position.y + radiusY
					var objectLeft  = object.state.position.x - radiusX
					var objectRight = object.state.position.x + radiusX
					var objectDown  = object.state.position.y - radiusY
				
				// collision?
					if ((objectUp    > targetCoordinates.down )
					 && (objectLeft  < targetCoordinates.right)
					 && (objectRight > targetCoordinates.left )
					 && (objectDown  < targetCoordinates.up   )) {
						// get deltas
							var deltaUp    = Math.abs(targetCoordinates.up    - objectDown )
							var deltaLeft  = Math.abs(targetCoordinates.left  - objectRight)
							var deltaRight = Math.abs(targetCoordinates.right - objectLeft )
							var deltaDown  = Math.abs(targetCoordinates.down  - objectUp   )

						// get side
							var delta = Math.min(deltaUp, deltaLeft, deltaRight, deltaDown)
							return (delta == deltaUp) ? "up" : (delta == deltaLeft) ? "left" : (delta == deltaRight) ? "right" : "down"
					}
					else {
						return null
					}
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

/*** resolves ***/
	/* resolveEdge */
		module.exports.resolveEdge = resolveEdge
		function resolveEdge(request, chamber, creature, edge, callback) {
			try {
				// set edge
					creature.state.position.edge = edge

				// heroes only
					if (creature.info.type !== "hero") {
						return false
					}

				// all agreed?
					var unanimity = true
					for (var h in request.game.data.heroes) {
						if (request.game.data.heroes[h].state.position.edge !== edge) {
							unanimity = false
						}
					}

					if (!unanimity) {
						return false
					}

				// get nextChamber
					var nextChamberX = chamber.info.x + (edge == "left" ? -1 : edge == "right" ? 1 : 0)
					var nextChamberY = chamber.info.y + (edge == "down" ? -1 : edge == "up"    ? 1 : 0)
					var nextChamber = request.game.data.chambers[nextChamberX] ? (request.game.data.chambers[nextChamberX][nextChamberY] || null) : null

				// no chamber
					if (!nextChamber) {
						return false
					}				
					else {
						updateChamber(request, nextChamberX, nextChamberY, callback)
					}
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* resolveCollision */
		module.exports.resolveCollision = resolveCollision
		function resolveCollision(request, chamber, creature, collision, callback) {
			try {
				//
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

/*** updates ***/
	/* updateTime */
		module.exports.updateTime = updateTime
		function updateTime(request, callback) {
			try {
				if (request.game.data.state.start) {
					// time
						request.game.data.state.time += 100

					// chamber
						var chamber = request.game.data.chambers[request.game.data.state.chamber.x][request.game.data.state.chamber.y]

					// heroes
						for (var h in chamber.heroes) {
							var hero = chamber.heroes[h]
							updatePosition(request, chamber, hero, callback)
						}

					// creatures
						for (var c in chamber.creatures) {
							var creature = chamber.creatures[c]
							updatePosition(request, chamber, creature, callback)
						}

					// send data
						callback(Object.keys(request.game.observers), {success: true, data: chamber})

						for (var p in request.game.players) {
							callback([p], {success: true, data: request.game.data.heroes[p]})
						}
				}
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* updateChamber */
		module.exports.updateChamber = updateChamber
		function updateChamber(request, x, y, callback) {
			try {
				// get old
					var oldX = request.game.data.state.chamber.x
					var oldY = request.game.data.state.chamber.y
				
				// set new
					request.game.data.state.chamber.x = x
					request.game.data.state.chamber.y = y

				// flip hero positions
					var direction = (x !== oldX) ? "x" : "y"
					for (var h in request.game.data.heroes) {
						request.game.data.heroes[h].state.position[direction] *= -1
					}
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* updatePosition */
		module.exports.updatePosition = updatePosition
		function updatePosition(request, chamber, creature, callback) {
			try {
				// get target coordinates
					var newX = creature.state.position.x + (creature.state.movement.left ? -creature.statistics.speed : creature.state.movement.right ? creature.statistics.speed : 0)
					var newY = creature.state.position.y + (creature.state.movement.down ? -creature.statistics.speed : creature.state.movement.up    ? creature.statistics.speed : 0)
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
							resolveCollision(request, chamber, creature, collisions[c], callback)
						}
						return
					}

				// get edges
					var edge = getEdge(request, chamber, targetCoordinates, callback)
					if (edge) {
						resolveEdge(request, chamber, creature, edge, callback)
						return
					}

				// move creature
					creature.state.position.edge = null
					creature.state.position.x = targetCoordinates.x
					creature.state.position.y = targetCoordinates.y
					return
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}
