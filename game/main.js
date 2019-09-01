/*** globals ***/
	/* canvas */
		var CANVAS = document.getElementById("canvas")
		var CONTEXT = CANVAS.getContext("2d")
		var CHAMBERID = null

/*** websocket ***/
	/* socket */
		var socket = null
		createSocket()
		function createSocket() {
			try {
				socket = new WebSocket(location.href.replace("http","ws"))
				socket.onopen = function() { socket.send(null) }
				socket.onerror = function(error) {}
				socket.onclose = function() {
					socket = null
					window.location = "../../../../"
				}

				socket.onmessage = function(message) {
					try {
						var post = JSON.parse(message.data)
						if (post && (typeof post == "object")) {
							receivePost(post)
						}
					} catch (error) {}
				}
			} catch (error) {}
		}

	/* checkLoop */
		var checkLoop = setInterval(function() {
			try {
				if (!socket) {
					try {
						createSocket()
					}
					catch (error) {}
				}
				else {
					clearInterval(checkLoop)
				}
			} catch (error) {}
		}, 5000)

/*** receives ***/
	/* receivePost */
		function receivePost(data) {
			try {
				// redirect
					if (data.location) {
						window.location = data.location
					}

				// message
					if (data.message) {
						displayMessage(data.message)
					}

				// info
					if (data.data) {
						drawChamber(data.data)
					}

				// paused
					if (data.paused) {
						drawPaused()
					}
			} catch (error) {}
		}

/*** draws ***/
	/* drawPaused */
		function drawPaused() {
			try {
				// overlay
					drawRectangle(CANVAS, CONTEXT, 0, 0, CANVAS.width, CANVAS.height, {color: CONSTANTS.colors.black[4], opacity: CONSTANTS.pauseOpacity})

				// text
					drawText(CANVAS, CONTEXT, CANVAS.width / 2, CANVAS.height / 2, "PAUSED", {size: CONSTANTS.cellSize * 2, color: CONSTANTS.colors.white[4], shadow: CONSTANTS.colors.black[4], blur: CONSTANTS.borderRadius})
			} catch (error) {}
		}

	/* drawChamber */
		function drawChamber(chamber) {
			try {
				// resize
					if (chamber.id !== CHAMBERID) {
						CHAMBERID 	   = chamber.id
						CANVAS.width   = chamber.info.chamberSize * chamber.info.cellSize
						CANVAS.height  = chamber.info.chamberSize * chamber.info.cellSize
					}

				// clear
					clearCanvas(CANVAS, CONTEXT)

				// background
					drawRectangle(CANVAS, CONTEXT, 0, 0, CANVAS.width, CANVAS.height, {color: chamber.info.colors[0]})

				// minimap
					drawMinimap(chamber)

				// draw walls
					drawWalls(chamber)

				// draw items
					for (var i in chamber.items) {
						drawItem(chamber.items[i])
					}

				// draw creatures
					for (var c in chamber.creatures) {
						drawCreature(chamber.creatures[c])
					}

				// draw heroes
					for (var h in chamber.heroes) {
						drawHero(chamber.heroes[h])
					}

				// overlay
					if (chamber.state.cooldown) {
						drawOverlay(chamber.state.cooldown, chamber.state.fadeout)
					}
			} catch (error) {}
		}

	/* drawOverlay */
		function drawOverlay(cooldown, fadeout) {
			try {
				// fade out
					if (fadeout) {
						var opacity = Math.max(0, Math.min(1, (CONSTANTS.chamberCooldown - cooldown) / CONSTANTS.chamberCooldown))
					}

				// fade in
					else {
						var opacity = Math.max(0, Math.min(1, cooldown / CONSTANTS.chamberCooldown))
					}

				// draw
					drawRectangle(CANVAS, CONTEXT, 0, 0, CANVAS.width, CANVAS.height, {color: CONSTANTS.colors.black[4], opacity: opacity})
			} catch (error) {}
		}

	/* drawMinimap */
		function drawMinimap(chamber) {
			try {
				// sizing variables
					var squareRadius = Math.floor(chamber.info.cellSize / (2 * CONSTANTS.layers) / 2)
					var squareSize = squareRadius * 2
					var radii = {
						topLeft: CONSTANTS.borderRadius / 4,
						topRight: CONSTANTS.borderRadius / 4,
						bottomLeft: CONSTANTS.borderRadius / 4,
						bottomRight: CONSTANTS.borderRadius / 4
					}

				// loop through chambers, highlighting current chamber
					for (var x = 1 - CONSTANTS.layers; x < CONSTANTS.layers; x++) {
						for (var y = 1 - CONSTANTS.layers; y < CONSTANTS.layers; y++) {
							if (Math.abs(x) + Math.abs(y) < CONSTANTS.layers) {
								var positionX = (x * squareSize) - squareRadius + Math.ceil(CANVAS.width  / 2)
								var positionY = (y * squareSize) - squareRadius + Math.ceil(CANVAS.height / 2)
								var color = (x == chamber.info.x && y == chamber.info.y) ? chamber.info.colors[2] : chamber.info.colors[1]

								drawRectangle(CANVAS, CONTEXT, positionX, positionY, squareSize, squareSize, {color: color, radii: radii})
							}
						}
					}
			} catch (error) {}
		}

	/* drawWalls */
		function drawWalls(chamber) {
			try {
				// dimensions
					var wallWidth  = chamber.info.cellSize
					var wallHeight = chamber.info.cellSize

				// loop through cells to find walls
					for (var x in chamber.cells) {
						for (var y in chamber.cells[x]) {
							if (chamber.cells[x][y].wall) {
								// get coordinates
									x = Number(x)
									y = Number(y)
									var wallX = x * wallWidth  + Math.ceil(CANVAS.width  / 2) - (wallWidth / 2)
									var wallY = y * wallHeight + Math.ceil(CANVAS.height / 2) - (wallHeight / 2)

								// get neighbors
									var neighbors = {
										up: 	(chamber.cells[x]     && chamber.cells[x][y + 1] && chamber.cells[x][y + 1].wall),
										left: 	(chamber.cells[x - 1] && chamber.cells[x - 1][y] && chamber.cells[x - 1][y].wall),
										right: 	(chamber.cells[x + 1] && chamber.cells[x + 1][y] && chamber.cells[x + 1][y].wall),
										down: 	(chamber.cells[x]     && chamber.cells[x][y - 1] && chamber.cells[x][y - 1].wall)
									}

								// get radii
									var radii = {
										topRight: 		(!neighbors.up   && !neighbors.right) ? CONSTANTS.borderRadius : 0,
										topLeft: 		(!neighbors.up   && !neighbors.left ) ? CONSTANTS.borderRadius : 0,
										bottomRight: 	(!neighbors.down && !neighbors.right) ? CONSTANTS.borderRadius : 0,
										bottomLeft: 	(!neighbors.down && !neighbors.left ) ? CONSTANTS.borderRadius : 0
									}

								// draw
									drawRectangle(CANVAS, CONTEXT, wallX, wallY, wallWidth, wallHeight, {color: chamber.info.colors[4], radii: radii})
							}
						}
					}
			} catch (error) {}
		}

	/* drawHero */
		function drawHero(hero) {
			try {
				// variables
					var heroX = hero.state.position.x + Math.ceil(CANVAS.width  / 2)
					var heroY = hero.state.position.y + Math.ceil(CANVAS.height / 2)
					var heroRadius = Math.ceil(((hero.info.size.x + hero.info.size.y) / 2) / 2)
					var heroColor = hero.info.color
					var heroOpacity = hero.state.alive ? 1 : CONSTANTS.deadOpacity

				// draw
					drawCircle(CANVAS, CONTEXT, heroX, heroY, heroRadius, {color: heroColor, opacity: heroOpacity})

				// orb ?
					for (var i in hero.items) {
						if (hero.items[i].info.type == "orb") {
							var item = hero.items[i]
							var itemRadius = Math.ceil(((item.info.size.x + item.info.size.y) / 2) / 2)
							var itemColor = item.info.color

							drawCircle(CANVAS, CONTEXT, heroX, heroY, itemRadius, {color: itemColor, opacity: heroOpacity})
						}
					}
			} catch (error) {}
		}

	/* drawItem */
		function drawItem(item) {
			try {
				// variables
					var itemX = item.state.position.x + Math.ceil(CANVAS.width  / 2)
					var itemY = item.state.position.y + Math.ceil(CANVAS.height / 2)
					var itemRadius = Math.ceil(((item.info.size.x + item.info.size.y) / 2) / 2)
					var itemOptions = {
						color: item.info.color
					}

					if (item.info.style == "border") {
						itemOptions.border = CONSTANTS.borderThickness
					}
					if (item.info.opacity) {
						itemOptions.opacity = item.info.opacity
					}

				// draw
					if (item.info.shape == "circle") {
						drawCircle(CANVAS, CONTEXT, itemX, itemY, itemRadius, itemOptions)
					}
					else if (item.info.shape == "square") {
						itemOptions.radii = {
							topLeft: 		CONSTANTS.borderRadius,
							topRight: 		CONSTANTS.borderRadius,
							bottomRight: 	CONSTANTS.borderRadius,
							bottomLeft: 	CONSTANTS.borderRadius
						}
						drawRectangle(CANVAS, CONTEXT, itemX - itemRadius, itemY - itemRadius, itemRadius * 2, itemRadius * 2, itemOptions)
					}
			} catch (error) {}
		}

	/* drawCreature */
		function drawCreature(creature) {
			try {
				// variables
					var creatureColor = creature.info.color
					var creatureRadius = Math.ceil(((creature.info.size.x + creature.info.size.y) / 2) / 2)
					if (creature.state.cooldowns.death !== undefined) {
						creatureRadius = Math.ceil(creatureRadius * creature.state.cooldowns.death / CONSTANTS.deathCooldown)
					}

				// coordinates
					var x1 = creature.state.position.x                  + Math.ceil(CANVAS.width  / 2)
					var y1 = creature.state.position.y + creatureRadius + Math.ceil(CANVAS.height / 2)
					var x2 = creature.state.position.x + creatureRadius + Math.ceil(CANVAS.width  / 2)
					var y2 = creature.state.position.y - creatureRadius + Math.ceil(CANVAS.height / 2)
					var x3 = creature.state.position.x - creatureRadius + Math.ceil(CANVAS.width  / 2)
					var y3 = creature.state.position.y - creatureRadius + Math.ceil(CANVAS.height / 2)

				// draw
					drawTriangle(CANVAS, CONTEXT, x1, y1, x2, y2, x3, y3, {color: creature.info.color})
			} catch (error) {}
		}
