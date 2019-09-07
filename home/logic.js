/*** modules ***/
	var main = require("../main/logic")
	var game = require("../game/logic")
	module.exports = {}

/*** creates ***/
	/* createGame */
		module.exports.createGame = createGame
		function createGame(request, id, callback) {
			try {
				// create game
					request.game    = main.getSchema("game")
					request.game.id = id
					game.createMap(request, callback)

				callback({success: true, message: "game created", location: "../../game/" + request.game.id})
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}
	
	/* createPlayer */
		module.exports.createPlayer = createPlayer
		function createPlayer(request) {
			try {
				// create player
					var player      = main.getSchema("player")
						player.id   = request.session.id
					return player
			}
			catch (error) {main.logError(error)}
		}

/*** joins ***/
	/* joinGame */
		module.exports.joinGame = joinGame
		function joinGame(request, callback) {
			try {
				if (request.game.data.state.end) {
					callback({success: false, message: "game already ended"})
				}
				else if (!request.game.players[request.session.id] && (Object.keys(request.game.players).length >= 3)) {
					callback({success: false, message: "game is at capacity"})
				}
				else if (request.game.players[request.session.id]) {
					callback({success: true, message: "rejoining game", location: "../../game/" + request.game.id})
				}
				else {
					// get remaining heroes
						var remainingHeroes = Object.keys(request.game.data.heroes)
						for (var p in request.game.players) {
							remainingHeroes.splice(remainingHeroes.indexOf(request.game.players[p].hero), 1)
						}

					// none remaining?
						if (!remainingHeroes.length) {
							callback({success: false, message: "no remaining heroes"})
						}

					// choose randomly from remaining
						else {
							request.game.players[request.session.id] = createPlayer(request)
							callback({success: true, message: "game joined", location: "../../game/" + request.game.id})
						}
				}
			}
			catch (error) {
				main.logError(error, arguments.callee.name, [request.session.id], callback)
			}
		}
