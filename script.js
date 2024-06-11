window.onload = async () => {
    let body = document.body
    body.style.zoom = 1
    let canvas = document.getElementById("canvas")
    let firstElementClicked = new Box()

    //Setting up game objects, drawing images
    let gameElements = await BuildGame()
    let cardPiles = gameElements.slice(0, 4)
    let clickBoxes = gameElements[4]

    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect()
        const xMouse = event.clientX - rect.left
        const yMouse = event.clientY - rect.top
        console.log("Mouse click on x:" + xMouse + "y:" + yMouse)

        let updatedElements = UpdateGame(firstElementClicked, xMouse, yMouse, cardPiles, clickBoxes)
        firstElementClicked = updatedElements[0]
        cardPiles = updatedElements[1]
    })

    document.getElementById('zoom-plus').addEventListener('click', (event) => {
        event.stopPropagation();
        const currentZoom = body.style.zoom 
        body.style.zoom = currentZoom * 1.1
    })

    document.getElementById('zoom-minus').addEventListener('click', (event) => {
        event.stopPropagation()
        const currentZoom = body.style.zoom 
        body.style.zoom = currentZoom * 0.9
    })

    document.getElementById("reset-game").addEventListener("click", () => {
        BuildGame()
    })

    document.getElementById("reset-settings").addEventListener("click", () => {
        document.exitFullscreen();
        body.style.zoom = 1
        let text = document.getElementById("fullscreen")
        text.innerText  = "Fullscreen off"
    })

    document.getElementById("fullscreen").addEventListener("click", () => {
        let text = document.getElementById("fullscreen")
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
            text.innerText  = "Fullscreen On"
        } else {
            document.exitFullscreen();
            text.innerText  = "Fullscreen Off"
        }
    })
}

//Edit for Set key bindings
/*
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        togglePauseMenu();
    } if (e.key === 'ArrowLeft') {
        dude.Velocity.X = -5;
    } else if (e.key === 'ArrowRight') {
        dude.Velocity.X = 5;
    } else if (e.key === 'ArrowUp') {
        dude.Velocity.Y = -5;
    } else if (e.key === 'ArrowDown') {
        dude.Velocity.Y = 5;
    }
});
document.addEventListener('keyup', function(e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        dude.Velocity.X = 0;
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        dude.Velocity.Y = 0;
    }
});*/

async function BuildGame() {
    let clickBoxes = SetClickBoxes()
    let cardPiles = await SetGameStart()
    return [cardPiles[0], cardPiles[1], cardPiles[2], cardPiles[3], clickBoxes]
}

async function SetGameStart(){ 
    let cards = MakeCards()
    let shuffledCards = ShuffleCards(cards)

    let gamePiles = await SetGamePiles(shuffledCards.slice(0, 28), 140, 200)

    let drawingPile = await SetDrawingPile(shuffledCards.slice(28), 140, 80)

    let drawnPile =  Array.from({length: 24}, () => null)
    await DrawEmptyPile(220, 80)

    let victoryPiles = Array.from({ length: 4 }, () => Array.from({ length: 13 }, () => null))
    for (let i = 0; i < 4; i++){
        await DrawEmptyPile(380 + (i * 80), 80)
    }
    return [gamePiles, drawingPile, drawnPile, victoryPiles]
}

function MakeCards(){
    let cards = Array.from({ length: 52}, () => new Card)
    let suits = ["diamonds", "clubs", "hearts", "spades"]
    
    let cardIndex = 0
    for (let i = 0; i < 13; i++){
        for (let j = 0; j < 4; j++){
            cards[cardIndex].value = i + 1
            cards[cardIndex].suit = j
            cards[cardIndex].url = "images/cards/" + (i + 1) + "_of_" + suits[j] + ".png"
            cardIndex++
        }
    }
    return cards
}

class Card {
    constructor() {
        this.hidden = false
        this.x = null
        this.y = null
        this.clickWidth = null
        this.clickHeight = null
        this.value = null
        this.suit = null
        this.url = null
    }
}

function ShuffleCards(cards){
    let slicedCards = SliceCards(cards)
    let shuffledCards = Array(slicedCards.length)

    for (let i = 0; i < shuffledCards.length; i++){
        let rndIndex = RandomInteger(0, slicedCards.length - 1)
        while (shuffledCards[rndIndex] != null) {
            rndIndex = (rndIndex + 1) % shuffledCards.length
        }
        shuffledCards[rndIndex] = slicedCards[i]   
    }
    return shuffledCards
}

function SliceCards(cards){
    let slicedCards = Array(cards.length)
    let firstHalf = cards.slice(0, cards.length / 2)
    let secondHalf = cards.slice(cards.length / 2)

    for (let i = 0; i < slicedCards.length; i++){
        if (i % 2 === 0){
            slicedCards[i] = secondHalf[Math.floor(i / 2)]
        } else {
            slicedCards[i] = firstHalf[Math.floor(i / 2)]
        }
    }
    return slicedCards
}

function RandomInteger(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min
}

async function SetGamePiles(shuffledCards, x, y){
    let gamePiles = Array.from({ length: 7 }, () =>  Array.from({ length: 13 }, () => null))
    let shuffledIndex = 0
    let lastCardIndex = 0
    for (let i = 0; i < gamePiles.length; i++) {
        for (let j = 0; j < i + 1 ; j++){
            gamePiles[i][j] = shuffledCards[shuffledIndex]
            shuffledIndex++
        }
        for (let j = 0; j < i + 1; j++) {
            if (j === lastCardIndex) {
                await DrawCard(gamePiles[i][j], x + 1.5, y)
                gamePiles[i][j].clickWidth = 50
                gamePiles[i][j].clickHeight = 73
            } else {
                await DrawCardBack(x, y);
                gamePiles[i][j].hidden = true
            }
            y += 15
        }
        lastCardIndex++
        x += 80
        y = 200
    }
    return gamePiles
}

async function SetDrawingPile(shuffledCards, x, y){
    let drawingPile = Array.from({ length: 24 }, () => null)
    await DrawCardBack(x, y)
    for (let i = 0; i < drawingPile.length; i++){
        drawingPile[i] = shuffledCards[i]
        drawingPile[i].hidden = true
        drawingPile[i].clickWidth = 53
        drawingPile[i].clickHeight = 76
    }
    return drawingPile
}

async function DrawCard(card, x, y){
    let canvas = document.getElementById("canvas")
    let ctx = canvas.getContext("2d")
    let img = await LoadImage(card.url)
    ctx.drawImage(img, x, y)
    card.x = x
    card.y = y
}

async function DrawCardBack(x, y){
    let canvas = document.getElementById("canvas")
    let ctx = canvas.getContext("2d")
    let img = await LoadImage("images/cardBack.png")
    ctx.drawImage(img, x, y)
}

async function DrawEmptyPile(x, y){
    let canvas = document.getElementById("canvas")
    let ctx = canvas.getContext("2d")
    ctx.strokeStyle = "#fff"
    ctx.beginPath()
    ctx.roundRect(x, y, 53, 76, [5])
    ctx.stroke()
}

async function ClearPileArea(x, y){
    let canvas = document.getElementById("canvas")
    let ctx = canvas.getContext("2d")
    ctx.clearRect(x, y, 53, 76);        
}

function LoadImage(src){
    return new Promise((resolve) => {
        const img = new Image()
        img.src = src
        img.onload = () => resolve(img)
    })
}

function SetClickBoxes(){
    let gamePilesBoxes = Array.from({ length: 7 }, () => Array.from({ length: 13 }, () => []))
    let drawingPileBox = {x: 140, y: 80, clickWidth: 53, clickHeight: 76}
    let drawnPileBox = {x: 220, y: 80, clickWidth: 50, clickHeight: 73}
    let victoryPilesBoxes = Array.from({ length: 4 }, () => [])

    let gamePilesX = 140
    let gamePilesY = 200
    for (let i = 0; i < gamePilesBoxes.length; i++){
        for (let j = 0; j < gamePilesBoxes[i].length; j++){
            gamePilesBoxes[i][j] = [{x: gamePilesX, y: gamePilesY, clickWidth: 50, clickHeight: 73}, {x: gamePilesX, y: gamePilesY, clickWidth: 50, clickHeight: 15}]
            gamePilesY += 15
        }
        gamePilesX += 80
        gamePilesY = 200
    }

    for (let i = 0; i < victoryPilesBoxes.length; i++){
        victoryPilesBoxes[i] = {x: 380 + (i * 80), y: 80, clickWidth: 50, clickHeight:73}
    }
    return [gamePilesBoxes, drawingPileBox, drawnPileBox, victoryPilesBoxes]
}

function UpdateGame(firstElementClicked, xMouse, yMouse, cardPiles, clickBoxes) {
    if (firstElementClicked.box === null){
        firstElementClicked = IdentifyClickedBox(xMouse, yMouse, cardPiles, clickBoxes)
    } else {
        let secondElementClicked = IdentifyClickedBox(xMouse, yMouse, cardPiles, clickBoxes)
        if (secondElementClicked.box === null){
            firstElementClicked = new Box()
        } else {
            if (firstElementClicked){
                cardPiles = TransferCards()
            }
        }
    }
    return [firstElementClicked, cardPiles]
}

function IdentifyClickedBox(xMouse, yMouse, cardPiles, clickBoxes){
    let gamePiles = cardPiles[0]
    let drawingPile = cardPiles[1]
    let drawnPile = cardPiles[2]
    let victoryPiles = cardPiles[3]
    for (let i = 0; i < clickBoxes[0].length; i++){
        for (let j = 0; j < clickBoxes[0][i].length; j++){
            if (gamePiles[i][j] != null){
                let clickBox = clickBoxes[0][i][j]
                if (gamePiles[i][j + 1] === null){
                    if ((xMouse >= clickBox[0].x && clickBox[0].x + clickBox[0].clickWidth  >= xMouse) && (yMouse >= clickBox[0].y && clickBox[0].y + clickBox[0].clickHeight >= yMouse)){
                        return new Box(clickBox[0], j, 0, i)
                    } 
                } else if (gamePiles[i][j].hidden === false) {
                    if ((xMouse >= clickBox[1].x && clickBox[1].x + clickBox[1].clickWidth >= xMouse) && (yMouse >= clickBox[1].y && clickBox[1].y + clickBox[1].clickHeight >= yMouse)){
                        return new Box(clickBox[1], j, 0, i)
                    }
                }
            }
        }
    }
    if ((xMouse >= clickBoxes[1].x && clickBoxes[1].x + clickBoxes[1].clickWidth >= xMouse) && (yMouse >= clickBoxes[1].y && clickBoxes[1].y + clickBoxes[1].clickHeight >= yMouse)){
        return new Box(clickBoxes[1], drawingPile.lastIndexOf(Card), 1, 0)
    } 
    if ((xMouse >= clickBoxes[2].x && clickBoxes[2].x + clickBoxes[2].clickWidth >= xMouse) && (yMouse >= clickBoxes[2].y && clickBoxes[2].y + clickBoxes[2].clickHeight >= yMouse)){
        return new Box(clickBoxes[2], drawnPile.lastIndexOf(Card), 2, 0)
    }
    for (let i = 0; i < clickBoxes[3].length; i++){
        if ((xMouse >= clickBoxes[3][i].x && clickBoxes[3][i].x + clickBoxes[3][i].clickWidth >= xMouse) && (yMouse >= clickBoxes[3][i].y && clickBoxes[3][i].y + clickBoxes[3][i].clickHeight >= yMouse)){
            return new Box(clickBoxes[3][i], victoryPiles[i].lastIndexOf(Card), 3, i)
        }
    }
    return new Box()
}

class Box {
    constructor(box = null, cardIndex = null, type = null, subType = null, pile = null) {
        this.box = box
        this.type = type
        this.subType = subType
        this.cardIndex = cardIndex
        this.pile = pile
    }
}
function TransferCards(donorPile, receivingPile, donorType, receiverType){
    if (receiverType.type === 1){
        return [donorPile, receivingPile]
        //Put here some alert informing the player they can't slide cards to the drawing pile
    } else if (receiverType.type === 2) {
        return [donorPile, receivingPile]
         //Put here some alert informing the player they can't slide cards to the drawn pile
    } else if (firstElementClicked.type === 3){
        return [donorPile, receivingPile]
        //Put here some alert informing the player that they can't slide cards from the victory piles
    } else if (receiverType === 0 && receiverPilePosition != receivingPile.lastIndexOf(Card)) {
        return [donorPile, receivingPile]
        //Put here some alert informing the player that they can only slide cards to a respective gamepile's first card
    } else {
        let updatedPiles = TransferCards(firstElementClicked.pile, secondElementClicked.pile, firstElementClicked.cardIndex)
    }
    //if (){

    //}
    return [donorPile, receivingPile]
}

//Untested - Unsure how to and if to implent this way
function TransferCardsToGamePile(donorPile, receivingPile, amount, x, y){
    if (receivingPile.length < 14){
        if ((toVictoryPile && receivingPile[receivingPile.length - 1].suit % 2 === donorPile[donorPile.length - amount].suit % 2) ||
        receivingPile[receivingPile.length - 1].value === donorPile[donorPile.length - amount].value + 1 ){
            if (receivingPile[0] === null && donorPile[donorPile.length - amount].value === 13){
                for (let i = 0; i < amount; i++){
                    receivingPile.push(donorPile[donorPile.length - amount + i])
                    DrawCard(receivingPile[receivingPile.length - 1], x, y)
                    y += 15
                }
                donorPile.splice(donorPile.length - amount, amount)
                return [donorPile, receivingPile]
            } else {
                /*Some alert informing the player that this transfer cannot be performed because the first card being transfered is not one smaller 
                than the last receivingPiles card*/
            }
        } else {
            //Some alert informing the player that this transfer cannot be performed because the cards have the same colour
        }

    } else {
        //Some alert informing the player that this transfer cannot be performed because the receiving pile is full 
    }
}

//Untested - Unsure how to and if to implent this way
function TransferCardsToVictoryPile(donorPile, receivingPile, amount, x, y){
    if (receivingPile.length < 14){
        if ((toVictoryPile && receivingPile[receivingPile.length - 1].suit % 2 === donorPile[donorPile.length - amount].suit % 2 || 
            receivingPile[receivingPile.length - 1].value === donorPile[donorPile.length - amount].value - 1 )){
            if (receivingPile[0] === null && donorPile[donorPile.length - amount].value === 1){
                for (let i = 0; i < amount; i++){
                    receivingPile.push(donorPile[donorPile.length - amount + i])
                }
                donorPile.splice(donorPile.length - amount, amount)
                DrawCard(receivingPile[receivingPile.length - 1], x, y)
                return [donorPile, receivingPile]
            } else {
                /*Some alert informing the player that this transfer cannot be performed because the first card being transfered is not one larger 
                than the last receivingPiles card*/
            }
        } else {
            //Some alert informing the player that this transfer cannot be performed because the cards do not have the same colour
        }    
    } else {
        //Some alert informing the player that this transfer cannot be performed because the receiving pile is full 
    }
}

//Untested - Unsure how to and if to implent this way
function IsGameWon(victoryPiles){
    for (let i = 0; i < victoryPiles.length; i++){
        if (victoryPiles[i].length === 13){
            if (victoryPiles[i][victoryPiles[i].length - 1].value === 13){
                continue
            }
            throw new Error("TransferCards error - game condition broken")
        }
        return false
    }
    return true
}