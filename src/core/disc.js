/* eslint no-plusplus: 0 */
/* eslint comma-dangle: 0 */
/* eslint class-methods-use-this: 0 */
/* eslint consistent-return: 0 */
/* eslint array-callback-return: 0 */

class Disc {
  constructor(options) {
    const {
      name,
      type
    } = options;

    this.name = name;
    this.type = type;
    this.position = [];
  }

  resetPosition() {
    this.position.splice(0);
  }

  setPosition(pos) {
    this.resetPosition();
    pos.map(p => this.position.push(p));
  }
}

export default Disc;
