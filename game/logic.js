/*** modules ***/
	var main       = require("../main/logic")
	module.exports = {}

/*** maps ***/
	var DIRECTIONS 	= main.getAsset("directions")
	var HEROES 		= main.getAsset("heroes")
	var COLORS 		= main.getAsset("colors")

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

						case (request.post.input == "a"):
							triggerPrimary(request, callback)
						break

						case (request.post.input == "b"):
							triggerSecondary(request, callback)
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

						case (request.post.input == "a"):
							untriggerPrimary(request, callback)
						break

						case (request.post.input == "b"):
							untriggerSecondary(request, callback)
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

	/* triggerPrimary */
		module.exports.triggerPrimary = triggerPrimary
		function triggerPrimary(request, callback) {
			try {
				var hero = request.game.data.heroes[request.session.id]
					hero.state.actions.primary = true
					hero.state.actions.secondary = false
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* untriggerPrimary */
		module.exports.untriggerPrimary = untriggerPrimary
		function untriggerPrimary(request, callback) {
			try {
				var hero = request.game.data.heroes[request.session.id]
					hero.state.actions.primary = false
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* triggerSecondary */
		module.exports.triggerSecondary = triggerSecondary
		function triggerSecondary(request, callback) {
			try {
				var hero = request.game.data.heroes[request.session.id]
					hero.state.actions.primary = false
					hero.state.actions.secondary = true
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

	/* untriggerSecondary */
		module.exports.untriggerSecondary = untriggerSecondary
		function untriggerSecondary(request, callback) {
			try {
				var hero = request.game.data.heroes[request.session.id]
					hero.state.actions.secondary = false
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}

/*** creates ***/
	/* createHero */
		module.exports.createHero = createHero
		function createHero(request, callback) {
			try {
				// get remaining heroes
					var remainingTypes = Object.keys(HEROES)
					for (var h in request.game.data.heroes) {
						remainingTypes = remainingTypes.filter(function (r) {
							return r !== request.game.data.heroes[h].info.type
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

						if (     (!chambers[x + 1] || !chambers[x + 1][y - 1]) && Math.abs(x += 1) + Math.abs(y -= 1) == layer) {
							x += 1
							y -= 1
						}
						else if ((!chambers[x - 1] || !chambers[x - 1][y - 1]) && Math.abs(x -= 1) + Math.abs(y -= 1) == layer) {
							x -= 1
							y -= 1
						}
						else if ((!chambers[x - 1] || !chambers[x - 1][y + 1]) && Math.abs(x -= 1) + Math.abs(y += 1) == layer) {
							x -= 1
							y += 1
						}
						else if ((!chambers[x + 1] || !chambers[x + 1][y + 1]) && Math.abs(x += 1) + Math.abs(y += 1) == layer) {
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
		function createChamber(request, x, y, callback) {
			try {
				// create chamber & add to game
					var chamber = main.getSchema("chamber")
						chamber.info.x = x
						chamber.info.y = y
						chamber.heroes = request.game.data.heroes
						chamber.colors = COLORS[main.chooseRandom(Object.keys(COLORS))]

					if (!request.game.data.chambers[x]) {
						request.game.data.chambers[x] = {}
					}
					request.game.data.chambers[x][y] = chamber
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
					var chamberUp    =  chamber.info.size.y / 2
					var chamberLeft  = -chamber.info.size.x / 2
					var chamberRight =  chamber.info.size.x / 2
					var chamberDown  = -chamber.info.size.y / 2

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

	/* getCollisions */
		module.exports.getCollisions = getCollisions
		function getCollisions(request, chamber, targetCoordinates, callback) {
			try {
				// collisions
					var collisions = []

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
					if ((objectUp    >= targetCoordinates.down )
					 && (objectLeft  <= targetCoordinates.right)
					 && (objectRight >= targetCoordinates.left )
					 && (objectDown  <= targetCoordinates.up   )) {
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

				// get nextChamber
					var nextChamberX = chamber.info.x + (edge == "left" ? -1 : edge == "right" ? 1 : 0)
					var nextChamberY = chamber.info.y + (edge == "down" ? -1 : edge == "up"    ? 1 : 0)
					var nextChamber = request.game.data.chambers[nextChamberX] ? (request.game.data.chambers[nextChamberX][nextChamberY] || null) : null

				// no chamber
					if (!nextChamber) {
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
						callback(Object.keys(request.game.players).concat(Object.keys(request.game.observers)), {success: true, data: chamber})
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
					creature.state.position.x = targetCoordinates.x
					creature.state.position.y = targetCoordinates.y
					return
			}
			catch (error) {
				main.logError(error)
				callback([request.session.id], {success: false, message: "unable to " + arguments.callee.name})
			}
		}
