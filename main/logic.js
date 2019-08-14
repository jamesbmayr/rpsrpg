/*** modules ***/
	var http       = require("http")
	var fs         = require("fs")
	var debug      = getEnvironment("debug")
	module.exports = {}

/*** maps ***/
	var COLORS = getAsset("colors")

/*** logs ***/
	/* logError */
		module.exports.logError = logError
		function logError(error) {
			if (debug) {
				console.log("\n*** ERROR @ " + new Date().toLocaleString() + " ***")
				console.log(" - " + error)
				console.dir(arguments)
			}
		}

	/* logStatus */
		module.exports.logStatus = logStatus
		function logStatus(status) {
			if (debug) {
				console.log("\n--- STATUS @ " + new Date().toLocaleString() + " ---")
				console.log(" - " + status)

			}
		}

	/* logMessage */
		module.exports.logMessage = logMessage
		function logMessage(message) {
			if (debug) {
				console.log(" - " + new Date().toLocaleString() + ": " + message)
			}
		}

	/* logTime */
		module.exports.logTime = logTime
		function logTime(flag, callback) {
			if (debug) {
				var before = process.hrtime()
				callback()
				
				var after = process.hrtime(before)[1] / 1e6
				if (after > 5) {
					logMessage(flag + " " + after)
				}
			}
			else {
				callback()
			}
		}

/*** maps ***/
	/* getEnvironment */
		module.exports.getEnvironment = getEnvironment
		function getEnvironment(index) {
			try {
				if (process.env.DOMAIN !== undefined) {
					var environment = {
						port:   process.env.PORT,
						domain: process.env.DOMAIN,
						debug:  (process.env.DEBUG || false)
					}
				}
				else {
					var environment = {
						port:   3000,
						domain: "localhost",
						debug:  true
					}
				}

				return environment[index]
			}
			catch (error) {
				logError(error)
				return false
			}
		}

	/* getAsset */
		module.exports.getAsset = getAsset
		function getAsset(index) {
			try {
				switch (index) {
					// site components
						case "logo":
							return "logo.png"
						break
						case "google fonts":
							return '<!--<link href="https://fonts.googleapis.com/css?family=Press-Start-P2" rel="stylesheet">-->'
						break
						case "meta":
							return '<meta charset="UTF-8"/>\
									<meta name="description" content="Three fantasy heroes team up to fight through a randomly generated dungeon of orb-stealing monsters."/>\
									<meta name="keywords" content="game,fantasy,heroes,monsters,wizard,barbarian,ranger,multiplayer"/>\
									<meta name="author" content="James Mayr"/>\
									<meta property="og:title" content="Three fantasy heroes team up to fight through a randomly generated dungeon of orb-stealing monsters."/>\
									<meta property="og:url" content="https://rpsrpg.herokuapp.com"/>\
									<meta property="og:description" content="Three fantasy heroes team up to fight through a randomly generated dungeon of orb-stealing monsters."/>\
									<meta property="og:image" content="https://rpsrpg.herokuapp.com/banner.png"/>\
									<meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"/>'
						break
						case "css variables":
							// colors
								var cssColors = ""
								for (var hue in COLORS) {
									for (var shade in COLORS[hue]) {
										cssColors += "		--" + hue + "-" + shade + ": " + COLORS[hue][shade] + ";\n"
									}
								}
							
							// data
								return ('/*** variables ***/\n' +
										'	:root {\n' +
										'		--font: ' + getAsset("font") + ';\n' +
										'		--borderRadius: ' + getAsset("borderRadius") + 'px;\n' +
												cssColors +
										'	}')
						break
						case "js variables":
							return ('/*** superglobals ***/\n' +
									'	var LAYERS = ' + getAsset("layers") + '\n' +
									'	var CHAMBERSIZE = ' + getAsset("chamberSize") + '\n' +
									'	var CELLSIZE = ' + getAsset("cellSize") + '\n' +
									'	var BORDERRADIUS = ' + getAsset("borderRadius") + '\n' +
									'	var FONT = "' + getAsset("font") + '"\n' +
									'	var COLORS = ' + JSON.stringify(COLORS) + '\n' +
									'')
						break

						case "loopInterval":
							return 50
						break
						case "layers":
							return 3
						break
						case "chamberSize":
							return 9
						break
						case "cellSize":
							return 128
						break
						case "borderRadius":
							return 16
						break
						case "font":
							return "monospace"
						break
						case "baseHealth":
							return 128
						break
						case "heal":
							return 1
						break
						case "portalCooldown":
							return Math.floor(1000 / getAsset("loopInterval")) * 3
						break

						case "colors":
							return {
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
								black:      ["#e4e6e7","#a2a7a9","#6e7477","#3d4142","#232526"],
								white:      ["#c0dee5","#cee2e8","#dcf1f7","#e3f5f9","#f9fdff"]
							}
						break

						case "directions":
							return ["up", "left", "right", "down"]
						break

						case "actions":
							return ["a", "b", "x", "y"]
						break

						case "wallMakers":
							return [
								function empty(cells, minX, maxX, minY, maxY) {
									return
								},
								function solid(cells, minX, maxX, minY, maxY) {
									for (var x = minX; x <= maxX; x++) {
										for (var y = minY; y <= maxY; y++) {
											cells[x][y].wall = true
										}
									}
								},
								function allButInner(cells, minX, maxX, minY, maxY) {
									for (var x = minX; x <= maxX; x++) {
										for (var y = minY; y <= maxY; y++) {
											cells[x][y].wall = true
										}
									}

									if (minX < 0) {
										if (minY < 0) {
											cells[maxX][maxY].wall = false
										}
										else {
											cells[maxX][minY].wall = false
										}
									}
									else {
										if (minY < 0) {
											cells[minX][maxY].wall = false
										}
										else {
											cells[minX][minY].wall = false
										}
									}
								},
								function corners(cells, minX, maxX, minY, maxY) {
									cells[minX    ][minY    ].wall = true
									cells[maxX    ][minY    ].wall = true
									cells[minX    ][maxY    ].wall = true
									cells[maxX    ][maxY    ].wall = true
								},
								function center(cells, minX, maxX, minY, maxY) {
									var centerX = Math.floor( Math.abs(minX + maxX) / 2) * Math.sign(minX + maxX)
									var centerY = Math.floor( Math.abs(minY + maxY) / 2) * Math.sign(minY + maxY)
									cells[centerX][centerY].wall = true
								},
								function up(cells, minX, maxX, minY, maxY) {
									for (var x = minX; x <= maxX; x++) {
										cells[x][maxY].wall = true
										cells[x][maxY - 1].wall = true
									}
								},
								function left(cells, minX, maxX, minY, maxY) {
									for (var y = minY; y <= maxY; y++) {
										cells[minX][y].wall = true
										cells[minX + 1][y].wall = true
									}
								},
								function right(cells, minX, maxX, minY, maxY) {
									for (var y = minY; y <= maxY; y++) {
										cells[maxX][y].wall = true
										cells[maxX - 1][y].wall = true
									}
								},
								function down(cells, minX, maxX, minY, maxY) {
									for (var x = minX; x <= maxX; x++) {
										cells[x][minY].wall = true
										cells[x][minY + 1].wall = true
									}
								},
								function upLeft(cells, minX, maxX, minY, maxY) {
									cells[minX][maxY].wall = true
									cells[minX][maxY - 1].wall = true
									cells[minX + 1][maxY].wall = true
									cells[minX + 1][maxY - 1].wall = true
								},
								function upRight(cells, minX, maxX, minY, maxY) {
									cells[maxX][maxY].wall = true
									cells[maxX][maxY - 1].wall = true
									cells[maxX - 1][maxY].wall = true
									cells[maxX - 1][maxY - 1].wall = true
								},
								function downLeft(cells, minX, maxX, minY, maxY) {
									cells[minX][minY].wall = true
									cells[minX][minY + 1].wall = true
									cells[minX + 1][minY].wall = true
									cells[minX + 1][minY + 1].wall = true
								},
								function downRight(cells, minX, maxX, minY, maxY) {
									cells[maxX][minY].wall = true
									cells[maxX][minY + 1].wall = true
									cells[maxX - 1][minY].wall = true
									cells[maxX - 1][minY + 1].wall = true
								},
								function diagonal(cells, minX, maxX, minY, maxY) {
									if (minX < 0 && minY > 0) {
										cells[minX + 1][maxY - 1].wall = true
										cells[minX + 2][maxY - 1].wall = true
										cells[minX + 1][maxY - 2].wall = true
									}
									else if (minX > 0 && minY > 0) {
										cells[maxX - 1][maxY - 1].wall = true
										cells[maxX - 2][maxY - 1].wall = true
										cells[maxX - 1][maxY - 2].wall = true
									}
									else if (minX < 0 && minY < 0) {
										cells[minX + 1][minY + 1].wall = true
										cells[minX + 2][minY + 1].wall = true
										cells[minX + 1][minY + 2].wall = true
									}
									else if (minX > 0 && minY < 0) {
										cells[maxX - 1][minY + 1].wall = true
										cells[maxX - 2][minY + 1].wall = true
										cells[maxX - 1][minY + 2].wall = true
									}
								},
								function inverseDiagonal(cells, minX, maxX, minY, maxY) {
									if (minX > 0 && minY < 0) {
										cells[minX + 1][maxY].wall = true
										cells[minX][maxY - 1].wall = true
									}
									else if (minX < 0 && minY < 0) {
										cells[maxX - 1][maxY].wall = true
										cells[maxX][maxY - 1].wall = true
									}
									else if (minX > 0 && minY > 0) {
										cells[minX + 1][minY].wall = true
										cells[minX][minY + 1].wall = true
									}
									else if (minX < 0 && minY > 0) {
										cells[maxX - 1][minY].wall = true
										cells[maxX][minY + 1].wall = true
									}
								}
							]
						break

						case "heroes":
							var quarterCell = Math.floor(getAsset("cellSize") / 4)
							var baseHealth = getAsset("baseHealth")

							return {
								"barbarian": {
									info: {
										rps: "rock",
										type: "hero",
										subtype: "barbarian",
										color: COLORS.orange[2]
									},
									state: {
										health: baseHealth / 4,
										healthMax: baseHealth,
										position: {
											x: -3 * quarterCell,
											y:  3 * quarterCell
										}
									},
									statistics: {
										power: Math.floor(baseHealth / 8),
										armor: Math.floor(baseHealth / 8),
										speed: Math.floor(quarterCell / 2),
										range: quarterCell * 8
									}
								},
								"wizard": {
									info: {
										rps: "paper",
										type: "hero",
										subtype: "wizard",
										color: COLORS.purple[2]
									},
									state: {
										health: baseHealth / 4,
										healthMax: baseHealth,
										position: {
											x: -1 * quarterCell,
											y: -3 * quarterCell
										}
									},
									statistics: {
										power: Math.floor(baseHealth / 8),
										armor: Math.floor(baseHealth / 16),
										speed: Math.floor(quarterCell / 2),
										range: quarterCell * 32
									}
								},
								"ranger": {
									info: {
										rps: "scissors",
										type: "hero",
										subtype: "ranger",
										color: COLORS.greengray[2]
									},
									state: {
										health: baseHealth / 4,
										healthMax: baseHealth,
										position: {
											x:  3 * quarterCell,
											y:  3 * quarterCell
										}
									},
									statistics: {
										power: Math.floor(baseHealth / 8),
										armor: Math.floor(baseHealth / 8),
										speed: quarterCell,
										range: quarterCell * 32
									}
								}
							}
						break

						case "orbs":
							var orbSize = Math.floor(getAsset("cellSize") / 8 * 3)

							return {
								"rock": {
									info: {
										rps: "rock",
										name: "rock orb",
										type: "orb",
										subtype: "rock orb",
										size: {
											x: orbSize,
											y: orbSize
										},
										shape: "circle",
										style: "fill",
										color: COLORS.orange[3]
									}
								},
								"paper": {
									info: {
										rps: "paper",
										name: "paper orb",
										type: "orb",
										subtype: "paper orb",
										size: {
											x: orbSize,
											y: orbSize
										},
										shape: "circle",
										style: "fill",
										color: COLORS.purple[3]
									}
								},
								"scissors": {
									info: {
										rps: "scissors",
										name: "scissors orb",
										type: "orb",
										subtype: "scissors orb",
										size: {
											x: orbSize,
											y: orbSize
										},
										shape: "circle",
										style: "fill",
										color: COLORS.greengray[3]
									}
								}
							}
						break

						case "pedestals":
							var quarterCell = Math.floor(getAsset("cellSize") / 4)
							var pedestals = getAsset("orbs")
							
							for (var p in pedestals) {
								overwriteObject(pedestals[p], {
									info: {
										type: "pedestal",
										shape: "circle",
										style: "border"
									},
									state: {
										active: false,
										position: {
											x: 0,
											y: 0
										}
									}
								})
							}

							overwriteObject(pedestals["rock"],     {state: {position: {x: -4 * quarterCell}}})
							overwriteObject(pedestals["scissors"], {state: {position: {x:  4 * quarterCell}}})
							
							return pedestals
						break

						case "healTile":
							return {
								info: {
									type: "tile",
									subtype: "heal",
									size: {
										x: Math.floor(getAsset("cellSize") / 4) * 3,
										y: Math.floor(getAsset("cellSize") / 4) * 3
									},
									color: COLORS.green[1],
									shape: "square",
									style: "border"
								}
							}
						break

						case "portalTile":
							return {
								info: {
									type: "tile",
									subtype: "portal",
									size: {
										max: Math.floor(getAsset("cellSize") / 4) * 3,
										x: Math.floor(getAsset("cellSize") / 4) * 3,
										y: Math.floor(getAsset("cellSize") / 4) * 3
									},
									color: COLORS.blue[1],
									shape: "square",
									style: "border"
								},
								state: {
									active: true,
									link: null
								}
							}

					default:
						return null
					break
				}
			}
			catch (error) {logError(error)}
		}

	/* getSchema */
		module.exports.getSchema = getSchema
		function getSchema(index) {
			try {
				switch (index) {
					case "game":
						return {
							id: 			null,
							created: 		(new Date().getTime()),
							loop: 			null,
							observers: 		{},
							players: 		{},
							data: {
								info: {
									layers: getAsset("layers")
								},
								state: {
									start: 	true,
									end: 	false,
									time: 	0,
									chamber: {
										x: 	0,
										y: 	0
									},
									portalCooldown: 0
								},
								heroes: 	{},
								chambers: 	{},
								nodemaps: 	{}
							}
						}
					break

					case "player":
						return {
							id: 			null,
							name: 			null,
							created: 		(new Date().getTime()),
							connected: 		false,
							connection: 	null
						}
					break

					case "creature":
						return {
							id: 			generateRandom(),
							info: {
								name: 		null,
								rps: 		null,
								type: 		null,
								subtype:	null,
								size: {
									x: 		Math.floor(getAsset("cellSize") / 2),
									y: 		Math.floor(getAsset("cellSize") / 2)
								},
								color: 		null
							},
							state: {
								alive: 		true,
								health: 	0,
								healthMax: 	0,
								position: {
									x: 		0,
									y: 		0,
									edge: 	null
								},
								movement: {
									facing: "down",
									up: false,
									left: false,
									right: false,
									down: false
								},
								actions: {
									a: false,
									b: false,
									x: false,
									y: false
								},
								kills: 		0,
								points: 	0
							},
							statistics: {
								power: 		0,
								armor: 		0,
								speed: 		0,
								range: 		0
							},
							items: 			{}
						}
					break

					case "chamber":
						return {
							id: 			generateRandom(),
							info: {
								name: 		null,
								colors: 	[],
								x: 0,
								y: 0,
								chamberSize: getAsset("chamberSize"),
								cellSize: getAsset("cellSize")
							},
							cells:          {},
							heroes: 		{},
							creatures: 		{},
							items:			{}
						}
					break

					case "item":
						return {
							id: 			generateRandom(),
							info: {
								name: 		null,
								rps: 		null,
								type: 		"item",
								subtype: 	null,
								size: {
									x: Math.floor(getAsset("cellSize") / 4),
									y: Math.floor(getAsset("cellSize") / 4)
								},
								color: 		null
							},
							state: {
								position: {
									x: 		0,
									y: 		0
								}
							}
						}
					break

					default:
						return null
					break
				}
			}
			catch (error) {logError(error)}
		}

/*** checks ***/
	/* isNumLet */
		module.exports.isNumLet = isNumLet
		function isNumLet(string) {
			try {
				return (/^[a-z0-9A-Z_\s]+$/).test(string)
			}
			catch (error) {
				logError(error)
				return false
			}
		}

	/* isBot */
		module.exports.isBot = isBot
		function isBot(agent) {
			try {
				switch (true) {
					case (typeof agent == "undefined" || !agent):
						return "no-agent"
					break
					
					case (agent.indexOf("Googlebot") !== -1):
						return "Googlebot"
					break
				
					case (agent.indexOf("Google Domains") !== -1):
						return "Google Domains"
					break
				
					case (agent.indexOf("Google Favicon") !== -1):
						return "Google Favicon"
					break
				
					case (agent.indexOf("https://developers.google.com/+/web/snippet/") !== -1):
						return "Google+ Snippet"
					break
				
					case (agent.indexOf("IDBot") !== -1):
						return "IDBot"
					break
				
					case (agent.indexOf("Baiduspider") !== -1):
						return "Baiduspider"
					break
				
					case (agent.indexOf("facebook") !== -1):
						return "Facebook"
					break

					case (agent.indexOf("bingbot") !== -1):
						return "BingBot"
					break

					case (agent.indexOf("YandexBot") !== -1):
						return "YandexBot"
					break

					default:
						return null
					break
				}
			}
			catch (error) {
				logError(error)
				return false
			}
		}

/*** tools ***/		
	/* renderHTML */
		module.exports.renderHTML = renderHTML
		function renderHTML(request, path, callback) {
			try {
				var html = {}
				fs.readFile(path, "utf8", function (error, file) {
					if (error) {
						logError(error)
						callback("")
					}
					else {
						html.original = file
						html.array = html.original.split(/<script\snode>|<\/script>node>/gi)

						for (html.count = 1; html.count < html.array.length; html.count += 2) {
							try {
								html.temp = eval(html.array[html.count])
							}
							catch (error) {
								html.temp = ""
								logError("<sn>" + Math.ceil(html.count / 2) + "</sn>\n" + error)
							}
							html.array[html.count] = html.temp
						}

						callback(html.array.join(""))
					}
				})
			}
			catch (error) {
				logError(error)
				callback("")
			}
		}

	/* sanitizeString */
		module.exports.sanitizeString = sanitizeString
		function sanitizeString(string) {
			try {
				return string.replace(/[^a-zA-Z0-9_\s\!\@\#\$\%\^\&\*\(\)\+\=\-\[\]\\\{\}\|\;\'\:\"\,\.\/\<\>\?]/gi, "")
			}
			catch (error) {
				logError(error)
				return ""
			}
		}

	/* duplicateObject */
		module.exports.duplicateObject = duplicateObject
		function duplicateObject(object) {
			try {
				return JSON.parse(JSON.stringify(object))
			}
			catch (error) {
				logError(error)
				return null
			}
		}

	/* duplicateArray */
		module.exports.duplicateArray = duplicateArray
		function duplicateArray(array) {
			try {
				var splitter = ":||:"
				return array.join(splitter).split(splitter)
			}
			catch (error) {
				logError(error)
				return null
			}
		}

	/* overwriteObject */
		module.exports.overwriteObject = overwriteObject
		function overwriteObject(base, overwrites) {
			try {
				for (var o in overwrites) {
					if (typeof overwrites[o] == "object") {
						if (base[o] && typeof base[o] == "object") {
							overwriteObject(base[o], overwrites[o])
						}
						else {
							base[o] = overwrites[o]
						}
					}
					else {
						base[o] = overwrites[o]
					}
				}
			}
			catch (error) {
				logError(error)
				return null
			}
		}

/*** randoms ***/
	/* generateRandom */
		module.exports.generateRandom = generateRandom
		function generateRandom(set, length) {
			try {
				set = set || "0123456789abcdefghijklmnopqrstuvwxyz"
				length = length || 32
				
				var output = ""
				for (var i = 0; i < length; i++) {
					output += (set[Math.floor(Math.random() * set.length)])
				}

				if ((/[a-zA-Z]/).test(set)) {
					while (!(/[a-zA-Z]/).test(output[0])) {
						output = (set[Math.floor(Math.random() * set.length)]) + output.substring(1)
					}
				}

				return output
			}
			catch (error) {
				logError(error)
				return null
			}
		}

	/* chooseRandom */
		module.exports.chooseRandom = chooseRandom
		function chooseRandom(options) {
			try {
				if (!Array.isArray(options)) {
					return false
				}
				else {
					return options[Math.floor(Math.random() * options.length)]
				}
			}
			catch (error) {
				logError(error)
				return false
			}
		}

	/* sortRandom */
		module.exports.sortRandom = sortRandom
		function sortRandom(array) {
			try {
				// duplicate array
					var output = duplicateObject(array)

				// fisher-yates shuffle
					var x = output.length
					while (x > 0) {
						var y = Math.floor(Math.random() * x)
						x = x - 1
						var temp = output[x]
						output[x] = output[y]
						output[y] = temp
					}

				return output
			}
			catch (error) {
				logError(error)
				return null
			}
		}

/*** database ***/
	/* determineSession */
		module.exports.determineSession = determineSession
		function determineSession(request, callback) {
			try {
				if (isBot(request.headers["user-agent"])) {
					request.session = null
				}
				else if (!request.cookie.session || request.cookie.session == null || request.cookie.session == 0) {
					request.session = {
						id: generateRandom(),
						updated: new Date().getTime(),
						info: {
							"ip":         request.ip,
				 			"user-agent": request.headers["user-agent"],
				 			"language":   request.headers["accept-language"],
						}
					}
				}
				else {
					request.session = {
						id: request.cookie.session,
						updated: new Date().getTime(),
						info: {
							"ip":         request.ip,
				 			"user-agent": request.headers["user-agent"],
				 			"language":   request.headers["accept-language"],
						}
					}
				}

				callback()
			}
			catch (error) {
				logError(error)
				callback(false)
			}
		}
