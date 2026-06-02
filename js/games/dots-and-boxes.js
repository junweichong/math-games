// ====== AI CLASSES ======
class SquareAI {
    static makeMove(game, mode) {
        let bestMove = null;
        let moves = [];
        
        for (let r = 0; r < game.dotsSize; r++) {
            for (let c = 0; c < game.dotsSize - 1; c++) {
                if (mode.lines.horizontal[r][c] === 0) moves.push({ type: 'h', r, c });
            }
        }
        for (let r = 0; r < game.dotsSize - 1; r++) {
            for (let c = 0; c < game.dotsSize; c++) {
                if (mode.lines.vertical[r][c] === 0) moves.push({ type: 'v', r, c });
            }
        }

        if (moves.length === 0) return;

        for (let move of moves) {
            if (mode.wouldCompleteBox(move.type, move.r, move.c)) {
                bestMove = move;
                break;
            }
        }

        if (!bestMove) {
            let safeMoves = moves.filter(move => !mode.givesOpponentBox(move.type, move.r, move.c));
            if (safeMoves.length > 0) {
                bestMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
            } else {
                bestMove = moves[Math.floor(Math.random() * moves.length)];
            }
        }

        let selector = '';
        if (bestMove.type === 'h') selector = `.line.horizontal[data-row="${bestMove.r}"][data-col="${bestMove.c}"]`;
        else if (bestMove.type === 'v') selector = `.line.vertical[data-row="${bestMove.r}"][data-col="${bestMove.c}"]`;
        
        const element = game.container.querySelector(selector);
        if (element) {
            mode.makeMove(bestMove.type, bestMove.r, bestMove.c, element);
        }
    }
}

class NazarenoAI {
    static makeMove(game, mode) {
        let possibleLines = [];

        for (let r1 = 0; r1 < game.dotsSize; r1++) {
            for (let c1 = 0; c1 < game.dotsSize; c1++) {
                // Try horizontal lines
                for (let c2 = c1 + 1; c2 < game.dotsSize; c2++) {
                    if (mode.isValidNazarenoMove(r1, c1, r1, c2)) {
                        possibleLines.push({ r1, c1, r2: r1, c2 });
                    } else break;
                }
                // Try vertical lines
                for (let r2 = r1 + 1; r2 < game.dotsSize; r2++) {
                    if (mode.isValidNazarenoMove(r1, c1, r2, c1)) {
                        possibleLines.push({ r1, c1, r2, c2: c1 });
                    } else break;
                }
            }
        }

        if (possibleLines.length === 0) return;

        possibleLines.sort((a, b) => {
            const boxesA = mode.countBoxesForLine(a.r1, a.c1, a.r2, a.c2);
            const boxesB = mode.countBoxesForLine(b.r1, b.c1, b.r2, b.c2);
            if (boxesA !== boxesB) return boxesB - boxesA;
            const lenA = Math.abs(a.r1 - a.r2) + Math.abs(a.c1 - a.c2);
            const lenB = Math.abs(b.r1 - b.r2) + Math.abs(b.c1 - b.c2);
            return lenB - lenA;
        });

        const topMove = possibleLines[0];
        mode.processNazarenoMove(topMove.r1, topMove.c1, topMove.r2, topMove.c2);
    }
}

class TriangleAI {
    static makeMove(game, mode) {
        const possibleKeys = [];
        const elementsMap = new Map();
        const allLines = game.container.querySelectorAll('.svg-line:not(.taken)');
        allLines.forEach(el => {
            possibleKeys.push(el.dataset.key);
            elementsMap.set(el.dataset.key, el);
        });

        if (possibleKeys.length === 0) return;

        const has = (map, r1, c1, r2, c2) => {
            const k = (r1 < r2 || (r1 === r2 && c1 < c2)) ? `${r1},${c1}-${r2},${c2}` : `${r2},${c2}-${r1},${c1}`;
            return map.has(k);
        };

        const countEdges = (map, edges) => edges.filter(e => has(map, e[0], e[1], e[2], e[3])).length;

        // 1. Can we complete a triangle?
        for (let key of possibleKeys) {
            const simMap = new Map(mode.triLines);
            simMap.set(key, 2);
            for (let tri of mode.allTriangles) {
                if (countEdges(simMap, tri.edges) === 3 && countEdges(mode.triLines, tri.edges) === 2) {
                    mode.makeMove(key, elementsMap.get(key));
                    return;
                }
            }
        }

        // 2. Find a safe move
        let safeKeys = [];
        for (let key of possibleKeys) {
            const simMap = new Map(mode.triLines);
            simMap.set(key, 2);
            let isSafe = true;
            for (let tri of mode.allTriangles) {
                if (countEdges(simMap, tri.edges) === 2) {
                    isSafe = false;
                    break;
                }
            }
            if (isSafe) safeKeys.push(key);
        }

        const chosenKey = safeKeys.length > 0 ? safeKeys[Math.floor(Math.random() * safeKeys.length)] : possibleKeys[Math.floor(Math.random() * possibleKeys.length)];
        mode.makeMove(chosenKey, elementsMap.get(chosenKey));
    }
}

// ====== MODE CLASSES ======
class SquareMode {
    constructor(game) {
        this.game = game;
        this.lines = { horizontal: [], vertical: [] };
    }

    render() {
        const size = this.game.dotsSize;
        const grid = document.createElement('div');
        grid.className = 'dots-grid square';
        
        let gridTemplate = "";
        for(let i=0; i<size; i++) {
            gridTemplate += "12px ";
            if (i < size - 1) gridTemplate += "80px ";
        }
        grid.style.gridTemplateColumns = gridTemplate;
        grid.style.gridTemplateRows = gridTemplate;

        this.lines.horizontal = Array(size).fill().map(() => Array(size - 1).fill(0));
        this.lines.vertical = Array(size - 1).fill().map(() => Array(size).fill(0));

        for (let r = 0; r < size * 2 - 1; r++) {
            for (let c = 0; c < size * 2 - 1; c++) {
                const el = document.createElement('div');
                
                if (r % 2 === 0 && c % 2 === 0) {
                    el.className = 'dot';
                } else if (r % 2 === 0 && c % 2 !== 0) {
                    const row = r / 2;
                    const col = (c - 1) / 2;
                    el.className = 'line horizontal';
                    el.dataset.row = row;
                    el.dataset.col = col;
                    el.addEventListener('click', () => this.handleLineClick('h', row, col, el));
                } else if (r % 2 !== 0 && c % 2 === 0) {
                    const row = (r - 1) / 2;
                    const col = c / 2;
                    el.className = 'line vertical';
                    el.dataset.row = row;
                    el.dataset.col = col;
                    el.addEventListener('click', () => this.handleLineClick('v', row, col, el));
                } else {
                    const row = (r - 1) / 2;
                    const col = (c - 1) / 2;
                    el.className = 'box';
                    el.id = `box-${row}-${col}`;
                }
                grid.appendChild(el);
            }
        }
        this.game.container.appendChild(grid);
    }

    handleLineClick(type, r, col, element) {
        if (this.game.isGameOver || element.classList.contains('taken')) return;
        if (this.game.playerCount === 1 && this.game.currentPlayer !== this.game.humanRole) return;
        this.makeMove(type, r, col, element);
    }

    makeMove(type, r, col, element) {
        element.classList.add('taken', `p${this.game.currentPlayer}`);
        if (type === 'h') this.lines.horizontal[r][col] = this.game.currentPlayer;
        else if (type === 'v') this.lines.vertical[r][col] = this.game.currentPlayer;

        const boxesCompleted = this.checkBoxes(type, r, col);
        
        if (boxesCompleted.length > 0) {
            boxesCompleted.forEach(boxCoord => {
                const id = `box-${boxCoord.r}-${boxCoord.c}`;
                const boxEl = document.getElementById(id);
                if (boxEl) {
                    boxEl.textContent = this.game.currentPlayer === 1 ? 'A' : 'B';
                    boxEl.classList.add(`p${this.game.currentPlayer}`);
                }
                this.game.scores[this.game.currentPlayer]++;
            });
            
            this.game.onScoreUpdate(this.game.scores);
            
            if (!this.game.checkGameOver()) {
                if (this.game.playerCount === 1 && this.game.currentPlayer !== this.game.humanRole) {
                    setTimeout(() => SquareAI.makeMove(this.game, this), 600);
                }
            }
        } else {
            this.game.switchTurn();
            if (!this.game.isGameOver && this.game.playerCount === 1 && this.game.currentPlayer !== this.game.humanRole) {
                setTimeout(() => SquareAI.makeMove(this.game, this), 600);
            }
        }
    }

    checkBoxes(type, r, col) {
        let completed = [];
        const size = this.game.dotsSize;
        if (type === 'h') {
            if (r > 0) {
                if (this.lines.horizontal[r-1][col] && this.lines.vertical[r-1][col] && this.lines.vertical[r-1][col+1]) {
                    completed.push({r: r-1, c: col});
                }
            }
            if (r < size - 1) {
                if (this.lines.horizontal[r+1][col] && this.lines.vertical[r][col] && this.lines.vertical[r][col+1]) {
                    completed.push({r: r, c: col});
                }
            }
        } else {
            if (col > 0) {
                if (this.lines.vertical[r][col-1] && this.lines.horizontal[r][col-1] && this.lines.horizontal[r+1][col-1]) {
                    completed.push({r: r, c: col-1});
                }
            }
            if (col < size - 1) {
                if (this.lines.vertical[r][col+1] && this.lines.horizontal[r][col] && this.lines.horizontal[r+1][col]) {
                    completed.push({r: r, c: col});
                }
            }
        }
        return completed;
    }

    wouldCompleteBox(type, r, col) {
        let lineRef = type === 'h' ? this.lines.horizontal : this.lines.vertical;
        lineRef[r][col] = this.game.currentPlayer;
        const completed = this.checkBoxes(type, r, col);
        lineRef[r][col] = 0; 
        return completed.length > 0;
    }

    givesOpponentBox(type, r, col) {
        if (type === 'h') {
            if (r > 0) {
                let count = 0;
                if (this.lines.horizontal[r-1][col]) count++;
                if (this.lines.vertical[r-1][col]) count++;
                if (this.lines.vertical[r-1][col+1]) count++;
                if (count === 2) return true;
            }
            if (r < this.game.dotsSize - 1) {
                let count = 0;
                if (this.lines.horizontal[r+1][col]) count++;
                if (this.lines.vertical[r][col]) count++;
                if (this.lines.vertical[r][col+1]) count++;
                if (count === 2) return true;
            }
        } else {
            if (col > 0) {
                let count = 0;
                if (this.lines.vertical[r][col-1]) count++;
                if (this.lines.horizontal[r][col-1]) count++;
                if (this.lines.horizontal[r+1][col-1]) count++;
                if (count === 2) return true;
            }
            if (col < this.game.dotsSize - 1) {
                let count = 0;
                if (this.lines.vertical[r][col+1]) count++;
                if (this.lines.horizontal[r][col]) count++;
                if (this.lines.horizontal[r+1][col]) count++;
                if (count === 2) return true;
            }
        }
        return false;
    }
}

class TriangleMode {
    constructor(game) {
        this.game = game;
        this.triLines = new Map();
        this.completedTriangles = new Set();
        this.totalTriangles = 0;
        this.allTriangles = []; // UNIFIED TRIANGLE DATA STRUCTURE
    }

    render() {
        const size = this.game.dotsSize;
        const grid = document.createElement('div');
        grid.className = 'dots-grid triangle';
        grid.style.position = 'relative';
        
        const hStep = 80; 
        const vStep = 69.28; 
        const gridWidth = (size - 1) * hStep;
        const gridHeight = (size - 1) * vStep;
        
        grid.style.width = `${gridWidth + 40}px`;
        grid.style.height = `${gridHeight + 40}px`;
        
        const offset = (gridWidth + 40) / 2;

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.style.width = '100%';
        svg.style.height = '100%';
        svg.style.overflow = 'visible';

        const getCenter = (r, c) => {
            const rowWidth = r * hStep;
            const rowStart = offset - (rowWidth / 2);
            return {
                x: rowStart + (c * hStep),
                y: r * vStep + 20
            };
        };

        const getLineKey = (r1, c1, r2, c2) => {
            if (r1 < r2 || (r1 === r2 && c1 < c2)) return `${r1},${c1}-${r2},${c2}`;
            return `${r2},${c2}-${r1},${c1}`;
        };

        // 1. Draw faces (Polygons) first so they are under lines
        for (let r = 0; r < size; r++) {
            for (let c = 0; c <= r; c++) {
                if (r < size - 1) {
                    const p1 = getCenter(r, c);
                    const p2 = getCenter(r + 1, c);
                    const p3 = getCenter(r + 1, c + 1);
                    const id = `face-up-${r}-${c}`;
                    
                    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    poly.setAttribute('points', `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`);
                    poly.classList.add('svg-face');
                    poly.id = id;
                    svg.appendChild(poly);
                    
                    this.allTriangles.push({
                        id: id,
                        edges: [[r, c, r + 1, c], [r, c, r + 1, c + 1], [r + 1, c, r + 1, c + 1]]
                    });
                    this.totalTriangles++;
                }

                if (r < size - 1 && c < r) {
                    const p1 = getCenter(r, c);
                    const p2 = getCenter(r, c + 1);
                    const p3 = getCenter(r + 1, c + 1);
                    const id = `face-down-${r}-${c}`;
                    
                    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                    poly.setAttribute('points', `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`);
                    poly.classList.add('svg-face');
                    poly.id = id;
                    svg.appendChild(poly);
                    
                    this.allTriangles.push({
                        id: id,
                        edges: [[r, c, r, c + 1], [r, c, r + 1, c + 1], [r, c + 1, r + 1, c + 1]]
                    });
                    this.totalTriangles++;
                }
            }
        }

        // 2. Draw lines
        const createLine = (r1, c1, r2, c2) => {
            const p1 = getCenter(r1, c1);
            const p2 = getCenter(r2, c2);
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', p1.x);
            line.setAttribute('y1', p1.y);
            line.setAttribute('x2', p2.x);
            line.setAttribute('y2', p2.y);
            line.classList.add('svg-line');
            line.dataset.key = getLineKey(r1, c1, r2, c2);
            line.addEventListener('click', () => this.handleLineClick(line));
            svg.appendChild(line);
        };

        for (let r = 0; r < size; r++) {
            for (let c = 0; c <= r; c++) {
                if (c < r) createLine(r, c, r, c + 1);
                if (r < size - 1) createLine(r, c, r + 1, c);
                if (r < size - 1) createLine(r, c, r + 1, c + 1);
            }
        }

        // 3. Draw dots
        for (let r = 0; r < size; r++) {
            for (let c = 0; c <= r; c++) {
                const pos = getCenter(r, c);
                const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                dot.setAttribute('cx', pos.x);
                dot.setAttribute('cy', pos.y);
                dot.setAttribute('r', '5');
                dot.setAttribute('fill', '#2d3436');
                dot.style.pointerEvents = 'none';
                svg.appendChild(dot);
            }
        }

        grid.appendChild(svg);
        this.game.container.appendChild(grid);
    }

    handleLineClick(element) {
        if (this.game.isGameOver || element.classList.contains('taken')) return;
        if (this.game.playerCount === 1 && this.game.currentPlayer !== this.game.humanRole) return;
        this.makeMove(element.dataset.key, element);
    }

    makeMove(key, element) {
        if (this.triLines.has(key)) return;
        
        this.triLines.set(key, this.game.currentPlayer);
        if (element) {
            element.classList.add('taken', `p${this.game.currentPlayer}`);
        }

        const newlyCompleted = this.checkAllTriangles();

        if (newlyCompleted.length > 0) {
            newlyCompleted.forEach(id => {
                const face = document.getElementById(id);
                if (face) face.classList.add(`p${this.game.currentPlayer}`);
                this.game.scores[this.game.currentPlayer]++;
            });
            
            this.syncVisuals();
            this.game.onScoreUpdate(this.game.scores);
            
            if (!this.game.checkGameOver()) {
                if (this.game.playerCount === 1 && this.game.currentPlayer !== this.game.humanRole) {
                    setTimeout(() => TriangleAI.makeMove(this.game, this), 600);
                }
            }
        } else {
            this.syncVisuals();
            this.game.switchTurn();
            if (!this.game.isGameOver && this.game.playerCount === 1 && this.game.currentPlayer !== this.game.humanRole) {
                setTimeout(() => TriangleAI.makeMove(this.game, this), 600);
            }
        }
    }

    syncVisuals() {
        const allLines = this.game.container.querySelectorAll('.svg-line');
        allLines.forEach(line => {
            const key = line.dataset.key;
            if (this.triLines.has(key)) {
                const player = this.triLines.get(key);
                line.classList.add('taken', `p${player}`);
            }
        });
    }

    checkAllTriangles() {
        const newlyCompleted = [];
        const has = (r1, c1, r2, c2) => {
            const key = (r1 < r2 || (r1 === r2 && c1 < c2)) ? `${r1},${c1}-${r2},${c2}` : `${r2},${c2}-${r1},${c1}`;
            return this.triLines.has(key);
        };

        // Unified validation logic
        for (let tri of this.allTriangles) {
            if (!this.completedTriangles.has(tri.id)) {
                let complete = true;
                for (let edge of tri.edges) {
                    if (!has(edge[0], edge[1], edge[2], edge[3])) {
                        complete = false;
                        break;
                    }
                }
                
                if (complete) {
                    this.completedTriangles.add(tri.id);
                    newlyCompleted.push(tri.id);
                }
            }
        }
        return newlyCompleted;
    }
}

class NazarenoMode {
    constructor(game) {
        this.game = game;
        this.lines = { horizontal: [], vertical: [] };
        this.dragStart = null;
        this.dragPreview = null;
    }

    render() {
        const size = this.game.dotsSize;
        const grid = document.createElement('div');
        grid.className = 'dots-grid square nazareno';
        
        let gridTemplate = "";
        for(let i=0; i<size; i++) {
            gridTemplate += "12px ";
            if (i < size - 1) gridTemplate += "80px ";
        }
        grid.style.gridTemplateColumns = gridTemplate;
        grid.style.gridTemplateRows = gridTemplate;

        this.lines.horizontal = Array(size).fill().map(() => Array(size - 1).fill(0));
        this.lines.vertical = Array(size - 1).fill().map(() => Array(size).fill(0));

        for (let r = 0; r < size * 2 - 1; r++) {
            for (let c = 0; c < size * 2 - 1; c++) {
                const el = document.createElement('div');
                
                if (r % 2 === 0 && c % 2 === 0) {
                    el.className = 'dot';
                    el.dataset.dotRow = r / 2;
                    el.dataset.dotCol = c / 2;
                    el.addEventListener('mousedown', (e) => this.handleDragStart(e, r / 2, c / 2));
                } else if (r % 2 === 0 && c % 2 !== 0) {
                    el.className = 'line horizontal';
                    el.dataset.row = r / 2;
                    el.dataset.col = (c - 1) / 2;
                } else if (r % 2 !== 0 && c % 2 === 0) {
                    el.className = 'line vertical';
                    el.dataset.row = (r - 1) / 2;
                    el.dataset.col = c / 2;
                } else {
                    el.className = 'box';
                    el.id = `box-${(r - 1) / 2}-${(c - 1) / 2}`;
                }
                grid.appendChild(el);
            }
        }
        this.game.container.appendChild(grid);
    }

    handleDragStart(e, r, c) {
        if (this.game.isGameOver || (this.game.playerCount === 1 && this.game.currentPlayer !== this.game.humanRole)) return;
        this.dragStart = { r, c };
        
        const grid = this.game.container.querySelector('.dots-grid');
        this.dragPreview = document.createElement('div');
        this.dragPreview.className = `drag-preview p${this.game.currentPlayer}`;
        grid.appendChild(this.dragPreview);
        
        const moveHandler = (ev) => this.handleDragMove(ev, grid);
        const upHandler = (ev) => {
            window.removeEventListener('mousemove', moveHandler);
            window.removeEventListener('mouseup', upHandler);
            this.handleDragEnd(ev, grid);
        };
        
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', upHandler);
    }

    handleDragMove(e, grid) {
        if (!this.dragStart) return;
        
        const rect = grid.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const totalSpacing = 92; 
        
        const startX = this.dragStart.c * totalSpacing + 6; 
        const startY = this.dragStart.r * totalSpacing + 6;
        
        let targetC = this.dragStart.c;
        let targetR = this.dragStart.r;
        
        const dx = mouseX - startX;
        const dy = mouseY - startY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            // Dragging horizontally
            targetC = Math.round(dx / totalSpacing) + this.dragStart.c;
            targetC = Math.max(0, Math.min(this.game.dotsSize - 1, targetC));
        } else {
            // Dragging vertically
            targetR = Math.round(dy / totalSpacing) + this.dragStart.r;
            targetR = Math.max(0, Math.min(this.game.dotsSize - 1, targetR));
        }

        // Calculate perfect grid coordinates for end point
        const endX = targetC * totalSpacing + 6;
        const endY = targetR * totalSpacing + 6;

        const length = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        const angle = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;

        this.dragPreview.style.width = `${length}px`;
        this.dragPreview.style.transform = `rotate(${angle}deg)`;
        this.dragPreview.style.left = `${startX}px`;
        this.dragPreview.style.top = `${startY}px`;
        
        if (this.isValidNazarenoMove(this.dragStart.r, this.dragStart.c, targetR, targetC)) {
            this.dragPreview.classList.add('valid');
        } else {
            this.dragPreview.classList.remove('valid');
        }
    }

    handleDragEnd(e, grid) {
        if (!this.dragStart) return;
        
        const rect = grid.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const totalSpacing = 92;
        
        const startX = this.dragStart.c * totalSpacing + 6; 
        const startY = this.dragStart.r * totalSpacing + 6;
        
        let targetC = this.dragStart.c;
        let targetR = this.dragStart.r;
        
        const dx = mouseX - startX;
        const dy = mouseY - startY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            targetC = Math.round(dx / totalSpacing) + this.dragStart.c;
            targetC = Math.max(0, Math.min(this.game.dotsSize - 1, targetC));
        } else {
            targetR = Math.round(dy / totalSpacing) + this.dragStart.r;
            targetR = Math.max(0, Math.min(this.game.dotsSize - 1, targetR));
        }

        if (targetR === this.dragStart.r && targetC === this.dragStart.c) {
            this.cleanupDrag();
            return;
        }

        if (this.isValidNazarenoMove(this.dragStart.r, this.dragStart.c, targetR, targetC)) {
            this.processNazarenoMove(this.dragStart.r, this.dragStart.c, targetR, targetC);
        }
        
        this.cleanupDrag();
    }

    cleanupDrag() {
        if (this.dragPreview) {
            this.dragPreview.remove();
            this.dragPreview = null;
        }
        this.dragStart = null;
    }

    isValidNazarenoMove(r1, c1, r2, c2) {
        if (r1 === r2 && c1 === c2) return false;
        if (r1 !== r2 && c1 !== c2) return false; 
        
        if (r1 === r2) {
            const start = Math.min(c1, c2);
            const end = Math.max(c1, c2);
            for (let c = start; c < end; c++) {
                if (this.lines.horizontal[r1][c] !== 0) return false;
            }
        } else {
            const start = Math.min(r1, r2);
            const end = Math.max(r1, r2);
            for (let r = start; r < end; r++) {
                if (this.lines.vertical[r][c1] !== 0) return false;
            }
        }
        return true;
    }

    processNazarenoMove(r1, c1, r2, c2) {
        const segments = [];
        let type = '';
        
        if (r1 === r2) {
            type = 'h';
            const start = Math.min(c1, c2);
            const end = Math.max(c1, c2);
            for (let c = start; c < end; c++) {
                segments.push({ r: r1, col: c });
            }
        } else {
            type = 'v';
            const start = Math.min(r1, r2);
            const end = Math.max(r1, r2);
            for (let r = start; r < end; r++) {
                segments.push({ r, col: c1 });
            }
        }

        if (segments.length === 0) return;

        let totalBoxesCompleted = 0;
        segments.forEach(seg => {
            const grid = this.game.container.querySelector('.dots-grid');
            const el = grid.querySelector(`.line.${type === 'h' ? 'horizontal' : 'vertical'}[data-row="${seg.r}"][data-col="${seg.col}"]`);
            el.classList.add('taken', `p${this.game.currentPlayer}`);
            
            if (type === 'h') this.lines.horizontal[seg.r][seg.col] = this.game.currentPlayer;
            else this.lines.vertical[seg.r][seg.col] = this.game.currentPlayer;

            const boxes = this.checkBoxes(type, seg.r, seg.col);
            if (boxes.length > 0) {
                boxes.forEach(boxCoord => {
                    const id = `box-${boxCoord.r}-${boxCoord.c}`;
                    const boxEl = document.getElementById(id);
                    if (boxEl && !boxEl.classList.contains('p1') && !boxEl.classList.contains('p2')) {
                        boxEl.textContent = this.game.currentPlayer === 1 ? 'A' : 'B';
                        boxEl.classList.add(`p${this.game.currentPlayer}`);
                        this.game.scores[this.game.currentPlayer]++;
                        totalBoxesCompleted++;
                    }
                });
            }
        });

        if (totalBoxesCompleted > 0) {
            this.game.onScoreUpdate(this.game.scores);
        }

        if (!this.game.checkGameOver()) {
            this.game.switchTurn();
            if (this.game.playerCount === 1 && this.game.currentPlayer !== this.game.humanRole) {
                setTimeout(() => NazarenoAI.makeMove(this.game, this), 600);
            }
        }
    }

    countBoxesForLine(r1, c1, r2, c2) {
        let count = 0;
        if (r1 === r2) {
            const start = Math.min(c1, c2);
            const end = Math.max(c1, c2);
            for (let c = start; c < end; c++) {
                this.lines.horizontal[r1][c] = this.game.currentPlayer;
                count += this.checkBoxes('h', r1, c).length;
                this.lines.horizontal[r1][c] = 0;
            }
        } else {
            const start = Math.min(r1, r2);
            const end = Math.max(r1, r2);
            for (let r = start; r < end; r++) {
                this.lines.vertical[r][c1] = this.game.currentPlayer;
                count += this.checkBoxes('v', r, c1).length;
                this.lines.vertical[r][c1] = 0;
            }
        }
        return count;
    }

    checkBoxes(type, r, col) {
        let completed = [];
        const size = this.game.dotsSize;
        if (type === 'h') {
            if (r > 0) {
                if (this.lines.horizontal[r-1][col] && this.lines.vertical[r-1][col] && this.lines.vertical[r-1][col+1]) {
                    completed.push({r: r-1, c: col});
                }
            }
            if (r < size - 1) {
                if (this.lines.horizontal[r+1][col] && this.lines.vertical[r][col] && this.lines.vertical[r][col+1]) {
                    completed.push({r: r, c: col});
                }
            }
        } else {
            if (col > 0) {
                if (this.lines.vertical[r][col-1] && this.lines.horizontal[r][col-1] && this.lines.horizontal[r+1][col-1]) {
                    completed.push({r: r, c: col-1});
                }
            }
            if (col < size - 1) {
                if (this.lines.vertical[r][col+1] && this.lines.horizontal[r][col] && this.lines.horizontal[r+1][col]) {
                    completed.push({r: r, c: col});
                }
            }
        }
        return completed;
    }
}

// ====== MAIN CLASS ======
export class DotsAndBoxes {
    constructor(container, onScoreUpdate, onTurnChange, onGameOver) {
        this.container = container;
        this.onScoreUpdate = onScoreUpdate;
        this.onTurnChange = onTurnChange;
        this.onGameOver = onGameOver;
        
        this.dotsSize = 5;
        this.currentPlayer = 1;
        this.playerCount = 2;
        this.humanRole = 1;
        this.gameMode = 'classic';
        this.scores = { 1: 0, 2: 0 };
        this.isGameOver = false;
        
        this.modeHandler = null;
    }

    init() {
        this.container.innerHTML = '';
        this.currentPlayer = 1;
        this.scores = { 1: 0, 2: 0 };
        this.isGameOver = false;
        
        if (this.gameMode === 'triangles') {
            this.modeHandler = new TriangleMode(this);
        } else if (this.gameMode === 'nazareno') {
            this.modeHandler = new NazarenoMode(this);
        } else {
            this.modeHandler = new SquareMode(this);
        }
        
        this.modeHandler.render();
        this.onTurnChange(this.currentPlayer);
        this.onScoreUpdate(this.scores);
        
        if (this.playerCount === 1 && this.currentPlayer !== this.humanRole) {
            setTimeout(() => {
                if (this.gameMode === 'triangles') TriangleAI.makeMove(this, this.modeHandler);
                else if (this.gameMode === 'nazareno') NazarenoAI.makeMove(this, this.modeHandler);
                else SquareAI.makeMove(this, this.modeHandler);
            }, 600);
        }
    }

    switchTurn() {
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.onTurnChange(this.currentPlayer);
    }

    checkGameOver() {
        let totalItems = 0;
        if (this.gameMode === 'triangles') {
            totalItems = this.modeHandler.totalTriangles;
        } else {
            totalItems = (this.dotsSize - 1) * (this.dotsSize - 1);
        }

        if (this.scores[1] + this.scores[2] === totalItems) {
            this.isGameOver = true;
            const winner = this.scores[1] > this.scores[2] ? 'Player 1' : (this.scores[2] > this.scores[1] ? 'Player 2' : 'It\'s a Tie!');
            this.onGameOver(winner);
            return true;
        }
        return false;
    }
}
