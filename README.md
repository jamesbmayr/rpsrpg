# RPS RPG

Three fantasy heroes team up to fight through a randomly generated dungeon of orb-hoarding monsters.

---
<pre>
 {}      [=]       8<
Rock    Paper   Scissors
Role   Playing    Game
</pre>
---

## Launch
Every game has a unique 4-letter id. Go to the homepage on a computer to start a new game.
Join a game on a computer or mobile device by entering the 4-letter id.

## Gameplay
Each player selects a hero:
* *barbarian*: swing a club, toss rocks, and set off bombs
* *wizard*: swing a staff, shoot lightning, and create a wall of water
* *ranger*: swing a sword, throw knives, and deploy spikes

Traverse the randomly generated dungeon, guarded by armies of monsters, to find and return the three magic orbs.
Along the adventure, you'll also encounter:
* *portals*: teleport between chambers
* *shrines*: temporary rage, protection, and speed
* *healing*: quickly recover health

## Code
The app is powered by nodeJS and websockets, written in 100% raw javascript. 

---
<pre>
rpsrpg
|- package.json
|- index.js (handleRequest, parseRequest, routeRequest, \_302, \_403, \_404; handleSocket, parseSocket, routeSocket, updateSocket, \_400)
|- node_modules
|   |- websocket
|
|- main
|   |- logic.js (logError, logStatus, logMessage, logTime; getEnvironment, getAsset, getSchema; isNumLet, isBot; renderHTML, sanitizeString, duplicateObject, duplicateArray, overwriteObject, getDistance; generateRandom, rangeRandom, rollRandom, chooseRandom, sortRandom; determineSession)
|   |- \_404.html
|   |- stylesheet.css
|   |- script.js (sendPost; displayMessage)
|   |- draw.js (clearCanvas, rotateCanvas; drawLine, drawCircle, drawTriangle, drawRectangle, drawShape; drawText, drawGradient)
|   |- images
|      |- banner.png
|      |- icon.png
|      |- j.png
|      |- logo.png
|
|- home
|   |- logic.js (createGame, createPlayer; joinGame)
|   |- index.html
|   |- stylesheet.css
|   |- script.js (isNumLet; createGame, joinGame)
|
|- about
|   |- index.html
|   |- stylesheet.css
|   |- script.js (isEmail, sanitizeString; submitFeedback)
|
|- game
    |- logic.js (addPlayer, removePlayer; selectHero, pressInput, releaseInput; triggerMove, untriggerMove, triggerAction, untriggerAction, triggerPause; createMap, createChamber, createCells, createWalls, createDoors, createWallImages, createNeighborConnections, createConnectionPaths; createTemple, createPortal, createShrine, createSpawn; createItem, createOrb, createRangeAttack, createAreaAttack; createCreature, createMonsters, createHero; getNextCoords, getCells, getCollisionSide; resolveEdges, resolveEdge, resolveWalls, resolveWall, resolveCollisions, resolveCollision, resolveAttackCollision, resolveStop, resolveDamage, resolvePoints; updateTime, updateNextChamber, updateChamber, updateCreature, updateItem, updateMovement, updateActions, updateAcceleration, updateMinimap, updateImage)
    |- main.html
    |- main.css
    |- main.js (preloadImages, preloadSounds; createSocket, checkLoop; receivePost; drawPaused, drawChamber, drawOverlay, drawMinimap; drawBackground, drawWalls, drawCreature, drawItem; playAudio, adjustSoundtrack)
    |- player.html
    |- player.css
    |- player.js (preloadImages; createSocket, checkLoop; selectHero, pressInput, releaseInput; receivePost; displaySelection, displayInfo, displayHealthBar, displayButtons; playVibration)
</pre>
