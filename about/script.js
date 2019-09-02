/*** helpers ***/
	/* isEmail */
		function isEmail(string) {
			return (/[a-z0-9!#$%&\'*+\/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+\/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/).test(string)
		}

	/* sanitizeString */
		function sanitizeString(string) {
			return (string.length ? string.replace(/[^a-zA-Z0-9_\s\!\@\#\$\%\^\&\*\(\)\+\=\-\[\]\\\{\}\|\;\'\:\"\,\.\/\<\>\?]/gi, "") : "")
		}

/*** actions ***/
	/* submitFeedback */
		document.getElementById("feedback-submit").addEventListener(on.click, submitFeedback)
		document.getElementById("feedback-email").addEventListener("keyup", function(event) { if (event.which == 13) { submitFeedback() } })
		function submitFeedback() {
			var text  = document.getElementById("feedback-text").value  || false
			var email = document.getElementById("feedback-email").value || false

			if (!text || !text.length) {
				displayMessage("No text was entered.")
			}
			else if (!email || !isEmail(email)) {
				displayMessage("Please enter a valid email.")
			}
			else {
				try {
					var time = new Date()
					var text = sanitizeString(text).replace(/\&/gi, "%26")

					var request = new XMLHttpRequest()
						request.open("GET", "https://script.google.com/macros/s/???/exec?project=melodemons&time=" + time + "&email=" + email + "&text=" + text, true)
						request.onload = function() {
							if (request.readyState === XMLHttpRequest.DONE && request.status === 200) {
								displayMessage("Thanks! Feedback sent!")
								document.getElementById("feedback-text").value  = ""
								document.getElementById("feedback-email").value = ""
							}
							else {
								displayMessage("Unable to send feedback at this time.")
							}
						}
					request.send()
				} catch (error) {
					displayMessage("Unable to send feedback at this time.")
				}
			}
		}
