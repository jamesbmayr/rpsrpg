# RPSG

Three fantasy heroes team up to fight through a randomly generated dungeon of orb-stealing monsters.

---
<pre>

</pre>
---

## Launch
Every game has a unique 4-letter id. Go to the homepage on a computer to start a new game.
Join a game on a computer or mobile device by entering the 4-letter id.

## Gameplay



## Code
The app is powered by nodeJS and websockets, written in 100% raw javascript. 

---
<pre>
rpsg
|- package.json
|- index.js (handleRequest, parseRequest, routeRequest, \_302, \_403, \_404; handleSocket, parseSocket, routeSocket, updateSocket, \_400)
|- node_modules
|   |- websocket
|
|- main
|   |- logic.js (logError, logStatus, logMessage, logTime; getEnvironment, getAsset, getSchema; isNumLet, isBot; renderHTML, sanitizeString, duplicateObject; generateRandom, chooseRandom, sortRandom; determineSession)
|   |- \_404.html
|   |- stylesheet.css
|   |- script.js (sanitizeString; isEmail, isNumLet; chooseRandom; sendPost; displayMessage)
|   |- draw.js (clearData, randomizeData; clearCanvas, rotateCanvas; drawLine, drawCircle, drawTriangle, drawRectangle, drawShape, drawText, drawGradient)
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
|   |- script.js (createGame, joinGame)
|
|- about
|   |- index.html
|   |- stylesheet.css
|   |- script.js (submitFeedback)
|
|- game
    |- logic.js (addPlayer, removePlayer; pressInput, releaseInput; updateGame)
    |- main.html
    |- main.css
    |- main.js (createSocket, checkLoop; receivePost; drawGame)
    |- player.html
    |- player.css
    |- player.js (createSocket, checkLoop; pressInput, releaseInput; receivePost; drawGame)
</pre>
