/*** pools ***/
	/* colors */
		var colors = {
			magenta:    ["#ffcce6","#ff66b3","#e60073","#99004d","#33001a"],
			red:        ["#fab7b7","#f66f6f","#d80e0e","#7c0808","#300303"],
			brown:      ["#e09b06","#ae7804","#7c5603","#513802","#191101"],
			browngray:  ["#d5cac3","#b6a196","#a18778","#786154","#4f4037"],
			orange:     ["#fde4ce","#f9ae6c","#f68523","#ab5407","#442103"],
			beige:      ["#f7f4ed","#e0d3b8","#c1a871","#91773f","#6a572f"],
			yellow:     ["#f6f4d5","#e5dd80","#d8cb41","#beb227","#7f771a"],
			green:      ["#a9d3ab","#539e57","#1a661e","#074f0b","#053007"],
			greengray:  ["#d3ded4","#99b29b","#6a8c6c","#4d664e","#374938"],
			cyan:       ["#e6ffff","#b3ffff","#33ffff","#00cccc","#008080"],
			cerulean:   ["#dae7f1","#90b8d5","#4689b9","#2b5572","#1c374a"],
			bluegray:   ["#dee9ed","#adc8d2","#7ba7b7","#487484","#2d4852"],
			blue:       ["#d0e0fb","#7a9bd3","#2b76ef","#0b3d8e","#04142f"],
			purple:     ["#dac0f7","#b08bda","#7b3dc2","#4a2574","#180c26"],
			black:      ["#e4e6e7","#a2a7a9","#6e7477","#3d4142","#111111"],
			white:      ["#c0dee5","#cee2e8","#dcf1f7","#e3f5f9","#f9fdff"]
		}

/*** canvas ***/
	/* clearCanvas */
		function clearCanvas(canvas, context) {
			context.clearRect(0, 0, canvas.width, canvas.height)
		}

	/* rotateCanvas */
		function rotateCanvas(canvas, context, x, y, degrees, callback) {
			// rotate
				context.translate(x, y)
				context.rotate(degrees * Math.PI / 180)
				context.translate(-x, -y)

			// do whatever
				callback()

			// rotate back
				context.translate(x, y)
				context.rotate(-degrees * Math.PI / 180)
				context.translate(-x, -y)
		}

	/* drawLine */
		function drawLine(canvas, context, x1, y1, x2, y2, options) {
			// parameters
				options = options || {}
				context.beginPath()
				context.strokeStyle = options.gradient ? drawGradient(canvas, context, options) : (options.color || "transparent")
				context.lineWidth   = options.border || 1
				context.shadowBlur  = options.blur ? options.blur : 0
				context.shadowColor = options.shadow ? options.shadow : "transparent"
				context.globalAlpha = options.opacity || 1
				
			// draw
				context.moveTo(x1, canvas.height - y1)
				context.lineTo(x2, canvas.height - y2)
				context.stroke()
		}

	/* drawCircle */
		function drawCircle(canvas, context, x, y, radius, options) {
			// parameters
				options = options || {}
				context.beginPath()
				context.fillStyle   = options.gradient ? drawGradient(canvas, context, options) : (options.color || "transparent")
				context.strokeStyle = options.gradient ? drawGradient(canvas, context, options) : (options.color || "transparent")
				context.lineWidth   = options.border || 1
				context.shadowBlur  = options.blur ? options.blur : 0
				context.shadowColor = options.shadow ? options.shadow : "transparent"
				context.globalAlpha = options.opacity || 1

			// draw
				if (options.border) {
					context.arc(x, canvas.height - y, radius, (options.start || 0), (options.end || (2 * Math.PI)))
					context.stroke()
				}
				else {
					context.moveTo(x, canvas.height - y)
					context.arc(x, canvas.height - y, radius, (options.start || 0), (options.end || (2 * Math.PI)), true)
					context.closePath()
					context.fill()
				}
		}

	/* drawTriangle */
		function drawTriangle(canvas, context, x1, y1, x2, y2, x3, y3, options) {
			// parameters
				options = options || {}
				context.beginPath()
				context.fillStyle   = options.gradient ? drawGradient(canvas, context, options) : (options.color || "transparent")
				context.lineWidth   = options.border || 1
				context.shadowBlur  = options.blur ? options.blur : 0
				context.shadowColor = options.shadow ? options.shadow : "transparent"
				context.globalAlpha = options.opacity || 1

			// draw
				context.moveTo(x1, canvas.height - y1)
				context.lineTo(x2, canvas.height - y2)
				context.lineTo(x3, canvas.height - y3)
				context.lineTo(x1, canvas.height - y1)
				context.closePath()
				context.fill()
		}

	/* drawRectangle */
		function drawRectangle(canvas, context, x, y, width, height, options) {
			// parameters
				options = options || {}
				context.beginPath()
				context.fillStyle   = options.gradient ? drawGradient(canvas, context, options) : (options.color || "transparent")
				context.lineWidth   = options.border || 1
				context.shadowBlur  = options.blur ? options.blur : 0
				context.shadowColor = options.shadow ? options.shadow : "transparent"
				context.globalAlpha = options.opacity || 1

			// draw
				if (options.radii) {
					context.moveTo(x + options.radii.topLeft, canvas.height - y - height)
					context.lineTo(x + width - options.radii.topRight, canvas.height - y - height)
					context.quadraticCurveTo(x + width, canvas.height - y - height, x + width, canvas.height - y - height + options.radii.topRight)
					context.lineTo(x + width, canvas.height - y - options.radii.bottomRight)
					context.quadraticCurveTo(x + width, canvas.height - y, x + width - options.radii.bottomRight, canvas.height - y)
					context.lineTo(x + options.radii.bottomLeft, canvas.height - y)
					context.quadraticCurveTo(x, canvas.height - y, x, canvas.height - y - options.radii.bottomLeft)
					context.lineTo(x, canvas.height - y - height + options.radii.topLeft)
					context.quadraticCurveTo(x, canvas.height - y - height, x + options.radii.topLeft, canvas.height - y - height)
					context.closePath()
					context.fill()
				}
				else {
					context.fillRect(x, canvas.height - y, width, -1 * height)
				}
		}

	/* drawShape */
		function drawShape(canvas, context, x, y, width, height, options) {
			// parameters
				options = options || {}
				context.beginPath()
				context.fillStyle   = options.gradient ? drawGradient(canvas, context, options) : (options.color || "transparent")
				context.lineWidth   = options.border || 1
				context.shadowBlur  = options.blur ? options.blur : 0
				context.shadowColor = options.shadow ? options.shadow : "transparent"
				context.globalAlpha = options.opacity || 1

			// coordinates
				options.coordinates = options.coordinates.split(/\s?,\s?/)

			// draw
				for (var c in options.coordinates) {
					var pair = options.coordinates[c].split(/\s+/)
					
					if (!c) {
						context.moveTo(x + (width * Number(pair[0].replace("%", "")) / 100), (y + (height * Number(pair[1].replace("%", "")) / 100)))
					}
					else {
						context.lineTo(x + (width * Number(pair[0].replace("%", "")) / 100), (y + (height * Number(pair[1].replace("%", "")) / 100)))
					}
				}
				context.closePath()
				context.fill()
		}

	/* drawText */
		function drawText(canvas, context, x, y, text, options) {
			// variables
				options = options || {}
				context.font = (options.style ? options.style + " " : "") + (options.size || 32) + "px " + (options.font || font)
				context.fillStyle   = options.gradient ? drawGradient(canvas, context, options) : (options.color || "transparent")
				context.textAlign   = options.alignment || "center"
				context.shadowBlur  = options.blur ? options.blur : 0
				context.shadowColor = options.shadow ? options.shadow : "transparent"
				context.globalAlpha = options.opacity || 1


			// draw
				context.fillText((text || ""), x, canvas.height - y)
		}

	/* drawGradient */
		function drawGradient(canvas, context, options) {
			// radial
				if (options.gradient.r1 || options.gradient.r2) {
					var gradient = context.createRadialGradient(options.gradient.x1, options.gradient.y1, options.gradient.r1, options.gradient.x2, options.gradient.y2, options.gradient.r2)
				}

			// linear
				else {
					var gradient = context.createLinearGradient(options.gradient.x1, canvas.height - options.gradient.y1, options.gradient.x2, canvas.height - options.gradient.y2)
				}

			// colors
				var gradientColors = Object.keys(options.gradient.colors)
				for (var c in gradientColors) {
					gradient.addColorStop(Number(gradientColors[c]), options.gradient.colors[gradientColors[c]])
				}

			return gradient
		}

