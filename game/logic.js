/*** modules ***/
	var main       = require("../main/logic")
	module.exports = {}

/*** maps ***/
	var CONSTANTS 	= main.getAsset("constants")
	var MONSTERS 	= main.getAsset("monsters")
	var HEROES 		= main.getAsset("heroes")
	var WALLMAKERS 	= main.getAsset("wallMakers")
	var PATHINGAI 	= main.getAsset("pathingAI")

/*** players ***/
	/* addPlayer */
		module.exports.addPlayer = addPlayer
		function addPlayer(request, callback) {
			try {
				if (!request.game) {
					callback([request.session.id], {success: false, message: "Game not found."})
				}
				else {
					// add existing player
						if (request.game.players[request.session.id]) {
							var player = request.game.players[request.session.id]
							player.connected  = true
							player.connection = request.connection

							if (request.game.data.heroes[player.hero]) {
								request.game.data.heroes[player.hero].player = request.session.id
								callback([request.session.id], {success: true, hero: request.game.data.heroes[player.hero]})
							}
							else {
								callback([request.session.id], {success: true, heroOptions: getHeroOptions(request, callback)})
							}
						}

					// add observer
						else {
							var observer 		= main.getSchema("player")
							observer.id 		= request.session.id
							observer.connected  = true
							observer.connection = request.connection
							request.game.observers[request.session.id] = observer
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
					// disable connection
						if (request.game.players[request.session.id]) {
							var player = request.game.players[request.session.id]
							player.connected = false

							if (player.hero) {
								request.game.data.heroes[player.hero].player = null
								player.hero = null

								var otherPlayers = Object.keys(request.game.players).filter(function(p) {
									return !request.game.players[p].hero
								}) || []

								callback(otherPlayers, {success: true, heroOptions: getHeroOptions(request, callback)})
							}
						}
						else if (request.game.observers[request.session.id]) {
							request.game.observers[request.session.id].connected = false
						}

					// remove player or observer
						if (request.game.data.state.end || !request.game.data.state.start) {
							if (request.game.players[request.session.id]) {
								delete request.game.players[request.session.id]
							}
							else if (request.game.observers[request.session.id]) {
								delete request.game.observers[request.session.id]
							}
						}

					// callback
						callback([request.session.id], {success: true, location: "../../../../"})

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
	/* selectHero */
		module.exports.selectHero = selectHero
		function selectHero(request, callback) {
			try {
				if (request.game.data.state.end) {
					callback([request.session.id], {success: false, message: "Game ended."})
				}
				else {
					// get player
						var player = request.game.players[request.session.id]

						if (!player) {
							callback([request.session.id], {success: false, message: "Player not found."})
						}
						else if (player.hero) {
							callback([request.session.id], {success: false, message: "Hero already selected."})
						}
						else if (!request.post.input || !Object.keys(HEROES).includes(request.post.input)) {
							callback([request.session.id], {success: false, message: "Invalid hero selection."})
						}
						else {
							// get hero
								var heroKey = Object.keys(request.game.data.heroes).find(function(h) {
									return request.game.data.heroes[h] && (request.game.data.heroes[h].info.subtype == request.post.input) && !request.game.data.heroes[h].player
								})
								if (!heroKey) {
									callback([request.session.id], {success: false, message: "Hero unavailable."})
								}
								else {
									// connect hero <> player
										var hero = request.game.data.heroes[heroKey]
											hero.player = request.session.id
											hero.state.movement.up 		= false
											hero.state.movement.right 	= false
											hero.state.movement.down 	= false
											hero.state.movement.left 	= false
											hero.state.actions.a 		= false
											hero.state.actions.b 		= false
										player.hero = hero.id

										callback([request.session.id], {success: true, hero: hero})

									// inform players without heroes about updated selection
										var otherPlayers = Object.keys(request.game.players).filter(function(p) {
											return !request.game.players[p].hero
										}) || []

										callback(otherPlayers, {success: true, heroOptions: getHeroOptions(request, callback)})
								}
						}
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* pressInput */
		module.exports.pressInput = pressInput
		function pressInput(request, callback) {
			try {
				if (request.game.data.state.end) {
					callback([request.session.id], {success: false, message: "Game ended."})
				}
				else {
					var player = request.game.players[request.session.id]
					var hero   = player ? request.game.data.heroes[player.hero] : null

					if (!hero) {
						callback([request.session.id], {success: false, message: "Hero not found."})
					}
					else {
						switch (true) {
							case (CONSTANTS.directions.includes(request.post.input)):
								triggerMove(request, hero, callback)
							break

							case (CONSTANTS.actions.includes(request.post.input)):
								triggerAction(request, hero, callback)
							break

							case (request.post.input == "start"):
								triggerPause(request, hero, callback)
							break

							case (request.post.input.split("-").length && CONSTANTS.directions.includes(request.post.input.split("-")[0]) && CONSTANTS.directions.includes(request.post.input.split("-")[1])):
								triggerMove(request, hero, callback)
							break
						}
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
				if (request.game.data.state.end) {
					callback([request.session.id], {success: false, message: "Game ended."})
				}
				else {
					var player = request.game.players[request.session.id]
					var hero   = player ? request.game.data.heroes[player.hero] : null

					if (!hero) {
						callback([request.session.id], {success: false, message: "Hero not found."})
					}
					else {
						switch (true) {
							case (CONSTANTS.directions.includes(request.post.input)):
								untriggerMove(request, hero, callback)
							break

							case (CONSTANTS.actions.includes(request.post.input)):
								untriggerAction(request, hero, callback)
							break

							case (request.post.input.split("-").length && CONSTANTS.directions.includes(request.post.input.split("-")[0]) && CONSTANTS.directions.includes(request.post.input.split("-")[1])):
								untriggerMove(request, hero, callback)
							break
						}
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
		function triggerMove(request, hero, callback) {
			try {
				// change direction
					hero.state.movement.direction = request.post.input.includes("-") ? request.post.input.split("-")[1] : request.post.input

				// set movements
					switch (request.post.input) {
						case "up":
							hero.state.movement.up    = true
							hero.state.movement.down  = false
						break
						case "right":
							hero.state.movement.right = true
							hero.state.movement.left  = false
						break
						case "down":
							hero.state.movement.down  = true
							hero.state.movement.up    = false
						break
						case "left":
							hero.state.movement.left  = true
							hero.state.movement.right = false
						break

						case "up-left":
							hero.state.movement.up    = true
							hero.state.movement.down  = false
							hero.state.movement.left  = true
							hero.state.movement.right = false
						break
						case "up-right":
							hero.state.movement.up    = true
							hero.state.movement.down  = false
							hero.state.movement.right = true
							hero.state.movement.left  = false
						break
						case "down-right":
							hero.state.movement.down  = true
							hero.state.movement.up    = false
							hero.state.movement.right = true
							hero.state.movement.left  = false
						break
						case "down-left":
							hero.state.movement.left  = true
							hero.state.movement.right = false
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
		function untriggerMove(request, hero, callback) {
			try {
				// unset movements
					switch (request.post.input) {
						case "up":
							hero.state.movement.up    = false
						break
						case "right":
							hero.state.movement.right = false
						break
						case "down":
							hero.state.movement.down  = false
						break
						case "left":
							hero.state.movement.left  = false
						break

						case "up-left":
							hero.state.movement.up    = false
							hero.state.movement.left  = false
						break
						case "up-right":
							hero.state.movement.up    = false
							hero.state.movement.right = false
						break
						case "down-right":
							hero.state.movement.down  = false
							hero.state.movement.right = false
						break
						case "down-left":
							hero.state.movement.down  = false
							hero.state.movement.left  = false
						break
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* triggerAction */
		module.exports.triggerAction = triggerAction
		function triggerAction(request, hero, callback) {
			try {
				// unset all actions
					hero.state.actions.a = false
					hero.state.actions.b = false

				// set action
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
		function untriggerAction(request, hero, callback) {
			try {
				// unset actions
					hero.state.actions.a = false
					hero.state.actions.b = false
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* triggerPause */
		module.exports.triggerPause = triggerPause
		function triggerPause(request, hero, callback) {
			try {
				// change pause
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
				// create heroes
					createHeroes(request, callback)

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
					var shrineChambers = specialChambers.slice(0, shrineTypes.length * CONSTANTS.shrineSets)

				// pick portalChambers
					var portalChambers = specialChambers.slice(shrineTypes.length * CONSTANTS.shrineSets, shrineTypes.length * CONSTANTS.shrineSets + CONSTANTS.portalPairs * 2)
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
					var spawnChambers = specialChambers.slice(shrineTypes.length * CONSTANTS.shrineSets + portalsPlaced)

				// loop through spiral to make chambers
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
								if (!shrineTypes.length) {
									shrineTypes = main.sortRandom(CONSTANTS.rps)
								}

								options.shrine = shrineTypes.shift()
							}
							else if (portalPairs[allChambers[a]]) {
								options.portal = portalPairs[allChambers[a]]
							}
							else if (spawnChambers.includes(allChambers[a]) && main.rollRandom(CONSTANTS.spawnChance[0], CONSTANTS.spawnChance[1])) {
								var spawnCount = main.rangeRandom(CONSTANTS.spawnCountMin, CONSTANTS.spawnCountMax)
								options.spawns = []
								for (var s = 0; s < spawnCount; s++) {
									options.spawns.push(main.chooseRandom(spawnTypes))
								}
								
							}

						// monsters ?
							if (!options.temple && main.rollRandom(CONSTANTS.monsterChance[0], CONSTANTS.monsterChance[1])) {
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

				// loop through chambers to assign wall images
					for (var x in request.game.data.chambers) {
						for (var y in request.game.data.chambers[x]) {
							createWallImages(request, request.game.data.chambers[x][y], callback)
						}
					}

				// loop through chambers to make nodemaps
					for (var x in request.game.data.chambers) {
						for (var y in request.game.data.chambers[x]) {
							// chamber
								var chamber = request.game.data.chambers[x][y]

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
					var layer = Math.abs(chamberX) + Math.abs(chamberY)
					var chamber = main.getSchema("chamber")
						chamber.info.x = chamberX
						chamber.info.y = chamberY
						chamber.info.colors = {
							background: 	CONSTANTS.chamberColors[layer][0],
							wall: 			CONSTANTS.chamberColors[layer][4]
						}
						chamber.info.image = "layer_" + layer + "_background"
					
				// attach heroes
					chamber.heroes = request.game.data.heroes

				// attach overlay
					chamber.state.overlay = request.game.data.state.overlay

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
						else if (options.spawns) {
							createSpawns(request, chamber, options.spawns, false, callback)
						}

						if (options.monsters) {
							createMonsters(request, chamber, options.monsters, callback)
						}
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

				// down-right
					main.chooseRandom(WALLMAKERS)(chamber.cells, 1, cellMaxX, cellMinY, -1)

				// down-left
					main.chooseRandom(WALLMAKERS)(chamber.cells, cellMinX, -1, cellMinY, -1)

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

					if (request.game.data.chambers[chamber.info.x + 1] && request.game.data.chambers[chamber.info.x + 1][chamber.info.y]) {
						var neighborRight = request.game.data.chambers[chamber.info.x + 1][chamber.info.y]
						var neighborRightMinX = Math.floor(neighborRight.info.chamberSize / 2) * -1
					}

					if (request.game.data.chambers[chamber.info.x] && request.game.data.chambers[chamber.info.x][chamber.info.y - 1]) {
						var neighborDown = request.game.data.chambers[chamber.info.x][chamber.info.y - 1]
						var neighborDownMaxY = Math.floor(neighborDown.info.chamberSize / 2)
					}

					if (request.game.data.chambers[chamber.info.x - 1] && request.game.data.chambers[chamber.info.x - 1][chamber.info.y]) {
						var neighborLeft = request.game.data.chambers[chamber.info.x - 1][chamber.info.y]
						var neighborLeftMaxX = Math.floor(neighborLeft.info.chamberSize / 2)
					}

				// center chamber
					if (chamber.info.x == 0 && chamber.info.y == 0) {
						doors = main.duplicateArray(CONSTANTS.directions)
					}

				// point chamber
					else if ((chamber.info.x == 0 && Math.abs(chamber.info.y) == layers - 1)
						  || (chamber.info.y == 0 && Math.abs(chamber.info.x) == layers - 1)) {
						if (chamber.info.y == -1 * (layers - 1)) {
							doors = ["up"]
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
						else if (chamber.info.x == (layers - 1)) {
							doors = ["left"]
							possibleDoors = []
						}
					}

				// edge chamber
					else if (Math.abs(chamber.info.x) + Math.abs(chamber.info.y) == layers - 1) {
						if (chamber.info.x > 0 && chamber.info.y < 0) {
							doors = ["up", "left"]
							possibleDoors = []
						}
						else if (chamber.info.x < 0 && chamber.info.y < 0) {
							doors = ["up", "right"]
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

						// right (check right's left)
							if (neighborRight && neighborRight.cells[neighborRightMinX] && neighborRight.cells[neighborRightMinX][0] && !neighborRight.cells[neighborRightMinX][0].wall) {
								doors.push("right")
							}

						// down (check down's up)
							if (neighborDown && neighborDown.cells[0] && neighborDown.cells[0][neighborDownMaxY] && !neighborDown.cells[0][neighborDownMaxY].wall) {
								doors.push("down")
							}

						// left (check left's right)
							if (neighborLeft && neighborLeft.cells[neighborLeftMaxX] && neighborLeft.cells[neighborLeftMaxX][0] && !neighborLeft.cells[neighborLeftMaxX][0].wall) {
								doors.push("left")
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
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* createWallImages */
		module.createWallImages = createWallImages
		function createWallImages(request, chamber, callback) {
			try {
				// get layer
					var layer = Math.abs(chamber.info.x) + Math.abs(chamber.info.y)

				// loop through cells to find walls
					for (var x in chamber.cells) {
						x = Number(x)
						for (var y in chamber.cells[x]) {
							y = Number(y)
							if (chamber.cells[x][y].wall) {
								// get neighbors
									var neighbors = {
										up: 	!(chamber.cells[x]     && chamber.cells[x][y + 1] && chamber.cells[x][y + 1].wall),
										right: 	!(chamber.cells[x + 1] && chamber.cells[x + 1][y] && chamber.cells[x + 1][y].wall),
										down: 	!(chamber.cells[x]     && chamber.cells[x][y - 1] && chamber.cells[x][y - 1].wall),
										left: 	!(chamber.cells[x - 1] && chamber.cells[x - 1][y] && chamber.cells[x - 1][y].wall)
									}

								// get images
									var directions = Object.keys(neighbors).filter(function(k) {
										return neighbors[k]
									}) || []
									
									chamber.cells[x][y].wall = "layer_" + layer + "_wall_" + directions.length + "_" + directions.join("")
							}
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

				// left
					if (chamber.cells[x - 1] && chamber.cells[x - 1][y] && !chamber.cells[x - 1][y].wall) {
						if (!connectedCells.includes((x - 1) + "," + (y))) {
							connectedCells.push((x - 1) + "," + (y))
						}
						createConnectionPaths(request, chamber, nodemap, x, y, x - 1, y, callback)
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
				// set to visited
					chamber.state.visited = true
					updateMinimap(request, chamber, callback)

				// loop through middle 5x5 and clear
					for (var x = -2; x <= 2; x++) {
						for (var y = -2; y <= 2; y++) {
							chamber.cells[x][y].wall = false
						}
					}

				// set pedestals
					var pedestals = main.getAsset("pedestals")
					for (var p in pedestals) {
						var pedestal = createItem(request, pedestals[p], callback)
						chamber.items[pedestal.id] = pedestal
					}

				// set fade-in
					chamber.state.cooldowns.activate = CONSTANTS.chamberCooldown * CONSTANTS.loadFade
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
					var chamberRadius = Math.floor(chamber.info.chamberSize / 2)
					var portalX = main.rangeRandom(-chamberRadius + CONSTANTS.edgeBuffer, chamberRadius - CONSTANTS.edgeBuffer)
					var portalY = main.rangeRandom(-chamberRadius + CONSTANTS.edgeBuffer, chamberRadius - CONSTANTS.edgeBuffer)

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
					var chamberRadius = Math.floor(chamber.info.chamberSize / 2)
					var shrineX = main.rangeRandom(-chamberRadius + CONSTANTS.edgeBuffer, chamberRadius - CONSTANTS.edgeBuffer)
					var shrineY = main.rangeRandom(-chamberRadius + CONSTANTS.edgeBuffer, chamberRadius - CONSTANTS.edgeBuffer)

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
							image: "shrine_" + shrineType + "_all_standing_default",
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

	/* createSpawns */
		module.exports.createSpawns = createSpawns
		function createSpawns(request, chamber, spawnTypes, temporary, callback) {
			try {
				var chamberRadius = Math.floor(chamber.info.chamberSize / 2)

				for (var s in spawnTypes) {
					// get spawnX & spawnY
						if (temporary) {
							var spawnX = 0
							var spawnY = 0
						}
						else {
							do {
								var spawnX = main.rangeRandom(-chamberRadius + CONSTANTS.edgeBuffer, chamberRadius - CONSTANTS.edgeBuffer)
								var spawnY = main.rangeRandom(-chamberRadius + CONSTANTS.edgeBuffer, chamberRadius - CONSTANTS.edgeBuffer)
							} while (Object.keys(chamber.items).filter(function(i) {
								return (chamber.items[i] && chamber.items[i].state.position.x == spawnX * CONSTANTS.cellSize && chamber.items[i].state.position.y == spawnY * CONSTANTS.cellSize)
							}).length)
						}

					// clear 3x3 area
						if (!temporary) {
							for (var x = spawnX - 1; x <= spawnX + 1; x++) {
								for (var y = spawnY - 1; y <= spawnY + 1; y++) {
									chamber.cells[x][y].wall = false
								}
							}
						}

					// get monsterTypes
						var monsterTypes = []
						for (var m in MONSTERS) {
							if (MONSTERS[m].info.rps == spawnTypes[s]) {
								monsterTypes.push(m)
							}
						}

					// create spawn
						var spawn = createItem(request, main.getAsset("spawn"), callback)
						main.overwriteObject(spawn, {
							info: {
								rps: spawnTypes[s],
								subtype: spawnTypes[s],
								color: main.getAsset("orbs")[spawnTypes[s]].info.color,
								monsterTypes: monsterTypes,
								temporary: temporary || false
							},
							state: {
								image: "spawn_" + spawnTypes[s] + "_all_standing_default",
								position: {
									x: spawnX * CONSTANTS.cellSize,
									y: spawnY * CONSTANTS.cellSize,
								}
							}
						})
					
					// add to chamber
						chamber.items[spawn.id] = spawn
				}
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
					var chamberRadius = Math.floor(chamber.info.chamberSize / 2)
					var orbX = main.rangeRandom(-chamberRadius + CONSTANTS.edgeBuffer, chamberRadius - CONSTANTS.edgeBuffer)
					var orbY = main.rangeRandom(-chamberRadius + CONSTANTS.edgeBuffer, chamberRadius - CONSTANTS.edgeBuffer)

					for (var x = orbX - 1; x <= orbX + 1; x++) {
						for (var y = orbY - 1; y <= orbY + 1; y++) {
							chamber.cells[x][y].wall = false
						}
					}

				// create orb
					var orb = createItem(request, main.getAsset("orbs")[orbType], callback)
					main.overwriteObject(orb, {
						state: {
							active: true,
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
								x: CONSTANTS.rangeAttackRadius * power,
								y: CONSTANTS.rangeAttackRadius * power
							},
							color: creature.info.color,
							statistics: {
								power: power,
								speed: creature.info.statistics.rangeSpeed
							}
						},
						state: {
							image: "rangeAttack_" + creature.info.subtype + "_" + creature.state.movement.direction + "_moving_default",
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

				// sound
					creature.state.sound = "rangeAttack_" + creature.info.subtype
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
								x: 0,
								y: 0
							},
							color: creature.info.color,
							statistics: {
								power: power
							}
						},
						state: {
							image: "areaAttack_" + creature.info.subtype + "_all_standing_default",
							position: {
								x: creature.state.position.x,
								y: creature.state.position.y
							}
						}
					})

				// add to items
					chamber.items[attack.id] = attack

				// sound
					creature.state.sound = "areaAttack_" + creature.info.subtype
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
					for (var x = -chamberRadius + CONSTANTS.edgeBuffer; x <= chamberRadius - CONSTANTS.edgeBuffer; x++) {
						for (var y = -chamberRadius + CONSTANTS.edgeBuffer; y <= chamberRadius - CONSTANTS.edgeBuffer; y++) {
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

	/* createHeroes */
		module.exports.createHeroes = createHeroes
		function createHeroes(request, callback) {
			try {
				// create each hero & add to game
					for (var h in HEROES) {
						var hero = createCreature(request, HEROES[h], callback)
						request.game.data.heroes[hero.id] = hero
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

/*** gets ***/
	/* getHeroOptions */
		module.exports.getHeroOptions = getHeroOptions
		function getHeroOptions(request, callback) {
			try {
				// keys of heroes without players
					var heroOptionKeys = Object.keys(request.game.data.heroes).filter(function(h) {
						return !request.game.data.heroes[h].player
					}) || []

				// heroes without players
					var heroOptions = heroOptionKeys.map(function(k) {
						return request.game.data.heroes[k]
					}) || []

				// return
					return heroOptions
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

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
					var thingRight = positionX + radiusX
					var thingDown  = positionY - radiusY
					var thingLeft  = positionX - radiusX
				
				// collision?
					if ((thingUp    > targetCoordinates.y - targetCoordinates.radiusY)
					 && (thingRight > targetCoordinates.x - targetCoordinates.radiusX)
					 && (thingDown  < targetCoordinates.y + targetCoordinates.radiusY)
					 && (thingLeft  < targetCoordinates.x + targetCoordinates.radiusX)) {
						// get deltas
							var deltaUp    = Math.abs(targetCoordinates.y + targetCoordinates.radiusY - thingDown )
							var deltaRight = Math.abs(targetCoordinates.x + targetCoordinates.radiusX - thingLeft )
							var deltaDown  = Math.abs(targetCoordinates.y - targetCoordinates.radiusY - thingUp   )
							var deltaLeft  = Math.abs(targetCoordinates.x - targetCoordinates.radiusX - thingRight)

						// get side
							var delta = Math.min(deltaUp, deltaRight, deltaDown, deltaLeft)
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
					var quarterCell	 = Math.ceil(CONSTANTS.cellSize / 4)
					var chamberUp    =  chamber.info.chamberSize * quarterCell * 2
					var chamberRight =  chamber.info.chamberSize * quarterCell * 2
					var chamberDown  = -chamber.info.chamberSize * quarterCell * 2
					var chamberLeft  = -chamber.info.chamberSize * quarterCell * 2
					var collision 	 = {
						side: null
					}

				// test each size
					if (targetCoordinates.y + targetCoordinates.radiusY > chamberUp - quarterCell) {
						var edge = "up"
						if (targetCoordinates.y + targetCoordinates.radiusY > chamberUp) {
							collision.side = "up"
						}
					}
					else if (targetCoordinates.x + targetCoordinates.radiusX > chamberRight - quarterCell) {
						var edge = "right"
						if (targetCoordinates.x + targetCoordinates.radiusX > chamberRight) {
							collision.side = "right"
						}
					}
					else if (targetCoordinates.y - targetCoordinates.radiusY < chamberDown + quarterCell) {
						var edge = "down"
						if (targetCoordinates.y - targetCoordinates.radiusY < chamberDown) {
							collision.side = "down"
						}
					}
					else if (targetCoordinates.x - targetCoordinates.radiusX < chamberLeft + quarterCell) {
						var edge = "left"
						if (targetCoordinates.x - targetCoordinates.radiusX < chamberLeft) {
							collision.side = "left"
						}
					}
					else {
						var edge = null
					}

				// resolve edge
					if (!edge) {
						return targetCoordinates
					}
					else {
						return resolveEdge(request, chamber, thing, targetCoordinates, collision, edge, callback)
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* resolveEdge */
		module.exports.resolveEdge = resolveEdge
		function resolveEdge(request, chamber, thing, targetCoordinates, collision, destination, callback) {
			try {
				// is edge? (or portal)
					var isEdge = CONSTANTS.directions.includes(destination)

				// heroes
					if (thing.info.type == "hero") {
						// save edge (or portal)
							thing.state.position.edge = destination

						// all agreed?
							var agreed = true
							for (var h in request.game.data.heroes) {
								if (request.game.data.heroes[h].state.alive && request.game.data.heroes[h].state.position.edge !== destination) {
									agreed = false
								}
							}

							if (agreed && !chamber.state.cooldowns.edge) {
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

								// updateNextChamber
									updateNextChamber(request, nextChamberX, nextChamberY, isEdge, callback)

								// reset heroes
									for (var h in request.game.data.heroes) {
										request.game.data.heroes[h].state.position.edge = null
									}
							}
					}

				// collision side ?
					if (collision && collision.side) {
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

						// shrine
							if (item.info.type == "shrine" && thing.info.type == "hero") {
								if (!item.state.cooldowns.activate) {
									thing.state.effects[item.info.subtype] = CONSTANTS.effectCooldown
								}
							}

						// portal
							else if (item.info.type == "portal" && thing.info.type == "hero") {
								if (!item.state.cooldowns.activate) {
									targetCoordinates = resolveEdge(request, chamber, thing, targetCoordinates, null, item.state.link, callback)
								}
							}

						// orbs
							else if (item.info.type == "orb" && item.state.active && ["hero", "monster", "creature"].includes(thing.info.type)) {
								// collect orb
									if (thing.info.type == "hero" && thing.info.rps == chamber.items[item.id].info.rps) {
										thing.items[item.id] = main.duplicateObject(chamber.items[item.id])
										delete chamber.items[item.id]

										chamber.state.overlay.orb = thing.info.rps
									}

								// stop movement
									else {
										targetCoordinates = resolveStop(request, targetCoordinates, collision, item, callback)
									}
							}

						// pedestal
							else if (item.info.type == "pedestal" && ["hero", "monster", "creature"].includes(thing.info.type)) {
								// deposit orb
									if (thing.info.type == "hero" && thing.info.rps == chamber.items[item.id].info.rps) {
										var itemKeys = Object.keys(thing.items)
										var orbKey = itemKeys.find(function(id) {
											return thing.items[id].info.type == "orb"
										})

										if (orbKey) {
											request.game.data.state.orbs++
											chamber.items[item.id].state.active = true
											chamber.items[item.id].state.flip = false
											chamber.items[item.id].info.style = "filled"
											resolvePoints(request, item, callback)

											delete thing.items[orbKey]

											chamber.state.overlay.orb = null
										}
									}

								// stop movement
									targetCoordinates = resolveStop(request, targetCoordinates, collision, item, callback)
							}
					}

				// meleeAttacks (other heroes / creatures)
					if (["hero", "monster", "creature"].includes(thing.info.type) && (collision.supertype == "hero" || collision.supertype == "creature" || collision.type == "spawn")) {
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
										// sound
											attack.state.sound = "collision_" + attack.info.type + "_" + recipient.info.type

										// power
											if (attack.info.type == "rangeAttack" || attack.info.type == "areaAttack") {
												var power = attack.info.statistics.power
											}
											else {
												var power = attacker.info.statistics.meleePower * (attacker.state.effects.rock ? CONSTANTS.rockMultiplier : 1)
											}

										// damage
											var alive = resolveDamage(request, chamber, recipient, {
												power: 	power,
												rps: 	attacker ? attacker.info.rps  : attack.info.rps,
												type: 	attacker ? attacker.info.type : attack.info.type
											}, callback)

										// kill
											if (!alive && attacker.info.type == "hero") {
												resolvePoints(request, recipient, callback)
											}
									}									

								// bump
									if (recipient.state.alive && (collision.supertype == "creature" || collision.supertype == "hero")) {
										if (attacker && (attacker.info.type !== "hero" || attacker.player || recipient.info.type !== "hero")) {
											var acceleration = attacker.info.statistics.bumpMove
											recipient.state.position.vx = recipient.state.position.vx + (collision.side == "right" ? acceleration : collision.side == "left" ? -acceleration : 0)
											recipient.state.position.vy = recipient.state.position.vy + (collision.side == "up"    ? acceleration : collision.side == "down" ? -acceleration : 0)
											recipient.state.movement.bumped = true
											recipient.state.vibration = [50]
										}
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
					if (collision.side == "up") {
						targetCoordinates.y = Math.round(Math.min(targetCoordinates.y, obstacle.state.position.y - (obstacle.info.size.y / 2) - targetCoordinates.radiusY))
						targetCoordinates.collisionY = true
					}
					else if (collision.side == "right") {
						targetCoordinates.x = Math.round(Math.min(targetCoordinates.x, obstacle.state.position.x - (obstacle.info.size.x / 2) - targetCoordinates.radiusX))
						targetCoordinates.collisionX = true
					}
					else if (collision.side == "down") {
						targetCoordinates.y = Math.round(Math.max(targetCoordinates.y, obstacle.state.position.y + (obstacle.info.size.y / 2) + targetCoordinates.radiusY))
						targetCoordinates.collisionY = true
					}
					else if (collision.side == "left") {
						targetCoordinates.x = Math.round(Math.max(targetCoordinates.x, obstacle.state.position.x + (obstacle.info.size.x / 2) + targetCoordinates.radiusX))
						targetCoordinates.collisionX = true
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
							var multiplier = 1
							switch (damage.rps) {
								case "rock":
									multiplier = (recipient.info.rps == "scissors") ? CONSTANTS.rpsMultiplier : (recipient.info.rps == "paper")    ? (1 / CONSTANTS.rpsMultiplier) : 1
								break
								case "paper":
									multiplier = (recipient.info.rps == "rock")     ? CONSTANTS.rpsMultiplier : (recipient.info.rps == "scissors") ? (1 / CONSTANTS.rpsMultiplier) : 1
								break
								case "scissors":
									multiplier = (recipient.info.rps == "paper")    ? CONSTANTS.rpsMultiplier : (recipient.info.rps == "rock")     ? (1 / CONSTANTS.rpsMultiplier) : 1
								break
							}

						// damage
							var totalDamage = Math.max(0, Math.floor(damage.power * multiplier))

						// reduce armor
							if (recipient.state.armor) {
								var inflictedDamage = Math.round(totalDamage * (1 - recipient.info.statistics.armorPower))
								recipient.state.armor = Math.max(0, recipient.state.armor - 1)
							}
							else {
								var inflictedDamage = totalDamage
							}

						// reduce health
							if (inflictedDamage > 0) {
								recipient.state.health = Math.max(0, Math.min(recipient.info.statistics.healthMax, recipient.state.health - inflictedDamage))
							}

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
									if (!recipient.state.cooldowns.death) {
										recipient.state.cooldowns.death = CONSTANTS.deathCooldown
									}

								// drop items
									if (recipient.items) {
										var x = Number(recipient.state.position.x)
										var y = Number(recipient.state.position.y)

										for (var i in recipient.items) {
											var item = main.duplicateObject(recipient.items[i])
												item.state.position.x = Math.round(x + Number(Math.floor(Math.random() * 2 * CONSTANTS.itemDropRadius) - CONSTANTS.itemDropRadius))
												item.state.position.y = Math.round(y + Number(Math.floor(Math.random() * 2 * CONSTANTS.itemDropRadius) - CONSTANTS.itemDropRadius))
											chamber.items[i] = item

											if (item.info.type == "orb") {
												chamber.state.overlay.orb = null
											}

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

	/* resolvePoints */
		module.exports.resolvePoints = resolvePoints
		function resolvePoints(request, thing, callback) {
			try {
				// points
					var points = 0

				// chamber
					if (thing.info && thing.info.type == "chamber") {
						points = thing.info.points || CONSTANTS.newChamberPoints
					}

				// creature
					else if (thing.info && (thing.info.type == "creature" || thing.info.type == "monster")) {
						points = thing.info.points || CONSTANTS.monsterPoints
					}

				// spawn
					else if (thing.info && thing.info.type == "spawn") {
						points = thing.info.points || CONSTANTS.spawnPoints
					}

				// pedestal
					else if (thing.info && thing.info.type == "pedestal") {
						points = thing.info.points || CONSTANTS.pedestalPoints
					}

				// points?
					if (points) {
						request.game.data.state.overlay.timeout = Math.max(0, Math.min(CONSTANTS.gameCooldown, request.game.data.state.overlay.timeout + points))
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
				// chamber
					var chamber = request.game.data.chambers[request.game.data.state.chamber.x][request.game.data.state.chamber.y]

				// paused
					if (request.game.data.state.paused) {
						request.game.data.state.overlay.message = CONSTANTS.pauseMessage
						callback(Object.keys(request.game.observers), {success: true, chamber: chamber})	
					}

				// game over
					else if (request.game.data.state.end) {
						callback(Object.keys(request.game.observers), {success: true, chamber: chamber, end: true})	
						callback(Object.keys(request.game.players), {success: true, end: true})
					}

				// play
					else {
						// time
							request.game.data.state.time += CONSTANTS.loopInterval

						// victory
							if (request.game.data.state.orbs >= CONSTANTS.rps.length) {
								request.game.data.state.end = true
								request.game.data.state.overlay.message = CONSTANTS.victoryMessage
							}

						// timeout
							else if (!request.game.data.state.overlay.timeout) {
								request.game.data.state.end = true
								request.game.data.state.overlay.message = CONSTANTS.defeatMessage
							}

						// full party death
							else if (request.game.data.state.start && !request.game.data.state.nextChamber
								&& !Object.keys(request.game.data.heroes).filter(function(h) {
									return request.game.data.heroes[h].player && request.game.data.heroes[h].state.alive
								}).length) {
								updateNextChamber(request, 0, 0, "reset", callback)
							}

						// chamber switch
							else if (request.game.data.state.nextChamber) {
								if (chamber.state.cooldowns.activate) {
									chamber.state.cooldowns.activate = Math.max(0, chamber.state.cooldowns.activate - 1)
								}
								else {
									updateChamber(request, callback)
									var chamber = request.game.data.chambers[request.game.data.state.chamber.x][request.game.data.state.chamber.y]
								}
							}
							else if (chamber.state.cooldowns.activate) {
								chamber.state.cooldowns.activate = Math.max(0, chamber.state.cooldowns.activate - 1)
							}

						// regular gameplay
							else {
								// started?
									if (!request.game.data.state.start) {
										if (Object.keys(request.game.players).length < 3) {
											request.game.data.state.overlay.message = CONSTANTS.joinMessage + request.game.id
										}
										else {
											request.game.data.state.overlay.message = CONSTANTS.startMessage
										}
									}
									else {
										request.game.data.state.overlay.message = null
										request.game.data.state.overlay.timeout = Math.max(0, Math.min(CONSTANTS.gameCooldown, request.game.data.state.overlay.timeout - 1))
									}

								// edge cooldown?
									chamber.state.cooldowns.edge = Math.max(0, chamber.state.cooldowns.edge - 1)

								// heroes
									for (var h in chamber.heroes) {
										var hero = chamber.heroes[h]
										if (hero) {
											updateCreature(request, chamber, hero, callback)
										}
									}

								// creatures
									for (var c in chamber.creatures) {
										var creature = chamber.creatures[c]
										if (creature) {
											updateCreature(request, chamber, creature, callback)
										}
									}

								// items
									for (var i in chamber.items) {
										var item = chamber.items[i]
										if (item) {
											updateItem(request, chamber, item, callback)
										}
									}
							}

						// send data
							callback(Object.keys(request.game.observers), {success: true, chamber: chamber})

							for (var p in request.game.players) {
								if (request.game.players[p].hero) {
									callback([p], {success: true, hero: request.game.data.heroes[request.game.players[p].hero]})
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

							// message
								request.game.data.state.overlay.message = CONSTANTS.teleportMessage
						}

					// full party death
						else if (isEdge == "reset") {
							// non-player heroes
								for (var h in request.game.data.heroes) {
									var hero = request.game.data.heroes[h]

									// stop effects
										if (!hero.player && hero.state.effects) {
											for (var e in hero.state.effects) {
												hero.state.effects[e] = 0
											}
										}
									
									// drop items
										if (!hero.player && hero.items) {
											var x = Number(hero.state.position.x)
											var y = Number(hero.state.position.y)

											for (var i in hero.items) {
												var item = main.duplicateObject(hero.items[i])
													item.state.position.x = Math.round(x + Number(Math.floor(Math.random() * 2 * CONSTANTS.itemDropRadius) - CONSTANTS.itemDropRadius))
													item.state.position.y = Math.round(y + Number(Math.floor(Math.random() * 2 * CONSTANTS.itemDropRadius) - CONSTANTS.itemDropRadius))
												request.game.data.chambers[oldX][oldY].items[i] = item

												delete hero.items[i]
											}
										}
								}

							// message
								request.game.data.state.overlay.message = CONSTANTS.deathMessage
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
					// start game if not already
						request.game.data.state.start = true

					// get old
						var oldX = Number(request.game.data.state.chamber.x)
						var oldY = Number(request.game.data.state.chamber.y)
						var oldChamber = request.game.data.chambers[oldX][oldY]
							oldChamber.state.fadeout  = false

					// remove dead creatures
						for (var c in oldChamber.creatures) {
							if (!oldChamber.creatures[c].state.alive) {
								delete oldChamber.creatures[c]
							}
						}

					// remove attacks & temporary spawns
						for (var i in oldChamber.items) {
							if (oldChamber.items[i].info.type == "rangeAttack"
							 || oldChamber.items[i].info.type == "areaAttack"
							 || oldChamber.items[i].info.type == "spawn" && oldChamber.items[i].info.temporary) {
								delete oldChamber.items[i]
							}
						}
					
					// get new
						var isEdge = request.game.data.state.nextChamber.isEdge
						var newX = Number(request.game.data.state.nextChamber.x)
						var newY = Number(request.game.data.state.nextChamber.y)
						var newChamber = request.game.data.chambers[newX][newY]
							newChamber.state.cooldowns.activate = CONSTANTS.chamberCooldown
							newChamber.state.cooldowns.edge 	= CONSTANTS.edgeCooldown

					// truly new?
						if (!newChamber.state.visited) {
							newChamber.state.visited = true
							updateMinimap(request, newChamber, callback)
							resolvePoints(request, newChamber, callback)
						}
					
					// set new
						request.game.data.state.chamber.x = newX
						request.game.data.state.chamber.y = newY

					// unset next
						request.game.data.state.nextChamber = null

					// full party death? reset hero positions
						if (isEdge == "reset") {
							newChamber.state.cooldowns.activate = CONSTANTS.chamberCooldown * 2
							request.game.data.state.overlay.message = CONSTANTS.deathMessage

							for (var h in request.game.data.heroes) {
								var hero = request.game.data.heroes[h]
								var clone = HEROES[hero.info.subtype]
									hero.state.position.x = clone.state.position.x
									hero.state.position.y = clone.state.position.y
									hero.info.size.x = hero.info.size.maxX
									hero.info.size.y = hero.info.size.maxY
									hero.info.opacity = 1
									hero.state.alive = true
									hero.state.health = hero.info.statistics.healthMax * CONSTANTS.reviveHealthFraction
							}
						}

					// edge? flip hero positions
						else if (isEdge) {
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

					// orb time? --> spawns
						if ((newX || newY) && newChamber.state.overlay.orb) {
							var existingSpawnCount = (Object.keys(newChamber.items).filter(function(key) {
								return (newChamber.items[key] && newChamber.items[key].info.type == "spawn" && newChamber.items[key].info.temporary)
							}) || []).length || 0

							var spawnArray = []
							while (spawnArray.length < CONSTANTS.temporarySpawnCount - existingSpawnCount) {
								spawnArray.push(newChamber.state.overlay.orb)
							}

							createSpawns(request, newChamber, spawnArray, true, callback)
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
				// resets
					creature.state.position.edge = null
					creature.state.sound = null
					creature.state.vibration = null
							
				// dead creature (not hero)
					if (!creature.state.alive) {
						// first time? sound / opacity
							if (creature.state.cooldowns.death == CONSTANTS.deathCooldown) {
								creature.info.opacity = CONSTANTS.deathOpacity
								creature.state.sound = "death_" + creature.info.type + "_" + creature.info.subtype
							}

						// reduce cooldown
							creature.state.cooldowns.death = Math.max(0, creature.state.cooldowns.death - CONSTANTS.deathFade)

						// reduce size
							creature.info.size.x = Math.max(0, creature.info.size.x * creature.state.cooldowns.death / CONSTANTS.deathCooldown)
							creature.info.size.y = Math.max(0, creature.info.size.y * creature.state.cooldowns.death / CONSTANTS.deathCooldown)

						// 0 cooldown?
							if (!creature.state.cooldowns.death) {
								// put hero at center
									if (creature.info.type == "hero") {
										creature.state.position.x = 0
										creature.state.position.y = 0
										creature.state.position.edge = null

										if (!chamber.info.x && !chamber.info.y) {
											var clone = HEROES[creature.info.subtype]
											creature.state.position.x = clone.state.position.x
											creature.state.position.y = clone.state.position.y
											creature.info.size.x = creature.info.size.maxX
											creature.info.size.y = creature.info.size.maxY
											creature.info.opacity = 1
											creature.state.alive = true
											creature.state.health = creature.info.statistics.healthMax * CONSTANTS.reviveHealthFraction
											creature.state.armor = creature.info.statistics.armorMax
										}
									}

								// delete creature
									else {
										delete chamber.creatures[creature.id]
									}
							}
					}

				// alive
					else {
						// no player? --> AI
							if (!creature.player) {
								// get path
									var cellX = Math.round(Math.abs(creature.state.position.x / CONSTANTS.cellSize)) * Math.sign(creature.state.position.x)
										if (cellX == -0) { cellX = 0 }
									var cellY = Math.round(Math.abs(creature.state.position.y / CONSTANTS.cellSize)) * Math.sign(creature.state.position.y)
										if (cellY == -0) { cellY = 0 }
									var path = PATHINGAI[creature.info.pathing](chamber, creature, cellX + "," + cellY, request.game.data.nodemaps[chamber.id])

								// get movement & direction
									updateMovement(request, creature, path, callback)

								// actions
									updateActions(request, chamber, creature, callback)
							}

						// accelerate
							updateAcceleration(request, creature, callback)

						// get actual target coordinates
							var targetCoordinates = {
								id: 		creature.id,
								radiusX: 	Math.ceil(creature.info.size.x / 2),
								radiusY: 	Math.ceil(creature.info.size.y / 2),
								x: 			Math.round(creature.state.position.x + creature.state.position.vx),
								y: 			Math.round(creature.state.position.y + creature.state.position.vy),
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
							creature.state.position.x = Math.round(targetCoordinates.x)
							creature.state.position.y = Math.round(targetCoordinates.y)

						// arrest movement?
							creature.state.position.vx = targetCoordinates.collisionX ? 0 : creature.state.position.vx
							creature.state.position.vy = targetCoordinates.collisionY ? 0 : creature.state.position.vy
						
						// armor
							var multiplier  = (creature.state.effects && creature.state.effects.paper) ? CONSTANTS.paperMultiplier : 1
							creature.state.armor = Math.max(0, Math.min(creature.info.statistics.armorMax * multiplier, creature.state.armor + multiplier))

						// healing
							if (!chamber.info.x && !chamber.info.y) {
								creature.state.health = Math.min(creature.info.statistics.healthMax, creature.state.health + CONSTANTS.heal)
							}

						// bumped
							if (creature.state.movement.bumped) {
								creature.state.movement.bumped = false

								if (creature.info.type == "hero") {
									creature.state.vibration = CONSTANTS.collisionVibration
									creature.state.sound = "collision_hero_object"
								}
							}

						// attacks
							else if (!Object.keys(creature.items).length) {
								// a
									if (creature.state.actions.a && !creature.state.cooldowns.a) {
										creature.state.cooldowns.a = CONSTANTS.aCooldown
										createRangeAttack(request, chamber, creature, callback)
									}

								// b
									if (creature.state.actions.b && !creature.state.cooldowns.b) {
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
				// reset
					item.state.sound = null

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

									targetCoordinates.x = Math.round(newX)
									targetCoordinates.y = Math.round(newY)

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
										item.info.statistics.power = 0
										item.info.size.x = 0
										item.info.size.y = 0
									}

								// move & shrink item
									else {
										item.state.position.x = Math.round(targetCoordinates.x)
										item.state.position.y = Math.round(targetCoordinates.y)
										item.info.statistics.power = Math.max(0, item.info.statistics.power - CONSTANTS.rangeAttackFade)
										item.info.size.x = Math.max(0, item.info.statistics.power * CONSTANTS.rangeAttackRadius)
										item.info.size.y = Math.max(0, item.info.statistics.power * CONSTANTS.rangeAttackRadius)
									}
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
									targetCoordinates.x = Math.round(attacker.state.position.x)
									targetCoordinates.y = Math.round(attacker.state.position.y)

								// resolve collisions
									targetCoordinates = resolveCollisions(request, chamber, item, targetCoordinates, callback)

								// move & grow item
									item.state.position.x = Math.round(attacker.state.position.x)
									item.state.position.y = Math.round(attacker.state.position.y)
									item.info.statistics.power = Math.max(0, item.info.statistics.power - CONSTANTS.areaAttackFade)
									item.info.opacity = Math.max(0, Math.min(1, item.info.opacity - (CONSTANTS.areaAttackFade * CONSTANTS.deathOpacity / 10)))
									item.info.size.x = Math.max(0, item.info.size.x + (CONSTANTS.areaAttackFade * CONSTANTS.areaAttackRadius))
									item.info.size.y = Math.max(0, item.info.size.y + (CONSTANTS.areaAttackFade * CONSTANTS.areaAttackRadius))
							}
					}

				// portal
					else if (item.info.type == "portal") {
						// get max cooldown
							var cooldownMax = CONSTANTS.portalCooldown

						// reduce cooldown
							item.state.cooldowns.activate = Math.max(0, item.state.cooldowns.activate - 1)

						// size
							item.info.size.x = item.info.size.maxX * ((cooldownMax - item.state.cooldowns.activate) / cooldownMax)
							item.info.size.y = item.info.size.maxY * ((cooldownMax - item.state.cooldowns.activate) / cooldownMax)

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
										portal.info.size.x = portal.info.size.maxX * ((cooldownMax - portal.state.cooldowns.activate) / cooldownMax)
										portal.info.size.y = portal.info.size.maxY * ((cooldownMax - portal.state.cooldowns.activate) / cooldownMax)
							}
					}
				
				// spawn
					else if (item.info.type == "spawn") {
						// get max cooldown
							var cooldownMax = CONSTANTS.spawnCooldown

						// reduce cooldown
							item.state.cooldowns.activate = Math.max(0, item.state.cooldowns.activate - 1)

						// dead?
							if (!item.state.alive) {
								// first time? sound
									if (item.state.cooldowns.death == CONSTANTS.deathCooldown) {
										item.info.opacity = CONSTANTS.deathOpacity
										item.state.sound = "death_" + item.info.type + "_" + item.info.subtype
									}

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

				// orb
					else if (item.info.type == "orb") {
						if (chamber.state.overlay.orb) {
							item.state.active = false
						}
						else {
							item.state.active = true
						}
					}

				// image
					updateImage(request, item, targetCoordinates, callback)
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateMovement */
		module.exports.updateMovement = updateMovement
		function updateMovement(request, creature, path, chamber) {
			try {
				// save path
					creature.state.movement.path = path

				// get deltaX / deltaY
					var nextCoords = path.split(" > ")[1] || path.split(" > ")[0]
					var nextCellCenterX = Number(nextCoords.split(",")[0]) * CONSTANTS.cellSize
					var nextCellCenterY = Number(nextCoords.split(",")[1]) * CONSTANTS.cellSize
					var deltaX = nextCellCenterX - creature.state.position.x
					var deltaY = nextCellCenterY - creature.state.position.y

				// get movement
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
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateActions */
		module.exports.updateActions = updateActions
		function updateActions(request, chamber, creature, callback) {
			try {
				// reset
					creature.state.actions.a = false
					creature.state.actions.b = false

				// heroes
					if (creature.info.type == "hero") {
						// get count of creatures & spawns
							var creatureCount = Object.keys(chamber.creatures).length
							var spawnCount = (Object.keys(chamber.items).filter(function(i) {
								return chamber.items[i].info.type == "spawn"
							}) || []).length
						
						// update attacks
							if (creatureCount || spawnCount) {
								creature.state.actions.a = main.rollRandom(CONSTANTS.monsterChanceA[0], CONSTANTS.monsterChanceA[1])
								creature.state.actions.b = main.rollRandom(CONSTANTS.monsterChanceB[0], CONSTANTS.monsterChanceB[1])
							}
					}

				// monsters
					else {
						// get distances of heroes within awareness
							var heroCount = 0
							for (var h in chamber.heroes) {
								var hero = chamber.heroes[h]
								if (hero.state.alive) {
									var distance = main.getDistance(creature.state.position.x, creature.state.position.y, hero.state.position.x, hero.state.position.y)
									if (distance <= CONSTANTS.monsterAwareness) {
										heroCount++
									}
								}
							}

						// update attacks
							if (heroCount) {
								creature.state.actions.a = main.rollRandom(CONSTANTS.monsterChanceA[0], CONSTANTS.monsterChanceA[1])
								creature.state.actions.b = main.rollRandom(CONSTANTS.monsterChanceB[0], CONSTANTS.monsterChanceB[1])
							}
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateAcceleration */
		module.exports.updateAcceleration = updateAcceleration
		function updateAcceleration(request, creature, callback) {
			try {
				// max
					var maxSpeed = creature.info.statistics.moveSpeed * (creature.state.effects.scissors ? CONSTANTS.scissorsMultiplier : 1)

				// x
					if (creature.state.movement.bumped) {
						creature.state.position.vx = creature.state.position.vx
					}
					else if (creature.state.movement.right) {
						creature.state.position.vx = Math.max(-maxSpeed, Math.min(maxSpeed, creature.state.position.vx + CONSTANTS.acceleration))
					}
					else if (creature.state.movement.left) {
						creature.state.position.vx = Math.max(-maxSpeed, Math.min(maxSpeed, creature.state.position.vx - CONSTANTS.acceleration))
					}
					else {
						creature.state.position.vx = Math.max(-maxSpeed, Math.min(maxSpeed, Math.max(0, Math.abs(creature.state.position.vx) - CONSTANTS.acceleration) * Math.sign(creature.state.position.vx)))
					}

				// y
					if (creature.state.movement.bumped) {
						creature.state.position.vy = creature.state.position.vy
					}
					else if (creature.state.movement.up) {
						creature.state.position.vy = Math.max(-maxSpeed, Math.min(maxSpeed, creature.state.position.vy + CONSTANTS.acceleration))
					}
					else if (creature.state.movement.down) {
						creature.state.position.vy = Math.max(-maxSpeed, Math.min(maxSpeed, creature.state.position.vy - CONSTANTS.acceleration))
					}
					else {
						creature.state.position.vy = Math.max(-maxSpeed, Math.min(maxSpeed, Math.max(0, Math.abs(creature.state.position.vy) - CONSTANTS.acceleration) * Math.sign(creature.state.position.vy)))
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateMinimap */
		module.exports.updateMinimap = updateMinimap
		function updateMinimap(request, chamber, callback) {
			try {
				// normal
					var chamberType = "normal"

				// temple
					if (!chamber.info.x && !chamber.info.y) {
						chamberType = "temple"
					}
					else {
						for (var i in chamber.items) {
							if (chamber.items[i].info.type == "shrine") {
								chamberType = chamber.items[i].info.subtype
								break
							}
							else if (chamber.items[i].info.type == "portal") {
								chamberType = "portal"
								break
							}
						}
					}

				// set
					chamber.state.overlay.minimap[chamber.info.x + "," + chamber.info.y] = chamberType

			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}

	/* updateImage */
		module.exports.updateImage = updateImage
		function updateImage(request, thing, targetCoordinates, callback) {
			try {
				// flip?
					var flip = (request.game.data.state.time % CONSTANTS.imageFlip >= CONSTANTS.imageFlip / 2)

				// heroes && creatures
					if (thing.info.type == "hero" || thing.info.type == "creature" || thing.info.type == "monster") {
						var imageName = []
							imageName.push(thing.info.type)
							imageName.push(thing.info.subtype)
							imageName.push(thing.state.movement ? thing.state.movement.direction : "all")
							imageName.push(thing.state.movement && thing.state.movement[thing.state.movement.direction] ? (flip ? "standing" : "moving") : "standing")
							imageName.push(thing.state.actions.a ? "rangeAttack" : thing.state.actions.b ? "areaAttack" : (targetCoordinates.collisionX || targetCoordinates.collisionY) ? "collision" : Object.keys(thing.items).length ? "holding" : "inactive")
						thing.state.image = imageName.join("_")
					}

				// items
					else {
						var imageName = []
							imageName.push(thing.info.type)
							imageName.push(thing.info.subtype)
							imageName.push(thing.state.movement ? thing.state.movement.direction : "all")
							imageName.push((thing.state.movement && thing.state.movement.direction) ? "moving" : "standing")
							imageName.push((thing.state.flip) ? (flip ? "active" : "default") : thing.state.active ? "active" : "default")
						thing.state.image = imageName.join("_")
					}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}
