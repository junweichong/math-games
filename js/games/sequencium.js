export class Sequencium {
    constructor(container, updateScores, updateTurn, gameOver) {
        this.container = container;
        this.updateScores = updateScores;
        this.updateTurn = updateTurn;
        this.gameOver = gameOver;

        this.boardSize = 6;
        this.board = Array(6).fill(null).map(() => Array(6).fill(null));
        this.currentPlayer = 1;
        this.turnsRemainingInBlock = 1;
        this.scores = { 1: 3, 2: 3 };
        this.isGameOver = false;

        this.playerCount = 2; // Default
        this.humanRole = 1;   // Default (Play as P1)
        this.gameMode = 'classic'; // Default

        this.selectedCell = null; // { r, c } of currently selected cell
        this.validMovesForSelected = []; // Array of { r, c } coordinates
    }

    init() {
        if (this.gameMode === '7x7') {
            this.boardSize = 7;
        } else {
            this.boardSize = 6;
        }

        this.board = Array(this.boardSize).fill(null).map(() => Array(this.boardSize).fill(null));
        this.currentPlayer = 1;
        this.turnsRemainingInBlock = 1;
        this.scores = { 1: 3, 2: 3 };
        this.isGameOver = false;
        this.selectedCell = null;
        this.validMovesForSelected = [];

        if (this.gameMode === '7x7') {
            // Initial setup for Player 1 (Red / P1 Color)
            this.board[0][0] = { value: 1, player: 1, parent: null };
            this.board[1][1] = { value: 2, player: 1, parent: { r: 0, c: 0 } };
            this.board[2][2] = { value: 3, player: 1, parent: { r: 1, c: 1 } };

            // Initial setup for Player 2 (Blue / P2 Color)
            this.board[6][6] = { value: 1, player: 2, parent: null };
            this.board[5][5] = { value: 2, player: 2, parent: { r: 6, c: 6 } };
            this.board[4][4] = { value: 3, player: 2, parent: { r: 5, c: 5 } };

            // Middle block: row 3, col 3 is blocked (unselectable/black)
            this.board[3][3] = { blocked: true };
        } else {
            // Initial setup for Player 1 (Red / P1 Color)
            this.board[0][0] = { value: 1, player: 1, parent: null };
            this.board[1][1] = { value: 2, player: 1, parent: { r: 0, c: 0 } };
            this.board[2][2] = { value: 3, player: 1, parent: { r: 1, c: 1 } };

            // Initial setup for Player 2 (Blue / P2 Color)
            this.board[5][5] = { value: 1, player: 2, parent: null };
            this.board[4][4] = { value: 2, player: 2, parent: { r: 5, c: 5 } };
            this.board[3][3] = { value: 3, player: 2, parent: { r: 4, c: 4 } };
        }

        this.calculateScores();
        this.render();
        this.updateTurn(this.currentPlayer);

        if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
            setTimeout(() => this.makeAIMove(), 600);
        }
    }

    render() {
        this.container.innerHTML = '';

        // Create board wrapper to hold the SVG overlay and the Grid
        const wrapper = document.createElement('div');
        wrapper.className = 'sequencium-board-wrapper';

        // 1. Create SVG Overlay for connection lines
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'sequencium-svg-overlay');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.setAttribute('preserveAspectRatio', 'none');

        // Draw connection lines
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const cell = this.board[r][c];
                if (cell && cell.parent) {
                    const startCoords = this.getCellCenterPercent(cell.parent.r, cell.parent.c);
                    const endCoords = this.getCellCenterPercent(r, c);

                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('x1', `${startCoords.x}%`);
                    line.setAttribute('y1', `${startCoords.y}%`);
                    line.setAttribute('x2', `${endCoords.x}%`);
                    line.setAttribute('y2', `${endCoords.y}%`);
                    line.setAttribute('class', `sequencium-link-line p${cell.player}`);
                    
                    // Add SVG drawing effect (total length ~14.14% diagonal max)
                    line.setAttribute('stroke-dasharray', '100');
                    line.setAttribute('stroke-dashoffset', '100');

                    svg.appendChild(line);
                }
            }
        }
        wrapper.appendChild(svg);

        // 2. Create Board Grid
        const boardEl = document.createElement('div');
        boardEl.className = 'sequencium-board';
        boardEl.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        boardEl.style.gridTemplateRows = `repeat(${this.boardSize}, 1fr)`;

        // Check if board needs to be visually locked (like when it is AI turn)
        const isBoardDisabled = this.isGameOver || (this.playerCount === 1 && this.currentPlayer !== this.humanRole);
        if (isBoardDisabled) {
            boardEl.style.pointerEvents = 'none';
        }

        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const cellEl = document.createElement('div');
                cellEl.className = 'sequencium-cell';
                cellEl.dataset.r = r;
                cellEl.dataset.c = c;

                const cell = this.board[r][c];
                if (cell) {
                    if (cell.blocked) {
                        cellEl.classList.add('blocked-cell');
                    } else {
                        cellEl.textContent = cell.value;
                        cellEl.classList.add('occupied');
                        cellEl.classList.add(`p${cell.player}-cell`);

                        // Check if it's the currently selected cell
                        if (this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c) {
                            cellEl.classList.add('selected');
                        }
                    }
                } else {
                    // Check if this empty cell is a valid preview space
                    const isPreview = this.validMovesForSelected.some(mv => mv.r === r && mv.c === c);
                    if (isPreview) {
                        cellEl.classList.add('preview-valid');
                        // Optional: Show preview value (+1) in low opacity
                        if (this.selectedCell) {
                            const val = this.board[this.selectedCell.r][this.selectedCell.c].value + 1;
                            const hintSpan = document.createElement('span');
                            hintSpan.style.opacity = '0.3';
                            hintSpan.style.fontSize = '1.3rem';
                            hintSpan.textContent = val;
                            cellEl.appendChild(hintSpan);
                        }
                    }
                }

                cellEl.addEventListener('click', () => this.handleCellClick(r, c));
                boardEl.appendChild(cellEl);
            }
        }

        wrapper.appendChild(boardEl);
        this.container.appendChild(wrapper);

        // Show remaining moves if in balanced mode
        if ((this.gameMode === 'balanced' || this.gameMode === '7x7') && !this.isGameOver) {
            const turnIndicator = document.getElementById('turn-indicator');
            if (turnIndicator) {
                const movesText = this.turnsRemainingInBlock === 1 ? '1 move left' : '2 moves left';
                turnIndicator.textContent = `Player ${this.currentPlayer}'s Turn (${movesText})`;
            }
        }
    }

    getCellCenterPercent(row, col) {
        const cellSize = 100 / this.boardSize;
        const x = (col + 0.5) * cellSize;
        const y = (row + 0.5) * cellSize;
        return { x, y };
    }

    handleCellClick(r, c) {
        if (this.isGameOver) return;
        if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) return;

        const cell = this.board[r][c];

        // 1. Clicked on own cell -> select it to build from, or deselect if clicked again
        if (cell && cell.player === this.currentPlayer) {
            if (this.selectedCell && this.selectedCell.r === r && this.selectedCell.c === c) {
                this.selectedCell = null;
                this.validMovesForSelected = [];
            } else {
                this.selectedCell = { r, c };
                this.validMovesForSelected = this.getAdjacentEmptyCells(r, c);
            }
            this.render();
            return;
        }

        // 2. Clicked on a highlighted preview cell -> place number
        const isValidMove = this.validMovesForSelected.some(mv => mv.r === r && mv.c === c);
        if (isValidMove && this.selectedCell) {
            const parentValue = this.board[this.selectedCell.r][this.selectedCell.c].value;
            
            // Place number
            this.board[r][c] = {
                value: parentValue + 1,
                player: this.currentPlayer,
                parent: { r: this.selectedCell.r, c: this.selectedCell.c }
            };

            // Clear selections
            this.selectedCell = null;
            this.validMovesForSelected = [];

            this.calculateScores();
            this.nextTurn();
            return;
        }

        // 3. Clicked elsewhere -> cancel selection
        this.selectedCell = null;
        this.validMovesForSelected = [];
        this.render();
    }

    getAdjacentEmptyCells(r, c) {
        const emptyCells = [];
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
                    if (this.board[nr][nc] === null) {
                        emptyCells.push({ r: nr, c: nc });
                    }
                }
            }
        }
        return emptyCells;
    }

    nextTurn() {
        // Decrease turns remaining in the current block
        this.turnsRemainingInBlock--;

        // Check if current player's block is finished
        if (this.turnsRemainingInBlock <= 0) {
            // Switch player
            this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
            // Set turns remaining for the new block
            this.turnsRemainingInBlock = (this.gameMode === 'balanced' || this.gameMode === '7x7') ? 2 : 1;
        }

        this.updateTurn(this.currentPlayer);

        // Check if the board is completely full
        if (this.isBoardFull()) {
            this.endGame();
            return;
        }

        // Check if the current player has any valid moves
        if (!this.hasValidMoves(this.currentPlayer)) {
            // Check if the OTHER player has any valid moves
            const otherPlayer = this.currentPlayer === 1 ? 2 : 1;
            if (!this.hasValidMoves(otherPlayer)) {
                // Neither player has valid moves left! Game Over.
                this.endGame();
                return;
            }

            // Show turn passing notification
            const turnIndicator = document.getElementById('turn-indicator');
            if (turnIndicator) {
                turnIndicator.textContent = `Player ${this.currentPlayer} has no moves! Passing...`;
            }

            // Automate the pass after a short delay
            setTimeout(() => {
                this.currentPlayer = otherPlayer;
                this.turnsRemainingInBlock = (this.gameMode === 'balanced' || this.gameMode === '7x7') ? 2 : 1;
                this.updateTurn(this.currentPlayer);
                this.render();

                if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
                    setTimeout(() => this.makeAIMove(), 600);
                }
            }, 1500);
            return;
        }

        this.render();

        // If the new active player is the computer, trigger AI move
        if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
            setTimeout(() => this.makeAIMove(), 600);
        }
    }

    countOccupiedCells() {
        let count = 0;
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.board[r][c] !== null) {
                    count++;
                }
            }
        }
        return count;
    }

    hasValidMoves(player) {
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const cell = this.board[r][c];
                if (cell && cell.player === player) {
                    // Check if it has any adjacent empty cell
                    const empties = this.getAdjacentEmptyCells(r, c);
                    if (empties.length > 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    isBoardFull() {
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                if (this.board[r][c] === null) {
                    return false;
                }
            }
        }
        return true;
    }

    calculateScores() {
        let p1Max = 0;
        let p2Max = 0;

        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const cell = this.board[r][c];
                if (cell) {
                    if (cell.player === 1) {
                        p1Max = Math.max(p1Max, cell.value);
                    } else if (cell.player === 2) {
                        p2Max = Math.max(p2Max, cell.value);
                    }
                }
            }
        }

        this.scores[1] = p1Max;
        this.scores[2] = p2Max;
        this.updateScores(this.scores);
    }

    makeAIMove() {
        if (this.isGameOver) return;

        // 1. Gather all valid moves
        const moves = [];
        for (let r = 0; r < this.boardSize; r++) {
            for (let c = 0; c < this.boardSize; c++) {
                const cell = this.board[r][c];
                if (cell && cell.player === this.currentPlayer) {
                    const empties = this.getAdjacentEmptyCells(r, c);
                    for (let empty of empties) {
                        moves.push({
                            from: { r, c },
                            to: empty,
                            value: cell.value + 1
                        });
                    }
                }
            }
        }

        if (moves.length === 0) {
            // No moves, pass
            this.nextTurn();
            return;
        }

        // 2. Filter moves to get the ones with the highest placed value (greedy choice)
        const maxValue = Math.max(...moves.map(m => m.value));
        const candidateMoves = moves.filter(m => m.value === maxValue);

        // 3. Break ties using a positioning heuristic
        let bestMove = null;
        let highestHeuristic = -Infinity;

        for (let move of candidateMoves) {
            // Count empty neighbors of the target cell (more options to continue growth)
            const targetEmpties = this.getAdjacentEmptyCells(move.to.r, move.to.c);
            let emptyNeighbors = targetEmpties.length;

            // Count opponent neighbors of the target cell (blocking opportunity)
            let opponentNeighbors = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr === 0 && dc === 0) continue;
                    const nr = move.to.r + dr;
                    const nc = move.to.c + dc;
                    if (nr >= 0 && nr < this.boardSize && nc >= 0 && nc < this.boardSize) {
                        const neighbor = this.board[nr][nc];
                        if (neighbor && neighbor.player !== this.currentPlayer) {
                            opponentNeighbors++;
                        }
                    }
                }
            }

            // Heuristic value: favor blocking and keeping own growth options open
            const heuristic = emptyNeighbors + (opponentNeighbors * 2.0);

            if (heuristic > highestHeuristic) {
                highestHeuristic = heuristic;
                bestMove = move;
            } else if (heuristic === highestHeuristic && Math.random() > 0.5) {
                bestMove = move; // Random tie breaking
            }
        }

        if (!bestMove) {
            bestMove = candidateMoves[Math.floor(Math.random() * candidateMoves.length)];
        }

        // 4. Perform the chosen move
        const { from, to, value } = bestMove;

        // Visual selection feedback (highlight selected cell for AI before move)
        this.selectedCell = from;
        this.validMovesForSelected = [to];
        this.render();

        // Place value after a brief delay so the player can see what was chosen
        setTimeout(() => {
            this.board[to.r][to.c] = {
                value: value,
                player: this.currentPlayer,
                parent: from
            };

            this.selectedCell = null;
            this.validMovesForSelected = [];

            this.calculateScores();
            this.nextTurn();
        }, 400);
    }

    endGame() {
        this.isGameOver = true;
        this.render();

        if (this.scores[1] > this.scores[2]) {
            this.gameOver("Player 1");
        } else if (this.scores[2] > this.scores[1]) {
            this.gameOver("Player 2");
        } else {
            this.gameOver("It's a Tie!");
        }
    }
}
