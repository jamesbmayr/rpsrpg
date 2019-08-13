/*** globals ***/
	/* canvas */
		var CANVAS = document.getElementById("canvas")
		var CONTEXT = CANVAS.getContext("2d")
		var CHAMBERID = null
		var CHAMBERRADIUSX = 0
		var CHAMBERRADIUSY = 0

/*** websocket ***/
	/* socket */
		var socket = null
		createSocket()
		function createSocket() {
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
				}
				catch (error) {}
			}
		}

	/* checkLoop */
		var checkLoop = setInterval(function() {
			if (!socket) {
				try {
					createSocket()
				}
				catch (error) {}
			}
			else {
				clearInterval(checkLoop)
			}
		}, 5000)

/*** receives ***/
	/* receivePost */
		function receivePost(data) {
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
		}

/*** draws ***/
	/* drawChamber */
		function drawChamber(chamber) {
			// resize
				if (chamber.id !== CHAMBERID) {
					CHAMBERID 	   = chamber.id
					CANVAS.width   = chamber.info.chamberSize * chamber.info.cellSize
					CANVAS.height  = chamber.info.chamberSize * chamber.info.cellSize
					CHAMBERRADIUSX = Math.ceil(CANVAS.width  / 2)
					CHAMBERRADIUSY = Math.ceil(CANVAS.height / 2)
				}

			// clear
				clearCanvas(CANVAS, CONTEXT)

			// background
				drawRectangle(CANVAS, CONTEXT, 0, 0, canvas.width, canvas.height, {color: chamber.info.colors[0]})

			// minimap
				drawMinimap(chamber)
				// drawText(CANVAS, CONTEXT, CHAMBERRADIUSX, CHAMBERRADIUSY - 20, chamber.info.x + "," + chamber.info.y, {color: chamber.info.colors[1], size: 64})

			// draw walls
				drawWalls(chamber)

			// draw objects
				for (var o in chamber.objects) {
					drawObject(chamber.objects[o])
				}

			// draw creatures
				for (var c in chamber.creatures) {
					drawCreature(chamber.creatures[c])
				}

			// draw heroes
				for (var h in chamber.heroes) {
					drawHero(chamber.heroes[h])
				}
		}

	/* drawMinimap */
		function drawMinimap(chamber) {
			var squareRadius = Math.floor(CELLSIZE / (2 * LAYERS) / 2)
			var squareSize = squareRadius * 2
			var radii = {
				topLeft: 4,
				topRight: 4,
				bottomLeft: 4,
				bottomRight: 4
			}

			for (var x = 1 - LAYERS; x < LAYERS; x++) {
				for (var y = 1 - LAYERS; y < LAYERS; y++) {
					if (Math.abs(x) + Math.abs(y) < LAYERS) {
						var positionX = (x * squareSize) - squareRadius + CHAMBERRADIUSX
						var positionY = (y * squareSize) - squareRadius + CHAMBERRADIUSY
						var color = (x == chamber.info.x && y == chamber.info.y) ? chamber.info.colors[2] : chamber.info.colors[1]

						drawRectangle(CANVAS, CONTEXT, positionX, positionY, squareSize, squareSize, {color: color, radii: radii})
					}
				}
			}
		}

	/* drawWalls */
		function drawWalls(chamber) {
			var wallWidth  = CELLSIZE
			var wallHeight = CELLSIZE

			for (var x in chamber.cells) {
				for (var y in chamber.cells[x]) {
					if (chamber.cells[x][y].wall) {
						x = Number(x)
						y = Number(y)

						var wallX = x * wallWidth  + CHAMBERRADIUSX - (wallWidth / 2)
						var wallY = y * wallHeight + CHAMBERRADIUSY - (wallHeight / 2)

						var neighbors = {
							up: 	(chamber.cells[x]     && chamber.cells[x][y + 1] && chamber.cells[x][y + 1].wall),
							left: 	(chamber.cells[x - 1] && chamber.cells[x - 1][y] && chamber.cells[x - 1][y].wall),
							right: 	(chamber.cells[x + 1] && chamber.cells[x + 1][y] && chamber.cells[x + 1][y].wall),
							down: 	(chamber.cells[x]     && chamber.cells[x][y - 1] && chamber.cells[x][y - 1].wall)
						}

						var radii = {
							topRight: 		(!neighbors.up   && !neighbors.right) ? BORDERRADIUS : 0,
							topLeft: 		(!neighbors.up   && !neighbors.left ) ? BORDERRADIUS : 0,
							bottomRight: 	(!neighbors.down && !neighbors.right) ? BORDERRADIUS : 0,
							bottomLeft: 	(!neighbors.down && !neighbors.left ) ? BORDERRADIUS : 0
						}

						drawRectangle(CANVAS, CONTEXT, wallX, wallY, wallWidth, wallHeight, {color: chamber.info.colors[4], radii: radii})
					}
				}
			}
		}

	/* drawHero */
		function drawHero(hero) {
			// variables
				var heroX = hero.state.position.x + CHAMBERRADIUSX
				var heroY = hero.state.position.y + CHAMBERRADIUSY

				var heroRadius = Math.ceil(((hero.info.size.x + hero.info.size.y) / 2) / 2)
				var heroColor = hero.info.color

			// draw
				drawCircle(CANVAS, CONTEXT, heroX, heroY, heroRadius, {color: heroColor})
		}

	/* drawObject */
		function drawObject(object) {
			// variables
				var objectX = object.state.position.x - Math.ceil(object.info.size.x / 2) + CHAMBERRADIUSX
				var objectY = object.state.position.y + Math.ceil(object.info.size.y / 2) + CHAMBERRADIUSY
				var objectWidth = object.info.size.x
				var objectHeight = object.info.size.y * -1
				var objectColor = object.info.color

			// draw
				drawRectangle(CANVAS, CONTEXT, objectX, objectY, objectWidth, objectHeight, {color: objectColor})
		}

	/* drawCreature */
		function drawCreature(creature) {
			// variables
				var x1 = creature.state.position.x                                     + CHAMBERRADIUSX
				var y1 = creature.state.position.y + Math.ceil(object.info.size.y / 2) + CHAMBERRADIUSY
				var x2 = creature.state.position.x + Math.ceil(object.info.size.x / 2) + CHAMBERRADIUSX
				var y2 = creature.state.position.y - Math.ceil(object.info.size.y / 2) + CHAMBERRADIUSY
				var x3 = creature.state.position.x - Math.ceil(object.info.size.x / 2) + CHAMBERRADIUSX
				var y3 = creature.state.position.y - Math.ceil(object.info.size.y / 2) + CHAMBERRADIUSY
				var creatureColor = creature.info.color

			// draw
				drawTriangle(CANVAS, CONTEXT, x1, y1, x2, y2, x3, y3, {color: creature.info.color})
		}
