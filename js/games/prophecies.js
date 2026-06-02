export class Prophecies {
    constructor(container, updateScores, updateTurn, gameOver) {
        this.container = container;
        this.updateScores = updateScores;
        this.updateTurn = updateTurn;
        this.gameOver = gameOver;

        this.rows = 4;
        this.cols = 5;
        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.isGameOver = false;

        this.playerCount = 2; // Default
        this.humanRole = 1;   // Default (Play as P1)
        this.gameMode = 'classic'; // Default

        this.selectedCellForInput = null; // { r, c } when showing the option selector popup
    }

    init() {
        if (this.gameMode === 'custom' && this.customRows && this.customCols) {
            this.rows = this.customRows;
            this.cols = this.customCols;
        } else {
            this.rows = 4;
            this.cols = 5;
        }

        this.board = Array(this.rows).fill(null).map(() => Array(this.cols).fill(null));
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.isGameOver = false;
        this.selectedCellForInput = null;

        this.updateScores(this.scores);
        this.updateTurn(this.currentPlayer);
        this.render();

        if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
            setTimeout(() => this.makeAIMove(), 600);
        }
    }

    render() {
        this.container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'prophecies-board-wrapper';

        // Create main board grid (playable rows + 1 indicator row, playable columns + 1 indicator column)
        const boardEl = document.createElement('div');
        boardEl.className = 'prophecies-board';
        boardEl.style.gridTemplateColumns = `repeat(${this.cols + 1}, 1fr)`;
        boardEl.style.gridTemplateRows = `repeat(${this.rows + 1}, 1fr)`;

        // Lock board visually if it's AI's turn or game is over
        const isBoardDisabled = this.isGameOver || (this.playerCount === 1 && this.currentPlayer !== this.humanRole);
        if (isBoardDisabled) {
            boardEl.style.pointerEvents = 'none';
        }

        for (let r = 0; r < this.rows + 1; r++) {
            for (let c = 0; c < this.cols + 1; c++) {
                const cellEl = document.createElement('div');
                cellEl.dataset.r = r;
                cellEl.dataset.c = c;

                if (r < this.rows && c < this.cols) {
                    // Playable cell
                    cellEl.className = 'prophecies-cell';
                    const cell = this.board[r][c];

                    if (cell) {
                        if (cell.value === 'X') {
                            cellEl.textContent = 'X';
                            cellEl.classList.add('x-cell');
                        } else {
                            cellEl.textContent = cell.value;
                            cellEl.classList.add('number-cell');
                            cellEl.classList.add(`p${cell.player}-cell`);
                        }
                        cellEl.classList.add('occupied');
                    } else {
                        // Empty cell
                        cellEl.classList.add('empty-cell');
                        if (this.selectedCellForInput && this.selectedCellForInput.r === r && this.selectedCellForInput.c === c) {
                            cellEl.classList.add('selected');
                        }
                        cellEl.addEventListener('click', () => this.handleCellClick(r, c));
                    }
                } else {
                    // Indicator cell (row/col prophecy counts)
                    cellEl.className = 'prophecies-indicator-cell';

                    if (r < this.rows && c === this.cols) {
                        // Row count indicator
                        const count = this.getProphecyCountInRow(r);
                        cellEl.textContent = count;

                        // Check if row has a correct prophecy and who made it
                        const rowPlayer = this.getCorrectProphecyPlayerInRow(r, count);
                        if (rowPlayer) {
                            cellEl.classList.add(`p${rowPlayer}-correct`);
                        }
                    } else if (r === this.rows && c < this.cols) {
                        // Col count indicator
                        const count = this.getProphecyCountInCol(c);
                        cellEl.textContent = count;

                        // Check if column has a correct prophecy and who made it
                        const colPlayer = this.getCorrectProphecyPlayerInCol(c, count);
                        if (colPlayer) {
                            cellEl.classList.add(`p${colPlayer}-correct`);
                        }
                    } else {
                        // Corner cell
                        cellEl.classList.add('corner');
                        cellEl.innerHTML = '🎯';
                    }
                }

                boardEl.appendChild(cellEl);
            }
        }

        wrapper.appendChild(boardEl);

        // Render option selector popup if a cell is selected
        if (this.selectedCellForInput && !this.isGameOver) {
            const { r, c } = this.selectedCellForInput;
            const popup = document.createElement('div');
            popup.className = 'prophecies-selector-popup';

            const title = document.createElement('h4');
            title.textContent = `Prophecy for Row ${r + 1}, Col ${c + 1}`;
            popup.appendChild(title);

            const optionsGrid = document.createElement('div');
            optionsGrid.className = 'prophecies-options-grid';

            const valids = this.getValidNumbersForCell(r, c);

            const maxDim = Math.max(this.rows, this.cols);
            // Numbers 1 to maxDim
            for (let num = 1; num <= maxDim; num++) {
                const btn = document.createElement('button');
                btn.className = 'prophecies-selector-btn';
                btn.textContent = num;

                const isValid = valids.includes(num);
                if (!isValid) {
                    btn.classList.add('disabled');
                    btn.disabled = true;
                } else {
                    btn.addEventListener('click', () => this.makeMove(r, c, num));
                }
                optionsGrid.appendChild(btn);
            }

            // 'X' option (always valid)
            const xBtn = document.createElement('button');
            xBtn.className = 'prophecies-selector-btn x-btn';
            xBtn.textContent = 'X';
            xBtn.addEventListener('click', () => this.makeMove(r, c, 'X'));
            optionsGrid.appendChild(xBtn);

            popup.appendChild(optionsGrid);

            // Cancel button
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'prophecies-cancel-btn hand-drawn';
            cancelBtn.textContent = 'Cancel';
            cancelBtn.addEventListener('click', () => {
                this.selectedCellForInput = null;
                this.render();
            });
            popup.appendChild(cancelBtn);

            wrapper.appendChild(popup);
        }

        this.container.appendChild(wrapper);
    }

    handleCellClick(r, c) {
        if (this.isGameOver) return;
        if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) return;

        if (this.selectedCellForInput && this.selectedCellForInput.r === r && this.selectedCellForInput.c === c) {
            // Click again to close selector
            this.selectedCellForInput = null;
        } else {
            this.selectedCellForInput = { r, c };
        }
        this.render();
    }

    makeMove(r, c, val) {
        if (this.isGameOver) return;

        this.board[r][c] = {
            value: val,
            player: this.currentPlayer
        };

        this.selectedCellForInput = null;
        this.autoFillImpossibleCells();
        this.calculateScores();

        if (this.isBoardFull()) {
            this.endGame();
            return;
        }

        // Switch turn
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateTurn(this.currentPlayer);
        this.render();

        if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
            setTimeout(() => this.makeAIMove(), 600);
        }
    }

    getProphecyCountInRow(r) {
        let count = 0;
        const isXMode = this.gameMode === 'x-prophecies';
        for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r][c];
            if (cell) {
                if (isXMode) {
                    if (cell.value === 'X') count++;
                } else {
                    if (typeof cell.value === 'number') count++;
                }
            }
        }
        return count;
    }

    getProphecyCountInCol(c) {
        let count = 0;
        const isXMode = this.gameMode === 'x-prophecies';
        for (let r = 0; r < this.rows; r++) {
            const cell = this.board[r][c];
            if (cell) {
                if (isXMode) {
                    if (cell.value === 'X') count++;
                } else {
                    if (typeof cell.value === 'number') count++;
                }
            }
        }
        return count;
    }

    getCorrectProphecyPlayerInRow(r, count) {
        for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r][c];
            if (cell && cell.value === count && cell.player !== null) {
                return cell.player;
            }
        }
        return null;
    }

    getCorrectProphecyPlayerInCol(c, count) {
        for (let r = 0; r < this.rows; r++) {
            const cell = this.board[r][c];
            if (cell && cell.value === count && cell.player !== null) {
                return cell.player;
            }
        }
        return null;
    }

    getValidNumbersForCell(r, c) {
        const row = this.board[r];
        const valid = [];
        const maxDim = Math.max(this.rows, this.cols);
        for (let num = 1; num <= maxDim; num++) {
            // Check if number is in row
            const inRow = row.some(cell => cell && cell.value === num);

            // Check if number is in column
            let inCol = false;
            for (let rowIdx = 0; rowIdx < this.rows; rowIdx++) {
                const cell = this.board[rowIdx][c];
                if (cell && cell.value === num) {
                    inCol = true;
                    break;
                }
            }

            if (!inRow && !inCol) {
                valid.push(num);
            }
        }
        return valid;
    }

    autoFillImpossibleCells() {
        let changed = false;
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] === null) {
                    const valid = this.getValidNumbersForCell(r, c);
                    if (valid.length === 0) {
                        this.board[r][c] = {
                            value: 'X',
                            player: null // Auto-filled X is neutral
                        };
                        changed = true;
                    }
                }
            }
        }
        if (changed) {
            // Recursively resolve any further blockages
            this.autoFillImpossibleCells();
        }
    }

    isBoardFull() {
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] === null) {
                    return false;
                }
            }
        }
        return true;
    }

    calculateScores() {
        let p1Score = 0;
        let p2Score = 0;

        // Check rows
        for (let r = 0; r < this.rows; r++) {
            const count = this.getProphecyCountInRow(r);
            // Find prophecy matching row count
            for (let c = 0; c < this.cols; c++) {
                const cell = this.board[r][c];
                if (cell && cell.value === count && cell.player !== null) {
                    if (cell.player === 1) p1Score += count;
                    if (cell.player === 2) p2Score += count;
                }
            }
        }

        // Check columns
        for (let c = 0; c < this.cols; c++) {
            const count = this.getProphecyCountInCol(c);
            // Find prophecy matching column count
            for (let r = 0; r < this.rows; r++) {
                const cell = this.board[r][c];
                if (cell && cell.value === count && cell.player !== null) {
                    if (cell.player === 1) p1Score += count;
                    if (cell.player === 2) p2Score += count;
                }
            }
        }

        this.scores[1] = p1Score;
        this.scores[2] = p2Score;
        this.updateScores(this.scores);
    }

    makeAIMove() {
        if (this.isGameOver) return;

        const candidateMoves = [];

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                if (this.board[r][c] === null) {
                    const valids = this.getValidNumbersForCell(r, c);
                    // Add all valid numbers as options
                    for (let val of valids) {
                        const score = this.rateAIMove(r, c, val);
                        candidateMoves.push({ r, c, val, score });
                    }
                    // 'X' is always an option
                    const xScore = this.rateAIMove(r, c, 'X');
                    candidateMoves.push({ r, c, val: 'X', score: xScore });
                }
            }
        }

        if (candidateMoves.length === 0) return; // No moves left

        // Sort by score descending and pick from the best moves
        candidateMoves.sort((a, b) => b.score - a.score);
        const maxScore = candidateMoves[0].score;
        const bestMoves = candidateMoves.filter(m => m.score === maxScore);
        const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];

        // Highlight AI selection in UI
        this.selectedCellForInput = { r: chosen.r, c: chosen.c };
        this.render();

        setTimeout(() => {
            this.makeMove(chosen.r, chosen.c, chosen.val);
        }, 400);
    }

    rateAIMove(r, c, val) {
        const isXMode = this.gameMode === 'x-prophecies';

        if (val === 'X') {
            // Placing X can help secure an existing prophecy or block the player's
            let score = 0;

            // Analyze row
            const rowProphecy = this.findProphecyInRow(r);
            if (rowProphecy) {
                const currentCount = this.getProphecyCountInRow(r); // Current count (numbers or Xs)
                // New count if we place X
                const nextCount = isXMode ? currentCount + 1 : currentCount;

                if (rowProphecy.value === nextCount) {
                    score += rowProphecy.player === this.currentPlayer ? 20 : -15;
                } else if (rowProphecy.value < nextCount) {
                    // Already ruined or about to be ruined by overshooting
                    score += rowProphecy.player === this.currentPlayer ? -10 : 10;
                } else {
                    // Prophecy wants more. In X-mode, X helps. In standard mode, X blocks.
                    if (isXMode) {
                        score += rowProphecy.player === this.currentPlayer ? 8 : -5;
                    } else {
                        score += rowProphecy.player !== this.currentPlayer ? 5 : -5;
                    }
                }
            } else if (isXMode) {
                // In X mode, placing X is generally good if we haven't made a prophecy yet
                score += 2;
            }

            // Analyze col
            const colProphecy = this.findProphecyInCol(c);
            if (colProphecy) {
                const currentCount = this.getProphecyCountInCol(c);
                const nextCount = isXMode ? currentCount + 1 : currentCount;

                if (colProphecy.value === nextCount) {
                    score += colProphecy.player === this.currentPlayer ? 20 : -15;
                } else if (colProphecy.value < nextCount) {
                    score += colProphecy.player === this.currentPlayer ? -10 : 10;
                } else {
                    if (isXMode) {
                        score += colProphecy.player === this.currentPlayer ? 8 : -5;
                    } else {
                        score += colProphecy.player !== this.currentPlayer ? 5 : -5;
                    }
                }
            } else if (isXMode) {
                score += 2;
            }

            return score;
        }

        // Placing a number prophecy
        let score = val * 2;

        // Row analysis
        const rowCount = this.getProphecyCountInRow(r); // Current (numbers or Xs)
        const rowEmptyCount = this.getEmptyCountInRow(r);

        // Potential range of targets (numbers or Xs)
        // If placing a number NOW:
        // In Standard: New number count will be rowCount + 1. Max is rowCount + rowEmptyCount.
        // In X-Mode: New X count is currently rowCount. Max is rowCount + (rowEmptyCount - 1).
        let minTarget, maxTarget;
        if (isXMode) {
            minTarget = rowCount;
            maxTarget = rowCount + (rowEmptyCount - 1);
        } else {
            minTarget = rowCount + 1;
            maxTarget = rowCount + rowEmptyCount;
        }

        if (val >= minTarget && val <= maxTarget) {
            score += 10;
            if (val === minTarget && val === maxTarget) {
                score += 25; // Forced win
            } else if (val === minTarget || val === maxTarget) {
                score += 10; // High probability
            }
        } else {
            score -= 30; // Impossible
        }

        // Col analysis
        const colCount = this.getProphecyCountInCol(c);
        const colEmptyCount = this.getEmptyCountInCol(c);

        let minColTarget, maxColTarget;
        if (isXMode) {
            minColTarget = colCount;
            maxColTarget = colCount + (colEmptyCount - 1);
        } else {
            minColTarget = colCount + 1;
            maxColTarget = colCount + colEmptyCount;
        }

        if (val >= minColTarget && val <= maxColTarget) {
            score += 10;
            if (val === minColTarget && val === maxColTarget) {
                score += 25;
            } else if (val === minColTarget || val === maxColTarget) {
                score += 10;
            }
        } else {
            score -= 30;
        }

        return score;
    }

    findProphecyInRow(r) {
        for (let c = 0; c < this.cols; c++) {
            const cell = this.board[r][c];
            if (cell && typeof cell.value === 'number') {
                return cell;
            }
        }
        return null;
    }

    findProphecyInCol(c) {
        for (let r = 0; r < this.rows; r++) {
            const cell = this.board[r][c];
            if (cell && typeof cell.value === 'number') {
                return cell;
            }
        }
        return null;
    }

    getEmptyCountInRow(r) {
        let count = 0;
        for (let c = 0; c < this.cols; c++) {
            if (this.board[r][c] === null) count++;
        }
        return count;
    }

    getEmptyCountInCol(c) {
        let count = 0;
        for (let r = 0; r < this.rows; r++) {
            if (this.board[r][c] === null) count++;
        }
        return count;
    }

    endGame() {
        this.isGameOver = true;
        this.calculateScores();
        this.render();

        let winnerTextMsg = "";
        if (this.scores[1] > this.scores[2]) {
            winnerTextMsg = "Player 1";
        } else if (this.scores[2] > this.scores[1]) {
            winnerTextMsg = "Player 2";
        } else {
            winnerTextMsg = "It's a Tie!";
        }

        this.gameOver(winnerTextMsg);
    }
}
