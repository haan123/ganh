/* eslint no-plusplus: 0 */
/* eslint comma-dangle: 0 */
/* eslint class-methods-use-this: 0 */
/* eslint consistent-return: 0 */
/* eslint array-callback-return: 0 */

import Disc from './disc';

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

  return path.sort((a, b) => {
    a = +a.replace(':', '');
    b = +b.replace(':', '');

    return a - b;
  });
}

const INC = {
  leftCross: (x, y, c) => incrementor(x, y, c, [[-1, -1], [1, 1]]),
  rightCross: (x, y, c) => incrementor(x, y, c, [[1, -1], [-1, 1]]),
  vertical: (x, y, c) => incrementor(x, y, c, [[-1, 0], [1, 0]]),
  horizontal: (x, y, c) => incrementor(x, y, c, [[0, -1], [0, 1]])
};

export default class Game {
  constructor(options) {
    this.cells = {};
    this.discs = [];
    this.isPlayerReady = false;
    this.isMyTurn = false;

    this.createGrid(options);
    this.createDiscs(options);
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

  getTurnDiscs() {
    const type = this.isMyTurn ? this.oppDiscType : this.discType;

    return this.discs.filter(disc => disc.type === type);
  }

  getCurrentDiscType() {
    return this.isMyTurn ? this.discType : this.oppDiscType;
  }

  checkCentreCase() {

  }

  move(coord) {
    const paths1 = {};
    const paths2 = {};
    const discs = this.getTurnDiscs();
    const discType = this.getCurrentDiscType();

    Object.keys(INC).map((key) => {
      const fn = INC[key];

      paths1[key] = fn(...coord, 1);
      paths2[key] = fn(...coord, 2);
    });

    Object.keys(paths1).map((dir) => {
      const path = paths1[dir];

      if (!discType) return;

      const cell1 = this.getCell(path[0]);
      const cell2 = this.getCell(path[2]);

      if (!cell1 || !cell2) return;

      if (cell1.discType === discType && cell2.discType === discType) {
        console.log('aaa');
      }
    });

    Object.keys(paths2).map((dir) => {
      const path = paths2[dir];
      const cases = [[0, 1, 2], [2, 3, 4]];

      cases.map((c) => {
        const cell1 = this.getCell(path[c[0]]);
        const cell2 = this.getCell(path[c[1]]);
        const cell3 = this.getCell(path[c[2]]);
console.log(path, cell1 && cell1.discType, cell3 && cell3.discType, cell2.discType, discType)
        if (!cell1 || !cell3 || !cell2.discType || cell2.discType === discType) return;
console.log(path, discType, c[0], c[2])
        if (cell1.discType === discType && cell3.discType === discType) {
          console.log('aaa');
        }
      });
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
    const cell = this.getCell(startPos);
    const oldCell = this.getCell(disc.cell);

    disc.setPosition(pos.reverse());
    disc.cell = startPos;

    if (oldCell) oldCell.discType = '';
    cell.discType = disc.type;

    return true;
  }

  setup({ discType }) {
    this.discType = discType;
    this.oppDiscType = discType === 'a' ? 'b' : 'a';
  }

  createCoord(x, y) {
    return `${x}:${y}`;
  }

  parseCoord(coordinate) {
    const [x, y] = coordinate.split(':');

    return [+x, +y];
  }

  getCell(coord) {
    if (!coord) return;

    const [x, y] = this.parseCoord(coord);
    return this.cells[`${x}:${y}`];
  }

  createGrid({ rowNo, colNo }) {
    for (let row = 0; row < rowNo + 1; row++) {
      for (let col = 0; col < colNo + 1; col++) {
        this.cells[`${row}:${col}`] = {
          discType: ''
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
