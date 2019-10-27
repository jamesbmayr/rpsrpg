/*** helpers ***/
	/* isNumLet */
		function isNumLet(string) {
			return (/^[a-z0-9A-Z_\s]+$/).test(string)
		}

/*** actions ***/
	/* createGame */
		document.getElementById("createGame").addEventListener(on.click, createGame)
		function createGame() {
			try {
				// data
					var post = {
						action: "createGame"
					}

				// loading messages
					displayMessage("creating game...")
					document.getElementById("images").setAttribute("animation", true)
					document.getElementById("container").setAttribute("story", true)

				// submit
					sendPost(post, function(data) {
						if (!data.success) {
							displayMessage(data.message || "Unable to create a game...")
							document.getElementById("images").removeAttribute("animation")
							document.getElementById("container").removeAttribute("story")
						}
						else {
							window.location = data.location
						}
					})
			} catch (error) {}
		}

	/* joinGame */
		document.getElementById("joinGame").addEventListener(on.click, joinGame)
		document.getElementById("gameCode").addEventListener(on.keyup, function (event) { if (event.which == 13) { joinGame() } })
		function joinGame() {
			try {
				// get values
					var gameCode = document.getElementById("gameCode").value.replace(" ","").trim().toLowerCase() || false

				if (gameCode.length !== 4) {
					displayMessage("The game code must be 4 characters.")
				}
				else if (!isNumLet(gameCode)) {
					displayMessage("The game code can be letters only.")
				}
				else {
					// data
						var post = {
							action: "joinGame",
							gameid: gameCode,
							observing: (on.click == "click" && window.innerWidth >= CONSTANTS.maxContainerWidth)
						}

					// submit
						sendPost(post, function(data) {
							if (!data.success) {
								displayMessage(data.message || "Unable to join this game...")
							}
							else {
								window.location = data.location
							}
						})
				}
			} catch (error) {}
		}

/*** animations ***/
	/* globals */
		var animationLoop = setInterval(animateSprites, CONSTANTS.loopInterval)
		var SPRITES = {
			barbarian: document.getElementById("barbarian"),
			wizard: document.getElementById("wizard"),
			ranger: document.getElementById("ranger")
		}

	/* animateSprites */
		function animateSprites() {
			try {
				// loop through rps
					for (var i in SPRITES) {
						var reset = moveSprite(SPRITES[i])

						// reset
							if (reset) {
								resetSprite(SPRITES[i])
							}
					}
			} catch (error) {}
		}

	/* resetSprite */
		function resetSprite(sprite) {
			try {
				// random direction
					var direction = chooseRandom(CONSTANTS.directions)
					var height = Number(sprite.offsetHeight)
					var width = Number(sprite.offsetWidth)

				// position
					if (direction == "up") {
						var top  = window.innerHeight + height
						var left = rangeRandom(height, window.innerWidth - height)
					}
					else if (direction == "right") {
						var top = rangeRandom(width, window.innerHeight - width)
						var left = 0 - width
					}
					else if (direction == "down") {
						var top = 0 - height
						var left = rangeRandom(height, window.innerWidth - height)
					}
					else if (direction == "left") {
						var top = rangeRandom(width, window.innerHeight - width)
						var left = window.innerWidth + width
					}
				
				// reset sprite
					sprite.setAttribute("direction", direction)
					sprite.style.top = top + "px"
					sprite.style.left = left + "px"
			} catch (error) {}
		}

	/* moveSprite */
		function moveSprite(sprite) {
			try {
				// direction
					var direction = sprite.getAttribute("direction")
					if (!direction) {
						return true
					}

				// position
					var top = Number(sprite.style.top.replace("px", ""))
					var left = Number(sprite.style.left.replace("px", ""))
					var height = Number(sprite.offsetHeight)
					var width = Number(sprite.offsetWidth)

				// right
					if (direction == "right") {
						if (left > window.innerWidth + width) {
							return true
						}
						else {
							sprite.style.left = (left + CONSTANTS.animationDistance) + "px"
						}
					}

				// left
					else if (direction == "left") {
						if (left < -width) {
							return true
						}
						else {
							sprite.style.left = (left - CONSTANTS.animationDistance) + "px"
						}
					}

				// up
					else if (direction == "up") {
						if (top < -height) {
							return true
						}
						else {
							sprite.style.top = (top - CONSTANTS.animationDistance) + "px"
						}
					}

				// down
					else if (direction == "down") {
						if (top > window.innerHeight + height) {
							return true
						}
						else {
							sprite.style.top = (top + CONSTANTS.animationDistance) + "px"
						}
					}
			} catch (error) {}
		}