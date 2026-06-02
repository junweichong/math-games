import { DotsAndBoxes } from './games/dots-and-boxes.js?';
import { UltimateTicTacToe } from './games/ultimate-tic-tac-toe.js';
import { Dandelions } from './games/dandelions.js';
import { Sequencium } from './games/sequencium.js';
import { Prophecies } from './games/prophecies.js';
import { Pennywise } from './games/pennywise.js';

document.addEventListener('DOMContentLoaded', () => {
    const menuScreen = document.getElementById('menu-screen');
    const gameScreen = document.getElementById('game-screen');
    const backButton = document.getElementById('back-button');
    const gameTitle = document.getElementById('game-title');
    const boardContainer = document.getElementById('game-board-container');
    const turnIndicator = document.getElementById('turn-indicator');
    const p1ScoreEl = document.getElementById('p1-score');
    const p2ScoreEl = document.getElementById('p2-score');
    const p1Container = document.getElementById('p1-score-container');
    const p2Container = document.getElementById('p2-score-container');
    const playerInputs = document.getElementsByName('player-count');
    const roleSelection = document.getElementById('role-selection');
    const role1Label = document.getElementById('role-1-label');
    const role2Label = document.getElementById('role-2-label');
    const roleInputs = document.getElementsByName('player-role');
    const instructionsList = document.getElementById('instructions-list');
    const startBtn = document.getElementById('start-game-btn');
    const gameControls = document.getElementById('game-controls');
    const modesSidebar = document.getElementById('modes-sidebar');
    const modesBox = document.getElementById('modes-box');
    const gameInfo = document.getElementById('game-info');
    const infoBtn = document.getElementById('info-button');
    const instructionsModal = document.getElementById('instructions-modal');
    const closeInstructionsBtn = document.getElementById('close-instructions');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const winnerText = document.getElementById('winner-text');
    const finalP1Score = document.getElementById('final-p1-score');
    const finalP2Score = document.getElementById('final-p2-score');
    const playSameBtn = document.getElementById('play-same-btn');
    const playDiffBtn = document.getElementById('play-diff-btn');
    const modalMenuBtn = document.getElementById('modal-menu-btn');
    const viewBoardBtn = document.getElementById('view-board-btn');
    const gameModeInputs = document.getElementsByName('game-mode');

    const cards = document.querySelectorAll('.game-card:not(.placeholder-card)');

    const gameInstructions = {
        'dots-and-boxes': [
            'Players take turns connecting two dots with a line.',
            'Completing a 1x1 box earns you a point.',
            'When you complete a box, you MUST take another turn.',
            'The player with the most boxes at the end wins!'
        ],
        'ultimate-tic-tac-toe': [
            'The board is a 3x3 grid of smaller 3x3 Tic-Tac-Toe boards.',
            'Your move determines which small board your opponent must play in next.',
            'Win a small board to claim that square on the big board.',
            'Get 3 big squares in a row to win the game!'
        ],
        'dandelions': [
            'Player 1 (Dandelion) plants a seed on an empty square.',
            'Player 2 (Wind) chooses a wind direction from the compass.',
            'All dandelions scatter seeds in all empty squares along the wind direction path to the edge of the grid.',
            'The Wind can only blow 7 times in total (7 of 8 directions used).',
            'Dandelion wins by filling the board. Wind wins by preventing it!'
        ],
        'sequencium': [
            'Players take turns claiming numbers.',
            'Each new number must be adjacent to one you already own.',
            'Numbers must be in increasing order.',
            'The goal is to build the longest sequence!'
        ],
        'prophecies': [
            'Players take turns writing a number (1–5) or an X in an empty cell.',
            'A number is a prophecy: a prediction of how many numbers will appear in that row or column.',
            'No number can appear twice in the same row or column. Impossible cells are auto-filled with X.',
            'After the board is full, count numbers in each row and column.',
            'A correct prophecy scores that many points — and can score twice (once for row, once for column)!'
        ],
        'pennywise': [
            'Each player starts with: four 1s, three 5s, two 10s, and one 25.',
            'On your turn, place one number from your hand into the pot.',
            'You may then take back any combination of numbers from the pot whose total is STRICTLY LESS than the number you played.',
            'The goal is to be the last player with numbers remaining in your hand!'
        ]
    };

    const gameModesInfo = {
        'dots-and-boxes': [
            { id: 'mode-classic', value: 'classic', label: 'Classic', info: 'The standard game: complete boxes to score points. Most boxes win!', checked: true },
            { id: 'mode-triangles', value: 'triangles', label: 'Triangles', info: 'Played on a triangular grid. Complete triangles to score points!' },
            { id: 'mode-nazareno', value: 'nazareno', label: 'Nazareno', info: 'Draw straight lines of any length by dragging between dots! Complete multiple boxes at once, but there are no bonus turns.' }
        ],
        'dandelions': [
            { id: 'mode-classic', value: 'classic', label: 'Classic (5x5)', info: 'The standard game on a 5x5 board. The game ends after 7 turns.', checked: true },
            { id: 'mode-6x6', value: '6x6', label: '6x6 (Double Plant)', info: 'Played on a 6x6 board. Dandelion starts with a double plant and Wind ends with a double gust.' },
            { id: 'mode-rival', value: 'rival', label: 'Rival Dandelions (8x8)', info: 'Green vs Blue on an 8x8 grid. Players plant alternately (with alternating start order). After each pair of plants, the wind blows automatically. Most covered cells win!' },
            { id: 'mode-collaborative', value: 'collaborative', label: 'Collaborative (8x8)', info: 'Work together as Dandelion and Wind on an 8x8 board to cover all 64 cells. You get 8 gusts of wind.' }
        ],
        'sequencium': [
            { id: 'mode-classic', value: 'classic', label: 'Classic (6x6)', info: 'The standard game played on a 6x6 grid.', checked: true },
            { id: 'mode-balanced', value: 'balanced', label: 'Balanced (6x6)', info: 'First player takes 1 turn, then players take 2 turns each. Ends on Player 1 taking 2 turns.' },
            { id: 'mode-7x7', value: '7x7', label: 'Blockade (7x7)', info: 'Played on a 7x7 grid with a blacked-out, unselectable middle cell.' }
        ],
        'prophecies': [
            { id: 'mode-classic', value: 'classic', label: 'Classic (4×5)', info: 'The standard game on a 4-row, 5-column grid. Numbers 1–5.', checked: true },
            { id: 'mode-x', value: 'x-prophecies', label: 'X-Prophecies (4×5)', info: 'Each number predicts the total number of Xs that will appear in its row or column.' },
            { id: 'mode-custom', value: 'custom', label: 'Custom Grid', info: 'Choose your own grid size! Rows and columns from 4 to 8.' }
        ],
        'pennywise': [
            { id: 'mode-classic', value: 'classic', label: 'Classic', info: 'The standard game: 2 players, starting with 1s, 5s, 10s, and 25.', checked: true },
            { id: 'mode-multiplayer', value: 'multiplayer', label: 'Multiplayer', info: 'Play locally with up to 6 players! The game rules remain the same.' }
        ]
    };

    let currentGameId = null;
    let currentGameInstance = null;

    // --- UI Update Callbacks ---
    const updateScores = (scores) => {
        const p1Score = document.getElementById('p1-score');
        const p2Score = document.getElementById('p2-score');
        if (p1Score) p1Score.textContent = scores[1];
        if (p2Score) p2Score.textContent = scores[2];
    };

    const updateTurn = (player) => {
        if (currentGameId === 'dandelions' && currentGameInstance && currentGameInstance.gameMode === 'rival') {
            if (player === 'Wind') {
                turnIndicator.textContent = `💨 Wind is blowing...`;
                p1Container.classList.remove('active');
                p2Container.classList.remove('active');
            } else if (player === 1) {
                turnIndicator.textContent = `🟢 Green Player's Turn`;
                p1Container.classList.add('active');
                p2Container.classList.remove('active');
            } else if (player === 2) {
                turnIndicator.textContent = `🔵 Blue Player's Turn`;
                p1Container.classList.remove('active');
                p2Container.classList.add('active');
            }
        } else if (currentGameId === 'dandelions' && currentGameInstance && currentGameInstance.gameMode === 'collaborative') {
            const windUsed = currentGameInstance.usedWinds ? currentGameInstance.usedWinds.size : 0;
            if (player === 1) {
                turnIndicator.textContent = `🌱 Dandelion's Turn (Gust ${Math.min(windUsed + 1, 8)}/8)`;
                p1Container.classList.add('active');
                p2Container.classList.remove('active');
            } else if (player === 2) {
                turnIndicator.textContent = `💨 Wind's Turn (Gust ${Math.min(windUsed + 1, 8)}/8)`;
                p1Container.classList.remove('active');
                p2Container.classList.add('active');
            }
        } else {
            turnIndicator.textContent = `Player ${player}'s Turn`;
            p1Container.classList.toggle('active', player === 1);
            p2Container.classList.toggle('active', player === 2);
        }
    };

    const gameOver = (winner) => {
        setTimeout(() => {
            winnerText.textContent = winner === "It's a Tie!" || winner.startsWith("Cooperative") ? winner : `${winner} Wins!`;

            const p1Score = document.getElementById('p1-score');
            const p2Score = document.getElementById('p2-score');
            finalP1Score.textContent = p1Score ? p1Score.textContent : '0';
            finalP2Score.textContent = p2Score ? p2Score.textContent : '0';

            const finalScoresDisplay = document.querySelector('.final-scores');
            if (currentGameId === 'ultimate-tic-tac-toe' || currentGameId === 'pennywise' || (currentGameId === 'dandelions' && currentGameInstance && currentGameInstance.gameMode === 'classic') || (currentGameId === 'dandelions' && currentGameInstance && currentGameInstance.gameMode === '6x6')) {
                finalScoresDisplay.classList.add('hidden');
            } else {
                finalScoresDisplay.classList.remove('hidden');
            }

            gameOverOverlay.classList.remove('hidden');

            // Show controls again after game ends
            gameControls.classList.remove('hidden');
            boardContainer.classList.add('locked');
            modesBox.classList.remove('locked');
        }, 600);
    };

    // --- Menu Logic ---
    function setRoleSelectionDisabled(disabled) {
        if (disabled) {
            roleSelection.classList.add('disabled');
            roleInputs.forEach(input => input.disabled = true);
        } else {
            roleSelection.classList.remove('disabled');
            roleInputs.forEach(input => input.disabled = false);
        }
    }

    function updateRoleLabels(gameId, selectedMode = 'classic') {
        if (gameId === 'ultimate-tic-tac-toe') {
            role1Label.textContent = 'Play as X (First)';
            role2Label.textContent = 'Play as O (Second)';
        } else if (gameId === 'dandelions') {
            if (selectedMode === 'rival') {
                role1Label.textContent = 'Play as Green (P1)';
                role2Label.textContent = 'Play as Blue (P2)';
            } else if (selectedMode === 'collaborative') {
                role1Label.textContent = 'Play as Dandelion (First)';
                role2Label.textContent = 'Play as Wind (Second)';
            } else {
                role1Label.textContent = 'Play as Dandelion (First)';
                role2Label.textContent = 'Play as Wind (Second)';
            }
        } else {
            role1Label.textContent = 'Go First (P1)';
            role2Label.textContent = 'Go Second (P2)';
        }
    }

    function updateInstructions(gameId, selectedMode = 'classic') {
        instructionsList.innerHTML = '';
        let instructions = [];
        if (gameId === 'dandelions' && selectedMode === 'rival') {
            instructions = [
                'Players are Green and Blue, competing to cover the board.',
                'Each round, one player plants, then the other (alternating who starts).',
                'After both have planted, the wind automatically blows in a random direction (can repeat).',
                'Seeds blow along the wind path until blocked by any occupied cell.',
                'Once a square is filled, it cannot be filled again.',
                'The game ends when the board is full. Whoever has more covered cells in their color wins!'
            ];
        } else if (gameId === 'dandelions' && selectedMode === 'collaborative') {
            instructions = [
                'Dandelion and Wind work together to cover all 64 cells on the 8x8 grid.',
                'Dandelion plants a flower, then Wind chooses a direction from the compass to blow.',
                'The goal is to reach a perfect 64/64 coverage within 8 gusts of wind.',
                'The AI will help you make the best cooperative choices for whichever role it plays.'
            ];
        } else if (gameId === 'sequencium' && selectedMode === 'balanced') {
            instructions = [
                'Balanced turn sequence: Player 1 takes 1 turn, then each player takes 2 turns.',
                'Played on a standard 6x6 grid.',
                'The game ends when the board is filled, with Player 2 getting one final move.',
                'Each new number must be adjacent to one you already own and increase by 1.',
                'The goal is to reach a higher maximum number than your opponent!'
            ];
        } else if (gameId === 'sequencium' && selectedMode === '7x7') {
            instructions = [
                'Balanced turn sequence: Player 1 takes 1 turn, then each player takes 2 turns.',
                'Played on a 7x7 grid with a blacked-out, unselectable middle cell.',
                'The game ends when the board is filled, with Player 2 getting one final move.',
                'Each new number must be adjacent to one you already own and increase by 1.',
                'The goal is to reach a higher maximum number than your opponent!'
            ];
        } else if (gameId === 'prophecies' && selectedMode === 'x-prophecies') {
            instructions = [
                'Rules are similar to classic, but numbers are predictions of "X" counts.',
                'Each number you write is a prophecy of how many "X"s will be in that row and column.',
                'A correct prophecy scores that many points — and can score twice!',
                'No number can appear twice in the same row or column. Impossible cells are auto-filled with X.'
            ];
        } else {
            instructions = gameInstructions[gameId] || ['No instructions available yet.'];
        }

        instructions.forEach(text => {
            const li = document.createElement('li');
            li.textContent = text;
            instructionsList.appendChild(li);
        });
    }

    playerInputs.forEach(input => {
        input.addEventListener('change', () => {
            setRoleSelectionDisabled(input.value !== '1');
        });
    });

    cards.forEach(card => {
        card.addEventListener('click', () => {
            const gameId = card.getAttribute('data-game');
            showOptionsModal(gameId);
        });

        // Animation on cards
        card.addEventListener('mouseenter', () => {
            const randomRot = (Math.random() * 4 - 2).toFixed(2);
            card.style.transform = `translate(-4px, -4px) rotate(${randomRot}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });

    backButton.addEventListener('click', () => {
        menuScreen.classList.remove('hidden');
        gameScreen.classList.add('hidden');
        currentGameInstance = null;
    });

    startBtn.addEventListener('click', () => {
        let playerCount = 2;
        playerInputs.forEach(input => {
            if (input.checked) playerCount = parseInt(input.value);
        });

        let playerRole = 1;
        roleInputs.forEach(input => {
            if (input.checked) playerRole = parseInt(input.value);
        });

        let gameMode = 'classic';
        const gameModeInputs = document.getElementsByName('game-mode');
        gameModeInputs.forEach(input => {
            if (input.checked) gameMode = input.value;
        });

        startGame(playerCount, gameMode, playerRole);
    });



    viewBoardBtn.addEventListener('click', () => {
        gameOverOverlay.classList.toggle('board-view-active');
        viewBoardBtn.classList.toggle('active');
    });

    playSameBtn.addEventListener('click', () => {
        gameOverOverlay.classList.remove('board-view-active');
        viewBoardBtn.classList.remove('active');
        gameOverOverlay.classList.add('hidden');

        let playerCount = 2;
        playerInputs.forEach(input => {
            if (input.checked) playerCount = parseInt(input.value);
        });

        let playerRole = 1;
        roleInputs.forEach(input => {
            if (input.checked) playerRole = parseInt(input.value);
        });

        let gameMode = 'classic';
        const gameModeInputs = document.getElementsByName('game-mode');
        gameModeInputs.forEach(input => {
            if (input.checked) gameMode = input.value;
        });

        startGame(playerCount, gameMode, playerRole);
    });

    playDiffBtn.addEventListener('click', () => {
        gameOverOverlay.classList.remove('board-view-active');
        viewBoardBtn.classList.remove('active');
        gameOverOverlay.classList.add('hidden');
        gameControls.classList.remove('hidden');
        boardContainer.classList.add('locked');

        // Reset settings to default: 1 Player, classic, role 1
        const pCountInputs = document.getElementsByName('player-count');
        pCountInputs.forEach(input => {
            input.checked = (input.value === '1');
        });

        const pRoleInputs = document.getElementsByName('player-role');
        pRoleInputs.forEach(input => {
            input.checked = (input.value === '1');
        });

        setRoleSelectionDisabled(false);

        // Reset game mode selections cache and radios
        if (gameModesInfo[currentGameId]) {
            gameModesInfo[currentGameId].forEach((mode, idx) => {
                mode.checked = (idx === 0);
            });
        }

        const gModeInputs = document.getElementsByName('game-mode');
        gModeInputs.forEach((input, idx) => {
            input.checked = (idx === 0);
        });

        // Update labels and rules
        updateRoleLabels(currentGameId, 'classic');
        updateInstructions(currentGameId, 'classic');

        // Clear and reset the board structure
        initGameBoard(1, 'classic', 1);
    });

    modalMenuBtn.addEventListener('click', () => {
        gameOverOverlay.classList.remove('board-view-active');
        viewBoardBtn.classList.remove('active');
        gameOverOverlay.classList.add('hidden');
        menuScreen.classList.remove('hidden');
        gameScreen.classList.add('hidden');
        currentGameInstance = null;
    });

    // Info Modal Logic
    infoBtn.addEventListener('click', () => {
        instructionsModal.classList.remove('hidden');
    });

    closeInstructionsBtn.addEventListener('click', () => {
        instructionsModal.classList.add('hidden');
    });

    instructionsModal.addEventListener('click', (e) => {
        if (e.target === instructionsModal) {
            instructionsModal.classList.add('hidden');
        }
    });

    function showOptionsModal(id) {
        currentGameId = id;
        gameTitle.textContent = id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

        menuScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        gameControls.classList.remove('hidden');
        boardContainer.classList.remove('hidden');
        boardContainer.classList.add('locked');
        modesBox.classList.remove('locked');
        gameInfo.classList.remove('hidden');

        const scoreBoard = document.getElementById('score-board');
        if (id === 'ultimate-tic-tac-toe' || id === 'dandelions') {
            scoreBoard.classList.add('hidden');
        } else {
            scoreBoard.classList.remove('hidden');
        }

        const modesList = document.getElementById('modes-list');
        if (gameModesInfo[id]) {
            modesSidebar.classList.remove('hidden');
            document.getElementById('game-play-area').classList.remove('centered-layout');

            modesList.innerHTML = '';
            gameModesInfo[id].forEach(mode => {
                const checkedAttr = mode.checked ? 'checked' : '';
                let customHtml = '';

                if (id === 'prophecies' && mode.value === 'custom') {
                    customHtml = `
                        <div id="prophecies-grid-controls" class="prophecies-grid-controls disabled">
                            <h5 class="hand-drawn">Grid Size</h5>
                            <div class="grid-size-row">
                                <label>Rows:
                                    <select id="prophecy-rows" disabled>
                                        <option value="4" selected>4</option>
                                        <option value="5">5</option>
                                        <option value="6">6</option>
                                        <option value="7">7</option>
                                        <option value="8">8</option>
                                    </select>
                                </label>
                                <label>Cols:
                                    <select id="prophecy-cols" disabled>
                                        <option value="4">4</option>
                                        <option value="5" selected>5</option>
                                        <option value="6">6</option>
                                        <option value="7">7</option>
                                        <option value="8">8</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                    `;
                } else if (id === 'pennywise' && mode.value === 'multiplayer') {
                    customHtml = `
                        <div id="pennywise-player-controls" class="pennywise-player-controls">
                            <h5 class="hand-drawn">Number of Players</h5>
                            <select id="pennywise-players">
                                <option value="3">3 Players</option>
                                <option value="4">4 Players</option>
                                <option value="5">5 Players</option>
                                <option value="6">6 Players</option>
                            </select>
                        </div>
                    `;
                }

                modesList.innerHTML += `
                    <div class="mode-item ${customHtml ? 'has-custom-controls' : ''}">
                        <div class="mode-item-main">
                            <label class="mode-option">
                                <input type="radio" name="game-mode" value="${mode.value}" ${checkedAttr}>
                                <span class="custom-radio"></span>
                                ${mode.label}
                            </label>
                            <span class="mode-info" title="${mode.info}">i</span>
                        </div>
                        ${customHtml}
                    </div>
                `;
            });

            // Add change listener to update dynamically
            const modeInputs = document.getElementsByName('game-mode');
            modeInputs.forEach(input => {
                input.addEventListener('change', () => {
                    updateRoleLabels(id, input.value);
                    updateInstructions(id, input.value);

                    // Toggle custom grid controls for prophecies
                    if (id === 'prophecies') {
                        const gridCtrl = document.getElementById('prophecies-grid-controls');
                        const rowSelect = document.getElementById('prophecy-rows');
                        const colSelect = document.getElementById('prophecy-cols');
                        if (input.value === 'custom') {
                            gridCtrl.classList.remove('disabled');
                            rowSelect.disabled = false;
                            colSelect.disabled = false;
                        } else {
                            gridCtrl.classList.add('disabled');
                            rowSelect.disabled = true;
                            colSelect.disabled = true;
                        }
                    }
                });
            });
        } else {
            modesSidebar.classList.add('hidden');
            document.getElementById('game-play-area').classList.add('centered-layout');
            modesList.innerHTML = '';
        }

        // Add Other-wise starting sets for Pennywise
        if (id === 'pennywise') {
            const existingOther = document.querySelector('.otherwise-box');
            if (existingOther) existingOther.remove();

            const otherwiseBox = document.createElement('div');
            otherwiseBox.className = 'otherwise-box';

            const stashOptions = [
                { id: 'classic', label: 'Classic' },
                { id: 'coprimes', label: 'Coprimes' },
                { id: 'darlene', label: 'Darlene' },
                { id: 'nodimes', label: 'No Dimes' },
                { id: 'sugar', label: 'Sugar' },
                { id: 'taylor', label: 'Taylor' },
                { id: 'djibouti', label: 'Djibouti' },
                { id: 'chile', label: 'Chile' },
                { id: 'buthan', label: 'Buthan' },
                { id: 'azerbaijan', label: 'Azerbaijan' },
                { id: 'madagascar', label: 'Madagascar' }
            ];

            let stashHtml = '';
            stashOptions.forEach(opt => {
                stashHtml += `
                    <label class="otherwise-item selectable">
                        <input type="radio" name="penny-set" value="${opt.id}" ${opt.id === 'classic' ? 'checked' : ''}>
                        <span>${opt.label}</span>
                    </label>
                `;
            });

            otherwiseBox.innerHTML = `
                <h4 class="hand-drawn">Other-wise</h4>
                <div class="otherwise-list">
                    ${stashHtml}
                </div>
            `;
            modesBox.appendChild(otherwiseBox);
        } else {
            const existingOther = document.querySelector('.otherwise-box');
            if (existingOther) existingOther.remove();
        }

        // Get initially selected mode
        let initialMode = 'classic';
        const initialCheckedMode = Array.from(document.getElementsByName('game-mode')).find(r => r.checked);
        if (initialCheckedMode) {
            initialMode = initialCheckedMode.value;
        }

        // Populate initial instructions and role labels
        updateRoleLabels(id, initialMode);
        updateInstructions(id, initialMode);

        // Setup role UI state based on selected game and player count
        let count = 2;
        playerInputs.forEach(input => {
            if (input.checked) count = parseInt(input.value);
        });
        setRoleSelectionDisabled(count !== 1);

        // Pre-initialize the game board (uninteractable)
        initGameBoard(2, initialMode, 1);
    }

    function startGame(playerCount, gameMode = 'classic', playerRole = 1) {
        gameControls.classList.add('hidden');
        boardContainer.classList.remove('locked');
        modesBox.classList.add('locked');

        initGameBoard(playerCount, gameMode, playerRole);
    }

    function initGameBoard(playerCount, gameMode = 'classic', playerRole = 1) {
        const id = currentGameId;
        boardContainer.innerHTML = '';

        // Show/hide score board based on game and mode, and update labels dynamically
        const scoreBoard = document.getElementById('score-board');
        if (id === 'ultimate-tic-tac-toe' || id === 'pennywise' || (id === 'dandelions' && gameMode !== 'rival' && gameMode !== 'collaborative')) {
            scoreBoard.classList.add('hidden');
        } else {
            scoreBoard.classList.remove('hidden');
            if (id === 'dandelions' && gameMode === 'rival') {
                p1Container.innerHTML = `Green: <span id="p1-score">0</span>`;
                p2Container.innerHTML = `Blue: <span id="p2-score">0</span>`;
            } else if (id === 'dandelions' && gameMode === 'collaborative') {
                p1Container.innerHTML = `Covered: <span id="p1-score">0</span> / 64`;
                p2Container.innerHTML = `Gusts: <span id="p2-score">0</span> / 8`;
            } else {
                p1Container.innerHTML = `Player 1: <span id="p1-score">0</span>`;
                p2Container.innerHTML = `Player 2: <span id="p2-score">0</span>`;
            }
        }

        switch (id) {
            case 'dots-and-boxes':
                currentGameInstance = new DotsAndBoxes(boardContainer, updateScores, updateTurn, gameOver);
                currentGameInstance.playerCount = playerCount;
                currentGameInstance.humanRole = playerRole;
                currentGameInstance.gameMode = gameMode;
                currentGameInstance.init();
                break;
            case 'ultimate-tic-tac-toe':
                currentGameInstance = new UltimateTicTacToe(boardContainer, updateScores, updateTurn, gameOver);
                currentGameInstance.playerCount = playerCount;
                currentGameInstance.humanRole = playerRole;
                currentGameInstance.init();
                break;
            case 'dandelions':
                currentGameInstance = new Dandelions(boardContainer, updateScores, updateTurn, gameOver);
                currentGameInstance.playerCount = playerCount;
                currentGameInstance.humanRole = playerRole;
                currentGameInstance.gameMode = gameMode;
                currentGameInstance.init();
                break;
            case 'sequencium':
                currentGameInstance = new Sequencium(boardContainer, updateScores, updateTurn, gameOver);
                currentGameInstance.playerCount = playerCount;
                currentGameInstance.humanRole = playerRole;
                currentGameInstance.gameMode = gameMode;
                currentGameInstance.init();
                break;
            case 'prophecies':
                currentGameInstance = new Prophecies(boardContainer, updateScores, updateTurn, gameOver);
                currentGameInstance.playerCount = playerCount;
                currentGameInstance.humanRole = playerRole;
                currentGameInstance.gameMode = gameMode;
                if (gameMode === 'custom') {
                    const rowSel = document.getElementById('prophecy-rows');
                    const colSel = document.getElementById('prophecy-cols');
                    currentGameInstance.customRows = rowSel ? parseInt(rowSel.value) : 4;
                    currentGameInstance.customCols = colSel ? parseInt(colSel.value) : 5;
                }
                currentGameInstance.init();
                break;
            case 'pennywise':
                currentGameInstance = new Pennywise(boardContainer, updateScores, updateTurn, gameOver);
                if (gameMode === 'multiplayer') {
                    const playersSel = document.getElementById('pennywise-players');
                    currentGameInstance.playerCount = playersSel ? parseInt(playersSel.value) : 3;
                } else {
                    // For classic mode, playerCount is 1 (vs AI) or 2 (Local)
                    // But Pennywise always needs 2 wallets on screen.
                    currentGameInstance.playerCount = Math.max(2, playerCount);
                }
                currentGameInstance.isVsAI = (playerCount === 1 && gameMode === 'classic');
                currentGameInstance.humanRole = playerRole;
                currentGameInstance.gameMode = gameMode;

                // Get Other-wise stash set
                const stashSel = document.querySelector('input[name="penny-set"]:checked');
                currentGameInstance.stashStyle = stashSel ? stashSel.value : 'classic';

                currentGameInstance.init();
                break;
            default:
                boardContainer.innerHTML = '<p class="hand-drawn">Logic for this game is coming soon!</p>';
                updateScores({ 1: 0, 2: 0 });
                turnIndicator.textContent = 'Coming Soon...';
        }
    }
});
