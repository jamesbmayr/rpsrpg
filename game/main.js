/*** globals ***/
	/* canvas */
		var CANVAS = document.getElementById("canvas")
		var CONTEXT = CANVAS.getContext("2d")

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
					// document.getElementById("info").innerText = JSON.stringify(data.data, 2, 2, 2)
					drawChamber(data.data)
				}
		}

/*** draws ***/
	/* drawChamber */
		function drawChamber(chamber) {
			// clear
				clearCanvas(CANVAS, CONTEXT)

			// draw heroes
				for (var h in chamber.heroes) {
					drawHero(chamber.heroes[h])
				}
		}

	/* drawHero */
		function drawHero(hero) {
			drawCircle(CANVAS, CONTEXT, hero.state.position.x + 256, hero.state.position.y + 256, Math.ceil((hero.info.size.x + hero.info.size.y) / 2), {color: hero.info.color})
		}
