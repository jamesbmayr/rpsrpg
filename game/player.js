/*** globals ***/
	/* elements */
		var SELECTION = document.getElementById("selection-inner")
		var INFO = document.getElementById("info")
		var DPAD = document.getElementById("d-pad")
		var MIDDLE = document.getElementById("middle")
		var ACTIONS = document.getElementById("actions")
		var HEALTHBAR = document.querySelector("#health-inner")
		var INPUTS = {
			up: 	document.querySelector("#up"),
			down: 	document.querySelector("#down"),
			left: 	document.querySelector("#left"),
			right: 	document.querySelector("#right"),
			start: 	document.querySelector("#start"),
			a: 		document.querySelector("#a"),
			b: 		document.querySelector("#b")
		}

	/* booleans */
		var SELECTED = false

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

/*** inputs ***/
	/* selectHero */
		function selectHero(event) {
			try {
				socket.send(JSON.stringify({
					action: 	"selectHero",
					input: 		event.target.value
				}))
			} catch (error) {}
		}

	/* pressInput */
		for (var i in INPUTS) { INPUTS[i].addEventListener(on.mousedown, pressInput) }
		function pressInput(event) {
			try {
				event.target.setAttribute("active", true)
				socket.send(JSON.stringify({
					action: 	"pressInput",
					input: 		event.target.value
				}))
			} catch (error) {}
		}

	/* releaseInput */
		for (var i in INPUTS) { INPUTS[i].addEventListener(on.mouseup, releaseInput) }
		function releaseInput(event) {
			try {
				event.target.removeAttribute("active")
				socket.send(JSON.stringify({
					action: 	"releaseInput",
					input: 		event.target.value
				}))
			} catch (error) {}
		}

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

				// selection
					if (data.heroOptions) {
						displaySelection(data.heroOptions)
					}

				// info
					if (data.hero) {
						displayInfo(data.hero)
					}
			} catch (error) {}
		}

/*** display ***/
	/* displaySelection */
		function displaySelection(heroOptions) {
			try {
				// clear selection
					SELECTION.innerHTML = ""

				// create buttons
					for (var h in heroOptions) {
						var button = document.createElement("button")
							button.className = "selection-option"
							button.style.backgroundImage = "url(selection_" + heroOptions[h].info.subtype + ".png)"
							button.value = heroOptions[h].info.subtype
							button.addEventListener(on.click, selectHero)
						SELECTION.appendChild(button)
					}

				// no options?
					if (!heroOptions.length) {
						var message = document.createElement("div")
							message.className = "selection-message"
							message.innerText = "No heroes remaining."
						SELECTION.appendChild(message)
					}

				// hide controls
					INFO.setAttribute("hidden", true)
					DPAD.setAttribute("hidden", true)
					MIDDLE.setAttribute("hidden", true)
					ACTIONS.setAttribute("hidden", true)
			} catch (error) {}
		}

	/* displayInfo */
		function displayInfo(hero) {
			try {
				// hide selection/
					if (!SELECTED) {
						SELECTED = true
						SELECTION.parentNode.setAttribute("hidden", true)
						INFO.removeAttribute("hidden")
						DPAD.removeAttribute("hidden")
						MIDDLE.removeAttribute("hidden")
						ACTIONS.removeAttribute("hidden")
					}

				// healthbar
					displayHealthbar(hero)

				// dpad & actions
					displayButtons(hero)
			} catch (error) {}
		}

	/* displayHealthBar */
		function displayHealthbar(hero) {
			try {
				// width
					var healthPercentage = Math.round(hero.state.health / hero.state.healthMax * 100)
					HEALTHBAR.style.width = Math.min(100, Math.max(0, healthPercentage)) + "%"

				// color
					HEALTHBAR.setAttribute("color", healthPercentage > CONSTANTS.healthHigh ? "high" : healthPercentage > CONSTANTS.healthLow ? "medium" : "low")

				// paper effects
					if (hero.state.effects.paper) {
						HEALTHBAR.setAttribute("effect", true)
					}
					else {
						HEALTHBAR.removeAttribute("effect")
					}
			} catch (error) {}
		}

	/* displayButtons */
		function displayButtons(hero) {
			try {
				// action button sizes / border
					for (var c in hero.state.cooldowns) {
						var button = document.getElementById(c)
						var size = Math.ceil(button.getBoundingClientRect().width)
						var fraction = (hero.state.cooldowns[c] / CONSTANTS[c + "Cooldown"]) / 3
						button.style.borderWidth = Math.max(0, Math.min(size, fraction * size)) + "px"
					}

				// deactivate dpad / actions
					for (var i in INPUTS) {
						var id = INPUTS[i].id
						if (CONSTANTS.directions.includes(id)) {
							if (!hero.state.movement[id]) {
								INPUTS[i].removeAttribute("active")
							}
						}
						else if (CONSTANTS.actions.includes(id)) {
							if (!hero.state.actions[id]) {
								INPUTS[i].removeAttribute("active")
							}
						}
					}

				// rock effects
					if (hero.state.effects.rock) {
						INPUTS.a.setAttribute("effect", true)
						INPUTS.b.setAttribute("effect", true)
					}
					else {
						INPUTS.a.removeAttribute("effect")
						INPUTS.b.removeAttribute("effect")
					}

				// scissors effects
					if (hero.state.effects.scissors) {
						INPUTS.up.setAttribute(   "effect", true)
						INPUTS.down.setAttribute( "effect", true)
						INPUTS.left.setAttribute( "effect", true)
						INPUTS.right.setAttribute("effect", true)
					}
					else {
						INPUTS.up.removeAttribute(   "effect")
						INPUTS.down.removeAttribute( "effect")
						INPUTS.left.removeAttribute( "effect")
						INPUTS.right.removeAttribute("effect")
					}
			} catch (error) {}
		}
