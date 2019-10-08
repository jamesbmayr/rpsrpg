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

				// submit
					sendPost(post, function(data) {
						if (!data.success) {
							displayMessage(data.message || "Unable to create a game...")
							document.getElementById("images").removeAttribute("animation")
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
							observing: (on.click == "click" && window.innerWidth >= CONSTANTS.observerWidth)
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
