/* eslint no-plusplus: 0 */
/* eslint comma-dangle: 0 */
/* eslint class-methods-use-this: 0 */
/* eslint consistent-return: 0 */
/* eslint array-callback-return: 0 */

import Disc from './disc';

const PATH_MAP = {
  leftCross: (x, y) => [
    [x - 1, y - 1],
    [x + 1, y + 1]
  ],
  rightCross: (x, y) => [
    [x + 1, y - 1],
    [x - 1, y + 1]
  ],
  vertical: (x, y) => [
    [x - 1, y],
    [x + 1, y]
  ],
  horizontal: (x, y) => [
    [x, y - 1],
    [x, y + 1]
  ]
};

export default class Game {
  constructor(options) {
    this.cells = {};
    this.discs = [];
    this.allCoords = [];
    this.isPlayerReady = false;
    this.isMyTurn = false;

    this.createGrid(options);
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
    return this.discs.filter(disc => disc.type === this.turn);
  }

  checkTurn(coord) {
    const paths = {};
    const discs = this.getTurnDiscs();

    Object.keys(PATH_MAP).map((key) => {
      const fn = PATH_MAP[key];

      paths[key] = fn(...coord);
    });

    Object.keys(paths).map((dir) => {
      const path = paths[dir];
      const arr = [];

      discs.map((disc) => {
        if (path.indexOf(disc.position[0]) !== -1) {
          arr.push(disc);
        }
      });

      if (arr.length === 2) {
        console.log('aaa');
      }
    });
  }

  resetDiscPos(disc) {
    this.allCoords = this.allCoords.filter(coord => disc.position.indexOf(coord) < 0);

    disc.resetPosition();
  }

  resetAllCoords() {
    this.allCoords = [];
    this.discs.map(disc => disc.resetPosition());
  }

  setPosition(disc, [x, y]) {
    const { position } = disc;
    const startPos = this.createCoord(x, y);
    const pos = [startPos];

    const coords = this.allCoords.filter(coord => !position || position.indexOf(coord) < 0);

    this.allCoords = [...coords, ...pos];

    disc.setPosition(pos.reverse());

    return true;
  }

  setup({ count }) {
    for (let i = 0; i < count; i++) {
      const name = `disc-${i}`;

      const disc = new Disc({
        name,
        type: i < (count / 2) ? 'me' : 'opp'
      });

      this.discs.push(disc);
    }
  }

  createCoord(x, y) {
    return `${x}:${y}`;
  }

  parseCoord(coordinate) {
    const [x, y] = coordinate.split(':');

    return [+x, +y];
  }

  createGrid({ rowNo, colNo }) {
    for (let row = 0; row < rowNo; row++) {
      for (let col = 0; col < colNo; col++) {
        this.cells[`${row}:${col}`] = {
          hasDiscOn: false
        };
      }
    }
  }
}
