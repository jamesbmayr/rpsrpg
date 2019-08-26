/*** globals ***/
	var INPUTS = Array.from(document.querySelectorAll(".input"))
	var HEALTHBAR = document.querySelector("#health-inner")
	var POINTSBAR = document.querySelector("#points-inner")

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

/*** inputs ***/
	/* pressInput */
		INPUTS.forEach(function(input) { input.addEventListener(on.mousedown, pressInput) })
		function pressInput(event) {
			event.target.setAttribute("active", true)
			socket.send(JSON.stringify({
				action: 	"pressInput",
				input: 		event.target.value
			}))
		}

	/* releaseInput */
		INPUTS.forEach(function(input) { input.addEventListener(on.mouseup, releaseInput) })
		function releaseInput(event) {
			event.target.removeAttribute("active")
			socket.send(JSON.stringify({
				action: 	"releaseInput",
				input: 		event.target.value
			}))
		}

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
				if (data.data && data.data.id == window.id) {
					displayInfo(data.data)
				}
		}

/*** display ***/
	/* displayInfo */
		function displayInfo(hero) {
			// healthbar
				var healthPercentage = Math.round(hero.state.health / hero.state.healthMax * 100)
				HEALTHBAR.style.width = Math.min(100, Math.max(0, healthPercentage)) + "%"
				HEALTHBAR.setAttribute("color", healthPercentage > HEALTHHIGH ? "high" : healthPercentage > HEALTHLOW ? "medium" : "low")

			// button sizes
				for (var c in hero.state.cooldowns) {
					var button = document.getElementById(c)
					var size = Math.ceil(button.getBoundingClientRect().width)
					var fraction = (hero.state.cooldowns[c] / BUTTONCOOLDOWNMAX) * 3 / 4
					button.style.borderWidth = Math.max(0, Math.min(size, fraction * size)) + "px"
				}
		}
