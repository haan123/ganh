/* eslint no-plusplus: 0 */
/* eslint comma-dangle: 0 */
/* eslint class-methods-use-this: 0 */
/* eslint consistent-return: 0 */
/* eslint array-callback-return: 0 */

import Disc from './disc';

const rdash = /-/g;
function sortPath(path) {
  return path.sort((a, b) => {
    a = a.replace(':', '');
    b = b.replace(':', '');

    if (a.indexOf('-') !== -1) {
      a = -1 * parseInt(a.replace(rdash, ''), 10);
    }

    if (b.indexOf('-') !== -1) {
      b = -1 * parseInt(b.replace(rdash, ''), 10);
    }

    return a - b;
  });
}

function incrementor(x, y, c, increment) {
  const path = [`${x}:${y}`];


  increment.map((inc) => {
    let x1 = x;
    let y1 = y;

    for (let i = 1; i <= c; i++) {
      x1 += inc[0];
      y1 += inc[1];

      path.push(`${x1}:${y1}`);
    }
  });

  return sortPath(path);
}

const INC = {
  leftCross: (x, y, c) => incrementor(x, y, c, [[-1, -1], [1, 1]]),
  rightCross: (x, y, c) => incrementor(x, y, c, [[1, -1], [-1, 1]]),
  vertical: (x, y, c) => incrementor(x, y, c, [[-1, 0], [1, 0]]),
  horizontal: (x, y, c) => incrementor(x, y, c, [[0, -1], [0, 1]])
};

const NO_CROSS_DOCKS = ['0:1', '0:3', '1:4', '3:4'];

export default class Game {
  constructor(options) {
    this.docks = {};
    this.discs = [];
    this.isPlayerReady = false;
    this.isMyTurn = false;
    this.isGamePlaying = false;
    this.disintegrate = options.disintegrate;

    this.createGrid(options);
    this.createDiscs(options);
    this.setCornerDocks(options);
  }

  setTurn(user) {
    this.turn = user;

    if (this.user === this.turn) {
      this.isMyTurn = true;
    } else {
      this.isMyTurn = false;
    }
  }

  isAllDiscsReady() {
    return !this.discs.find(disc => !disc.position || !disc.position.length);
  }

  isPlaying() {
    return this.isGamePlaying;
  }

  play() {
    this.isGamePlaying = true;
  }

  stop() {
    this.isGamePlaying = false;
  }

  isReady() {
    return this.isPlayerReady;
  }

  ready(ready) {
    this.isPlayerReady = ready;
  }

  setUser(user) {
    this.user = user;
  }

  getUserName() {
    return this.user.name;
  }

  getDisc(name) {
    return this.discs.find(disc => disc.name === name);
  }

  getDiscByCoord(c) {
    return this.discs.find(disc => disc.position.indexOf(c) !== -1);
  }

  unClickAllDiscs() {
    this.discs.map((disc) => {
      disc.setSelect(false);
    });
  }

  getPosition(coordinate, arrange, decker) {
    let [x, y] = this.parseCoord(coordinate);
    const pos = [coordinate];

    for (let i = 1; i < decker; i++) {
      x = arrange.x(x);
      y = arrange.y(y);

      const nextCoor = this.createCoord(x, y);
      pos.push(nextCoor);
    }

    return pos;
  }

  getCurrentDiscType() {
    return this.isMyTurn ? this.discType : this.oppDiscType;
  }

  isValidMove(currentCoord, nextCoord) {
    const cell = this.getDock(currentCoord);

    return cell.validMoves.indexOf(nextCoord) !== -1;
  }

  move(coord) {
    const paths1 = {};
    const paths2 = {};
    const discType = this.getCurrentDiscType();

    Object.keys(INC).map((key) => {
      const fn = INC[key];

      paths1[key] = fn(...coord, 1);
      paths2[key] = fn(...coord, 2);
    });

    Object.keys(paths1).map((dir) => {
      const [p1,, p2] = paths1[dir];

      if (!discType) return;

      const cell1 = this.getDock(p1) || {};
      const cell2 = this.getDock(p2) || {};

      if (!cell1.disc || !cell2.disc) return;

      if (cell1.disc.type !== discType && cell2.disc.type !== discType) {
        this.hideDiscs([cell1, cell2]);
      }
    });

    Object.keys(paths2).map((dir) => {
      const path = paths2[dir];
      const cases = [[0, 1, 2], [2, 3, 4]];

      cases.map((c) => {
        const cell1 = this.getDock(path[c[0]]) || {};
        const cell2 = this.getDock(path[c[1]]) || {};
        const cell3 = this.getDock(path[c[2]]) || {};

        if (!cell1.disc || !cell3.disc
          || !cell2.disc || cell2.disc.type === discType) return;

        if (cell1.disc.type === discType && cell3.disc.type === discType) {
          this.hideDiscs([cell2]);
        }
      });
    });

    this.cornerDocks.map((c) => {
      const cornerDock = this.getDock(c.corner) || {};

      if (cornerDock.disc && discType !== cornerDock.disc.type) {
        let count = 0;

        c.around.map((co) => {
          const dock = this.getDock(co) || {};

          if (dock.disc && dock.disc.type === discType) {
            count++;
          }
        });

        if (count === 3) {
          this.hideDiscs([cornerDock]);
        }
      }
    });
  }

  hasWinner(turn) {
    const type = turn === this.user ? this.oppDiscType : this.discType;
    const discs = this.discs.filter(disc => disc.type === type);

    return !discs.filter(disc => disc.cell).length;
  }

  hideDisc(cell) {
    const { disc } = cell;
    disc.cell = '';
    disc.resetPosition();

    cell.disc = null;
  }

  hideDiscs(docks) {
    this.disintegrate.animate(docks.map(dock => dock.disc.name));

    docks.map((cell) => {
      this.hideDisc(cell);
    });
  }

  resetDiscPos(disc) {
    disc.resetPosition();
  }

  resetAllCoords() {
    this.discs.map(disc => disc.resetPosition());
  }

  setPosition(disc, [x, y]) {
    const startPos = this.createCoord(x, y);
    const pos = [startPos];
    const cell = this.getDock(startPos);
    const oldCell = this.getDock(disc.cell);

    disc.setPosition(pos.reverse());
    disc.cell = startPos;

    if (oldCell) oldCell.disc = null;
    cell.disc = disc;

    return true;
  }

  getOppDiscType(type) {
    return type === 'a' ? 'b' : 'a';
  }

  setup({ discType }) {
    this.discType = discType;
    this.oppDiscType = this.getOppDiscType(discType);
  }

  createCoord(x, y) {
    return `${x}:${y}`;
  }

  parseCoord(coordinate) {
    const [x, y] = Array.isArray(coordinate) ? coordinate : coordinate.split(':');

    return [+x, +y];
  }

  getDock(coord) {
    if (!coord) return;

    const [x, y] = this.parseCoord(coord);
    return this.docks[`${x}:${y}`];
  }

  getSelectingDisc() {
    return this.discs.find(disc => disc.isSelecting);
  }

  clearNextMoves(docks) {
    Object.keys(docks).map((coord) => {
      const dock = this.getDock(coord);
      dock.isNextMove = false;
    });
  }

  clearAllNextMoves() {
    this.clearNextMoves(this.docks);
  }

  setNextMoves(discName) {
    const disc = this.getDisc(discName);
    const dock = this.getDock(disc.position[0]);

    this.clearAllNextMoves();

    dock.validMoves.filter(c => !this.getDiscByCoord(c)).map((c) => {
      const nextDock = this.getDock(c);

      nextDock.isNextMove = true;
    });
  }

  getDockByDiscName(discName) {
    const disc = this.getDisc(discName);

    return this.getDock(disc.position[0]);
  }

  filterPath(rowNo, colNo, path) {
    return path.filter((coord, i) => {
      const [x, y] = this.parseCoord(coord);

      return x >= 0 && y >= 0 && x <= rowNo && y <= colNo && path.indexOf(coord) === i;
    });
  }

  getNoCrossDocks(rowNo, colNo) {
    let noCrossDocks = [];

    NO_CROSS_DOCKS.map((c) => {
      const coord = this.parseCoord(c);

      Object.keys(INC).map((key) => {
        if (key.toLowerCase().indexOf('cross') !== -1) {
          const fn = INC[key];
          const arr = fn(...coord, 4);

          noCrossDocks = [...noCrossDocks, ...arr];
        }
      });
    });

    noCrossDocks = this.filterPath(rowNo, colNo, noCrossDocks);

    return sortPath(noCrossDocks);
  }

  setCornerDocks({ rowNo, colNo }) {
    const docks = ['0:0',
      this.createCoord(0, colNo),
      this.createCoord(rowNo, 0),
      this.createCoord(rowNo, colNo)
    ];

    const cornerDocks = [];

    docks.map((coord) => {
      let around = [];

      Object.keys(INC).map((key) => {
        const fn = INC[key];
        const path = fn(...this.parseCoord(coord), 1);
        around = [...around, ...path];
      });

      around = this.filterPath(rowNo, colNo, around);
      around.splice(around.indexOf(coord), 1);
      around = sortPath(around);
      cornerDocks.push({
        corner: coord,
        around
      });
    });

    this.cornerDocks = cornerDocks;
  }

  createGrid({ rowNo, colNo }) {
    const noCrossDocks = this.getNoCrossDocks(rowNo, colNo);

    for (let x = 0; x < rowNo + 1; x++) {
      for (let y = 0; y < colNo + 1; y++) {
        const coord = this.createCoord(x, y);
        let validMoves = [];

        Object.keys(INC).map((key) => {
          if (key.toLowerCase().indexOf('cross') !== -1 && noCrossDocks.indexOf(coord) !== -1) {
            return;
          }

          const fn = INC[key];

          const path = this.filterPath(rowNo, colNo, fn(x, y, 1))
            .filter(c => c !== coord);

          if (path.length) {
            validMoves = [...validMoves, ...path];
          }
        });

        validMoves = sortPath(validMoves);

        this.docks[coord] = {
          disc: null,
          isNextMove: false,
          validMoves
        };
      }
    }
  }

  createDiscs({ rowNo, colNo }) {
    const count = rowNo * colNo;

    for (let i = 0; i < count; i++) {
      const name = `disc-${i}`;

      const disc = new Disc({
        name,
        type: i < (count / 2) ? 'a' : 'b'
      });

      this.discs.push(disc);
    }
  }
}
