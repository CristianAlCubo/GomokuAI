/*
 * Taller #2 - Agente para Gomoku
 * Nombre del grupo: Melao
 * Integrantes:
 *  - Cristian David Machado Guzman
 *  - Cristian Camilo Cubillos Reyes
 *  - Julio Cesar Bedoya Gutierrez
 *
 */

class MelaoGameClass {
  static board = null;
  static MAX_DEPTH = 2;
  static MAX_LEVEL = 2;
  static playerColor = null;
  static MANY_FEAT_VAL = 1000000;
  static ONE_FEAT_VAL = 1000;
  static RATIO_SCR = true;

  /* private methods */
  static #areIndependentLines(line1, line2) {
    for (const point of line1.freePoints) {
      const [i, j] = point.cell;

      if (line2.freePoints.some((p) => p.cell[0] === i && p.cell[1] === j)) return false;
    }

    return true;
  }

  static #getScore(lines, board) {
    /*
     * The line's score depends on their
     * feature and also their points sets
     * values.
     *
     *
     * A line's feature is the count of
     * how much 'winner parts' pairs have.
     *
     * A line has one winner parts pair when
     * the size (number of points within) of
     * two adjacent parts is greater than or
     * equal to 4, and therefore the opponent
     * is forced to place the next move
     * between those parts (i.e. [X,X,X, ,X]
     * or [X,X, ,X,X].)
     *
     */

    let score = 0;
    let lineOfFive = false;

    for (const line of lines) {
      let lineScore = 0;

      if (MelaoGameClass.sameParts(line.head, line.tail)) {
        const lineSize = this.distanceBetweenCells(line.head.first, line.head.last) + 1;

        if (lineSize >= 5) {
          lineOfFive = true;
          break;
        }

        const lineStartCell = line.start;
        const lineEndCell = line.end;
        const firstPartStartCell = line.head.first;
        const lastPartEndCell = line.tail.last;

        const startsAtFirst = this.sameCells(lineStartCell, firstPartStartCell);
        const endsAtLast = this.sameCells(lineEndCell, lastPartEndCell);

        if (startsAtFirst && endsAtLast) {
          // dead line
          line.type = 0;
        } else if (startsAtFirst || endsAtLast) {
          // hurt line
          line.type = 1;
        } else {
          // healthy line
          line.type = 2;
        }

        switch (line.type) {
          case 2:
            if (lineSize === 4) {
              line.feature += 2;
            } else if (lineSize === 3) {
              line.feature += 1;
            } else {
              // lineScore += 15 * lineSize - 10;
              lineScore += 20;
            }
            break;
          case 1:
            if (lineSize === 4) {
              line.feature += 1;
            } else {
              lineScore += 8 * lineSize - 5;
            }
            break;
          default:
            lineScore += lineSize * lineSize;
            break;
        }
      } else {
        /*
         * find all winner parts pairs.
         * if there is not any single pair then
         * calculate basic score.
         *
         */
        let auxPart = line.head;
        let auxPartSize = this.distanceBetweenCells(auxPart.first, auxPart.last) + 1;

        let acc = 15 * auxPartSize - 10;
        let numParts = 1;
        while (auxPart.prev && !lineOfFive) {
          let prevPartSize = this.distanceBetweenCells(auxPart.prev.first, auxPart.prev.last) + 1;

          if (auxPartSize >= 5) lineOfFive = true;

          if (auxPartSize + prevPartSize >= 4) line.feature += 1;
          acc += 15 * prevPartSize - 10;

          numParts++;
          auxPart = auxPart.prev;
          auxPartSize = this.distanceBetweenCells(auxPart.first, auxPart.last) + 1;
        }

        lineScore += acc * numParts;
      }

      // if we found a part with size of 5
      // then break the for cycle.
      if (lineOfFive) break;

      // if there are many feature, we must
      // set a high score to line
      if (line.feature >= 2)
        //lineScore += line.feature * this.MANY_FEAT_VAL;
        line.feature *= this.MANY_FEAT_VAL;
      else if (line.feature >= 1) line.feature *= this.ONE_FEAT_VAL;
      lineScore += line.feature;

      score += lineScore;
    }

    if (lineOfFive) return Infinity;

    const singleFeatureLines = lines.filter((line) => line.feature === 1);
    if (score < this.MANY_FEAT_VAL && score >= this.ONE_FEAT_VAL && singleFeatureLines.length > 1) {
      for (const line of singleFeatureLines) {
        if (singleFeatureLines.some((l) => this.#areIndependentLines(l, line))) {
          // ARREGLAR / como?
          score += this.MANY_FEAT_VAL;
          break;
        }
      }
    }

    return score;
  }

  /* public methods */
  static getNearActions(action, board, prevActions, level = this.MAX_LEVEL) {
    const nearActions = [];
    const [row, col] = action;

    const minRow = Math.max(0, row - level);
    const minCol = Math.max(0, col - level);
    const maxRow = Math.min(board.length - 1, row + level);
    const maxCol = Math.min(board.length - 1, col + level);

    for (let i = minRow; i <= maxRow; i++) {
      for (let j = minCol; j <= maxCol; j++) {
        if (board[i][j] === " " && !prevActions.some((a) => a[0] == i && a[1] == j))
          nearActions.push([i, j]);
      }
    }
    return nearActions;
  }

  /*
   * This distance is defined as how many
   * cells are needed to go from 'c1' to 'c2',
   * and viceversa. Similar to usual euclidian
   * distance.
   *
   * (Note that this distance only works
   * for cells in the same direction, not
   * any cell in board)
   */
  static distanceBetweenCells(cell1, cell2) {
    const [xStartPoint, yStartPoint] = cell1;
    const [xEndPoint, yEndPoint] = cell2;

    return Math.max(Math.abs(xStartPoint - xEndPoint), Math.abs(yStartPoint - yEndPoint));
  }

  static sameCells(cell1, cell2) {
    return cell1[0] === cell2[0] && cell1[1] === cell2[1];
  }

  static sameParts(part1, part2) {
    return this.sameCells(part1.first, part2.first) && this.sameCells(part1.last, part2.last);
  }

  static generateLines(state, color) {
    /*
     * lines are generated if two points are
     * in the same row, columnd or diagonal and
     * there is maximum one empty space between
     * them.
     *
     * a line expands if the forward cell
     * is not occupied by the opponent.
     *
     */

    const DIRECTIONS_MAP = {
      ">": [0, 1],
      l: [1, 1],
      v: [1, 0],
      "/": [1, -1],
    };

    // This will be the lines set to return.
    const lines = [];
    // This points set stores the player
    // points.
    const points = [];
    // Here we will save all points that
    // have not neighbors.
    const singlePoints = [];
    // With this "hashmap" we can search and
    // update the points to see if they are
    // already in a line in the current
    // direction.
    const pointsHash = {};

    for (let row = 0; row < state.length; row++) {
      for (let col = 0; col < state.length; col++) {
        if (state[row][col] === color) {
          const newPoint = {
            cell: [row, col],
            overLineWithDir: {
              ">": false,
              l: false,
              v: false,
              "/": false,
            },
          };
          points.push(newPoint);

          !pointsHash[row] && (pointsHash[row] = {});
          pointsHash[row][col] = newPoint;
        }
      }
    }

    for (const point of points) {
      const availableDirections = [">", "l", "v", "/"].filter((dir) => !point.overLineWithDir[dir]);

      for (const direction of availableDirections) {
        // This cell saves the position
        // where the line is already
        // extended.
        let cell = point.cell;

        let firstExpan = 0;
        let limitExpan = 2;

        /*
         * The new line is composed of
         * many parts, and each part is composed
         * of continuous points and are separated
         * by empty cells or freepoints.
         *
         */
        let newPart = {
          first: cell,
          last: cell,
        };
        const newLine = {
          start: cell,
          end: cell,
          head: newPart,
          tail: newPart,
          feature: 0,
          freePoints: [],
        };

        // New position to expand
        let newCellX = cell[0] + DIRECTIONS_MAP[direction][0];
        let newCellY = cell[1] + DIRECTIONS_MAP[direction][1];

        let isValidX = newCellX < state.length && newCellX >= 0;
        let isValidY = newCellY < state.length && newCellY >= 0;
        while (
          isValidX &&
          isValidY &&
          (state[newCellX][newCellY] === " " || state[newCellX][newCellY] === color) &&
          firstExpan < limitExpan
        ) {
          if (state[newCellX][newCellY] === " ") {
            firstExpan++;
            newPart = undefined;

            state[cell[0]][cell[1]] === color &&
              newLine.freePoints.push({
                cell: [newCellX, newCellY],
                //prev: cell //not needed for now
              });
          } else if (state[newCellX][newCellY] === color) {
            if (!newPart) {
              newPart = {
                last: [newCellX, newCellY],
                prev: newLine.head,
              };
              newLine.head = newPart;

              /*freePoints[freePoints.length-1].next
				= [newCellX, newCellY]*/
            }

            /* To not repeat points that are
             * already in lines with the same
             * current direction, we need to set
             * they 'over dirs' array values to
             * true.
             */
            // this was the last cell where a point
            // of 'color' was added to line.
            let [prevCellX, prevCellY] = cell;
            if (state[cell[0]][cell[1]] === " ") {
              prevCellX = cell[0] - DIRECTIONS_MAP[direction][0];
              prevCellY = cell[1] - DIRECTIONS_MAP[direction][1];
            }

            const prevPoint = pointsHash[prevCellX][prevCellY];
            prevPoint.overLineWithDir[direction] = true;

            const nextPoint = pointsHash[newCellX][newCellY];
            nextPoint.overLineWithDir[direction] = true;

            // we must reset the expansion counter
            // everytime that another point is
            // added to the line.
            firstExpan = 0;
            newPart.first = [newCellX, newCellY];
          }

          cell = [newCellX, newCellY];

          newCellX = cell[0] + DIRECTIONS_MAP[direction][0];
          newCellY = cell[1] + DIRECTIONS_MAP[direction][1];

          isValidX = newCellX < state.length && newCellX >= 0;
          isValidY = newCellY < state.length && newCellY >= 0;

          newLine.start = cell;
        }

        /*
         * Now we expand the line backwards,
         * so it's the same process but with
         * names changed.
         *
         * [refactor??]
         *
         */
        let lastExpan = 0;
        newPart = newLine.tail;
        cell = newPart.last;

        newCellX = cell[0] - DIRECTIONS_MAP[direction][0];
        newCellY = cell[1] - DIRECTIONS_MAP[direction][1];
        isValidX = newCellX < state.length && newCellX >= 0;
        isValidY = newCellY < state.length && newCellY >= 0;
        while (
          isValidX &&
          isValidY &&
          (state[newCellX][newCellY] === " " || state[newCellX][newCellY] === color) &&
          lastExpan < limitExpan
        ) {
          if (state[newCellX][newCellY] === " ") {
            lastExpan++;
            newPart = undefined;

            state[cell[0]][cell[1]] === color &&
              newLine.freePoints.push({
                cell: [newCellX, newCellY],
              });
          } else if (state[newCellX][newCellY] === color) {
            if (!newPart) {
              newPart = {
                first: [newCellX, newCellY],
              };
              newLine.tail.prev = newPart;
              newLine.tail = newPart;
            }

            // this was the last cell where a point
            // of 'color' was added to line.
            let [prevCellX, prevCellY] = cell;
            if (state[cell[0]][cell[1]] === " ") {
              prevCellX = cell[0] + DIRECTIONS_MAP[direction][0];
              prevCellY = cell[1] + DIRECTIONS_MAP[direction][1];
            }
            const prevPoint = pointsHash[prevCellX][prevCellY];
            prevPoint.overLineWithDir[direction] = true;

            const nextPoint = pointsHash[newCellX][newCellY];
            nextPoint.overLineWithDir[direction] = true;

            lastExpan = 0;
            newPart.last = [newCellX, newCellY];
          }

          cell = [newCellX, newCellY];

          newCellX = cell[0] - DIRECTIONS_MAP[direction][0];
          newCellY = cell[1] - DIRECTIONS_MAP[direction][1];

          isValidX = newCellX < state.length && newCellX >= 0;
          isValidY = newCellY < state.length && newCellY >= 0;

          newLine.end = cell;
        }

        /*
         * add new line to lines if has
         * many parts or if its only part
         * has many points.
         * if there only one point in the
         * line then add it to singlePoints
         * array.
         *
         */
        if (
          !this.sameParts(newLine.head, newLine.tail) ||
          !this.sameCells(newLine.head.first, newLine.tail.last)
        ) {
          lines.push(newLine);
        } else if (!singlePoints.some((p) => this.sameCells(p.head.first, newLine.head.first))) {
          singlePoints.push(newLine);
        }
      }
    }

    return { lines, singlePoints };
  }

  static setPlayerColor(color) {
    this.playerColor = color;
  }

  static setBoard(board) {
    this.board = board;
  }

  static result(state, action) {
    // ineficiente?
    const resultBoard = Array(state.board.length)
      .fill(0)
      .map((e, i) => state.board[i].slice());
    const [i, j] = action;

    resultBoard[i][j] = state.move_state;
    return {
      board: resultBoard,
      move_state: state.move_state === "W" ? "B" : "W",
    };
  }

  // MEJORAR
  static actions(state) {
    let calculatedActions = [];
    const occupiedPositions = [];

    // Instead of using all free positions as actions,
    // use only free positions close to those already
    // occupied.
    for (let i = 0; i < state.board.length; i++) {
      for (let j = 0; j < state.board.length; j++) {
        if (state.board[i][j] !== " ") occupiedPositions.push([i, j]);
      }
    }

    for (const position of occupiedPositions) {
      const [i, j] = position;
      calculatedActions = calculatedActions.concat(
        this.getNearActions(position, state.board, calculatedActions)
      );
    }

    return calculatedActions;
  }

  static evalFunction(state) {
    const color = this.playerColor;
    const opponentColor = color === "W" ? "B" : "W";

    const sets = this.generateLines(state.board, color);
    const opponentSets = this.generateLines(state.board, opponentColor);

    const myScore = this.#getScore(sets.lines, state.board) + sets.singlePoints.length + 1;
    const opponentScore =
      this.#getScore(opponentSets.lines, state.board) + opponentSets.singlePoints.length + 1;

    return this.RATIO_SCR
      ? myScore / opponentScore || 0 // 0 if NaN.
      : myScore - opponentScore;
  }

  static isCutoff(state, depth) {
    return depth === this.MAX_DEPTH || this.isTerminal(state);
  }

  static isTerminal(state) {
    // If winner() returns 'W' or 'B' then
    // someone won.
    if (new Board().winner(state.board)) return true;

    // Since nobody has won the game, we have to
    // check if there is any empty position on
    // the board so it's not a draw yet.
    for (let i = 0; i < state.board.length; i++) {
      for (let j = 0; j < state.board.length; j++) {
        if (state.board[i][j] === " ") return false;
      }
    }
    return true;
  }
}

// State node class to build the states tree.
class MelaoTreeNode {
  constructor(state, action) {
    this.state = state;
    this.action = action;
    this.childrenNodes = null;
  }

  expandNode() {
    const s = this.state;
    const childrenNodes = [];

    for (let a of MelaoGameClass.actions(s)) {
      const newState = MelaoGameClass.result(s, a);
      const newNode = new MelaoTreeNode(newState, a);
      childrenNodes.push(newNode);
    }

    this.childrenNodes = childrenNodes;
    return childrenNodes;
  }
}

class MelaoPlayer extends Agent {
  constructor() {
    super();
    this.board = new Board();
    this.statesTree = null;
    this.color = null;
  }

  /* Player agent methods. */
  updateStateTree(board) {
    let newRoot;
    if (this.statesTree && this.statesTree.childrenNodes) {
      newRoot = this.statesTree.childrenNodes.find((childNode) => {
        const [i, j] = childNode.action;
        return board[i][j] !== " ";
      });
    }
    if (!this.statesTree || !this.statesTree.childrenNodes || !newRoot) {
      newRoot = new MelaoTreeNode({ board, move_state: this.color }, null);
    }
    this.statesTree = newRoot;
  }

  alphaBetaSearch(stateNode, depth) {
    const { move, utility } = this.maxValue(stateNode, depth, -Infinity, Infinity);
    return move;
  }

  maxValue(stateNode, depth, alpha, beta) {
    if (MelaoGameClass.isCutoff(stateNode.state, depth)) {
      return {
        utility: MelaoGameClass.evalFunction(stateNode.state),
        move: null,
      };
    }

    let value = -Infinity;
    let move;

    const statesNodes = stateNode.childrenNodes || stateNode.expandNode();

    for (let sNode of statesNodes) {
      let { utility } = this.minValue(sNode, depth + 1, alpha, beta);

      if (utility >= value) {
        value = utility;
        move = sNode.action;

        alpha = Math.max(alpha, value);
      }

      if (value >= beta) {
        return { utility: value, move };
      }
    }

    return { utility: value, move };
  }

  minValue(stateNode, depth, alpha, beta) {
    if (MelaoGameClass.isCutoff(stateNode.state, depth))
      return {
        utility: MelaoGameClass.evalFunction(stateNode.state),
        move: null,
      };

    let value = Infinity;
    let move;

    const statesNodes = stateNode.childrenNodes || stateNode.expandNode();

    for (let sNode of statesNodes) {
      let { utility } = this.maxValue(sNode, depth + 1, alpha, beta);

      // if score is not calculated with ratio,
      // then it can be the same value, as
      // utility can now be Infinity, so that
      // option can be valid, but if RATIO=true
      // then utility minimum will be 0, and
      // then the strict less comparison will
      // not have any problem.
      if (utility < value || (utility === value && !MelaoGameClass.RATIO_SCR)) {
        value = utility;
        move = sNode.action;

        beta = Math.min(beta, value);
      }

      if (value <= alpha) {
        return { utility: value, move };
      }
    }

    return { utility: value, move };
  }

  getFreeMiddlePoint(p1, p2) {
    const [point1X, point1Y] = p1;
    const [point2X, point2Y] = p2;

    return [(point1X + point2X) / 2, (point1Y + point2Y) / 2];
  }

  searchDangerousLines(lines) {
    const criticalPositions = [];

    // repetido no, mejorado?
    for (const line of lines) {
      let freePrePoint = { partsSize: 0, cell: undefined };
      let auxPart = line.head;

      let auxPartSize = MelaoGameClass.distanceBetweenCells(auxPart.first, auxPart.last) + 1;
      let sumPartsSizes = auxPartSize;

      let numParts = 1;
      while (auxPart.prev) {
        numParts += 1;

        let prevPartSize =
          MelaoGameClass.distanceBetweenCells(auxPart.prev.first, auxPart.prev.last) + 1;

        const size = prevPartSize + auxPartSize;

        if (size >= 3 && size > freePrePoint.partsSize) {
          freePrePoint = {
            cell: this.getFreeMiddlePoint(auxPart.last, auxPart.prev.first),
            partsSize: size,
          };
        }

        auxPart = auxPart.prev;
        auxPartSize = prevPartSize;
        sumPartsSizes += auxPartSize;
      }

      const distStart = MelaoGameClass.distanceBetweenCells(line.head.first, line.start);
      const distEnd = MelaoGameClass.distanceBetweenCells(line.tail.last, line.end);

      if (!distStart && !distEnd) line.type = 0;
      else if (!distStart || !distEnd) line.type = 1;
      else line.type = 2;

      let criticalPoint;
      let addToSet = false;
      // If the line has 4 points and
      // is not dead, then win.
      if (numParts === 1 && sumPartsSizes >= 4 && line.type > 0) {
        criticalPoint = line.freePoints[0].cell;
        return [
          {
            criticalPoint,
            lineSize: sumPartsSizes,
          },
        ];
      }
      // If the line has many parts
      // with >3 points, then win moving
      // to point between parts.
      //... && line.type > 0
      if (freePrePoint.cell && sumPartsSizes >= 4) {
        criticalPoint = freePrePoint.cell;
        return [
          {
            criticalPoint,
            lineSize: sumPartsSizes,
          },
        ];
      }
      // If the line only has 1 part
      // and it only has 3 points, if
      // the line if healthy then make
      // a line with 4 points.
      else if (numParts === 1 && sumPartsSizes === 3 && line.type > 1 && distStart + distEnd > 2) {
        criticalPoint =
          distStart > 1
            ? this.getFreeMiddlePoint(line.start, line.head.first)
            : this.getFreeMiddlePoint(line.end, line.tail.last);

        addToSet = true;
      }
      // If the line has many parts
      // and they sum 3, if the line
      // is healthy then make a line
      // with 4 points moving to
      // point between parts.
      else if (freePrePoint.cell && sumPartsSizes === 3 && line.type > 1) {
        criticalPoint = freePrePoint.cell;
        addToSet = true;
      }

      addToSet &&
        criticalPositions.push({
          criticalPoint,
          lineSize: sumPartsSizes,
        });
    }

    return criticalPositions;
  }

  makeMove(board) {
    /*
     * First we must see if there is some dangerous
     * line (i.e. [ ,X,X,X, ] or [X,X,X,X, ]) that
     * maybe the heuristic cannot identify as it.
     *
     * If exists some dangerous line make
     * the move that nullifies it.
     *
     */

    // MOVER NUEVOS METODOS A GAME()

    let move;
    const color = this.color;
    const opponentColor = color === "W" ? "B" : "W";

    // Look if we have the possibility to win first,
    // if not, then look if the opponent is about win.
    const sets = MelaoGameClass.generateLines(board, color);

    const myCriticalMoves = this.searchDangerousLines(sets.lines);
    // As we are making the winner move, we don't
    // need to update the states tree or do
    // anything different to winning.
    if (myCriticalMoves.length && myCriticalMoves[0].lineSize === 4)
      return myCriticalMoves[0].criticalPoint;

    const opponentSets = MelaoGameClass.generateLines(board, opponentColor);

    const opponentCriticalMoves = this.searchDangerousLines(opponentSets.lines);
    if (opponentCriticalMoves.length && opponentCriticalMoves[0].lineSize === 4) {
      move = opponentCriticalMoves[0].criticalPoint;
      board[move[0]][move[1]] = this.color;

      this.updateStateTree(board);

      return move;
    }

    // If nobody can complete 5, then look if
    // someone can complete 4 first.

    // Update the state looking at the enemy's move.
    this.updateStateTree(board);

    if (myCriticalMoves.length) {
      move = myCriticalMoves[0].criticalPoint;
      board[move[0]][move[1]] = this.color;

      this.updateStateTree(board);

      return move;
    }

    if (opponentCriticalMoves.length) {
      move = opponentCriticalMoves[0].criticalPoint;
      board[move[0]][move[1]] = this.color;

      this.updateStateTree(board);

      return move;
    }

    // If nobody can create a 'good' or 'winner' line
    // then play as usual, make the heuristic move.

    move = this.alphaBetaSearch(this.statesTree, 0);
    const [a, b] = move;
    board[a][b] = this.color;

    // Update again with our last move.
    this.updateStateTree(board);

    return move;
  }

  // Aperturas Quemadas que son populares para el swap2
  getBestOpening(board) {
    const c = Math.floor(board.length / 2);
    let openings = [
      [
        [c, c],
        [c - 1, c],
        [c + 1, c],
      ],
      [
        [c, c],
        [c - 1, c + 1],
        [c + 1, c - 1],
      ],
      [
        [c, c],
        [c - 1, c - 1],
        [c + 1, c + 1],
      ],
      [
        [c, c],
        [c - 1, c],
        [c, c + 1],
      ],
    ];

    // Escoge una al azar
    return openings[Math.floor(Math.random() * openings.length)];
  }

  // Cuenta cuántas fichas hay alrededor
  // de una posición para decidir
  countNeighbors(board, x, y) {
    let neighbors = 0;
    let directions = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1],
    ];

    for (let [dx, dy] of directions) {
      let nx = x + dx,
        ny = y + dy;
      if (nx >= 0 && nx < board.length && ny >= 0 && ny < board.length && board[nx][ny] !== " ")
        neighbors++;
    }

    return neighbors;
  }

  // Evaluacion y movimientos especificos
  // para las instancias de la apeertura,
  // luego juega comun y corriente

  // Evalua la posicion y devuelve puntaje para saber si cambiar o no
  evaluateEarlyPosition(board, symbol) {
    let score = 0;
    const s = board.length;
    const c = Math.floor(s / 2);

    for (let x = 0; x < s; x++) {
      for (let y = 0; y < s; y++) {
        if (board[x][y] === symbol) {
          let distanceFromCenter = Math.abs(x - c) + Math.abs(y - c);
          let neighbors = this.countNeighbors(board, x, y);
          score += 100 - distanceFromCenter * 10 + neighbors * 15;
        }
      }
    }
    return score;
  }

  // Movimientos para hacer
  evaluateEarlyMoves(board, moves) {
    const c = Math.floor(board.length / 2);

    let scores = moves.map((move) => {
      let [x, y] = move;
      let distanceFromCenter = Math.abs(x - c) + Math.abs(y - c);
      let neighbors = this.countNeighbors(board, x, y);

      let score = 100 - distanceFromCenter * 10 + neighbors * 15;
      return { move, score };
    });

    scores.sort((a, b) => b.score - a.score);
    return scores.map((entry) => entry.move);
  }

  compute(board, move_state, time) {
    const moves = this.board.valid_moves(board);
    if (moves.length === 0) return "BLACK";
    let sortedMoves = [];

    switch (move_state) {
      case "1":
        console.log("== FIRST MOVE.");

        this.statesTree = null;
        return this.getBestOpening(board);

      case "2":
        console.log("== SECOND MOVE.");

        let myScore = this.evaluateEarlyPosition(board, this.symbol);
        let opponentScore = this.evaluateEarlyPosition(board, this.opponent);

        if (opponentScore > myScore * 1.2) {
          console.log("- we choose black (SWAP)");

          this.color = "B";
          MelaoGameClass.setPlayerColor(this.color);

          return "BLACK";
        }

        sortedMoves = this.evaluateEarlyMoves(board, moves);
        return sortedMoves.length >= 3 ? [sortedMoves[0], sortedMoves[1]] : sortedMoves[0];

      case "3":
        console.log("== THIRD MOVE.");
        sortedMoves = this.evaluateEarlyMoves(board, moves);
        return sortedMoves.length > 0 ? sortedMoves[0] : "BLACK";

      // Usual move as W or B: choose best action/move.
      default:
        this.color = move_state;
        MelaoGameClass.setPlayerColor(this.color);
        const move = this.makeMove(board);
        return [move[1], move[0]];
    }
  }
}
