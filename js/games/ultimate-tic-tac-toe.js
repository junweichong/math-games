export class UltimateTicTacToe {
    constructor(container, updateScores, updateTurn, gameOver) {
        this.container = container;
        this.updateScores = updateScores;
        this.updateTurn = updateTurn;
        this.gameOver = gameOver;
        
        this.board = Array(9).fill(null).map(() => Array(9).fill(null));
        this.largeBoardState = Array(9).fill(null);
        this.currentPlayer = 1;
        this.nextValidBoard = -1; // -1 means any board is valid
        this.scores = { 1: 0, 2: 0 }; 
        this.isGameOver = false;
        
        this.playerCount = 2; // Default, single player random moves
        this.humanRole = 1;
    }

    init() {
        this.board = Array(9).fill(null).map(() => Array(9).fill(null));
        this.largeBoardState = Array(9).fill(null);
        this.currentPlayer = 1;
        this.nextValidBoard = -1;
        this.scores = { 1: 0, 2: 0 };
        this.isGameOver = false;

        this.render();
        this.updateTurn(this.currentPlayer);

        if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
            setTimeout(() => this.makeComputerMove(), 600);
        }
        this.updateScores(this.scores);
    }

    render() {
        this.container.innerHTML = '';
        const boardEl = document.createElement('div');
        boardEl.className = 'utt-board';

        for (let i = 0; i < 9; i++) {
            const largeSquare = document.createElement('div');
            largeSquare.className = 'utt-large-square';
            largeSquare.dataset.index = i;

            if (this.nextValidBoard !== -1 && this.nextValidBoard !== i && !this.isGameOver) {
                largeSquare.classList.add('disabled');
            }
            if (this.largeBoardState[i]) {
                largeSquare.classList.add('won');
                largeSquare.classList.add(this.largeBoardState[i] === 1 ? 'p1' : (this.largeBoardState[i] === 2 ? 'p2' : 'tie'));
                const overlay = document.createElement('div');
                overlay.className = 'utt-large-overlay hand-drawn';
                overlay.textContent = this.largeBoardState[i] === 1 ? 'X' : (this.largeBoardState[i] === 2 ? 'O' : '-');
                largeSquare.appendChild(overlay);
            }

            for (let j = 0; j < 9; j++) {
                const smallSquare = document.createElement('div');
                smallSquare.className = 'utt-small-square hand-drawn';
                smallSquare.dataset.large = i;
                smallSquare.dataset.small = j;

                const val = this.board[i][j];
                if (val) {
                    smallSquare.textContent = val === 1 ? 'X' : 'O';
                    smallSquare.classList.add(val === 1 ? 'p1-text' : 'p2-text');
                } else {
                    smallSquare.addEventListener('click', () => this.handleMove(i, j));
                }

                largeSquare.appendChild(smallSquare);
            }
            boardEl.appendChild(largeSquare);
        }

        this.container.appendChild(boardEl);
    }

    handleMove(largeIdx, smallIdx) {
        if (this.isGameOver) return;
        if (this.board[largeIdx][smallIdx] !== null) return;
        if (this.largeBoardState[largeIdx] !== null) return;
        if (this.nextValidBoard !== -1 && this.nextValidBoard !== largeIdx) return;

        this.board[largeIdx][smallIdx] = this.currentPlayer;
        
        // Check win for large board
        const winner = this.checkWin(this.board[largeIdx]);
        if (winner) {
            this.largeBoardState[largeIdx] = winner;
            if (winner === 1) this.scores[1]++;
            else if (winner === 2) this.scores[2]++;
            this.updateScores(this.scores);
        } else if (this.board[largeIdx].every(cell => cell !== null)) {
            this.largeBoardState[largeIdx] = 'T'; // Tie
        }

        // Determine next valid board
        if (this.largeBoardState[smallIdx] === null) {
            this.nextValidBoard = smallIdx;
        } else {
            this.nextValidBoard = -1;
        }

        // Check global win
        const globalWinner = this.checkWin(this.largeBoardState);
        if (globalWinner && globalWinner !== 'T') {
            this.isGameOver = true;
            this.render();
            this.gameOver(`Player ${globalWinner}`);
            return;
        } else if (this.largeBoardState.every(cell => cell !== null)) {
            this.isGameOver = true;
            this.render();
            this.gameOver("It's a Tie!");
            return;
        }

        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateTurn(this.currentPlayer);
        this.render();

        // If playing vs computer
        if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
            setTimeout(() => this.makeComputerMove(), 500);
        }
    }

    checkWin(board) {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let line of lines) {
            const [a, b, c] = line;
            if (board[a] && board[a] !== 'T' && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    makeComputerMove() {
        if (this.isGameOver) return;
        
        let validMoves = [];
        for (let i = 0; i < 9; i++) {
            if (this.nextValidBoard !== -1 && this.nextValidBoard !== i) continue;
            if (this.largeBoardState[i] !== null) continue;
            
            for (let j = 0; j < 9; j++) {
                if (this.board[i][j] === null) {
                    validMoves.push({ large: i, small: j });
                }
            }
        }

        if (validMoves.length > 0) {
            const move = validMoves[Math.floor(Math.random() * validMoves.length)];
            this.handleMove(move.large, move.small);
        }
    }
}
