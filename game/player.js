/*** globals ***/
	var inputs = document.querySelectorAll(".input")
	var health = document.querySelector("#health-inner")
	var points = document.querySelector("#points-inner")
	var inventory = document.querySelector("#inventory")

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
		inputs.forEach(function(input) { input.addEventListener(on.mousedown, pressInput) })
		function pressInput(event) {
			event.target.setAttribute("active", true)
			socket.send(JSON.stringify({
				action: 	"pressInput",
				input: 		event.target.value
			}))
		}

	/* releaseInput */
		inputs.forEach(function(input) { input.addEventListener(on.mouseup, releaseInput) })
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
				if (data.info) {
					displayInfo(data.info)
				}

		}

/*** display ***/
	/* displayInfo */
		function displayInfo(info) {
			// health
				var healthPercentage = Math.round(info.state.health / info.state.healthMaximum * 100)
				health.style.width = Math.min(100, Math.max(0, healthPercentage))
				health.setAttribute("color", healthPercentage > 60 ? "high" : healthPercentage > 30 ? "medium" : "low")

			// points
				points.style.width = Math.min(100, Math.max(0, info.state.points))
		}
