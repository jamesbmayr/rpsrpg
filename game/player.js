/*** globals ***/
	/* elements */
		var SELECTION 	= document.getElementById("selection-inner")
		var WIRE 		= document.getElementById("wire")
		var CONTAINER 	= document.getElementById("container")
		var INFO 		= document.getElementById("info")
		var DPAD 		= document.getElementById("d-pad")
		var MIDDLE 		= document.getElementById("middle")
		var ACTIONS 	= document.getElementById("actions")
		var HEALTHBAR 	= document.getElementById("health-inner")
		var INPUTS = {
			up: 	document.getElementById("up"),
			down: 	document.getElementById("down"),
			left: 	document.getElementById("left"),
			right: 	document.getElementById("right"),
			start: 	document.getElementById("start"),
			a: 		document.getElementById("a"),
			b: 		document.getElementById("b")
		}
		var ENDLINK 	= document.getElementById("play-again")

	/* booleans */
		var SELECTED = false

	/* preloadSounds */
		var SOUNDS = []
		preloadSounds()
		function preloadSounds() {
			setTimeout(function() {
				try {
					for (var i in SFX.player) {
						var audio = new Audio()
							audio.id = SFX.player[i]
							audio.src = "/sfx/" + SFX.player[i] + ".mp3"
							audio.load()
						SOUNDS[SFX.player[i]] = audio
					}
				} catch (error) {}
			})
		}

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

	/* determineInput */
		document.addEventListener("keydown", determineInput)
		document.addEventListener("keyup", determineInput)
		function determineInput(event) {
			try {
				var input = null
				switch (event.key) {
					case "a":
						input = "left"
					break
					case "s":
						input = "down"
					break
					case "d":
						input = "right"
					break
					case "w":
						input = "up"
					break
					case "Escape":
						input = "start"
					break
					case "l":
						input = "b"
					break
					case "p":
						input = "a"
					break
				}

				if (input) {
					if (event.type == "keydown") {
						pressInput({target: INPUTS[input]})
					}
					else if (event.type == "keyup") {
						releaseInput({target: INPUTS[input]})
					}
				}
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

				// end?
					if (data.end) {
						ENDLINK.removeAttribute("hidden")
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
							button.style.backgroundImage = "url(/sprites/selection_" + heroOptions[h].info.subtype + ".png)"
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
				// hide selection
					if (!SELECTED) {
						SELECTED = true
						SELECTION.parentNode.setAttribute("hidden", true)
						INFO.removeAttribute("hidden")
						DPAD.removeAttribute("hidden")
						MIDDLE.removeAttribute("hidden")
						ACTIONS.removeAttribute("hidden")

						WIRE.style.backgroundColor = hero.info.color
						CONTAINER.style.borderColor = hero.info.color
					}

				// healthbar
					displayHealthbar(hero)

				// dpad & actions
					displayButtons(hero)

				// sounds
					if (hero.state.sound) {
						playAudio(hero.state.sound)
					}

				// vibration
					if (hero.state.vibration) {
						playVibration(hero.state.vibration)
					}
			} catch (error) {}
		}

	/* displayHealthBar */
		function displayHealthbar(hero) {
			try {
				// width
					var healthPercentage = Math.round(hero.state.health / hero.info.statistics.healthMax * 100)
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
					for (var a in CONSTANTS.actions) {
						var button = document.getElementById(CONSTANTS.actions[a])
						var size = Math.ceil(button.getBoundingClientRect().width)
						var fraction = (hero.state.cooldowns[CONSTANTS.actions[a]] / CONSTANTS[CONSTANTS.actions[a] + "Cooldown"]) / 3
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
						for (var a in CONSTANTS.actions) {
							INPUTS[CONSTANTS.actions[a]].setAttribute("effect", true)
						}
					}
					else {
						for (var a in CONSTANTS.actions) {
							INPUTS[CONSTANTS.actions[a]].removeAttribute("effect")
						}
					}

				// scissors effects
					if (hero.state.effects.scissors) {
						for (var d in CONSTANTS.directions) {
							INPUTS[CONSTANTS.directions[d]].setAttribute("effect", true)
						}
					}
					else {
						for (var d in CONSTANTS.directions) {
							INPUTS[CONSTANTS.directions[d]].removeAttribute("effect")
						}
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

	/* playVibration */
		function playVibration(vibrationArray) {
			try {
				navigator.vibrate(vibrationArray)
			} catch (error) {}
		}
