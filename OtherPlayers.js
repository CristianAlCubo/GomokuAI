// =================================================
// IMPLEMENTACIÓN PROPIA
// =================================================

class FirstNeighbourMovePlayer extends Agent {
  /*
      Agente sencillo que realiza el primer movimiento disponible en una celda vecina a una ficha ya colocada.
    */

  constructor() {
    super();
    this.board = new Board();
    this.symbol = null;
    this.brain = new Brain(this);
  }

  compute(board, move_state, time) {
    var moves = this.board.valid_moves(board);
    var index1, index2, index3;
    var r;

    switch (move_state) {
      case "1":
        index1 = Math.floor(moves.length * Math.random());
        index2 = index1;
        while (index1 == index2) {
          index2 = Math.floor(moves.length * Math.random());
        }
        index3 = index1;
        while (index3 == index1 || index3 == index2) {
          index3 = Math.floor(moves.length * Math.random());
        }
        return [moves[index1], moves[index2], moves[index3]];

      case "2":
        r = Math.random();
        if (r < 0.33333) return "BLACK";
        if (r < 0.66666) {
          index1 = Math.floor(moves.length * Math.random());
          return moves[index1];
        }
        index1 = Math.floor(moves.length * Math.random());
        index2 = index1;
        while (index1 == index2) {
          index2 = Math.floor(moves.length * Math.random());
        }
        return [moves[index1], moves[index2]];

      case "3":
        r = Math.random();
        if (r < 0.5) return "BLACK";
        index1 = Math.floor(moves.length * Math.random());
        return moves[index1];

      default:
        if (this.symbol === null) {
          this.symbol = move_state;
        }

        const depth = 1;
        this.brain.computeStatesTree(board, depth);
        return this.brain.statesTree.children[0].cell;
    }
  }
}

class MinimaxPlayer extends Agent {
  /*
      Agente que implementa el algoritmo minimax para determinar el mejor movimiento a realizar.
    */

  constructor() {
    super();
    this.board = new Board();
    this.symbol = null;
    this.brain = new Brain(this);
  }

  compute(board, move_state, time) {
    var moves = this.board.valid_moves(board);
    var index1, index2, index3;
    var r;

    switch (move_state) {
      case "1":
        index1 = Math.floor(moves.length * Math.random());
        index2 = index1;
        while (index1 == index2) {
          index2 = Math.floor(moves.length * Math.random());
        }
        index3 = index1;
        while (index3 == index1 || index3 == index2) {
          index3 = Math.floor(moves.length * Math.random());
        }
        return [moves[index1], moves[index2], moves[index3]];

      case "2":
        r = Math.random();
        if (r < 0.33333) return "BLACK";
        if (r < 0.66666) {
          index1 = Math.floor(moves.length * Math.random());
          return moves[index1];
        }
        index1 = Math.floor(moves.length * Math.random());
        index2 = index1;
        while (index1 == index2) {
          index2 = Math.floor(moves.length * Math.random());
        }
        return [moves[index1], moves[index2]];

      case "3":
        r = Math.random();
        if (r < 0.5) return "BLACK";
        index1 = Math.floor(moves.length * Math.random());
        return moves[index1];

      default:
        if (this.symbol === null) {
          this.symbol = move_state;
        }

        const depth = 1;
        this.brain.computeStatesTree(board, depth);
        const bestScore = this.brain.minimax(
          this.brain.statesTree,
          depth,
          -Infinity,
          Infinity,
          true
        );

        for (const child of this.brain.statesTree.children) {
          if (child.score === bestScore) {
            return child.cell;
          }
        }

        return this.brain.statesTree.children[0].cell;
    }
  }
}

class Node {
  constructor(board, type, root = null, symbol = null, cell = null) {
    this.type = type; // Tipo de nodo: MAX o MIN
    this.board = board; // Arreglo representando el estado del tablero en este nodo
    this.root = root;
    this.symbol = symbol; // Símbolo del jugador que movió en este nodo
    this.cell = cell; // Coordenadas (x,y) de la celda en la que se realizó la jugada

    this.score = 0;
    this.children = [];
  }
}

class Brain {
  constructor(player) {
    this.player = player;

    this.statesTree = null;
    this.boardEvaluator = new BoardEvaluator();
  }

  scoreBoard(board) {
    this.boardEvaluator.loadBoard(board);
    return this.boardEvaluator.evaluate(this.player.symbol);
  }

  computeStatesTree(board, depth, root = null, symbol = null) {
    if (depth === 0) {
      return;
    }

    root = root || new Node(board, "MAX", null, symbol);
    symbol = symbol || this.player.symbol;

    const celdasVecinas = this.getCeldasVecinas(board);
    for (const celda of celdasVecinas) {
      const row = celda[0];
      const col = celda[1];

      let boardCopy = board.slice(); // Copia del tablero
      boardCopy[row][col] = symbol;

      let newChild = new Node(boardCopy, depth % 2 == 0 ? "MAX" : "MIN", root, symbol, [row, col]);
      root.children.push(newChild);

      this.computeStatesTree(boardCopy, depth - 1, newChild, symbol === "B" ? "W" : "B");
    }

    this.statesTree = root;
  }

  minimax(root, depth, alpha, beta, maximizingPlayer) {
    if (depth === 0) {
      return this.scoreBoard(root.board);
    }

    if (maximizingPlayer) {
      let maxScore = -Infinity;
      for (const child of root.children) {
        let score = this.minimax(child, depth - 1, alpha, beta, false);
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, score);

        child.score = maxScore;

        if (beta <= alpha) {
          break;
        }
      }
      return maxScore;
    } else {
      let minScore = Infinity;
      for (const child of root.children) {
        let score = this.minimax(child, depth - 1, alpha, beta, true);
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, score);

        child.score = minScore;

        if (beta <= alpha) {
          break;
        }
      }
      return minScore;
    }
  }

  getCeldasVecinas(board) {
    const filas = board.length;
    const columnas = board[0].length;

    // Guarda las posiciones que son vecinas a cada una de las fichas en el juego
    const celdasVecinas = [];

    // Direcciones vecinas: horizontal, vertical y diagonal
    const direcciones = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    for (let i = 0; i < filas; i++) {
      for (let j = 0; j < columnas; j++) {
        // Si encontramos una ficha
        if (board[i][j] == "B" || board[i][j] == "W") {
          // Revisar las celdas vecinas
          for (const [dx, dy] of direcciones) {
            const ni = i + dx;
            const nj = j + dy;

            // Verificar si la vecina está dentro del tablero y está vacía
            if (ni >= 0 && ni < filas && nj >= 0 && nj < columnas && board[ni][nj] == " ") {
              // Marcar la celda como parte del contorno
              celdasVecinas.push([nj, ni]); // "j" representa la columna e "i" la fila. (j = x, i = y)
            }
          }
        }
      }
    }

    return celdasVecinas;
  }
}

class BoardEvaluator {
  constructor() {
    this.board = null;
    this.size = 0;
  }

  loadBoard(board) {
    this.board = board;
    this.size = board.length;
  }

  evaluate(color) {
    /**
     * Evalúa el tablero para el color dado.
     */
    let totalScore = 0;

    for (let x = 0; x < this.size; x++) {
      for (let y = 0; y < this.size; y++) {
        if (this.board[x][y] === color || this.board[x][y] === " ") {
          // Evaluar las 4 direcciones posibles desde la celda actual
          totalScore += this._scoreLine(x, y, 0, 1, color); // Horizontal
          totalScore += this._scoreLine(x, y, 1, 0, color); // Vertical
          totalScore += this._scoreLine(x, y, 1, 1, color); // Diagonal principal
          totalScore += this._scoreLine(x, y, 1, -1, color); // Diagonal inversa
        }
      }
    }

    return totalScore;
  }

  _scoreLine(x, y, dx, dy, color) {
    /**
     * Calcula el puntaje de una línea desde una celda inicial (x, y)
     * en la dirección (dx, dy) para el color dado.
     */
    const line = this._extractLine(x, y, dx, dy);
    return this._evaluateLine(line, color);
  }

  _extractLine(x, y, dx, dy) {
    /**
     * Extrae una línea desde (x, y) en la dirección (dx, dy).
     */
    const line = [];
    while (x >= 0 && x < this.size && y >= 0 && y < this.size) {
      line.push(this.board[x][y]);
      x += dx;
      y += dy;
    }
    return line;
  }

  _evaluateLine(line, color) {
    /**
     * Evalúa el puntaje de una línea específica para el color dado.
     */
    let score = 0;
    let consecutive = 0;
    let blockedEnds = 0;

    for (let cell of line) {
      if (cell === color) {
        consecutive++;
      } else if (cell === " ") {
        if (consecutive > 0) {
          score += this._calculateScore(consecutive, blockedEnds);
          consecutive = 0;
          blockedEnds = 0;
        }
      } else {
        // Celda del oponente
        if (consecutive > 0) {
          score += this._calculateScore(consecutive, blockedEnds + 1);
          consecutive = 0;
        }
        blockedEnds = 1;
      }
    }

    // Puntuar si hay piedras al final
    if (consecutive > 0) {
      score += this._calculateScore(consecutive, blockedEnds);
    }

    return score;
  }

  _calculateScore(consecutive, blockedEnds) {
    /**
     * Asigna puntaje basado en piedras consecutivas y bloqueos.
     */
    if (consecutive === 0) return 0;
    if (blockedEnds === 2) return 0; // Línea completamente bloqueada no tiene valor

    const baseScore = { 1: 1, 2: 10, 3: 100, 4: 1000, 5: Infinity };
    return (baseScore[consecutive] || 0) / (blockedEnds + 1);
  }
}
