/*** globals ***/
	/* canvas */
		var CANVAS = document.getElementById("canvas")
		var CONTEXT = CANVAS.getContext("2d")
		var CHAMBERID = null

		var TIMER = document.getElementById("timer")
		var TIMERCONTEXT = TIMER.getContext("2d")

	/* preloadImages */
		var IMAGES = []
		preloadImages()
		function preloadImages() {
			setTimeout(function() {
				try {
					for (var i in SPRITES) {
						var img = document.createElement("img")
							img.id = SPRITES[i]
							img.src = "/sprites/" + SPRITES[i] + ".png"
						IMAGES[SPRITES[i]] = img
					}
				} catch (error) {}
			}, 0)
		}

	/* preloadSounds */
		var MUSIC = false
		window.SOUNDS = SOUNDS
		var SOUNDS = []
		preloadSounds()
		function preloadSounds() {
			setTimeout(function() {
				try {
					for (var i in SFX.main) {
						var audio = new Audio()
							audio.id = SFX.main[i]
							audio.src = "/sfx/" + SFX.main[i] + ".mp3"
							audio.load()
						SOUNDS[SFX.main[i]] = audio
					}
				} catch (error) {}
			})
		}

	/* setVolume */
		window.setVolume = setVolume()
		function setVolume(name, percentage) {
			if (SOUNDS[name]) {
				SOUNDS[name].volume = Math.max(0, Math.min(1, Math.round(percentage / 100)))
			}
		}

	/* other */
		var ENDLINK = document.getElementById("play-again")
		var RADIANS = (Math.PI / 180)

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
					if (data.chamber) {
						drawChamber(data.chamber)
					}

				// end?
					if (data.end) {
						ENDLINK.removeAttribute("hidden")
					}

				// music
					if (!MUSIC) {
						MUSIC = SOUNDS["soundtrack"]
						MUSIC.loop = true
						MUSIC.pause()
						MUSIC.currentTime = 0
						MUSIC.play()
					}
			} catch (error) {}
		}

/*** draws: UI ***/
	/* drawChamber */
		function drawChamber(chamber) {
			try {
				// resize
					if (chamber.id !== CHAMBERID) {
						CHAMBERID 		= chamber.id
						CANVAS.width 	= chamber.info.chamberSize * chamber.info.cellSize
						CANVAS.height 	= chamber.info.chamberSize * chamber.info.cellSize
					}

				// drawTimer
					drawTimer(chamber)

				// clear & background
					clearCanvas(CANVAS, CONTEXT)
					drawBackground(chamber)

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
						drawCreature(chamber.heroes[h])
					}

				// overlay
					if (chamber.state.cooldowns.activate) {
						drawOverlay(chamber.state.cooldowns.activate, chamber.state.fadeout)
					}

					if (chamber.state.overlay.message) {
						drawOverlayMessage(chamber.state.overlay.message)
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

	/* drawOverlayMessage */
		function drawOverlayMessage(message) {
			try {
				// overlay
					var options = {
						color: CONSTANTS.colors.black[4],
						opacity: CONSTANTS.overlayOpacity,
						radii: {
							topLeft: CONSTANTS.borderRadius,
							topRight: CONSTANTS.borderRadius,
							bottomRight: CONSTANTS.borderRadius,
							bottomLeft: CONSTANTS.borderRadius
						}
					}
					drawRectangle(CANVAS, CONTEXT, CONSTANTS.borderRadius, CANVAS.height * 3 / 8, CANVAS.width - CONSTANTS.borderRadius * 2, CANVAS.height / 4, options)

				// text
					drawText(CANVAS, CONTEXT, CANVAS.width / 2, CANVAS.height / 2, message, {size: CONSTANTS.cellSize, color: CONSTANTS.colors.white[4], shadow: CONSTANTS.colors.black[4], blur: CONSTANTS.borderRadius})
			} catch (error) {}
		}

	/* drawMinimap */
		function drawMinimap(chamber) {
			try {
				// sizing variables
					var squareSize = Math.floor(chamber.info.cellSize / (2 * CONSTANTS.layers))
					var squareRadius = Math.floor(squareSize / 2)
					var radii = {
						topLeft: CONSTANTS.borderRadius / 4,
						topRight: CONSTANTS.borderRadius / 4,
						bottomRight: CONSTANTS.borderRadius / 4,
						bottomLeft: CONSTANTS.borderRadius / 4
					}

				// visited
					var visitedKeys = Object.keys(chamber.state.overlay.minimap)

				// loop through chambers, highlighting current chamber
					for (var x = 1 - CONSTANTS.layers; x < CONSTANTS.layers; x++) {
						for (var y = 1 - CONSTANTS.layers; y < CONSTANTS.layers; y++) {
							if (Math.abs(x) + Math.abs(y) < CONSTANTS.layers) {
								var positionX = (x * squareSize) + Math.ceil(CANVAS.width  / 2) - squareRadius
								var positionY = (y * squareSize) + Math.ceil(CANVAS.height / 2) - squareRadius

								var chamberType = visitedKeys.includes(x + "," + y) ? chamber.state.overlay.minimap[x + "," + y] : null
								var options = {
									color: (x == chamber.info.x && y == chamber.info.y) ? chamber.state.overlay.minimapColors.active : chamberType ? chamber.state.overlay.minimapColors.inactive : chamber.state.overlay.minimapColors.unexplored,
									radii: radii
								}

								drawRectangle(CANVAS, CONTEXT, positionX, positionY, squareSize, squareSize, options)

								if (chamberType && chamberType !== "normal") {
									drawCircle(CANVAS, CONTEXT, positionX + squareRadius, positionY + squareRadius, squareRadius / 2, {color: chamber.state.overlay.minimapColors[chamberType]})
								}
							}
						}
					}
			} catch (error) {}
		}

	/* drawTimer */
		function drawTimer(chamber) {
			try {
				// clear
					clearCanvas(TIMER, TIMERCONTEXT)

				// percentage
					var degrees = Math.max(0, Math.min(360, 360 * chamber.state.overlay.timeout / CONSTANTS.gameCooldown))
					var color = degrees > CONSTANTS.timeHigh ? CONSTANTS.colors.blue[2] : degrees > CONSTANTS.timeLow ? CONSTANTS.colors.yellow[2] : CONSTANTS.colors.red[2] 

				// update wheel
					drawCircle(TIMER, TIMERCONTEXT, TIMER.width / 2, TIMER.height / 2, TIMER.width * 2, {
						color: color,
						start: RADIANS * (degrees - 90),
						end:   RADIANS * -90
					})

			} catch (error) {}
		}

/*** draws: in-game ***/
	/* drawBackground */
		function drawBackground(chamber) {
			try {
				// image
					if (chamber.info.image && IMAGES[chamber.info.image]) {
						drawImage(CANVAS, CONTEXT, Math.ceil(CANVAS.width / 2), Math.ceil(CANVAS.height / 2), CANVAS.width, CANVAS.height, {image: IMAGES[chamber.info.image], opacity: 1})
					}

				// color
					else {
						drawRectangle(CANVAS, CONTEXT, 0, 0, CANVAS.width, CANVAS.height, {color: chamber.info.colors.background})
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
									var wallX = x * wallWidth  + Math.ceil(CANVAS.width  / 2)
									var wallY = y * wallHeight + Math.ceil(CANVAS.height / 2)

								// draw image
									if (IMAGES[chamber.cells[x][y].wall]) {
										drawImage(CANVAS, CONTEXT, wallX, wallY, wallWidth, wallHeight, {image: IMAGES[chamber.cells[x][y].wall], opacity: 1})
									}

								// draw square
									else {
										drawRectangle(CANVAS, CONTEXT, wallX - (wallWidth / 2), wallY - (wallWidth / 2), wallWidth, wallHeight, {color: chamber.info.colors.wall})
									}
							}
						}
					}
			} catch (error) {}
		}

	/* drawCreature */
		function drawCreature(creature) {
			try {
				// variables
					var creatureX = creature.state.position.x + Math.ceil(CANVAS.width  / 2)
					var creatureY = creature.state.position.y + Math.ceil(CANVAS.height / 2)
					var options = {
						image: IMAGES[creature.state.image] ? IMAGES[creature.state.image] : null,
						color: creature.info.color,
						shape: creature.info.shape,
						opacity: Math.max(0, Math.min(1, CONSTANTS.baseHealthOpacity + (creature.state.health / creature.info.statistics.healthMax * (1 - CONSTANTS.baseHealthOpacity))))
					}

				// draw
					if (options.image) {
						drawImage(CANVAS, CONTEXT, creatureX, creatureY, creature.info.size.x, creature.info.size.y, options)
					}
					else if (options.shape == "circle") {
						drawCircle(CANVAS, CONTEXT, creatureX, creatureY, Math.ceil(((creature.info.size.x + creature.info.size.y) / 2) / 2), options)
					}
					else if (options.shape == "triangle") {
						var x1 = creatureX
						var y1 = creatureY + (creature.info.size.y / 2)
						var x2 = creatureX + (creature.info.size.x / 2)
						var y2 = creatureY - (creature.info.size.y / 2)
						var x3 = creatureX - (creature.info.size.x / 2)
						var y3 = creatureY - (creature.info.size.y / 2)

						drawTriangle(CANVAS, CONTEXT, x1, y1, x2, y2, x3, y3, options)
					}
					else if (options.shape == "square") {
						options.radii = {
							topLeft: 		CONSTANTS.borderRadius,
							topRight: 		CONSTANTS.borderRadius,
							bottomRight: 	CONSTANTS.borderRadius,
							bottomLeft: 	CONSTANTS.borderRadius
						}
						drawRectangle(CANVAS, CONTEXT, creatureX - (creature.info.size.x / 2), creatureY - (creature.info.size.y / 2), creature.info.size.x, creature.info.size.y, options)
					}

				// sounds
					if (creature.state.sound) {
						playAudio(creature.state.sound)
					}

				// items
					for (var i in creature.items) {
						drawItem({
							info: {
								color: item.info.color,
								shape: item.info.shape,
								style: item.info.style,
								opacity: item.info.opacity,
								size: {
									x: item.info.size.x,
									y: item.info.size.y
								}
							},
							state: {
								image: item.state.image,
								position: {
									x: creature.state.position.x,
									y: creature.state.position.y
								}
							}
						})
					}
			} catch (error) {}
		}

	/* drawItem */
		function drawItem(item) {
			try {
				// variables
					var itemX = item.state.position.x + Math.ceil(CANVAS.width  / 2)
					var itemY = item.state.position.y + Math.ceil(CANVAS.height / 2)
					var options = {
						image: IMAGES[item.state.image] ? IMAGES[item.state.image] : null,
						color: item.info.color,
						shape: item.info.shape,
						opacity: item.info.opacity || 1,
						border: (item.info.style == "border") ? CONSTANTS.borderThickness : null
					}

					if (item.state.health) {
						options.opacity = Math.max(0, Math.min(1, CONSTANTS.baseHealthOpacity + (item.state.health / item.info.statistics.healthMax * (1 - CONSTANTS.baseHealthOpacity))))
					}

				// draw
					if (options.image) {
						drawImage(CANVAS, CONTEXT, itemX, itemY, item.info.size.x, item.info.size.y, options)
					}
					else if (options.shape == "circle") {
						drawCircle(CANVAS, CONTEXT, itemX, itemY, Math.ceil(((item.info.size.x + item.info.size.y) / 2) / 2), options)
					}
					else if (options.shape == "triangle") {
						var x1 = itemX
						var y1 = itemY + (item.info.size.y / 2)
						var x2 = itemX + (item.info.size.x / 2)
						var y2 = itemY - (item.info.size.y / 2)
						var x3 = itemX - (item.info.size.x / 2)
						var y3 = itemY - (item.info.size.y / 2)

						drawTriangle(CANVAS, CONTEXT, x1, y1, x2, y2, x3, y3, options)
					}
					else if (options.shape == "square") {
						options.radii = {
							topLeft: 		CONSTANTS.borderRadius,
							topRight: 		CONSTANTS.borderRadius,
							bottomRight: 	CONSTANTS.borderRadius,
							bottomLeft: 	CONSTANTS.borderRadius
						}
						drawRectangle(CANVAS, CONTEXT, itemX - (item.info.size.x / 2), itemY - (item.info.size.y / 2), item.info.size.x, item.info.size.y, options)
					}

				// sounds
					if (item.state.sound) {
						playAudio(item.state.sound)
					}
			} catch (error) {}
		}

/*** audio ***/
	/* playAudio */
		function playAudio(soundEffect) {
			try {
				if (soundEffect && SOUNDS[soundEffect]) {
					var audio = SOUNDS[soundEffect]
						audio.pause()
						audio.currentTime = 0
						audio.play().catch(function(error) {})
				}
			} catch (error) {}
		}
