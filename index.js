/*** modules ***/
	var http = require("http")
	var fs   = require("fs")
	var util = require("util")
	var qs   = require("querystring")
	var ws   = require("websocket").server

	var main = require("./main/logic")
	var game = require("./game/logic")
	var home = require("./home/logic")
	var db   = {}

	var ENVIRONMENT = main.getEnvironment()
	var CONSTANTS = main.getAsset("constants")

/*** server ***/
	var port = ENVIRONMENT.port
	var server = http.createServer(handleRequest)
		server.listen(port, function (error) {
			if (error) {
				main.logError(error)
			}
			else {
				main.logStatus("listening on port " + port)
			}
		})

/*** socket ***/
	var socket = new ws({
		httpServer: server,
		autoAcceptConnections: false
	})
		socket.on("request", handleSocket)

/*** handleRequest ***/
	function handleRequest(request, response) {
		// collect data
			var data = ""
			request.on("data", function (chunk) { data += chunk })
			request.on("end", parseRequest)

		/* parseRequest */
			function parseRequest() {
				try {
					// get request info
						request.get    = qs.parse(request.url.split("?")[1]) || {}
						request.path   = request.url.split("?")[0].split("/") || []
						request.url    = request.url.split("?")[0] || "/"
						request.post   = data ? JSON.parse(data) : {}
						request.cookie = request.headers.cookie ? qs.parse(request.headers.cookie.replace(/; /g, "&")) : {}
						request.ip     = request.headers["x-forwarded-for"] || request.connection.remoteAddress || request.socket.remoteAddress || request.connection.socket.remoteAddress

					// log it
						if (request.url !== "/favicon.ico") {
							main.logStatus((request.cookie.session || "new") + " @ " + request.ip + "\n[" + request.method + "] " + request.path.join("/") + "\n" + JSON.stringify(request.method == "GET" ? request.get : request.post))
						}

					// where next ?
						if ((/[.](ico|png|jpg|jpeg|gif|svg|pdf|txt|css|js|mp3|wav)$/).test(request.url)) { // serve asset
							routeRequest()
						}
						else { // get session and serve html
							main.determineSession(request, routeRequest)
						}
				}
				catch (error) {_403("unable to " + arguments.callee.name)}
			}

		/* routeRequest */
			function routeRequest() {
				try {
					// assets
						if (!request.session) {
							switch (true) {
								// icon
									case (/\/favicon[.]ico$/).test(request.url):
									case (/\/icon[.]png$/).test(request.url):
									case (/\/apple\-touch\-icon[.]png$/).test(request.url):
									case (/\/apple\-touch\-icon\-precomposed[.]png$/).test(request.url):
										try {
											response.writeHead(200, {"Content-Type": "image/png"})
											fs.readFile("./main/images/icon.png", function (error, file) {
												if (error) {_404(error)}
												else {
													response.end(file, "binary")
												}
											})
										}
										catch (error) {_404(error)}
									break

								// logo
									case (/\/logo[.]png$/).test(request.url):
										try {
											response.writeHead(200, {"Content-Type": "image/png"})
											fs.readFile("./main/images/logo.png", function (error, file) {
												if (error) {_404(error)}
												else {
													response.end(file, "binary")
												}
											})
										}
										catch (error) {_404(error)}
									break

								// banner
									case (/\/banner[.]png$/).test(request.url):
										try {
											response.writeHead(200, {"Content-Type": "image/png"})
											fs.readFile("./main/images/banner.png", function (error, file) {
												if (error) {_404(error)}
												else {
													response.end(file, "binary")
												}
											})
										}
										catch (error) {_404(error)}
									break

								// j
									case (/\/j[.]png$/).test(request.url):
										try {
											response.writeHead(200, {"Content-Type": "image/png"})
											fs.readFile("./main/images/j.png", function (error, file) {
												if (error) {_404(error)}
												else {
													response.end(file, "binary")
												}
											})
										}
										catch (error) {_404(error)}
									break

								// sprites
									case (/\/sprites\/([a-zA-Z0-9_])+[.]png$/).test(request.url):
										try {
											response.writeHead(200, {"Content-Type": "image/png"})
											fs.readFile("./main/sprites/" + request.path[request.path.length - 1], function (error, file) {
												if (error) {_404(error)}
												else {
													response.end(file, "binary")
												}
											})
										}
										catch (error) {_404(error)}
									break

								// sfx
									case (/\/sfx\/([a-zA-Z0-9_])+[.]mp3$/).test(request.url):
										try {
											response.writeHead(200, {"Content-Type": "audio/mpeg"})
											fs.readFile("./main/sfx/" + request.path[request.path.length - 1], function (error, file) {
												if (error) {_404(error)}
												else {
													response.end(file)
												}
											})
										}
										catch (error) {_404(error)}
									break

								// stylesheet
									case (/\/(stylesheet|main|player)[.]css$/).test(request.url):
										try {
											response.writeHead(200, {"Content-Type": "text/css"})
											fs.readFile("./main/stylesheet.css", "utf8", function (error, data) {
												if (error) {_404(error)}
												else {
													fs.readFile("./" + request.path[1] + "/" + request.path[2], "utf8", function (error, file) {
														if (error) { _404(error) }
														else {
															response.end(main.getAsset("css variables") + "\n\n" + data + "\n\n" + file)
														}
													})
												}
											})
										}
										catch (error) {_404(error)}
									break

								// script
									case (/\/(script|main|player)[.]js$/).test(request.url):
										try {
											response.writeHead(200, {"Content-Type": "text/javascript"})
											fs.readFile("./main/script.js", "utf8", function (error, data) {
												if (error) {_404(error)}
												else {
													fs.readFile("./main/draw.js", "utf8", function (error, draw) {
														if (error) {_404(error)}
														else {
															fs.readFile("./" + request.path[1] + "/" + request.path[2], "utf8", function (error, file) {
																if (error) { _404(error) }
																else {
																	response.end("window.addEventListener('load', function() {\n\n" + main.getAsset("js variables") + "\n\n" + data + "\n\n" + draw + "\n\n" + file + "\n\n})")
																}
															})
														}
													})
												}
											})
										}
										catch (error) {_404(error)}
									break

								// others
									default:
										_404()
									break
							}
						}
						
					// get
						else if (request.method == "GET") {
							response.writeHead(200, {
								"Set-Cookie": String( "session=" + request.session.id + "; expires=" + (new Date(new Date().getTime() + (1000 * 60 * 60 * 24 * 7)).toUTCString()) + "; path=/; domain=" + ENVIRONMENT.domain ),
								"Content-Type": "text/html; charset=utf-8"
							})

							switch (true) {
								// home
									case (/^\/$/).test(request.url):
										try {
											main.renderHTML(request, "./home/index.html", function (html) {
												response.end(html)
											})
										}
										catch (error) {_404(error)}
									break

								// about
									case (/^\/about\/?$/).test(request.url):
										try {
											main.renderHTML(request, "./about/index.html", function (html) {
												response.end(html)
											})
										}
										catch (error) {_404(error)}
									break

								// game
									case (/^\/game\/[a-zA-Z0-9]{4}$/).test(request.url):
										try {
											var id = request.path[2].toLowerCase()
											request.game = db[id] || false

											if (!request.game) {
												_302("../../")
											}
											else if (request.game.players[request.session.id]) {
												main.renderHTML(request, "./game/player.html", function (html) {
													response.end(html)
												})
											}
											else {
												main.renderHTML(request, "./game/main.html", function (html) {
													response.end(html)
												})
											}
										}
										catch (error) {_404(error)}
									break

								// data
									case (/^\/data\/?$/).test(request.url):
										try {
											if (ENVIRONMENT.debug) {
												var data = {}
												for (var d in db) {
													data[d] = db[d].data
												}

												response.end("<pre>" + JSON.stringify(data, 2, 2, 2) + "</pre>")
											}
											else {
												_404()
											}
										}
										catch (error) {_404(error)}
									break

								// others
									default:
										_404()
									break
							}
						}

					// post
						else if (request.method == "POST" && request.post.action) {
							response.writeHead(200, {"Content-Type": "text/json"})

							switch (request.post.action) {
								// home
									case "createGame":
										try {
											do {
												id = main.generateRandom("abcdefghijklmnopqrstuvwxyz", 4)
											}
											while (db[id])

											home.createGame(request, id, function (data) {
												db[id] = request.game
												response.end(JSON.stringify(data))
											})
										}
										catch (error) {_403(error)}
									break

									case "joinGame":
										try {
											if (!request.post.gameid || (request.post.gameid.length !== 4) || !main.isNumLet(request.post.gameid)) {
												response.end(JSON.stringify({success: false, message: "gameid must be 4 letters"}))
											}
											else if (!db[request.post.gameid]) {
												response.end(JSON.stringify({success: false, message: "game not found"}))
											}
											else {
												request.game = db[request.post.gameid]

												home.joinGame(request, function (data) {
													response.end(JSON.stringify(data))
												})
											}
										}
										catch (error) {_403(error)}
									break

								// others
									default:
										_403()
									break
							}
						}

					// others
						else {_403("unknown route")}
				}
				catch (error) {_403("unable to " + arguments.callee.name)}
			}

		/* _302 */
			function _302(data) {
				main.logStatus("redirecting to " + (data || "/"))
				response.writeHead(302, { Location: data || "../../../../" })
				response.end()
			}

		/* _403 */
			function _403(data) {
				main.logError(data)
				response.writeHead(403, { "Content-Type": "text/json" })
				response.end( JSON.stringify({success: false, error: data}) )
			}

		/* _404 */
			function _404(data) {
				main.logError(data)
				response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" })
				main.renderHTML(request, "./main/_404.html", function (html) {
					response.end(html)
				})
			}
	}

/*** handleSocket ***/
	function handleSocket(request) {
		// collect data
			if ((request.origin.replace("https://","").replace("http://","") !== ENVIRONMENT.domain) && (request.origin !== "http://" + ENVIRONMENT.domain + ":" + ENVIRONMENT.port)) {
				main.logStatus("[REJECTED]: " + request.origin + " @ " + (request.socket._peername.address || "?"))
				request.reject()
			}
			else if (!request.connection) {
				request.connection = request.accept(null, request.origin)
				parseSocket()
			}
			else {
				parseSocket()
			}

		/* parseSocket */
			function parseSocket() {
				try {
					// get request info
						request.url     = (request.httpRequest.headers.host || "") + (request.httpRequest.url || "")
						request.path    = request.httpRequest.url.split("?")[0].split("/") || []
						request.cookie  = request.httpRequest.headers.cookie ? qs.parse(request.httpRequest.headers.cookie.replace(/; /g, "&")) : {}
						request.headers = {}
						request.headers["user-agent"] = request.httpRequest.headers['user-agent']
						request.headers["accept-language"] = request.httpRequest.headers['accept-language']
						request.ip      = request.connection.remoteAddress || request.socket._peername.address

					// log it
						main.logStatus((request.cookie.session || "new") + " @ " + request.ip + "\n[WEBSOCKET] " + request.path.join("/"))

					// get session and wait for messages
						main.determineSession(request, routeSocket)
				}
				catch (error) {_400("unable to " + arguments.callee.name)}
			}

		/* routeSocket */
			function routeSocket() {
				try {
					// on connect
						request.game = db[request.path[2]] || false
						game.addPlayer(request, function (recipients, data) {
							if (!data.success) {
								request.connection.sendUTF(JSON.stringify({success: false, location: "../../"}))
								request.connection.close()
							}
							else {
								updateSocket(recipients, data)
							}
						})

					// on close
						request.connection.on("close", function (reasonCode, description) {
							game.removePlayer(request, function (recipients, data) {
								if (data.delete) {
									clearInterval(request.game.loop)
									delete db[request.game.id]
								}
								else {
									updateSocket(recipients, data)
								}
							})
						})
					
					// on message
						request.connection.on("message", function (message) {
							// get post data
								request.post = null
								try { request.post = JSON.parse(message.utf8Data) || null }
								catch (error) {main.logError(error)}

							// actions
								if (request.post && (request.post.action == "pressInput") && request.post.input) {
									try {
										game.pressInput(request, updateSocket)
									}
									catch (error) {_400(error)}
								}
								else if (request.post && (request.post.action == "releaseInput") && request.post.input) {
									try {
										game.releaseInput(request, updateSocket)
									}
									catch (error) {_400(error)}
								}
								else if (request.post && (request.post.action == "selectHero") && request.post.input) {
									try {
										game.selectHero(request, updateSocket)
									}
									catch (error) {_400(error)}
								}
						})

					// loop
						if (request.game && !request.game.loop) {
							request.game.loop = setInterval(function() {
								main.logTime(request.game.id + ":l ", function() {
									game.updateTime(request, updateSocket)
								})
							}, CONSTANTS.loopInterval)
						}
				}
				catch (error) {_400("unable to " + arguments.callee.name)}
			}

		/* updateSocket */
			function updateSocket(recipients, data) {
				try {
					data = JSON.stringify(data)
					for (var r in recipients) {
						try {
							var recipient = request.game.players[recipients[r]] || request.game.observers[recipients[r]] || null
							if (recipient && recipient.connected) {
								recipient.connection.sendUTF(data)
							}
						}
						catch (error) {main.logError(error)}
					}
				}
				catch (error) {main.logError(error)}
			}

		/* _400 */
			function _400(data) {
				main.logError(data)
				request.connection.sendUTF(JSON.stringify({success: false, message: (data || "unknown websocket error")}))
			}
	}
