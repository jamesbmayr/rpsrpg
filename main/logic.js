/*** modules ***/
	var http       = require("http")
	var fs         = require("fs")
	module.exports = {}

/*** constants ***/
	var ENVIRONMENT = getEnvironment()
	var CONSTANTS   = getAsset("constants")

/*** logs ***/
	/* logError */
		module.exports.logError = logError
		function logError(error, functionName, recipients, callback) {
			if (ENVIRONMENT.debug) {
				console.log("\n*** ERROR @ " + new Date().toLocaleString() + " ***")
				console.log(" - " + error)
				console.dir(arguments)

				try {
					if (functionName && recipients && callback) {
						callback(recipients, {success: false, message: "unable to " + functionName})
					}
				} catch (error) {}
			}
		}

	/* logStatus */
		module.exports.logStatus = logStatus
		function logStatus(status) {
			if (ENVIRONMENT.debug) {
				console.log("\n--- STATUS @ " + new Date().toLocaleString() + " ---")
				console.log(" - " + status)
			}
		}

	/* logMessage */
		module.exports.logMessage = logMessage
		function logMessage(message) {
			if (ENVIRONMENT.debug) {
				console.log(" - " + new Date().toLocaleString() + ": " + message)
			}
		}

	/* logTime */
		module.exports.logTime = logTime
		function logTime(flag, callback) {
			if (ENVIRONMENT.debug) {
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
		function getEnvironment() {
			try {
				if (process.env.DOMAIN !== undefined) {
					return {
						port:   process.env.PORT,
						domain: process.env.DOMAIN,
						debug:  (process.env.DEBUG || false)
					}
				}
				else {
					return {
						port:   3000,
						domain: "localhost",
						debug:  true
					}
				}
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
									<meta name="description" content="Three fantasy heroes team up to fight through a randomly generated dungeon of orb-hoarding monsters."/>\
									<meta name="keywords" content="game,fantasy,heroes,monsters,wizard,barbarian,ranger,multiplayer"/>\
									<meta name="author" content="James Mayr"/>\
									<meta property="og:title" content="Three fantasy heroes team up to fight through a randomly generated dungeon of orb-hoarding monsters."/>\
									<meta property="og:url" content="https://rpsrpg.herokuapp.com"/>\
									<meta property="og:description" content="Three fantasy heroes team up to fight through a randomly generated dungeon of orb-hoarding monsters."/>\
									<meta property="og:image" content="https://rpsrpg.herokuapp.com/banner.png"/>\
									<meta name="viewport" content="width=device-width, height=device-height, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"/>'
						break
						case "css variables":
							// colors
								var cssColors = ""
								for (var hue in CONSTANTS.colors) {
									for (var shade in CONSTANTS.colors[hue]) {
										cssColors += "		--" + hue + "-" + shade + ": " + CONSTANTS.colors[hue][shade] + ";\n"
									}
								}
							
							// data
								return ('/*** variables ***/\n' +
										'	:root {\n' +
										'		--font: ' + CONSTANTS.font + ';\n' +
										'		--borderWidth: ' + CONSTANTS.borderWidth + 'px;\n' +
										'		--animationTime: ' + CONSTANTS.animationTime + 's;\n' +
										'		--transitionTime: ' + CONSTANTS.transitionTime + 's;\n' +
										'		--overlayOpacity: ' + CONSTANTS.overlayOpacity + ';\n' +
										'		--maxContainerWidth: ' + CONSTANTS.maxContainerWidth + 'px;\n' +
												cssColors +
										'	}')
						break
						case "js variables":
							return ('/*** superglobals ***/\n' +
									'	var CONSTANTS = ' 	+ JSON.stringify(CONSTANTS) + '\n' +
									'	var SPRITES = ' 	+ JSON.stringify(getAsset("sprites")) + '\n' +
									'	var SFX = ' 		+ JSON.stringify(getAsset("sfx")) + '\n' +
									'')
						break

					// sprites
						case "sprites":
							return [
								"orb_rock_all_standing_active",				"orb_paper_all_standing_active",				"orb_scissors_all_standing_active",				"orb_rock_all_standing_default",				"orb_paper_all_standing_default",				"orb_scissors_all_standing_default",			
								"pedestal_rock_all_standing_default",		"pedestal_paper_all_standing_default",			"pedestal_scissors_all_standing_default",		"pedestal_rock_all_standing_active",			"pedestal_paper_all_standing_active",			"pedestal_scissors_all_standing_active",
								"spawn_rock_all_standing_default",			"spawn_paper_all_standing_default",				"spawn_scissors_all_standing_default",			"spawn_rock_all_standing_active",				"spawn_paper_all_standing_active",				"spawn_scissors_all_standing_active",
								"shrine_rock_all_standing_default",			"shrine_paper_all_standing_default",			"shrine_scissors_all_standing_default",			"shrine_rock_all_standing_active",				"shrine_paper_all_standing_active",				"shrine_scissors_all_standing_active",
								"portal_portal_all_standing_default", 		"portal_portal_all_standing_active",

								"layer_0_background", "layer_0_wall_0_", "layer_0_wall_1_up", "layer_0_wall_1_right", "layer_0_wall_1_down", "layer_0_wall_1_left", "layer_0_wall_2_upright", "layer_0_wall_2_rightdown", "layer_0_wall_2_downleft", "layer_0_wall_2_upleft", "layer_0_wall_2_updown", "layer_0_wall_2_rightleft", "layer_0_wall_3_uprightdown", "layer_0_wall_3_rightdownleft", "layer_0_wall_3_uprightleft", "layer_0_wall_3_updownleft", "layer_0_wall_4_uprightdownleft",
								"layer_1_background", "layer_1_wall_0_", "layer_1_wall_1_up", "layer_1_wall_1_right", "layer_1_wall_1_down", "layer_1_wall_1_left", "layer_1_wall_2_upright", "layer_1_wall_2_rightdown", "layer_1_wall_2_downleft", "layer_1_wall_2_upleft", "layer_1_wall_2_updown", "layer_1_wall_2_rightleft", "layer_1_wall_3_uprightdown", "layer_1_wall_3_rightdownleft", "layer_1_wall_3_uprightleft", "layer_1_wall_3_updownleft", "layer_1_wall_4_uprightdownleft",
								"layer_2_background", "layer_2_wall_0_", "layer_2_wall_1_up", "layer_2_wall_1_right", "layer_2_wall_1_down", "layer_2_wall_1_left", "layer_2_wall_2_upright", "layer_2_wall_2_rightdown", "layer_2_wall_2_downleft", "layer_2_wall_2_upleft", "layer_2_wall_2_updown", "layer_2_wall_2_rightleft", "layer_2_wall_3_uprightdown", "layer_2_wall_3_rightdownleft", "layer_2_wall_3_uprightleft", "layer_2_wall_3_updownleft", "layer_2_wall_4_uprightdownleft",
								"layer_3_background", "layer_3_wall_0_", "layer_3_wall_1_up", "layer_3_wall_1_right", "layer_3_wall_1_down", "layer_3_wall_1_left", "layer_3_wall_2_upright", "layer_3_wall_2_rightdown", "layer_3_wall_2_downleft", "layer_3_wall_2_upleft", "layer_3_wall_2_updown", "layer_3_wall_2_rightleft", "layer_3_wall_3_uprightdown", "layer_3_wall_3_rightdownleft", "layer_3_wall_3_uprightleft", "layer_3_wall_3_updownleft", "layer_3_wall_4_uprightdownleft",
								
								"hero_barbarian_up_moving_inactive", 		"hero_barbarian_down_moving_inactive", 			"hero_barbarian_left_moving_inactive", 			"hero_barbarian_right_moving_inactive", 		"hero_barbarian_up_standing_inactive", 			"hero_barbarian_down_standing_inactive", 		"hero_barbarian_left_standing_inactive", 		"hero_barbarian_right_standing_inactive", 
								"hero_barbarian_up_moving_holding", 		"hero_barbarian_down_moving_holding", 			"hero_barbarian_left_moving_holding", 			"hero_barbarian_right_moving_holding", 			"hero_barbarian_up_standing_holding", 			"hero_barbarian_down_standing_holding", 		"hero_barbarian_left_standing_holding", 		"hero_barbarian_right_standing_holding", 
								"hero_barbarian_up_moving_rangeAttack", 	"hero_barbarian_down_moving_rangeAttack", 		"hero_barbarian_left_moving_rangeAttack", 		"hero_barbarian_right_moving_rangeAttack", 		"hero_barbarian_up_standing_rangeAttack", 		"hero_barbarian_down_standing_rangeAttack", 	"hero_barbarian_left_standing_rangeAttack", 	"hero_barbarian_right_standing_rangeAttack", 
								"hero_barbarian_up_moving_areaAttack", 		"hero_barbarian_down_moving_areaAttack", 		"hero_barbarian_left_moving_areaAttack", 		"hero_barbarian_right_moving_areaAttack", 		"hero_barbarian_up_standing_areaAttack", 		"hero_barbarian_down_standing_areaAttack", 		"hero_barbarian_left_standing_areaAttack", 		"hero_barbarian_right_standing_areaAttack", 
								"hero_barbarian_up_moving_collision", 		"hero_barbarian_down_moving_collision", 		"hero_barbarian_left_moving_collision", 		"hero_barbarian_right_moving_collision", 		"hero_barbarian_up_standing_collision", 		"hero_barbarian_down_standing_collision", 		"hero_barbarian_left_standing_collision", 		"hero_barbarian_right_standing_collision", 
								
								"hero_ranger_up_moving_inactive", 			"hero_ranger_down_moving_inactive", 			"hero_ranger_left_moving_inactive", 			"hero_ranger_right_moving_inactive", 			"hero_ranger_up_standing_inactive", 			"hero_ranger_down_standing_inactive", 			"hero_ranger_left_standing_inactive", 			"hero_ranger_right_standing_inactive", 
								"hero_ranger_up_moving_holding", 			"hero_ranger_down_moving_holding", 				"hero_ranger_left_moving_holding", 				"hero_ranger_right_moving_holding", 			"hero_ranger_up_standing_holding", 				"hero_ranger_down_standing_holding", 			"hero_ranger_left_standing_holding", 			"hero_ranger_right_standing_holding", 
								"hero_ranger_up_moving_rangeAttack", 		"hero_ranger_down_moving_rangeAttack", 			"hero_ranger_left_moving_rangeAttack", 			"hero_ranger_right_moving_rangeAttack", 		"hero_ranger_up_standing_rangeAttack", 			"hero_ranger_down_standing_rangeAttack", 		"hero_ranger_left_standing_rangeAttack", 		"hero_ranger_right_standing_rangeAttack", 
								"hero_ranger_up_moving_areaAttack", 		"hero_ranger_down_moving_areaAttack", 			"hero_ranger_left_moving_areaAttack", 			"hero_ranger_right_moving_areaAttack", 			"hero_ranger_up_standing_areaAttack", 			"hero_ranger_down_standing_areaAttack", 		"hero_ranger_left_standing_areaAttack", 		"hero_ranger_right_standing_areaAttack", 
								"hero_ranger_up_moving_collision", 			"hero_ranger_down_moving_collision", 			"hero_ranger_left_moving_collision", 			"hero_ranger_right_moving_collision", 			"hero_ranger_up_standing_collision", 			"hero_ranger_down_standing_collision", 			"hero_ranger_left_standing_collision", 			"hero_ranger_right_standing_collision", 
								
								"hero_wizard_up_moving_inactive", 			"hero_wizard_down_moving_inactive", 			"hero_wizard_left_moving_inactive", 			"hero_wizard_right_moving_inactive", 			"hero_wizard_up_standing_inactive", 			"hero_wizard_down_standing_inactive", 			"hero_wizard_left_standing_inactive", 			"hero_wizard_right_standing_inactive",
								"hero_wizard_up_moving_holding", 			"hero_wizard_down_moving_holding", 				"hero_wizard_left_moving_holding", 				"hero_wizard_right_moving_holding", 			"hero_wizard_up_standing_holding", 				"hero_wizard_down_standing_holding", 			"hero_wizard_left_standing_holding", 			"hero_wizard_right_standing_holding",
								"hero_wizard_up_moving_rangeAttack", 		"hero_wizard_down_moving_rangeAttack", 			"hero_wizard_left_moving_rangeAttack", 			"hero_wizard_right_moving_rangeAttack", 		"hero_wizard_up_standing_rangeAttack", 			"hero_wizard_down_standing_rangeAttack", 		"hero_wizard_left_standing_rangeAttack", 		"hero_wizard_right_standing_rangeAttack",
								"hero_wizard_up_moving_areaAttack", 		"hero_wizard_down_moving_areaAttack", 			"hero_wizard_left_moving_areaAttack", 			"hero_wizard_right_moving_areaAttack", 			"hero_wizard_up_standing_areaAttack", 			"hero_wizard_down_standing_areaAttack", 		"hero_wizard_left_standing_areaAttack", 		"hero_wizard_right_standing_areaAttack",
								"hero_wizard_up_moving_collision", 			"hero_wizard_down_moving_collision", 			"hero_wizard_left_moving_collision", 			"hero_wizard_right_moving_collision", 			"hero_wizard_up_standing_collision", 			"hero_wizard_down_standing_collision", 			"hero_wizard_left_standing_collision", 			"hero_wizard_right_standing_collision",
								
								"monster_avalanche_up_moving_inactive", 	"monster_avalanche_down_moving_inactive", 		"monster_avalanche_left_moving_inactive", 		"monster_avalanche_right_moving_inactive", 		"monster_avalanche_up_standing_inactive", 		"monster_avalanche_down_standing_inactive", 	"monster_avalanche_left_standing_inactive", 	"monster_avalanche_right_standing_inactive",
								"monster_avalanche_up_moving_rangeAttack", 	"monster_avalanche_down_moving_rangeAttack", 	"monster_avalanche_left_moving_rangeAttack", 	"monster_avalanche_right_moving_rangeAttack", 	"monster_avalanche_up_standing_rangeAttack", 	"monster_avalanche_down_standing_rangeAttack", 	"monster_avalanche_left_standing_rangeAttack", 	"monster_avalanche_right_standing_rangeAttack",
								"monster_avalanche_up_moving_areaAttack", 	"monster_avalanche_down_moving_areaAttack",	 	"monster_avalanche_left_moving_areaAttack", 	"monster_avalanche_right_moving_areaAttack", 	"monster_avalanche_up_standing_areaAttack", 	"monster_avalanche_down_standing_areaAttack", 	"monster_avalanche_left_standing_areaAttack", 	"monster_avalanche_right_standing_areaAttack",
								"monster_avalanche_up_moving_collision", 	"monster_avalanche_down_moving_collision",	 	"monster_avalanche_left_moving_collision", 		"monster_avalanche_right_moving_collision", 	"monster_avalanche_up_standing_collision", 		"monster_avalanche_down_standing_collision", 	"monster_avalanche_left_standing_collision", 	"monster_avalanche_right_standing_collision",
								
								"monster_tatters_up_moving_inactive", 		"monster_tatters_down_moving_inactive", 		"monster_tatters_left_moving_inactive", 		"monster_tatters_right_moving_inactive", 		"monster_tatters_up_standing_inactive", 		"monster_tatters_down_standing_inactive", 		"monster_tatters_left_standing_inactive", 		"monster_tatters_right_standing_inactive",
								"monster_tatters_up_moving_rangeAttack", 	"monster_tatters_down_moving_rangeAttack", 		"monster_tatters_left_moving_rangeAttack", 		"monster_tatters_right_moving_rangeAttack", 	"monster_tatters_up_standing_rangeAttack", 		"monster_tatters_down_standing_rangeAttack", 	"monster_tatters_left_standing_rangeAttack", 	"monster_tatters_right_standing_rangeAttack",
								"monster_tatters_up_moving_areaAttack", 	"monster_tatters_down_moving_areaAttack", 		"monster_tatters_left_moving_areaAttack", 		"monster_tatters_right_moving_areaAttack", 		"monster_tatters_up_standing_areaAttack", 		"monster_tatters_down_standing_areaAttack", 	"monster_tatters_left_standing_areaAttack", 	"monster_tatters_right_standing_areaAttack",
								"monster_tatters_up_moving_collision", 		"monster_tatters_down_moving_collision", 		"monster_tatters_left_moving_collision", 		"monster_tatters_right_moving_collision", 		"monster_tatters_up_standing_collision", 		"monster_tatters_down_standing_collision", 		"monster_tatters_left_standing_collision", 		"monster_tatters_right_standing_collision",

								"monster_obscuro_up_moving_inactive", 		"monster_obscuro_down_moving_inactive", 		"monster_obscuro_left_moving_inactive", 		"monster_obscuro_right_moving_inactive", 		"monster_obscuro_up_standing_inactive", 		"monster_obscuro_down_standing_inactive", 		"monster_obscuro_left_standing_inactive", 		"monster_obscuro_right_standing_inactive",
								"monster_obscuro_up_moving_rangeAttack", 	"monster_obscuro_down_moving_rangeAttack", 		"monster_obscuro_left_moving_rangeAttack", 		"monster_obscuro_right_moving_rangeAttack", 	"monster_obscuro_up_standing_rangeAttack", 		"monster_obscuro_down_standing_rangeAttack", 	"monster_obscuro_left_standing_rangeAttack", 	"monster_obscuro_right_standing_rangeAttack",
								"monster_obscuro_up_moving_areaAttack", 	"monster_obscuro_down_moving_areaAttack", 		"monster_obscuro_left_moving_areaAttack", 		"monster_obscuro_right_moving_areaAttack", 		"monster_obscuro_up_standing_areaAttack", 		"monster_obscuro_down_standing_areaAttack", 	"monster_obscuro_left_standing_areaAttack", 	"monster_obscuro_right_standing_areaAttack",
								"monster_obscuro_up_moving_collision", 		"monster_obscuro_down_moving_collision", 		"monster_obscuro_left_moving_collision", 		"monster_obscuro_right_moving_collision", 		"monster_obscuro_up_standing_collision", 		"monster_obscuro_down_standing_collision", 		"monster_obscuro_left_standing_collision", 		"monster_obscuro_right_standing_collision",

								"rangeAttack_barbarian_up_moving_default", 	"rangeAttack_barbarian_down_moving_default", 	"rangeAttack_barbarian_left_moving_default", 	"rangeAttack_barbarian_right_moving_default",
								"rangeAttack_ranger_up_moving_default", 	"rangeAttack_ranger_down_moving_default", 		"rangeAttack_ranger_left_moving_default", 		"rangeAttack_ranger_right_moving_default",
								"rangeAttack_wizard_up_moving_default", 	"rangeAttack_wizard_down_moving_default", 		"rangeAttack_wizard_left_moving_default", 		"rangeAttack_wizard_right_moving_default",

								"rangeAttack_avalanche_up_moving_default", 	"rangeAttack_avalanche_down_moving_default", 	"rangeAttack_avalanche_left_moving_default", 	"rangeAttack_avalanche_right_moving_default",
								"rangeAttack_tatters_up_moving_default", 	"rangeAttack_tatters_down_moving_default", 		"rangeAttack_tatters_left_moving_default", 		"rangeAttack_tatters_right_moving_default",
								"rangeAttack_obscuro_up_moving_default", 	"rangeAttack_obscuro_down_moving_default", 		"rangeAttack_obscuro_left_moving_default", 		"rangeAttack_obscuro_right_moving_default",

								"areaAttack_barbarian_all_standing_default",	"areaAttack_wizard_all_standing_default",	"areaAttack_ranger_all_standing_default",
								"areaAttack_avalanche_all_standing_default",	"areaAttack_obscuro_all_standing_default",	"areaAttack_tatters_all_standing_default"
							]
						break

					// sfx
						case "sfx":
							return {
								main: [
									"soundtrack",
									"rangeAttack_barbarian", "rangeAttack_wizard", "rangeAttack_ranger",
									"areaAttack_barbarian", /*"areaAttack_wizard",*/ "areaAttack_ranger",
									"death_monster_avalanche", "death_monster_obscuro", "death_monster_tatters",
									"death_spawn_rock", "death_spawn_paper", "death_spawn_scissors",
									"collision_rangeAttack_monster", "collision_hero_object"
								],
								player: [

								]
							}
						break

					// game parameters
						case "constants":
							var constants = {
								// messages
									joinMessage: 		"JOIN: ",
									startMessage: 		"FIND THE ORBS!",
									pauseMessage: 		"PAUSED",
									victoryMessage: 	"VICTORY!",
									defeatMessage: 		"TIME'S UP!",
									deathMessage: 		"REVIVING",
									teleportMessage: 	"TELEPORTING",
									storyMessage: 		"Swarms of menacing monsters have stolen the sacred orbs!<br><br>BARBARIAN: use strength to obliterate scurrying spiders<br>WIZARD: summon spells to destroy raging rock monsters<br>RANGER: throw dangerous daggers through ghastly ghouls",

								// styling
									font: 				"monospace",
									borderWidth: 		16,
									borderThickness: 	8,
									overlayOpacity: 	0.5,
									deathOpacity: 		0.5,
									healthHigh: 		60,
									healthLow: 			30,
									timeHigh: 			90,
									timeLow: 			45,
									loadFade: 			4,
									audioRemoval: 		1000 * 5,
									animationTime: 		2,
									animationDistance: 	8,
									transitionTime: 	0.1,
									maxContainerWidth: 	800,

								// game loop
									loopInterval: 		50,

								// game creation
									layers: 			4,
									chamberSize: 		9,
									edgeBuffer: 		2,
									cellSize: 			128,
									portalPairs: 		2,
									shrineSets: 		2,
									monsterCountMin:	3,
									monsterCountMax:	10,
									monsterChance: 		[9,10],
									spawnCountMin: 		1,
									spawnCountMax: 		3,
									spawnChance: 		[7,10],
									temporarySpawnCount: 8,

								// health
									baseHealthFraction: 1,
									reviveHealthFraction: 0.25,
									heroHealth: 		128,
									spawnHealth: 		1024,
									heal: 				2,
									rpsMultiplier: 		2,

								// AI
									monsterChanceA: 	[1,3],
									monsterChanceB: 	[1,10],
									heroChanceA: 		[1,2],
									heroChanceB: 		[1,4],

								// fades
									rangeAttackFade: 	1,
									areaAttackFade: 	3,
									deathFade: 			1,

								// shrine effects
									rockMultiplier: 	1.5,
									paperMultiplier: 	2,
									scissorsMultiplier: 1.5,

								// lists
									rps: 				["rock", "paper", "scissors"],
									directions: 		["up", "right", "down", "left"],
									actions: 			["a", "b"],

								// colors
									colors: {
										magenta: 	["#ffcce6","#ff66b3","#e60073","#99004d","#33001a"],
										red: 		["#fab7b7","#f66f6f","#d80e0e","#7c0808","#300303"],
										brown: 		["#e09b06","#ae7804","#7c5603","#513802","#191101"],
										browngray: 	["#d5cac3","#b6a196","#a18778","#786154","#4f4037"],
										orange: 	["#fde4ce","#f9ae6c","#f68523","#ab5407","#442103"],
										beige: 		["#f7f4ed","#e0d3b8","#c1a871","#91773f","#6a572f"],
										yellow: 	["#f6f4d5","#e5dd80","#d8cb41","#beb227","#7f771a"],
										green: 		["#a9d3ab","#539e57","#1a661e","#074f0b","#053007"],
										greengray: 	["#d3ded4","#99b29b","#6a8c6c","#4d664e","#374938"],
										cyan: 		["#e6ffff","#b3ffff","#33ffff","#00cccc","#008080"],
										cerulean: 	["#dae7f1","#90b8d5","#4689b9","#2b5572","#1c374a"],
										bluegray: 	["#dee9ed","#adc8d2","#7ba7b7","#487484","#2d4852"],
										blue: 		["#d0e0fb","#7a9bd3","#2b76ef","#0b3d8e","#04142f"],
										purple: 	["#dac0f7","#b08bda","#7b3dc2","#4a2574","#180c26"],
										black: 		["#e4e6e7","#a2a7a9","#6e7477","#3d4142","#232526"],
										white: 		["#c0dee5","#cee2e8","#dcf1f7","#e3f5f9","#f9fdff"],
										rock: 		["#ff8700"],
										paper: 		["#22d0a7"],
										scissors: 	["#c4004b"]
									}
							}

							// time derivatives
								var second = (1000 / constants.loopInterval)
								constants.gameCooldown 		= Math.floor(second * 60 * 2)
								constants.chamberCooldown 	= Math.floor(second / 4)
								constants.edgeCooldown 		= Math.floor(second * 2)
								constants.spawnCooldown 	= Math.floor(second * 4)
								constants.portalCooldown 	= Math.floor(second * 3)
								constants.deathCooldown 	= Math.floor(second)
								constants.effectCooldown 	= Math.floor(second * 30)
								constants.aCooldown 		= Math.floor(second / 2)
								constants.bCooldown 		= Math.floor(second)

							// interval derivatives
								constants.imageFlip 		= constants.loopInterval * 6
								constants.collisionVibration = [constants.loopInterval]

							// points
								constants.monsterPoints 	= Math.floor(second * 5)
								constants.spawnPoints 		= Math.floor(second * 10)
								constants.newChamberPoints 	= Math.floor(second * 5)
								constants.pedestalPoints	= Math.floor(second * 60)

							// distance derivatives
								constants.acceleration 		= Math.floor(constants.cellSize / 16)
								constants.rangeAttackRadius = Math.floor(constants.cellSize / 32)
								constants.areaAttackRadius 	= Math.floor(constants.cellSize / 8)
								constants.itemDropRadius 	= Math.floor(constants.cellSize / 4)
								constants.monsterAwareness 	= Math.floor(constants.cellSize * 4)


							// chamber colors by layer
								constants.chamberColors = [
									constants.colors.cyan,
									constants.colors.bluegray,
									constants.colors.cerulean,
									constants.colors.blue,
									constants.colors.purple,
									constants.colors.black
								]

							return constants
						break

					// functions
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
								function left(cells, minX, maxX, minY, maxY) {
									for (var y = minY; y <= maxY; y++) {
										cells[minX][y].wall = true
										cells[minX + 1][y].wall = true
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
								function downRight(cells, minX, maxX, minY, maxY) {
									cells[maxX][minY].wall = true
									cells[maxX][minY + 1].wall = true
									cells[maxX - 1][minY].wall = true
									cells[maxX - 1][minY + 1].wall = true
								},
								function downLeft(cells, minX, maxX, minY, maxY) {
									cells[minX][minY].wall = true
									cells[minX][minY + 1].wall = true
									cells[minX + 1][minY].wall = true
									cells[minX + 1][minY + 1].wall = true
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

						case "pathingAI":
							return {
								docile: function(chamber, monster, currentCell, nodemap) {
									try {
										// get x and y
											var coords = currentCell.split(",")
											var x = Number(coords[0])
											var y = Number(coords[1])

										// randomly change X% of the time
											if (rangeRandom(CONSTANTS.directionChance[0], CONSTANTS.directionChance[1])) {
												monster.state.movement.direction = null
											}

										// walls? change direction
											else if (monster.state.movement.direction) {
												if ((monster.state.movement.direction == "up") && (!chamber.cells[x] || !chamber.cells[x][y + 1] || chamber.cells[x][y + 1].wall)) {
													monster.state.movement.direction = null
												}
												else if ((monster.state.movement.direction == "right") && (!chamber.cells[x + 1] || !chamber.cells[x + 1][y] || chamber.cells[x + 1][y].wall)) {
													monster.state.movement.direction = null
												}
												else if ((monster.state.movement.direction == "down") && (!chamber.cells[x] || !chamber.cells[x][y - 1] || chamber.cells[x][y - 1].wall)) {
													monster.state.movement.direction = null
												}
												else if ((monster.state.movement.direction == "left") && (!chamber.cells[x - 1] || !chamber.cells[x - 1][y] || chamber.cells[x - 1][y].wall)) {
													monster.state.movement.direction = null
												}
											}

										// no direction? get a random one
											if (!monster.state.movement.direction) {
												monster.state.movement.direction = chooseRandom(CONSTANTS.directions)
											}

										// get new target cell
											var targetCell = currentCell
											if ((monster.state.movement.direction == "up") && (chamber.cells[x] && chamber.cells[x][y + 1] && !chamber.cells[x][y + 1].wall)) {
												targetCell = (x) + "," + (y + 1)
											}
											else if ((monster.state.movement.direction == "right") && (chamber.cells[x + 1] && chamber.cells[x + 1][y] && !chamber.cells[x + 1][y].wall)) {
												targetCell = (x + 1) + "," + (y)
											}
											else if ((monster.state.movement.direction == "down") && (chamber.cells[x] && chamber.cells[x][y - 1] && !chamber.cells[x][y - 1].wall)) {
												targetCell = (x) + "," + (y - 1)
											}
											else if ((monster.state.movement.direction == "left") && (chamber.cells[x - 1] && chamber.cells[x - 1][y] && !chamber.cells[x - 1][y].wall)) {
												targetCell = (x - 1) + "," + (y)
											}

										// return path
											var paths = nodemap[currentCell][targetCell] || []
											if (!paths || !paths.length) {
												return currentCell
											}
											else {
												return paths.sort(function(a, b) {
													return a.split(" > ").length - b.split(" > ").length
												})[0] || currentCell
											}
									} catch (error) { return currentCell }
								},
								cowardly: function(chamber, monster, currentCell, nodemap) {
									try {
										// distances
											var distances = {}
											for (var h in chamber.heroes) {
												var hero = chamber.heroes[h]
												if (hero.state.alive) {
													var distance = getDistance(monster.state.position.x, monster.state.position.y, hero.state.position.x, hero.state.position.y)
													if (distance <= CONSTANTS.monsterAwareness) {
														distances[h] = distance
													}
												}
											}

										// get closest
											var keys = Object.keys(distances) || []
											if (!keys.length) {
												return currentCell
											}
												keys.sort(function(a,b) {
													return distances[b] - distances[a]
												})
											var closestHero = chamber.heroes[keys[0]]

										// get hero cell
											var heroX = closestHero.state.position.x
											var heroY = closestHero.state.position.y
											var cellX = Math.round(Math.abs(heroX / CONSTANTS.cellSize)) * Math.sign(heroX)
												if (cellX == -0 || cellX == 0) { cellX = 1 }
											var cellY = Math.round(Math.abs(heroY / CONSTANTS.cellSize)) * Math.sign(heroY)
												if (cellY == -0 || cellY == 0) { cellY = 1 }

										// get cell in opposite quadrant
											var targetX = Math.sign(cellX) * -1 * Math.floor(chamber.info.chamberSize / 2)
											var targetY = Math.sign(cellY) * -1 * Math.floor(chamber.info.chamberSize / 2)
											var targetCell = null
											var changeDirection = "x"
											while (!targetCell) {
												if (chamber.cells[targetX] && chamber.cells[targetX][targetY] && !chamber.cells[targetX][targetY].wall) {
													targetCell = targetX + "," + targetY
												}
												else if (changeDirection == "x") {
													targetX = (Math.abs(targetX) - 1) * Math.sign(targetX)
													changeDirection = "y"
												}
												else if (changeDirection == "y") {
													targetY = (Math.abs(targetY) - 1) * Math.sign(targetY)
													changeDirection = "x"
												}
											}

										// return path
											var paths = nodemap[currentCell][targetCell] || []
											if (!paths || !paths.length) {
												return currentCell
											}
											else {
												return paths.sort(function(a, b) {
													return a.split(" > ").length - b.split(" > ").length
												})[0] || currentCell
											}
									} catch (error) { return currentCell }
								},
								protective: function(chamber, monster, currentCell, nodemap) {
									try {
										// no items?
											if (!Object.keys(chamber.items)) {
												return currentCell
											}

										// some items
											else {
												// loop through to find best item (orb > pedestal > shrine > portal)
													var cellX = null
													var cellY = null
													var itemType = null
													var preferences = ["orb", "pedestal", "spawn", "shrine", "portal"]
													for (var i in chamber.items) {
														var item = chamber.items[i]
														if (item.info.type == "orb" && !item.state.active) {
															continue
														}
														else if (preferences.includes(item.info.type) && (preferences.indexOf(item.info.type) < preferences.indexOf(itemType))) {
															itemType = item.info.type
															var targetX = item.state.position.x
															var targetY = item.state.position.y
															var cellX = Math.round(Math.abs(targetX / CONSTANTS.cellSize)) * Math.sign(targetX)
																if (cellX == -0) { cellX = 0 }
															var cellY = Math.round(Math.abs(targetY / CONSTANTS.cellSize)) * Math.sign(targetY)
																if (cellY == -0) { cellY = 0 }
														}
													}

												// no item?
													if (!itemType) {
														return currentCell
													}

												// return path
													var paths = nodemap[currentCell][cellX + "," + cellY] || []
													if (!paths || !paths.length) {
														return currentCell
													}
													else {
														return paths.sort(function(a, b) {
															return a.split(" > ").length - b.split(" > ").length
														})[0] || currentCell
													}
											}
									} catch (error) { return currentCell }
								},
								aggressive: function(chamber, monster, currentCell, nodemap) {
									try {
										// distances
											var distances = {}
											for (var h in chamber.heroes) {
												var hero = chamber.heroes[h]
												if (hero.state.alive) {
													var distance = getDistance(monster.state.position.x, monster.state.position.y, hero.state.position.x, hero.state.position.y)
													if (distance <= CONSTANTS.monsterAwareness) {
														distances[h] = distance
													}
												}
											}

										// get closest
											var keys = Object.keys(distances) || []
											if (!keys.length) {
												return currentCell
											}
												keys.sort(function(a,b) {
													return distances[b] - distances[a]
												})
											var closestHero = chamber.heroes[keys[0]]

										// get target cell
											var targetX = closestHero.state.position.x
											var targetY = closestHero.state.position.y
											var cellX = Math.round(Math.abs(targetX / CONSTANTS.cellSize)) * Math.sign(targetX)
												if (cellX == -0) { cellX = 0 }
											var cellY = Math.round(Math.abs(targetY / CONSTANTS.cellSize)) * Math.sign(targetY)
												if (cellY == -0) { cellY = 0 }

										// return path
											var paths = nodemap[currentCell][cellX + "," + cellY] || []
											if (!paths || !paths.length) {
												return currentCell
											}
											else {
												return paths.sort(function(a, b) {
													return a.split(" > ").length - b.split(" > ").length
												})[0] || currentCell
											}
									} catch (error) { return currentCell }
								},
								strategic: function(chamber, monster, currentCell, nodemap) {
									try {
										// get rps target
											var rpsTarget = (monster.info.rps == "rock") ? "scissors" : (monster.info.rps == "scissors") ? "paper" : "rock"
											var targetKey = Object.keys(chamber.heroes).find(function(k) {
												return (chamber.heroes[k].info.rps == rpsTarget && chamber.heroes[k].state.alive)
											})
											var targetHero = chamber.heroes[targetKey]

										// no rps target?
											if (!targetHero) {
												return currentCell
											}

										// get target cell
											var targetX = targetHero.state.position.x
											var targetY = targetHero.state.position.y
											var cellX = Math.round(Math.abs(targetX / CONSTANTS.cellSize)) * Math.sign(targetX)
												if (cellX == -0) { cellX = 0 }
											var cellY = Math.round(Math.abs(targetY / CONSTANTS.cellSize)) * Math.sign(targetY)
												if (cellY == -0) { cellY = 0 }

										// return path
											var paths = nodemap[currentCell][cellX + "," + cellY] || []
											if (!paths || !paths.length) {
												return currentCell
											}
											else {
												return paths.sort(function(a, b) {
													return a.split(" > ").length - b.split(" > ").length
												})[0] || currentCell
											}
									} catch (error) { return currentCell }
								},
								hero: function(chamber, hero, currentCell, nodemap) {
									try {
										// get target object
											var targets = {}
											var antitargets = []

											// 1: orb (or, if holding orb, pedestal)
												if (hero.state.alive) {
													for (var i in chamber.items) {
														if (chamber.items[i].info.type == "orb" && chamber.items[i].state.active && chamber.items[i].info.rps == hero.info.rps) {
															targets["0"] = chamber.items[i]
														}
														else if (chamber.items[i].info.type == "pedestal" && chamber.items[i].info.rps == hero.info.rps
														  && Object.keys(hero.items).find(function(i) { return hero.items[i].info.type == "orb" })) {
															targets["0"] = chamber.items[i]
														}
													}
												}

											// 2: allies at edge
												for (var h in chamber.heroes) {
													if (h == hero.id) {}
													else if (chamber.heroes[h].player && chamber.heroes[h].state.position.edge) {
														targets["1"] = chamber.heroes[h]
													}
													else if (chamber.heroes[h].player && Object.keys(chamber.heroes[h].items).length) {
														targets["2"] = chamber.heroes[h]
													}
												}

											// 3: enemies & spawns
												if (hero.state.alive) {
													var targetType = (hero.info.rps == "rock") ? "scissors" : (hero.info.rps == "scissors") ? "paper" : "rock"
													for (var i in chamber.items) {
														if (chamber.items[i].info.type == "spawn" && chamber.items[i].state.alive) {
															if (chamber.items[i].info.rps == targetType) {
																targets["3"] = chamber.items[i]
															}
															else if (chamber.items[i].info.rps == hero.info.rps) {
																targets["5"] = chamber.items[i]
															}
															else {
																antitargets.push(chamber.items[i])
															}
														}
													}

													for (var c in chamber.creatures) {
														if (chamber.creatures[c].state.alive) {
															if (chamber.creatures[c].info.rps == targetType) {
																targets["4"] = chamber.creatures[c]
															}
															else if (chamber.creatures[c].info.rps == hero.info.rps) {
																targets["6"] = chamber.creatures[c]
															}
															else {
																antitargets.push(chamber.creatures[c])
															}
														}
													}
												}

											// 4: allies
												for (var h in chamber.heroes) {
													if (h == hero.id) {}
													else if (chamber.heroes[h].player && chamber.heroes[h].state.alive && chamber.heroes[h].state.health < CONSTANTS.heroHealth / 4) {
														targets["7"] = chamber.heroes[h]
													}
													else if (chamber.heroes[h].player && chamber.heroes[h].state.alive && chamber.heroes[h].state.health < CONSTANTS.heroHealth / 2) {
														targets["8"] = chamber.heroes[h]
													}
													else if (chamber.heroes[h].player && chamber.heroes[h].state.alive) {
														targets["9"] = chamber.heroes[h]
													}
												}

										// get targetCell
											// targets
												if (Object.keys(targets).length) {
													// get target key
														var firstKey = Object.keys(targets).sort(function(a, b) {
															return Number(a) - Number(b)
														})[0]

													// get target cell
														var targetX = targets[firstKey].state.position.x
														var targetY = targets[firstKey].state.position.y
														var cellX = Math.round(Math.abs(targetX / CONSTANTS.cellSize)) * Math.sign(targetX)
															if (cellX == -0) { cellX = 0 }
														var cellY = Math.round(Math.abs(targetY / CONSTANTS.cellSize)) * Math.sign(targetY)
															if (cellY == -0) { cellY = 0 }
														var targetCell = cellX + "," + cellY
												}

											// antitargets
												else if (antitargets.length) {
													// distances
														var distances = {}
														for (var a in antitargets) {
															var antitarget = antitargets[a]
															distances[antitarget.id] = getDistance(hero.state.position.x, hero.state.position.y, antitarget.state.position.x, antitarget.state.position.y)
														}

													// get closest
														var keys = Object.keys(distances) || []
														if (!keys.length) {
															return currentCell
														}
															keys.sort(function(a,b) {
																return distances[b] - distances[a]
															})
														var closestAntitarget = chamber.creatures[keys[0]]

													// get antitarget cell
														var antitargetX = closestAntitarget.state.position.x
														var antitargetY = closestAntitarget.state.position.y
														var cellX = Math.round(Math.abs(antitargetX / CONSTANTS.cellSize)) * Math.sign(antitargetX)
															if (cellX == -0 || cellX == 0) { cellX = 1 }
														var cellY = Math.round(Math.abs(antitargetY / CONSTANTS.cellSize)) * Math.sign(antitargetY)
															if (cellY == -0 || cellY == 0) { cellY = 1 }

													// get cell in opposite quadrant
														var targetX = Math.sign(cellX) * -1 * Math.floor(chamber.info.chamberSize / 2)
														var targetY = Math.sign(cellY) * -1 * Math.floor(chamber.info.chamberSize / 2)
														var targetCell = null
														var changeDirection = "x"
														while (!targetCell) {
															if (chamber.cells[targetX] && chamber.cells[targetX][targetY] && !chamber.cells[targetX][targetY].wall) {
																targetCell = targetX + "," + targetY
															}
															else if (changeDirection == "x") {
																targetX = (Math.abs(targetX) - 1) * Math.sign(targetX)
																changeDirection = "y"
															}
															else if (changeDirection == "y") {
																targetY = (Math.abs(targetY) - 1) * Math.sign(targetY)
																changeDirection = "x"
															}
														}
												}

											// none
												else {
													var targetCell = currentCell
												}

										// get path
											// old path
												var oldPath = hero.state.movement.path || null
												var oldPathArray = oldPath ? oldPath.split(" > ") : []

											// new path
												var paths = nodemap[currentCell] ? (nodemap[currentCell][targetCell] || []) : []
												var newPath = paths.length ? paths.sort(function(a, b) {
													return a.split(" > ").length - b.split(" > ").length
												})[0] : null
												var newPathArray = newPath ? newPath.split(" > ") : []
											
											// same as current?
												if (currentCell == targetCell) {
													return currentCell
												}

											// no path?
												else if (!newPath) {
													return oldPath || currentCell
												}

											// use old path if same target
												else if (oldPath && oldPathArray[oldPathArray.length - 1] == targetCell && oldPathArray.length <= newPathArray.length) {
													return oldPath || currentCell
												}

											// or else change path
												else {
													return newPath || currentCell
												}

									} catch (error) { return currentCell }
								}
							}
						break

					// creatures
						case "heroes":
							var sixteenthCell = Math.floor(CONSTANTS.cellSize / 16)
							var sixteenthHealth = Math.floor(CONSTANTS.heroHealth / 16)

							return {
								"barbarian": {
									player: null,
									info: {
										rps: "rock",
										type: "hero",
										subtype: "barbarian",
										color: CONSTANTS.colors.rock[0],
										shape: "circle",
										pathing: "hero",
										statistics: {
											moveSpeed: 	sixteenthCell * 1,
											rangeSpeed: sixteenthCell * 2,
											rangePower: sixteenthHealth * 1.5,
											meleePower:	sixteenthHealth * 2.5,
											areaPower: 	sixteenthHealth * 2,
											bumpMove: 	sixteenthCell * 3,
											armorPower:	0.25,
											armorMax: 	5,
											healthMax: CONSTANTS.heroHealth
										}
									},
									state: {
										image: "hero_barbarian_down_standing_inactive",
										health: CONSTANTS.heroHealth * CONSTANTS.baseHealthFraction,
										armor: 4,
										position: {
											x: 0,
											y: 4 * sixteenthCell
										}
									}
								},
								"wizard": {
									player: null,
									info: {
										rps: "paper",
										type: "hero",
										subtype: "wizard",
										color: CONSTANTS.colors.paper[0],
										shape: "circle",
										pathing: "hero",
										statistics: {
											moveSpeed: 	sixteenthCell * 1.25,
											rangeSpeed: sixteenthCell * 3,
											rangePower: sixteenthHealth * 2,
											meleePower:	sixteenthHealth * 1.5,
											areaPower: 	sixteenthHealth * 2.5,
											bumpMove: 	sixteenthCell * 2,
											armorPower:	0.25,
											armorMax: 	3,
											healthMax: CONSTANTS.heroHealth
										}
									},
									state: {
										image: "hero_wizard_down_standing_inactive",
										health: CONSTANTS.heroHealth * CONSTANTS.baseHealthFraction,
										armor: 2,
										position: {
											x: -4 * sixteenthCell,
											y: -4 * sixteenthCell
										}
									}
								},
								"ranger": {
									player: null,
									info: {
										rps: "scissors",
										type: "hero",
										subtype: "ranger",
										color: CONSTANTS.colors.scissors[0],
										shape: "circle",
										pathing: "hero",
										statistics: {
											moveSpeed: 	sixteenthCell * 1.5,
											rangeSpeed: sixteenthCell * 3,
											rangePower: sixteenthHealth * 2.5,
											meleePower:	sixteenthHealth * 2,
											areaPower: 	sixteenthHealth * 1.5,
											bumpMove: 	sixteenthCell * 2.5,
											armorPower:	0.25,
											armorMax: 	4,
											healthMax: CONSTANTS.heroHealth
										}
									},
									state: {
										image: "hero_ranger_down_standing_inactive",
										health: CONSTANTS.heroHealth * CONSTANTS.baseHealthFraction,
										armor: 2,
										position: {
											x:  4 * sixteenthCell,
											y: -4 * sixteenthCell
										}
									}
								}
							}
						break

						case "monsters":
							var sixteenthCell = Math.floor(CONSTANTS.cellSize / 16)
							var sixteenthHealth = Math.floor(CONSTANTS.heroHealth / 16)

							return {
								"avalanche": {
									info: {
										rps: "rock",
										type: "monster",
										subtype: "avalanche",
										color: CONSTANTS.colors.rock[0],
										shape: "triangle",
										pathing: "aggressive",
										points: CONSTANTS.monsterPoints,
										statistics: {
											moveSpeed: 	sixteenthCell * 1,
											rangeSpeed: sixteenthCell * 1.5,
											rangePower: sixteenthHealth * 1.5,
											meleePower:	sixteenthHealth * 2,
											areaPower: 	sixteenthHealth * 1.5,
											bumpMove:   sixteenthCell * 3,
											armorPower:	0.25,
											armorMax: 	4,
											healthMax: CONSTANTS.monsterHealth
										}
									},
									state: {
										image: "monster_avalanche_down_standing_inactive",
										health: CONSTANTS.monsterHealth * CONSTANTS.baseHealthFraction,
										armor: 2
									}
								},
								"obscuro": {
									info: {
										rps: "paper",
										type: "monster",
										subtype: "obscuro",
										color: CONSTANTS.colors.paper[0],
										shape: "triangle",
										pathing: "aggressive",
										points: CONSTANTS.monsterPoints,
										statistics: {
											moveSpeed: 	sixteenthCell * 1.5,
											rangeSpeed: sixteenthCell * 3,
											rangePower: sixteenthHealth * 2,
											meleePower:	sixteenthHealth * 1.5,
											areaPower: 	sixteenthHealth * 1.5,
											bumpMove:   sixteenthCell * 2,
											armorPower:	0.25,
											armorMax: 	2,
											healthMax: CONSTANTS.monsterHealth
										}
									},
									state: {
										image: "monster_obscuro_down_standing_inactive",
										health: CONSTANTS.monsterHealth * CONSTANTS.baseHealthFraction,
										armor: 2
									}
								},
								"tatters": {
									info: {
										rps: "scissors",
										type: "monster",
										subtype: "tatters",
										color: CONSTANTS.colors.scissors[0],
										shape: "triangle",
										pathing: "aggressive",
										points: CONSTANTS.monsterPoints,
										statistics: {
											moveSpeed: 	sixteenthCell * 1.25,
											rangeSpeed: sixteenthCell * 2,
											rangePower: sixteenthHealth * 1.5,
											meleePower:	sixteenthHealth * 1.5,
											areaPower: 	sixteenthHealth * 2,
											bumpMove:   sixteenthCell * 2.5,
											armorPower:	0.25,
											armorMax: 	3,
											healthMax: CONSTANTS.monsterHealth
										}
									},
									state: {
										image: "monster_tatters_down_standing_inactive",
										health: CONSTANTS.monsterHealth * CONSTANTS.baseHealthFraction,
										armor: 2
									}
								}
							}
						break

					// items
						case "orbs":
							var orbSize = Math.floor(CONSTANTS.cellSize / 8 * 3)

							return {
								"rock": {
									info: {
										rps: "rock",
										type: "orb",
										subtype: "rock",
										size: {
											x: orbSize,
											y: orbSize,
											maxX: orbSize,
											maxY: orbSize
										},
										shape: "circle",
										style: "fill",
										color: CONSTANTS.colors.rock[0]
									},
									state: {
										image: "orb_rock_all_standing_default"
									}
								},
								"paper": {
									info: {
										rps: "paper",
										type: "orb",
										subtype: "paper",
										size: {
											x: orbSize,
											y: orbSize,
											maxX: orbSize,
											maxY: orbSize
										},
										shape: "circle",
										style: "fill",
										color: CONSTANTS.colors.paper[0]
									},
									state: {
										image: "orb_rock_all_standing_default"
									}
								},
								"scissors": {
									info: {
										rps: "scissors",
										type: "orb",
										subtype: "scissors",
										size: {
											x: orbSize,
											y: orbSize,
											maxX: orbSize,
											maxY: orbSize
										},
										shape: "circle",
										style: "fill",
										color: CONSTANTS.colors.scissors[0]
									},
									state: {
										image: "orb_rock_all_standing_default"
									}
								}
							}
						break

						case "pedestals":
							var quarterCell = Math.floor(CONSTANTS.cellSize / 4)
							var pedestals = getAsset("orbs")
							
							for (var p in pedestals) {
								overwriteObject(pedestals[p], {
									info: {
										type: "pedestal",
										points: CONSTANTS.pedestalPoints,
										shape: "circle",
										style: "border"
									},
									state: {
										image: "pedestal_" + p + "_all_standing_default",
										flip: true,
										active: false
									}
								})
							}

							overwriteObject(pedestals["rock"],     {state: {position: {x:  0 * quarterCell, y: 	4 * quarterCell}}})
							overwriteObject(pedestals["paper"],    {state: {position: {x: -4 * quarterCell, y: -4 * quarterCell}}})
							overwriteObject(pedestals["scissors"], {state: {position: {x:  4 * quarterCell, y: -4 * quarterCell}}})
							
							return pedestals
						break

						case "portal":
							return {
								info: {
									type: "portal",
									subtype: "portal",
									size: {
										x: Math.floor(CONSTANTS.cellSize / 8) * 7,
										y: Math.floor(CONSTANTS.cellSize / 8) * 7,
										maxX: Math.floor(CONSTANTS.cellSize / 8) * 7,
										maxY: Math.floor(CONSTANTS.cellSize / 8) * 7
									},
									color: CONSTANTS.colors.blue[1],
									shape: "square",
									style: "border"
								},
								state: {
									image: "portal_portal_all_standing_default",
									flip: true,
									cooldowns: {
										activate: 0
									},
									link: null
								}
							}
						break

						case "shrine":
							return {
								info: {
									type: "shrine",
									size: {
										x: Math.floor(CONSTANTS.cellSize / 8) * 7,
										y: Math.floor(CONSTANTS.cellSize / 8) * 7,
										maxX: Math.floor(CONSTANTS.cellSize / 8) * 7,
										maxY: Math.floor(CONSTANTS.cellSize / 8) * 7
									},
									shape: "square",
									style: "border"
								},
								state: {
									image: "shrine_rock_all_standing_default",
									flip: true,
									cooldowns: {
										activate: 0
									}
								}
							}
						break

						case "spawn":
							return {
								info: {
									type: "spawn",
									points: CONSTANTS.spawnPoints,
									size: {
										x: Math.floor(CONSTANTS.cellSize / 8) * 7,
										y: Math.floor(CONSTANTS.cellSize / 8) * 7,
										maxX: Math.floor(CONSTANTS.cellSize / 8) * 7,
										maxY: Math.floor(CONSTANTS.cellSize / 8) * 7
									},
									shape: "triangle",
									style: "border",
									statistics: {
										armorPower: 0,
										armorMax:  	0,
										healthMax: CONSTANTS.spawnHealth
									},
									monsterTypes: [],
									temporary: false
								},
								state: {
									image: "spawn_rock_all_standing_default",
									flip: true,
									cooldowns: {
										activate: 0
									},
									alive: true,
									health: CONSTANTS.spawnHealth * CONSTANTS.baseHealthFraction,
									armor: 0
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
									layers: CONSTANTS.layers
								},
								state: {
									start: 	false,
									end: 	false,
									paused: false,
									time: 	0,
									orbs: 	0,
									overlay: {
										message: null,
										timeout: CONSTANTS.gameCooldown,
										orb: null,
										minimap: {},
										minimapColors: {
											active: 	CONSTANTS.colors.black[3],
											inactive: 	CONSTANTS.colors.black[2],
											unexplored: CONSTANTS.colors.black[1],
											temple: 	CONSTANTS.colors.white[4],
											portal: 	getAsset("portal").info.color,
											rock: 		CONSTANTS.colors.rock[0],
											paper: 		CONSTANTS.colors.paper[0],
											scissors: 	CONSTANTS.colors.scissors[0]
										}
									},
									chamber: {
										x: 	0,
										y: 	0
									},
									nextChamber: null
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
							hero: 			null,
							created: 		(new Date().getTime()),
							connected: 		false,
							connection: 	null
						}
					break

					case "chamber":
						return {
							id: 				generateRandom(),
							info: {
								type: 			"chamber",
								colors: 		{},
								image: 			null,
								x: 				0,
								y: 				0,
								chamberSize: 	CONSTANTS.chamberSize,
								cellSize: 		CONSTANTS.cellSize,
								points: 		CONSTANTS.newChamberPoints,
							},
							state: {
								visited: 		false,
								overlay: 		{},
								cooldowns: {
									fade: 		0
								},
								fadeout:  		false
							},
							cells:          	{},
							heroes: 			{},
							creatures: 			{},
							items:				{}
						}
					break

					case "creature":
						return {
							id: 				generateRandom(),
							info: {
								rps: 			null,
								type: 			"creature",
								subtype:		null,
								size: {
									x: 			Math.floor(CONSTANTS.cellSize / 2),
									y: 			Math.floor(CONSTANTS.cellSize / 2),
									maxX: 		Math.floor(CONSTANTS.cellSize / 2),
									maxY: 		Math.floor(CONSTANTS.cellSize / 2)
								},
								color: 			null,
								statistics: {
									moveSpeed:  0,
									rangeSpeed: 0,
									rangePower: 0,
									meleePower:	0,
									areaPower: 	0,
									bumpMove: 	0,
									armorPower: 0,
									armorMax: 	0,
									healthMax: 	0
								}
							},
							state: {
								alive: 			true,
								health: 		0,
								armor: 			0,
								effects: {
									heal: 		false,
									rock: 		false,
									paper: 		false,
									scissors: 	false
								},
								position: {
									vx: 		0,
									vy: 		0,
									x: 			0,
									y: 			0,
									edge: 		null
								},
								movement: {
									direction: 	"down",
									bumped: 	false,
									path: 		null,
									up: 		false,
									right: 		false,
									down: 		false,
									left: 		false
								},
								actions: {
									a: 			false,
									b: 			false
								},
								cooldowns: {
									a: 			0,
									b: 			0
								},
								image: 			null,
								sound: 			null,
								vibration: 		false
							},
							items: 				{}
						}
					break

					case "item":
						return {
							id: 			generateRandom(),
							info: {
								rps: 		null,
								type: 		"item",
								subtype: 	null,
								size: {
									x: 		Math.floor(CONSTANTS.cellSize / 4),
									y: 		Math.floor(CONSTANTS.cellSize / 4),
									maxX: 	Math.floor(CONSTANTS.cellSize / 4),
									maxY: 	Math.floor(CONSTANTS.cellSize / 4)
								},
								color: 		null
							},
							state: {
								position: {
									x: 		0,
									y: 		0
								},
								image: 		null,
								sound: 		null
							}
						}
					break

					case "attack":
						return {
							info: {
								attacker: {
									id: 		null,
									type: 		null,
									subtype: 	null
								},
								shape: 			"circle",
								style: 			"fill",
								opacity: 		1,
								statistics: {
									speed: 		0,
									power: 		0
								}
							},
							state: {
								image: "areaAttack_barbarian_all_standing_default",
								position: {
									x: 0,
									y: 0
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

	/* getDistance */
		module.exports.getDistance = getDistance
		function getDistance(x1, y1, x2, y2) {
			try {
				x1 = Number(x1)
				y1 = Number(y1)
				x2 = Number(x2)
				y2 = Number(y2)

				if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
					return null
				}
				else {
					return Math.pow(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2), 0.5)
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

	/* rangeRandom */
		module.exports.rangeRandom = rangeRandom
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
			}
			catch (error) {
				logError(error)
				return false
			}
		}

	/* rollRandom */
		module.exports.rollRandom = rollRandom
		function rollRandom(numerator, denominator) {
			try {
				numerator  = Number(numerator)
				denominator = Number(denominator)

				if (isNaN(numerator) || isNaN(denominator)) {
					return false
				}
				else {
					var roll = Math.floor(Math.random() * denominator) + 1
					return roll <= numerator
				}
			}
			catch (error) {
				logError(error)
				return false
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
