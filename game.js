class Game2048 {
    constructor() {
        this.size = 4;
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.bestScore = localStorage.getItem('bestScore') || 0;
        this.isAnimating = false;
        this.mergedTiles = new Set();
        this.isGameOver = false;
        this.init();
    }

    init() {
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.addNewTile();
        this.addNewTile();
        this.updateView();
    }

    addNewTile() {
        const emptyTiles = [];
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (this.grid[i][j] === 0) {
                    emptyTiles.push({x: i, y: j});
                }
            }
        }
        if (emptyTiles.length > 0) {
            const randomTile = emptyTiles[Math.floor(Math.random() * emptyTiles.length)];
            this.grid[randomTile.x][randomTile.y] = Math.random() < 0.9 ? 2 : 4;
            this.mergedTiles.add(`${randomTile.x}-${randomTile.y}`);
        }
    }

    async move(direction) {
        if (this.isGameOver) return;
        
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        this.mergedTiles.clear();
        const oldGrid = JSON.parse(JSON.stringify(this.grid));
        let moved = false;

        switch(direction) {
            case 'left': moved = this.moveLeft(); break;
            case 'right': moved = this.moveRight(); break;
            case 'up': moved = this.moveUp(); break;
            case 'down': moved = this.moveDown(); break;
        }

        if (moved) {
            await this.animateMove(oldGrid);
            this.addNewTile();
            this.updateView();
            
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                localStorage.setItem('bestScore', this.bestScore);
            }
        }

        this.isAnimating = false;

        if (this.checkGameOver()) {
            setTimeout(() => alert('Game Over!'), 300);
        }
    }

    async animateMove(oldGrid) {
        return new Promise(resolve => {
            const cells = document.querySelectorAll('.cell');
            const cellSize = 125; // 格子大小 + 间距

            // 创建移动前的状态快照
            const oldPositions = new Map();
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (oldGrid[i][j] !== 0) {
                        const value = oldGrid[i][j];
                        oldPositions.set(`${value}-${i}-${j}`, {
                            value,
                            row: i,
                            col: j
                        });
                    }
                }
            }

            // 为新位置的每个数字创建动画
            cells.forEach((cell, index) => {
                if (!cell.textContent) return;

                const newRow = Math.floor(index / 4);
                const newCol = index % 4;
                const value = parseInt(cell.textContent);

                // 查找这个数字的旧位置
                for (const [key, oldPos] of oldPositions) {
                    const [oldValue] = key.split('-');
                    if (parseInt(oldValue) === value) {
                        // 计算移动距离
                        const deltaX = (oldPos.col - newCol) * cellSize;
                        const deltaY = (oldPos.row - newRow) * cellSize;

                        // 立即设置到起始位置
                        cell.style.transition = 'none';
                        cell.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

                        // 强制浏览器重绘
                        cell.offsetHeight;

                        // 启用过渡并移动到目标位置
                        cell.style.transition = 'transform 0.15s ease-in-out';
                        cell.style.transform = 'translate(0, 0)';

                        oldPositions.delete(key);
                        break;
                    }
                }
            });

            // 等待动画完成
            setTimeout(resolve, 150);
        });
    }

    moveLeft() {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            let row = this.grid[i].filter(cell => cell !== 0);
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j + 1, 1);
                    moved = true;
                }
            }
            const newRow = row.concat(Array(this.size - row.length).fill(0));
            if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) {
                moved = true;
            }
            this.grid[i] = newRow;
        }
        return moved;
    }

    moveRight() {
        let moved = false;
        for (let i = 0; i < this.size; i++) {
            let row = this.grid[i].filter(cell => cell !== 0);
            for (let j = row.length - 1; j > 0; j--) {
                if (row[j] === row[j - 1]) {
                    row[j] *= 2;
                    this.score += row[j];
                    row.splice(j - 1, 1);
                    moved = true;
                }
            }
            const newRow = Array(this.size - row.length).fill(0).concat(row);
            if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) {
                moved = true;
            }
            this.grid[i] = newRow;
        }
        return moved;
    }

    moveUp() {
        let moved = false;
        for (let j = 0; j < this.size; j++) {
            let column = [];
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== 0) {
                    column.push(this.grid[i][j]);
                }
            }
            for (let i = 0; i < column.length - 1; i++) {
                if (column[i] === column[i + 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column.splice(i + 1, 1);
                    moved = true;
                }
            }
            const newColumn = column.concat(Array(this.size - column.length).fill(0));
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== newColumn[i]) {
                    moved = true;
                }
                this.grid[i][j] = newColumn[i];
            }
        }
        return moved;
    }

    moveDown() {
        let moved = false;
        for (let j = 0; j < this.size; j++) {
            let column = [];
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== 0) {
                    column.push(this.grid[i][j]);
                }
            }
            for (let i = column.length - 1; i > 0; i--) {
                if (column[i] === column[i - 1]) {
                    column[i] *= 2;
                    this.score += column[i];
                    column.splice(i - 1, 1);
                    moved = true;
                }
            }
            const newColumn = Array(this.size - column.length).fill(0).concat(column);
            for (let i = 0; i < this.size; i++) {
                if (this.grid[i][j] !== newColumn[i]) {
                    moved = true;
                }
                this.grid[i][j] = newColumn[i];
            }
        }
        return moved;
    }

    checkGameOver() {
        if (this.isGameOver) return true;

        let canMove = false;
        
        // 检查是否还有空格子
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (this.grid[i][j] === 0) {
                    return false;
                }
                
                // 检查水平方向是否可以合并
                if (j < 3 && this.grid[i][j] === this.grid[i][j + 1]) {
                    return false;
                }
                
                // 检查垂直方向是否可以合并
                if (i < 3 && this.grid[i][j] === this.grid[i + 1][j]) {
                    return false;
                }
            }
        }

        // 如果到这里，说明游戏确实结束了
        if (!canMove) {
            this.isGameOver = true;
        }

        return true;
    }

    resetGame() {
        this.isGameOver = false;
        this.grid = Array(this.size).fill().map(() => Array(this.size).fill(0));
        this.score = 0;
        this.addNewTile();
        this.addNewTile();
        this.updateView();
    }

    updateView() {
        const gridElement = document.getElementById('grid');
        gridElement.innerHTML = '';
        
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                if (this.grid[i][j] !== 0) {
                    cell.textContent = this.grid[i][j];
                    cell.classList.add(`tile-${this.grid[i][j]}`);
                    
                    // 添加新方块或合并动画
                    if (this.mergedTiles.has(`${i}-${j}`)) {
                        cell.classList.add('tile-new');
                    }
                }
                
                gridElement.appendChild(cell);
            }
        }

        document.getElementById('score').textContent = this.score;
        document.getElementById('best-score').textContent = this.bestScore;
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new Game2048();

    // 键盘事件监听
    document.addEventListener('keydown', (e) => {
        e.preventDefault(); // 防止页面滚动
        switch(e.key) {
            case 'ArrowLeft':
                game.move('left');
                break;
            case 'ArrowRight':
                game.move('right');
                break;
            case 'ArrowUp':
                game.move('up');
                break;
            case 'ArrowDown':
                game.move('down');
                break;
        }
    });

    // 新游戏按钮
    document.getElementById('new-game').addEventListener('click', () => {
        game.resetGame();
    });
}); 