/*** globals ***/
	/* triggers */
		if ((/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i).test(navigator.userAgent)) {
			var on = { click: "touchstart", mousedown: "touchstart", mousemove: "touchmove", mouseup: "touchend", scroll: "touchmove"  }
		}
		else {
			var on = { click:      "click", mousedown:  "mousedown", mousemove: "mousemove", mouseup:  "mouseup", scroll: "mousewheel" }
		}

	/* chooseRandom */
		function chooseRandom(options) {
			try {
				if (!Array.isArray(options)) {
					return false
				}
				else {
					return options[Math.floor(Math.random() * options.length)]
				}
			} catch (error) {}
		}

	/* rangeRandom */
		function rangeRandom(min, max) {
			try {
				min = Number(min)
				max = Number(max)

				if (isNaN(min) || isNaN(max)) {
					return false
				}
				else {
					return (Math.floor(Math.random() * (max + 1 - min)) + min)
				}
			} catch (error) {}
		}

/*** messages ***/
	/* sendPost */
		function sendPost(post, callback) {
			try {
				var request = new XMLHttpRequest()
					request.open("POST", location.pathname, true)
					request.onload = function() {
						if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
							callback(JSON.parse(request.responseText) || {success: false, message: "unknown error"})
						}
						else {
							callback({success: false, readyState: request.readyState, message: request.status})
						}
					}
				request.send(JSON.stringify(post))
			} catch (error) {}
		}

	/* displayMessage */
		var messageLoop = null
		var messageTime = 0
		function displayMessage(message) {
			try {
				var element = document.getElementById("message")
					element.innerHTML = message || "unknown error"
					element.className = ""
					element.style.opacity = 0
				
				if (typeof messageLoop !== "undefined") {
					clearInterval(messageLoop)
					messageTime = 0
				}

				messageLoop = setInterval(function() { // fade in
					if (messageTime < 5) {
						messageTime += 0.1
						element.style.opacity = (-0.5 * Math.pow(messageTime, 2)) + (2.5 * messageTime)
					}
					else {
						clearInterval(messageLoop)
						messageTime = 0
						element.className = "hidden"
						element.style.opacity = 0
					}			
				}, 100)
			} catch (error) {}
		}
