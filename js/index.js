// this tracks the current turn and is used to calculate trade bonuses
let currentTurn = 1;
const maxTurns = 24;
let currentScore = 0;
const defaultTradePrice = 5;
// store player trade items
const playerTradeItems = [];
// store turn trade information as a const
const turnTrades = [];
// store rumors information as a const
const rumors = [];
// store item descriptions as a const
const itemDescriptions = [];

function gameStart() {
    purgeTradeHistory();
    getTurnTrades();
    getItemDescriptions();
    getRumors();
    displayHighScore();
    getPlayerItems();
}
gameStart();

// trade history needs to be reset for each game
async function purgeTradeHistory() {
    // delete trade history table
    const del = await fetch('/purgeTable/trade_history')
        .then(del => del.text())
        .then(text => console.log(text)
    );
}

// get turn trades and add them to a global var
async function getTurnTrades() {
    const res = await fetch('/getTableData/turn_trades');
    const data = await res.json();
    data.elements.forEach(element => {
        let obj = {};
        obj['turn'] = element.turn;
        obj['item'] = element.item;
        obj['alefBonus'] = element.alef_bonus;
        obj['lamedBonus'] = element.lamed_bonus;
        obj['samechBonus'] = element.samech_bonus;
        turnTrades.push(obj);
    });
    getCurrentTurnTrade();
}

// get rumors and add them to a global var
async function getRumors() {
    const res = await fetch('/getTableData/rumors');
    const data = await res.json();
    data.elements.forEach(element => {
        let obj = {};
        obj['turn'] = element.turn;
        obj['rumor'] = element.rumor;
        rumors.push(obj);
    });
    displayRumor();
}

// get the high score from past players
const scoreSpan = document.getElementById('high-score');
async function displayHighScore() {
    const res = await fetch('/getHighScore');
    const data = await res.json();
    data.elements.forEach(element => {
        let p_name = element.player_name;
        let score = element.score;
        scoreSpan.innerHTML = `(high-score: ${score} - ${p_name})`;
    });
}

// increases the score and calls the display score function
function calcCurrentScore(priceForItems, tradeQty) {
    let increase = priceForItems * tradeQty;
    currentScore += increase;
    displayCurrentScore();
}

// display the current player score
const currentScoreSpan = document.getElementById('current-score');
function displayCurrentScore() {
    currentScoreSpan.innerHTML = `Current Score: ${currentScore}`;
}


// get item descriptions and load them in global var
async function getItemDescriptions() {
    const res = await fetch('/getDescriptions');
    const data = await res.json();
    data.elements.forEach(element => {
        let obj = {};
        obj['item'] = element.item;
        obj['description'] = element.description;
        itemDescriptions.push(obj);
    });
}

const turnRumor = document.getElementById('rumor');
// displays a rumor or a random excuse
function displayRumor() {
    // resets the text incase last trade was rejected
    turnRumor.classList.remove("red-text");
    // list of excuses - learn to do your job bro
    const noRumor = ['I have heard nothing.', 
                    'I have been asking around for info.', 
                    'Do we need to trade today? I want to nap.', 
                    'Finding a lead will take time.'];
    let heardRumor = Math.random() < 0.5;
    // if heardRumor is true, display from global rumors
    if (heardRumor) {
        turnRumor.innerText = `Servant Abed: "${rumors[currentTurn - 1].rumor}"`;
    // if heardRumor was false, present an excuse from noRumorSelection
    } else {
        // select randome number between 0 and 3
        let noRumorSelection = Math.floor(Math.random() * (3 - 0 + 1)) + 0;
        turnRumor.innerText = `Servant Abed: "${noRumor[noRumorSelection]}"`;
    }
}

// displays information about the item last traded 
const itemInfo = document.getElementById('item-info');
function displayItemDescription(tItem) {
    // loop through and find the description that goes with the item traded
    itemDescriptions.forEach(element => {
        if(tItem == element.item) {
            itemInfo.innerHTML = `You traded ${tItem} - ${element.description}`;
        }
    });
}

function getCurrentTurnTrade(cItem, tName) {
    // check to see if the item traded matches turn bonus item
    if(cItem == turnTrades[currentTurn - 1].item) {
        // it the item is a turn bonus item, get the traders bonus amount
        switch(tName) {
            case 'Alef':
              return turnTrades[currentTurn - 1].alefBonus + defaultTradePrice;
            case 'Lamed':
                return turnTrades[currentTurn - 1].lamedBonus + defaultTradePrice;
            case 'Samech':
                return turnTrades[currentTurn - 1].samechBonus + defaultTradePrice;
        }
    } else {
        return defaultTradePrice;
    }
}

// ensures player has enough of an item to make the trade
function verifyItemCount(tradeItem, tradeQty) {
    let canTradeStuff = false;
    playerTradeItems.forEach(element => {
        if(element.item == tradeItem) {
            canTradeStuff = (element.qty >= tradeQty);
        }
    });
    return canTradeStuff;
}

// player item it reduced by the amount traded
function reducePlayerItemQty(tradeItem, tradeQty) {
    playerTradeItems.forEach(element => {
        if(element.item == tradeItem) {
            element.qty -= tradeQty;
        }
    });
    displayPlayerItems();
}

// used when player tries to trade more than what they have
function rejectTradeOffer(item) {
    turnRumor.innerText = `Servant Abed: "We do not have enough ${item} to make that trade."`;
    turnRumor.classList.add("red-text");
}

// process trades 
const tradeHistory = document.getElementById('trade-history-output');

// run trade logic for turn
function runTradeProcess(traderName, itemsForTrade, tradeQty) {
    let canTrade = verifyItemCount(itemsForTrade, tradeQty);
    // if the player has enough of the selected items, make trade
    if(canTrade) {
        let priceForItems = getCurrentTurnTrade(itemsForTrade, traderName);
        reducePlayerItemQty(itemsForTrade, tradeQty);
        updateTradeHistory(traderName, itemsForTrade, priceForItems, tradeQty);
        document.getElementById('form-t1').reset();
        document.getElementById('form-t2').reset();
        document.getElementById('form-t3').reset();
    } else {
        rejectTradeOffer(itemsForTrade);
    }
}

// trader 1
function processTrader1() {
    // get values from form
    const traderName = document.getElementById('trader-name-t1').value;
    const itemsForTrade = document.getElementById('items-for-trade-t1').value;
    const tradeQty = document.getElementById('trade-qty-t1').value;
    runTradeProcess(traderName, itemsForTrade, tradeQty);
}
// trader 2
function processTrader2() {
    // get values from form
    const traderName = document.getElementById('trader-name-t2').value;
    const itemsForTrade = document.getElementById('items-for-trade-t2').value;
    const tradeQty = document.getElementById('trade-qty-t2').value;
    runTradeProcess(traderName, itemsForTrade, tradeQty);
}
// trader 3
function processTrader3() {
    // get values from form
    const traderName = document.getElementById('trader-name-t3').value;
    const itemsForTrade = document.getElementById('items-for-trade-t3').value;
    const tradeQty = document.getElementById('trade-qty-t3').value;
    runTradeProcess(traderName, itemsForTrade, tradeQty);
}

async function updateTradeHistory(traderName, itemsForTrade, priceForItems, tradeQty) {
    // insert new data to trade history
    const res = await fetch(`/addToTradeHistory/${currentTurn}&${traderName}&${itemsForTrade}&${priceForItems}&${tradeQty}`)
        .then(res => res.text())
        .then(text => console.log(text)
    );
    displayTradeHistoryData();
    displayItemDescription(itemsForTrade);
    calcCurrentScore(priceForItems, tradeQty);
    updateCurrentTurnCount();
    countPlayerItems();
    displayRumor();
}

// if palyer runs out of turns
function updateCurrentTurnCount() {
    if(currentTurn < maxTurns) {
        currentTurn++;
    } else {
        triggerEndGame("You've reached your max amount of turns.");
    }
}

// if the player runs out of items
function countPlayerItems() {
    let itemsRemaing = 0;
    playerTradeItems.forEach(element => {
        itemsRemaing += element.qty;
    });
    // check to see if player is out of items
    if(itemsRemaing == 0) {
        triggerEndGame(`You completed the game!`);
    }
}

// end game and trigger modal
function triggerEndGame(message) {
    let modalOutput = document.getElementById('modal-output');
    modalOutput.innerText = `${message} Please enter your name to log your score of ${currentScore}.`;
    
    toggleModal();
}

// makes the call to save the score fro mmodal imput
async function saveHighScore() {
    // get the player name from the modal form
    let sPlayerName = document.getElementById('modal-input').value;
    const res = await fetch(`/saveHighScore/${sPlayerName}&${currentScore}`)
        .then(res => res.text())
        .then(text => console.log(text)
    );
    toggleModal();
}

// update trade history on the html page
async function displayTradeHistoryData() {
    // clear table contents
    tradeHistory.innerHTML = '';
    // get new trade history data
    const res2 = await fetch(`/getTableData/trade_history`);
    const data = await res2.json();
    data.elements.forEach(element => {
        // loop through all returned items and output them to the UI
        // create containing div
        let container = document.createElement('div');
        container.setAttribute('class', 'data-row');
        tradeHistory.appendChild(container);
        // create turn div and append to container
        let turnDiv = document.createElement('div');
        turnDiv.setAttribute('class', 'data-cell');
        turnDiv.appendChild(document.createTextNode(element.turn));
        container.appendChild(turnDiv);
        // create trader name div and append to container
        let nameDiv = document.createElement('div');
        nameDiv.setAttribute('class', 'data-cell');
        nameDiv.appendChild(document.createTextNode(element.trader_name));
        container.appendChild(nameDiv);
        // create quantity div and append to container
        let tradeItemDiv = document.createElement('div');
        tradeItemDiv.setAttribute('class', 'data-cell');
        tradeItemDiv.appendChild(document.createTextNode(element.item));
        container.appendChild(tradeItemDiv);
        // create quantity div and append to container
        let sellPriceDiv = document.createElement('div');
        sellPriceDiv.setAttribute('class', 'data-cell');
        sellPriceDiv.appendChild(document.createTextNode(element.sell_price_per_item));
        container.appendChild(sellPriceDiv);
        // create quantity div and append to container
        let numItemsTradedDiv = document.createElement('div');
        numItemsTradedDiv.setAttribute('class', 'data-cell');
        numItemsTradedDiv.appendChild(document.createTextNode(element.num_items_traded));
        container.appendChild(numItemsTradedDiv);
        // create total div and append to container
        let calcTotalDiv = document.createElement('div');
        let totalVal = element.num_items_traded * element.sell_price_per_item;
        calcTotalDiv.setAttribute('class', 'data-cell bold');
        calcTotalDiv.appendChild(document.createTextNode(totalVal));
        container.appendChild(calcTotalDiv);
    });
}

// get player items and load them in global var
async function getPlayerItems() {
    const res = await fetch('/getAllPlayerItems');
    const data = await res.json();
    data.elements.forEach(element => {
        let obj = {};
        obj['item'] = element.item;
        obj['qty'] = element.qty;
        playerTradeItems.push(obj);
    });
    displayPlayerItems();
}

// display player items
const playerItems = document.getElementById('player-items-output');
async function displayPlayerItems() {
    // clear table contents
    playerItems.innerHTML = '';
    // loop through all items and output them to the UI
    playerTradeItems.forEach(element => {
        // create containing div
        let container = document.createElement('div');
        container.setAttribute('class', 'data-row');
        playerItems.appendChild(container);
        // create name div and append to container
        let nameDiv = document.createElement('div');
        nameDiv.setAttribute('class', 'data-cell');
        nameDiv.appendChild(document.createTextNode(element.item));
        container.appendChild(nameDiv);
        // create quantity div and append to container
        let quantDiv = document.createElement('div');
        quantDiv.setAttribute('class', 'data-cell');
        quantDiv.appendChild(document.createTextNode(element.qty));
        container.appendChild(quantDiv);
    });
}

// modal
const modal = document.querySelector(".modal");
const closeButton = document.querySelector(".close-button");
// all the modal code hangs out around here
function toggleModal() {
    modal.classList.toggle("show-modal");
}

function windowOnClick(event) {
    if (event.target === modal) {
        toggleModal();
    }
}

closeButton.addEventListener("click", toggleModal);
window.addEventListener("click", windowOnClick);