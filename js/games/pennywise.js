export class Pennywise {
    constructor(container, updateScores, updateTurn, gameOver) {
        this.container = container;
        this.updateScores = updateScores;
        this.updateTurn = updateTurn;
        this.gameOver = gameOver;

        this.hands = {};
        this.pot = [];
        this.currentPlayer = 1;

        this.playerCount = 2;
        this.humanRole = 1;
        this.gameMode = 'classic';

        this.gameState = 'place'; // 'place' or 'take'
        this.placedValue = null;
        this.takingBack = [];
        this.isGameOver = false;
        this.eliminatedPlayers = new Set();
    }

    init() {
        this.hands = {};
        this.eliminatedPlayers = new Set();

        const stashConfigs = {
            'classic': [1, 1, 1, 1, 5, 5, 5, 10, 10, 25],
            'coprimes': [1, 1, 1, 1, 4, 4, 4, 7, 7, 13],
            'darlene': [1, 1, 1, 3, 3, 3, 10, 10, 20],
            'nodimes': [1, 1, 1, 1, 5, 5, 5, 25],
            'sugar': [1, 1, 2, 2, 5, 5, 10],
            'taylor': [1, 1, 1, 5, 5, 10],
            'djibouti': [1, 1, 1, 2, 2, 2, 5, 5, 10],
            'chile': [1, 1, 1, 1, 5, 5, 5, 10, 10, 50],
            'buthan': [1, 1, 1, 1, 5, 5, 5, 10, 20, 25],
            'azerbaijan': [1, 1, 1, 1, 3, 3, 3, 5, 5, 10],
            'madagascar': [1, 1, 1, 2, 2, 2, 4, 4, 4, 5, 5, 10]
        };

        const startingStash = stashConfigs[this.stashStyle] || stashConfigs['classic'];

        for (let i = 1; i <= this.playerCount; i++) {
            this.hands[i] = [...startingStash];
        }
        this.pot = [];
        this.currentPlayer = 1;
        this.gameState = 'place';
        this.placedValue = null;
        this.takingBack = [];
        this.isGameOver = false;
        this.eliminatedPlayers = new Set();

        this.render();
        this.updateTurn(this.currentPlayer);
    }

    updateScoresDisplay() {
        const scores = {};
        for (let i = 1; i <= this.playerCount; i++) {
            scores[i] = this.hands[i].length;
        }
        this.updateScores(scores);
    }

    render() {
        this.container.innerHTML = '';

        const pennywiseArea = document.createElement('div');
        pennywiseArea.className = 'pennywise-area';

        // 1. Create the Pot (Center)
        const potEl = this.createPotEl();
        pennywiseArea.appendChild(potEl);

        // 2. Create Player Hands (Radial)
        for (let i = 1; i <= this.playerCount; i++) {
            const handEl = this.createHandEl(i);
            pennywiseArea.appendChild(handEl);
        }

        this.container.appendChild(pennywiseArea);
        this.updateScoresDisplay();
    }

    createPotEl() {
        const hexBorder = document.createElement('div');
        hexBorder.className = 'pot-hexagon-border';

        const potContainer = document.createElement('div');
        potContainer.className = 'pot-container';

        const potTitle = document.createElement('h3');
        potTitle.className = 'hand-drawn';
        potTitle.textContent = 'The Pot';
        potContainer.appendChild(potTitle);

        const potEl = document.createElement('div');
        potEl.className = 'pot-coins';
        if (this.pot.length === 0) {
            potEl.innerHTML = '<p class="empty-pot-msg">Pot is empty</p>';
        } else {
            const isCrowded = this.pot.length > 12;
            this.pot.forEach((val, idx) => {
                const coin = this.createCoinEl(val, 'pot');
                if (isCrowded) {
                    const scale = Math.max(0.4, 12 / this.pot.length);
                    coin.style.transform = `scale(${scale})`;
                    coin.style.margin = `-${8 * (1 - scale)}px`; // Much tighter gaps for many coins
                    coin.style.zIndex = 10 + idx; // Ensure they stack predictably
                }
                if (this.gameState === 'take' && !this.isGameOver) {
                    if (this.isValidToTake(idx)) {
                        coin.classList.add('takeable');
                        coin.onclick = () => this.toggleTake(idx);
                    }
                    if (this.takingBack.includes(idx)) {
                        coin.classList.add('selected-to-take');
                        coin.onclick = () => this.toggleTake(idx); // Still clickable to deselect
                    }
                }
                potEl.appendChild(coin);
            });
        }
        potContainer.appendChild(potEl);

        if (this.gameState === 'take' && !this.isGameOver) {
            const currentSum = this.getTakingSum();
            const sumDisplay = document.createElement('p');
            sumDisplay.className = 'sum-display bottom-taking';
            sumDisplay.innerHTML = `Taking: <strong>${currentSum}</strong> < ${this.placedValue}`;
            potContainer.appendChild(sumDisplay);
        }

        hexBorder.appendChild(potContainer);
        return hexBorder;
    }

    createHandEl(player) {
        const handEl = document.createElement('div');
        handEl.className = `player-hand player-${player}`;

        // Radial positioning
        const angle = ((player - 1) * 2 * Math.PI / this.playerCount) - (Math.PI / 2);
        const radius = 300; // Increased to accommodate bigger pot
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        handEl.style.left = `calc(50% + ${x}px)`;
        handEl.style.top = `calc(50% + ${y}px)`;
        handEl.style.transform = `translate(-50%, -50%)`;

        if (this.eliminatedPlayers.has(player)) {
            handEl.classList.add('eliminated');
        } else if (this.currentPlayer === player && !this.isGameOver) {
            handEl.classList.add('active-hand');
            handEl.style.transform = `translate(-50%, -50%) scale(1.15)`;

            // Add Finish Button beside hand if it's take phase
            if (this.gameState === 'take') {
                const finishBtn = document.createElement('button');
                finishBtn.className = 'hand-drawn finish-btn player-finish-btn';
                finishBtn.textContent = 'Finish';

                const isComputerTurn = this.isVsAI && this.currentPlayer !== this.humanRole;
                if (isComputerTurn) {
                    finishBtn.classList.add('disabled-btn');
                    finishBtn.disabled = true;
                } else {
                    finishBtn.onclick = (e) => {
                        e.stopPropagation();
                        this.finishTurn();
                    };
                }
                handEl.appendChild(finishBtn);
            }
        }

        const title = document.createElement('h4');
        title.className = 'hand-drawn';
        title.textContent = `P${player}`;
        handEl.appendChild(title);

        const coinsEl = document.createElement('div');
        coinsEl.className = 'hand-coins';

        const handData = this.hands[player];
        const isCrowded = handData.length > 12;
        if (isCrowded) coinsEl.classList.add('crowded-hand');

        handData.forEach((val, idx) => {
            const coin = this.createCoinEl(val, 'hand');
            if (isCrowded) {
                // Inline override for very crowded hands
                const scale = Math.max(0.6, 12 / handData.length);
                coin.style.transform = `scale(${scale})`;
                coin.style.margin = `-${2 * (1 - scale)}px`; // Tighten gaps
            }
            if (this.currentPlayer === player && this.gameState === 'place' && !this.isGameOver) {
                coin.classList.add('playable');
                coin.onclick = () => this.placeCoin(val, idx);
            }
            coinsEl.appendChild(coin);
        });
        handEl.appendChild(coinsEl);

        return handEl;
    }

    createCoinEl(val, type) {
        const coin = document.createElement('div');
        coin.className = `coin coin-${val} ${type}-coin`;
        coin.textContent = val;
        const rot = (Math.random() * 20 - 10).toFixed(2);
        coin.style.setProperty('--coin-rot', `${rot}deg`);
        return coin;
    }

    placeCoin(val, sortedIdx) {
        if (this.gameState !== 'place') return;
        const index = this.hands[this.currentPlayer].indexOf(val);
        if (index > -1) {
            this.hands[this.currentPlayer].splice(index, 1);
        }
        this.pot.push(val);
        this.placedValue = val;
        this.gameState = 'take';
        this.takingBack = [];
        this.render();
    }

    isValidToTake(idx) {
        if (this.takingBack.includes(idx)) return true; // Already selected
        const currentSum = this.getTakingSum();
        return (currentSum + this.pot[idx] < this.placedValue);
    }

    getTakingSum() {
        return this.takingBack.reduce((sum, idx) => sum + this.pot[idx], 0);
    }

    toggleTake(idx) {
        const currentSum = this.getTakingSum();
        const coinVal = this.pot[idx];
        if (this.takingBack.includes(idx)) {
            this.takingBack = this.takingBack.filter(i => i !== idx);
        } else {
            if (currentSum + coinVal < this.placedValue) {
                this.takingBack.push(idx);
            }
        }
        this.render();
    }

    finishTurn() {
        const takenValues = this.takingBack.map(idx => this.pot[idx]);
        this.takingBack.sort((a, b) => b - a).forEach(idx => {
            this.pot.splice(idx, 1);
        });
        this.hands[this.currentPlayer].push(...takenValues);

        this.nextPlayer();
    }

    nextPlayer() {
        // Step to next non-eliminated player
        let next = this.currentPlayer;
        let found = false;
        for (let i = 0; i < this.playerCount; i++) {
            next = (next % this.playerCount) + 1;
            if (this.hands[next].length > 0) {
                found = true;
                break;
            } else {
                this.eliminatedPlayers.add(next);
            }
        }

        if (!found || this.checkWinner()) {
            this.endGame();
        } else {
            this.currentPlayer = next;
            this.gameState = 'place';
            this.placedValue = null;
            this.takingBack = [];
            this.updateTurn(this.currentPlayer);
            this.render();

            if (this.isVsAI && this.currentPlayer !== this.humanRole) {
                setTimeout(() => this.makeAIMove(), 800);
            }
        }
    }

    checkWinner() {
        let activeCount = 0;
        for (let i = 1; i <= this.playerCount; i++) {
            if (this.hands[i].length > 0) activeCount++;
        }
        return activeCount <= 1;
    }

    makeAIMove() {
        if (this.isGameOver) return;
        const hand = this.hands[this.currentPlayer];
        if (hand.length === 0) {
            this.nextPlayer();
            return;
        }

        let bestPlaceIdx = 0;
        let bestTakingIndices = [];
        let maxTakingValue = -1;

        for (let i = 0; i < hand.length; i++) {
            const val = hand[i];
            const possibleTakes = this.findBestGreedyTakeback(val);
            const takingValue = possibleTakes.reduce((s, idx) => s + this.pot[idx], 0);
            if (takingValue > maxTakingValue) {
                maxTakingValue = takingValue;
                bestPlaceIdx = i;
                bestTakingIndices = possibleTakes;
            }
        }

        this.placeCoin(hand[bestPlaceIdx], bestPlaceIdx);
        setTimeout(() => {
            this.takingBack = bestTakingIndices;
            this.render();
            setTimeout(() => this.finishTurn(), 800);
        }, 800);
    }

    findBestGreedyTakeback(placedVal) {
        const indexedPot = this.pot.map((v, i) => ({ v, i }))
            .filter(item => item.v < placedVal)
            .sort((a, b) => b.v - a.v);

        let currentSum = 0;
        let indices = [];
        for (let item of indexedPot) {
            if (currentSum + item.v < placedVal) {
                currentSum += item.v;
                indices.push(item.i);
            }
        }
        return indices;
    }

    endGame() {
        this.isGameOver = true;
        let winner = "No one";
        for (let i = 1; i <= this.playerCount; i++) {
            if (this.hands[i].length > 0) {
                winner = `Player ${i}`;
                break;
            }
        }
        this.render();
        this.gameOver(winner);
    }
}
