export class Dandelions {
    constructor(container, updateScores, updateTurn, gameOver) {
        this.container = container;
        this.updateScores = updateScores;
        this.updateTurn = updateTurn;
        this.gameOver = gameOver;

        this.boardSize = 5;
        this.board = []; // 0: empty, 1: P1 green flower, 2: P1 green seed, 3: P2 blue flower, 4: P2 blue seed

        this.currentPlayer = 1; // 1: P1 Green, 2: P2 Blue or Wind
        this.scores = { 1: 0, 2: 0 };
        this.isGameOver = false;

        this.playerCount = 2;
        this.humanRole = 1;
        this.gameMode = 'classic';
        this.currentTurnIndex = 0;
        this.turnSequence = [];
        this.usedWinds = new Set();
        this.currentWindHighlight = null; // Highlighting the chosen wind in Rival mode

        this.windDirs = {
            'NW': [-1, -1], 'N': [-1, 0], 'NE': [-1, 1],
            'W': [0, -1], 'C': [0, 0], 'E': [0, 1],
            'SW': [1, -1], 'S': [1, 0], 'SE': [1, 1]
        };
    }

    init() {
        if (this.gameMode === 'rival') {
            this.boardSize = 8;
            this.roundFirstPlayer = 1;
            this.roundPhase = 'plant1';
            this.currentPlayer = 1;
            this.gustCount = 0;
        } else if (this.gameMode === 'collaborative') {
            this.boardSize = 8;
            this.turnSequence = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
        } else if (this.gameMode === '6x6') {
            this.boardSize = 6;
            this.turnSequence = [1, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 2];
        } else {
            this.boardSize = 5;
            this.turnSequence = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
        }

        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(0));
        this.usedWinds.clear();
        this.currentTurnIndex = 0;
        this.currentWindHighlight = null;

        if (this.gameMode !== 'rival') {
            this.currentPlayer = this.turnSequence[this.currentTurnIndex];
        }

        this.isGameOver = false;

        this.calculateScores();
        this.render();
        this.updateTurn(this.currentPlayer);

        if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
            setTimeout(() => this.makeAIMove(), 600);
        }
    }

    render() {
        this.container.innerHTML = '';

        const layout = document.createElement('div');
        layout.className = 'dandelions-layout';

        // BOARD
        let boardClass = 'dandelions-board-5x5';
        if (this.gameMode === 'rival' || this.gameMode === 'collaborative') {
            boardClass = 'dandelions-board-8x8';
        } else if (this.gameMode === '6x6') {
            boardClass = 'dandelions-board-6x6';
        }

        const boardEl = document.createElement('div');
        boardEl.className = boardClass;

        // Disable board during wind phase or AI's turn
        const isBoardDisabled = this.isGameOver || 
                               (this.gameMode === 'rival' && this.roundPhase === 'wind') ||
                               (this.playerCount === 1 && this.currentPlayer !== this.humanRole);
        if (isBoardDisabled) {
            boardEl.classList.add('disabled-board');
        }

        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const cell = document.createElement('div');
                cell.className = 'dandelion-node';
                cell.dataset.r = r;
                cell.dataset.c = c;

                if (this.board[r][c] === 1) {
                    cell.classList.add('p1-dand-planted');
                    // Draw a hand-drawn green asterisk
                    cell.innerHTML = `
                        <svg class="dand-asterisk" viewBox="0 0 100 100">
                            <line x1="50" y1="15" x2="50" y2="85" stroke="var(--dand-color)" stroke-width="12" stroke-linecap="round" />
                            <line x1="19" y1="32" x2="81" y2="68" stroke="var(--dand-color)" stroke-width="12" stroke-linecap="round" />
                            <line x1="19" y1="68" x2="81" y2="32" stroke="var(--dand-color)" stroke-width="12" stroke-linecap="round" />
                        </svg>
                    `;
                } else if (this.board[r][c] === 2) {
                    cell.classList.add('p1-dand-blown');
                    // Draw a neat green dot
                    cell.innerHTML = `
                        <svg class="dand-blown-dot" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="16" fill="var(--dand-color)" />
                        </svg>
                    `;
                } else if (this.board[r][c] === 3) {
                    cell.classList.add('p2-dand-planted');
                    // Draw a hand-drawn blue asterisk
                    cell.innerHTML = `
                        <svg class="dand-asterisk" viewBox="0 0 100 100">
                            <line x1="50" y1="15" x2="50" y2="85" stroke="var(--p2-color)" stroke-width="12" stroke-linecap="round" />
                            <line x1="19" y1="32" x2="81" y2="68" stroke="var(--p2-color)" stroke-width="12" stroke-linecap="round" />
                            <line x1="19" y1="68" x2="81" y2="32" stroke="var(--p2-color)" stroke-width="12" stroke-linecap="round" />
                        </svg>
                    `;
                } else if (this.board[r][c] === 4) {
                    cell.classList.add('p2-dand-blown');
                    // Draw a neat blue dot
                    cell.innerHTML = `
                        <svg class="dand-blown-dot" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="16" fill="var(--p2-color)" />
                        </svg>
                    `;
                }

                cell.addEventListener('click', () => this.handleBoardClick(r, c));
                boardEl.appendChild(cell);
            }
        }

        // COMPASS
        const compass = document.createElement('div');
        compass.className = 'dandelions-compass';

        // Compass is always disabled in Rival mode (wind is automatic), or on P1's turn in classic mode
        const isCompassDisabled = this.gameMode === 'rival' || this.currentPlayer === 1;
        if (isCompassDisabled) {
            compass.classList.add('disabled-compass');
        }

        const keys = ['NW', 'N', 'NE', 'W', 'C', 'E', 'SW', 'S', 'SE'];
        for (let key of keys) {
            const btn = document.createElement('div');
            btn.className = 'compass-btn hand-drawn';
            if (key === 'C') {
                btn.classList.add('center');
                btn.innerHTML = '🌬️';
            } else {
                btn.textContent = key;
                if (this.gameMode === 'rival') {
                    if (this.currentWindHighlight === key) {
                        btn.classList.add('highlighted-wind');
                    }
                } else {
                    if (this.usedWinds.has(key)) {
                        btn.classList.add('used');
                    } else {
                        btn.addEventListener('click', () => this.handleCompassClick(key));
                    }
                }
            }
            compass.appendChild(btn);
        }

        layout.appendChild(boardEl);
        layout.appendChild(compass);
        this.container.appendChild(layout);
    }

    handleBoardClick(r, c, isAI = false) {
        if (this.isGameOver) return;

        if (this.gameMode === 'rival') {
            if (this.roundPhase === 'wind') return;
            if (!isAI && this.playerCount === 1 && this.currentPlayer !== this.humanRole) return;
            if (this.board[r][c] !== 0) return;

            // Plant! Player 1 (Green) plants 1, Player 2 (Blue) plants 3
            this.board[r][c] = this.currentPlayer === 1 ? 1 : 3;

            this.calculateScores();
            this.checkWinCondition();

            if (!this.isGameOver) {
                if (this.roundPhase === 'plant1') {
                    // Transition to plant2
                    this.roundPhase = 'plant2';
                    this.currentPlayer = this.roundFirstPlayer === 1 ? 2 : 1;
                    this.updateTurn(this.currentPlayer);
                    this.render();

                    if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
                        setTimeout(() => this.makeAIMove(), 600);
                    }
                } else if (this.roundPhase === 'plant2') {
                    // Both players have planted! Transition to wind phase
                    this.roundPhase = 'wind';
                    this.updateTurn('Wind');
                    this.render();

                    setTimeout(() => this.triggerRivalWind(), 800);
                }
            }
            return;
        }

        // Classic / 6x6 Mode Board Click
        if (this.currentPlayer !== 1) return;
        if (!isAI && this.playerCount === 1 && this.humanRole !== 1) return;
        if (this.board[r][c] !== 0) return;

        this.board[r][c] = 1;
        this.calculateScores();
        this.checkWinCondition();

        if (!this.isGameOver) {
            this.currentTurnIndex++;
            this.currentPlayer = this.turnSequence[this.currentTurnIndex];
            if (this.currentPlayer) {
                this.updateTurn(this.currentPlayer);
                this.render();

                if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
                    setTimeout(() => this.makeAIMove(), 600);
                }
            }
        }
    }

    handleCompassClick(dirKey, isAI = false) {
        if (this.isGameOver || this.currentPlayer !== 2 || this.gameMode === 'rival') return;
        if (!isAI && this.playerCount === 1 && this.humanRole !== 2) return;
        if (this.usedWinds.has(dirKey)) return;

        this.usedWinds.add(dirKey);
        const [dr, dc] = this.windDirs[dirKey];

        // Seeds blow! Determine new dandelions
        let newDandelions = [];
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.board[r][c] === 1) {
                    let nr = r + dr;
                    let nc = c + dc;
                    while (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
                        const val = this.board[nr][nc];
                        if (val === 0) {
                            newDandelions.push({ r: nr, c: nc });
                        } else if (val === 2) {
                            // Seed: blow through! Do not block, but do not overwrite
                        } else if (val === 1) {
                            // Flower: blocked!
                            break;
                        }
                        nr += dr;
                        nc += dc;
                    }
                }
            }
        }

        // Apply new seeds as BLOWN (2)
        for (let spot of newDandelions) {
            this.board[spot.r][spot.c] = 2;
        }

        this.calculateScores();
        this.checkWinCondition();

        if (!this.isGameOver) {
            this.currentTurnIndex++;
            this.currentPlayer = this.turnSequence[this.currentTurnIndex];
            if (this.currentPlayer) {
                this.updateTurn(this.currentPlayer);
                this.render();

                if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
                    setTimeout(() => this.makeAIMove(), 600);
                }
            }
        }
    }

    triggerRivalWind() {
        if (this.isGameOver) return;

        this.gustCount++;

        const windKeys = ['NW', 'N', 'NE', 'W', 'E', 'SW', 'S', 'SE'];
        const dirKey = windKeys[Math.floor(Math.random() * windKeys.length)];

        this.currentWindHighlight = dirKey;
        this.render();

        const [dr, dc] = this.windDirs[dirKey];
        let newGreenSeeds = [];
        let newBlueSeeds = [];

        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.board[r][c] === 1) {
                    // Green flower blows green seeds
                    let nr = r + dr;
                    let nc = c + dc;
                    while (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
                        const val = this.board[nr][nc];
                        if (val === 0) {
                            newGreenSeeds.push({ r: nr, c: nc });
                        } else if (val === 1 || val === 2) {
                            // Blow through own color (green flower or green seed)
                        } else if (val === 3 || val === 4) {
                            // Blocked by opponent color (blue flower or blue seed)
                            break;
                        }
                        nr += dr;
                        nc += dc;
                    }
                } else if (this.board[r][c] === 3) {
                    // Blue flower blows blue seeds
                    let nr = r + dr;
                    let nc = c + dc;
                    while (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
                        const val = this.board[nr][nc];
                        if (val === 0) {
                            newBlueSeeds.push({ r: nr, c: nc });
                        } else if (val === 3 || val === 4) {
                            // Blow through own color (blue flower or blue seed)
                        } else if (val === 1 || val === 2) {
                            // Blocked by opponent color (green flower or green seed)
                            break;
                        }
                        nr += dr;
                        nc += dc;
                    }
                }
            }
        }

        // Apply new seeds
        for (let spot of newGreenSeeds) {
            this.board[spot.r][spot.c] = 2;
        }
        for (let spot of newBlueSeeds) {
            this.board[spot.r][spot.c] = 4;
        }

        this.calculateScores();
        this.checkWinCondition();

        if (!this.isGameOver) {
            setTimeout(() => {
                this.currentWindHighlight = null;
                this.roundFirstPlayer = this.roundFirstPlayer === 1 ? 2 : 1;
                this.roundPhase = 'plant1';
                this.currentPlayer = this.roundFirstPlayer;

                this.updateTurn(this.currentPlayer);
                this.render();

                if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
                    setTimeout(() => this.makeAIMove(), 600);
                }
            }, 1200);
        }
    }

    calculateScores() {
        if (this.gameMode === 'rival') {
            let greenCount = 0;
            let blueCount = 0;
            for (let r = 0; r < this.boardSize; r++) {
                for (let c = 0; c < this.boardSize; c++) {
                    if (this.board[r][c] === 1 || this.board[r][c] === 2) greenCount++;
                    else if (this.board[r][c] === 3 || this.board[r][c] === 4) blueCount++;
                }
            }
            this.scores[1] = greenCount;
            this.scores[2] = blueCount;
        } else if (this.gameMode === 'collaborative') {
            let count = 0;
            for (let r = 0; r < this.boardSize; r++) {
                for (let c = 0; c < this.boardSize; c++) {
                    if (this.board[r][c] === 1 || this.board[r][c] === 2) count++;
                }
            }
            this.scores[1] = count;
            this.scores[2] = this.usedWinds.size;
        } else {
            let count = 0;
            for (let r = 0; r < this.boardSize; r++) {
                for (let c = 0; c < this.boardSize; c++) {
                    if (this.board[r][c] === 1 || this.board[r][c] === 2) count++;
                }
            }
            this.scores[1] = count;
            this.scores[2] = (this.boardSize * this.boardSize) - count;
        }
        this.updateScores(this.scores);
    }

    checkWinCondition() {
        if (this.gameMode === 'rival') {
            let emptyCount = 0;
            for (let r = 0; r < this.boardSize; r++) {
                for (let c = 0; c < this.boardSize; c++) {
                    if (this.board[r][c] === 0) emptyCount++;
                }
            }

            if (emptyCount === 0 || this.gustCount >= 8) {
                this.isGameOver = true;
                this.render();
                if (this.scores[1] > this.scores[2]) {
                    this.gameOver("Green Player");
                } else if (this.scores[2] > this.scores[1]) {
                    this.gameOver("Blue Player");
                } else {
                    this.gameOver("It's a Tie!");
                }
            }
            return;
        }

        if (this.gameMode === 'collaborative') {
            const totalCovered = this.scores[1];
            if (totalCovered === 64) {
                this.isGameOver = true;
                this.render();
                this.gameOver("Cooperative Victory! Perfect 64/64");
                return;
            }
            
            if (this.currentTurnIndex >= this.turnSequence.length - 1 && this.currentPlayer === 2) {
                this.isGameOver = true;
                this.render();
                this.gameOver(`Cooperative Game Over! You covered ${totalCovered}/64`);
            }
            return;
        }

        const maxScore = this.boardSize * this.boardSize;
        if (this.scores[1] === maxScore) {
            this.isGameOver = true;
            this.render();
            this.gameOver("Player 1 (Dandelion)");
            return;
        }

        if (this.currentTurnIndex >= this.turnSequence.length - 1) {
            this.isGameOver = true;
            this.render();
            if (this.scores[1] < maxScore) {
                this.gameOver("Player 2 (Wind)");
            } else {
                this.gameOver("Player 1 (Dandelion)");
            }
        }
    }

    makeAIMove() {
        if (this.isGameOver) return;

        if (this.gameMode === 'rival') {
            if (this.roundPhase === 'plant1' || this.roundPhase === 'plant2') {
                this.makeDandelionMove();
            }
        } else if (this.gameMode === 'collaborative') {
            if (this.currentPlayer === 1) {
                this.makeCollaborativeDandelionMove();
            } else {
                this.makeCollaborativeWindMove();
            }
        } else {
            if (this.currentPlayer === 1) {
                this.makeDandelionMove();
            } else {
                this.makeWindMove();
            }
        }
    }

    makeWindMove() {
        if (this.isGameOver) return;

        let availableWinds = [];
        const keys = ['NW', 'N', 'NE', 'W', 'E', 'SW', 'S', 'SE'];
        for (let key of keys) {
            if (!this.usedWinds.has(key)) {
                availableWinds.push(key);
            }
        }

        if (availableWinds.length > 0) {
            const move = availableWinds[Math.floor(Math.random() * availableWinds.length)];
            this.handleCompassClick(move, true);
        }
    }

    makeDandelionMove() {
        if (this.isGameOver) return;

        let emptySpots = [];
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.board[r][c] === 0) {
                    emptySpots.push({ r, c });
                }
            }
        }

        if (emptySpots.length > 0) {
            const move = emptySpots[Math.floor(Math.random() * emptySpots.length)];
            this.handleBoardClick(move.r, move.c, true);
        }
    }

    makeCollaborativeDandelionMove() {
        let bestMove = null;
        let maxScore = -1;
        let emptySpots = [];

        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.board[r][c] === 0) {
                    emptySpots.push({ r, c });
                }
            }
        }

        for (let spot of emptySpots) {
            let score = 0;
            const directions = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1],           [0, 1],
                [1, -1],  [1, 0],  [1, 1]
            ];
            for (let [dr, dc] of directions) {
                let nr = spot.r + dr;
                let nc = spot.c + dc;
                while (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
                    const val = this.board[nr][nc];
                    if (val === 0) {
                        score++;
                    } else if (val === 2) {
                        // Blow through seeds
                    } else if (val === 1) {
                        break;
                    }
                    nr += dr;
                    nc += dc;
                }
            }

            if (score > maxScore) {
                maxScore = score;
                bestMove = spot;
            }
        }

        if (bestMove) {
            this.handleBoardClick(bestMove.r, bestMove.c, true);
        }
    }

    makeCollaborativeWindMove() {
        let bestDir = null;
        let maxNewSeeds = -1;
        let availableWinds = [];

        const keys = ['NW', 'N', 'NE', 'W', 'E', 'SW', 'S', 'SE'];
        for (let key of keys) {
            if (!this.usedWinds.has(key)) {
                availableWinds.push(key);
            }
        }

        for (let dirKey of availableWinds) {
            const [dr, dc] = this.windDirs[dirKey];
            let simulatedSeeds = 0;

            for (let r = 0; r < this.boardSize; r++) {
                for (let c = 0; c < this.boardSize; c++) {
                    if (this.board[r][c] === 1) {
                        let nr = r + dr;
                        let nc = c + dc;
                        while (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
                            const val = this.board[nr][nc];
                            if (val === 0) {
                                simulatedSeeds++;
                            } else if (val === 2) {
                                // Blow through seeds
                            } else if (val === 1) {
                                break;
                            }
                            nr += dr;
                            nc += dc;
                        }
                    }
                }
            }

            if (simulatedSeeds > maxNewSeeds) {
                maxNewSeeds = simulatedSeeds;
                bestDir = dirKey;
            }
        }

        if (!bestDir && availableWinds.length > 0) {
            bestDir = availableWinds[Math.floor(Math.random() * availableWinds.length)];
        }

        if (bestDir) {
            this.handleCompassClick(bestDir, true);
        }
    }
}
