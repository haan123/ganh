<template>
  <div class="container">
    <div class="user-board">
      <div :class="{
        'user': true,
        'badge': true,
        'badge-warning': game.isReady() && game.isMyTurn,
        'badge-dark': !game.isReady() || !game.isMyTurn
      }">
        {{player}}
        <span v-if="!game.isReady()" @click="editUser"><svgicon class="user__edit" icon="pencil" width="14" height="14" color="#f1f1f1"></svgicon></span>
      </div>
      <span v-bind:ref="arrow" class="arrow-icon" :style="{
        'display': game.isReady() ? 'block' : 'none'
      }">
        <span class="left-bar"></span>
        <span class="right-bar"></span>
      </span>
      <div :class="{
        'user': true,
        'badge': true,
        'badge-warning': game.isReady() && !game.isMyTurn,
        'badge-dark': !game.isReady() || game.isMyTurn
      }">{{oppPlayer}}</div>
    </div>
    <div class="widgets">
      <button @click="newGame" class="btn btn-danger btn-lg play">New Game</button>&nbsp;
    </div>

    <p class="game-guide">Discs cannot occupy squares next to each other, horizontally, vertically or diagonally, you can place a disc by dragging the disc from the disc base.</p>

    <div id="board-container" :class="{
      'board-container': true,
      'is-ready': game.isReady()
    }">
      <div class="board__inner">
        <div class="board">
          <div id="board-table" class="table board__table">
            <div class="disc-container">
               <template v-for="(disc) in discs">
                <div :key="disc.name" :id="disc.name" v-draggable="disc.draggable" :class="{
                  disc: true,
                  [`disc-${disc.type}`]: true
                }" :data-name="disc.name"></div>
              </template>
            </div>
            <div class="dock-container">
              <template v-for="(_, row) in (rowNo + 1)">
                <template v-for="(_, col) in (colNo + 1)">
                  <div v-bind:ref="`dock[${row}:${col}]`" :data-coord="`${row}:${col}`" :class="{
                    dock: true,
                    [`dock-${row}${col}`]: true
                  }" :data-cell="`${row}:${col}`" :title="`${row}:${col}`" :key="`${row}${col}`">
                    <div class="dock__drop droppable"></div>
                  </div>
                </template>
              </template>
            </div>
            <div class="board__frame">
              <div class="square"></div>
              <div class="board__col" v-for="(_, col) in (colNo * rowNo)" :key="col" v-bind:class="{
                'col': true
              }" :title="`${col}`">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="github">
        <a class="github-button" href="https://github.com/haan123/ganh" data-count-href="/haan123/ganh/stargazers" data-count-api="/repos/haan123/ganh#stargazers_count" data-count-aria-label="# stargazers on GitHub" aria-label="Star haan123/ganh on GitHub">Star</a>
        <a class="github-button" href="https://github.com/haan123/ganh/fork" data-icon="octicon-repo-forked" data-count-href="/haan123/ganh/network" data-count-api="/repos/haan123/ganh#forks_count" data-count-aria-label="# forks on GitHub" aria-label="Fork haan123/ganh on GitHub">Fork</a>
      </div>
      <div class="social">
        <span class="social-button social-button__tw"><a href="https://twitter.com/haquangngocan" target="_blank">
          <svgicon class="" icon="twitter" width="18" height="18" color="#fff"></svgicon>
        </a></span>
        <span class="social-button"><a  href="https://www.facebook.com/hana.printle" target="_blank">
          <svgicon icon="facebook" width="95" height="16" color="#fff"></svgicon>
        </a></span>
      </div>
      <span class="made-with-heart">
        <svgicon icon="pencil" width="16" height="16" color="#fff"></svgicon> with <svgicon icon="heart" width="16" height="16" color="#e82437"></svgicon> by <a href="https://github.com/haan123" target="_blank" style="font-weight:bold;color:#fff;">An Ha</a>
      </span>
    </div>

    <WinnerModal></WinnerModal>
    <LooseModal></LooseModal>
    <UserConfigModal v-bind:game="game"></UserConfigModal>
    <NewGameModal v-bind:game="game"></NewGameModal>
  </div>
</template>

<script>
/* eslint no-plusplus: 0 */
/* eslint comma-dangle: 0 */
/* eslint class-methods-use-this: 0 */
/* eslint consistent-return: 0 */
/* eslint array-callback-return: 0 */

import { setState, Draggable } from '../core/draggable';
import Game from '../core/game';
import WinnerModal from './WinnerModal';
import LooseModal from './LooseModal';
import UserConfigModal from './UserConfigModal';
import NewGameModal from './NewGameModal';
import modal from '../core/modal';
import dom from '../core/dom';

import '../svg/twitter';
import '../svg/facebook';
import '../svg/pencil';
import '../svg/heart';

const socket = io(window.SOCKET_URL);
const START_POINTS = ['2:0', '1:0', '0:0', '0:1', '0:2', '0:3', '0:4', '1:4', '2:4', '3:4', '4:4', '4:3', '4:2', '4:1', '4:0', '3:0'];

export default {
  name: 'HelloWorld',
  components: {
    WinnerModal,
    UserConfigModal,
    NewGameModal,
    LooseModal
  },

  directives: {
    Draggable
  },

  data() {
    socket.on('newGame', ({ discType }) => {
      this.game.setup({
        discType
      });

      this.game.discs.map((disc) => {
        this.resetPos(disc);
      });
    });

    socket.on('editUser', (data) => {
      this.game.setUser(data.user);
    });

    socket.on('ready', (data) => {
      this.game.ready(true);
      this.game.setTurn(data.turn);

      document.title = document.title.replace(/\s?\([\w\W]+\)/g, '');
      document.title += ` (${data.turn})`;

      if (!this.game.isMyTurn) {
        dom.addClass(this.$refs.arrow, 'open');
        this.oppPlayer = data.turn;
      } else {
        dom.removeClass(this.$refs.arrow, 'open');
        this.oppPlayer = data.oppPlayer;
      }
    });

    socket.on('fired', (data) => {
      if (data) return;

      const {
        cell,
        isDestroyed,
        fireStatus,
        hasWinner,
        winner,
        currentTurn,
        nextTurn,
        disc
      } = data;

      const isMyTurn = currentTurn === this.game.user;
      const elem = isMyTurn ? this.getActCell(cell) : this.getMapCell(cell);

      if (elem) {
        this.game.fire(cell, elem, {
          fireStatus,
          isDestroyed,
          disc
        });

        this.game.setTurn(nextTurn);

        document.title = document.title.replace(/\s?\([\w\W]+\)/g, '');

        if (this.game.isMyTurn) {
          dom.removeClass(this.$refs.arrow, 'open');
          document.title += ` (${this.game.user})`;
        } else {
          dom.addClass(this.$refs.arrow, 'open');
          document.title += ` (${this.oppPlayer})`;
        }

        if (hasWinner) {
          if (winner === this.game.user) {
            modal.showModal('modal-winner');
          } else {
            modal.showModal('modal-loose');
          }
        }
      }

      this.firing = false;
    });

    const rowNo = 4;
    const colNo = 4;

    this.game = new Game({
      rowNo,
      colNo
    });

    const discs = this.game.discs.map((disc) => {
      disc.draggable = {
        container: 'board-table',
        onDragEnd: this.dragEnd,
        resetInitialPos: false,
        resetPreviousPos: false
      };

      return disc;
    });

    return {
      game: this.game,
      arrow: 'arrow',
      rowNo,
      colNo,
      cells: this.game.cells,
      discs,
      isMyTurn: this.game.isMyTurn,
      oppPlayer: '(ᵔᴥᵔ)',
      player: '(ᵔᴥᵔ)'
    };
  },

  mounted() {
    this.checkUser();
    this.dock();
    this.ready();
  },

  methods: {
    newGame() {
      modal.showModal('new-game-modal');
    },

    ready() {
      const { user, discs } = this.game;

      socket.emit('ready', {
        user,
        discs
      });
    },

    getDockCell(coord) {
      if (typeof coord === 'string') {
        coord = this.game.parseCoord(coord);
      }

      const arr = this.$refs[`dock[${this.game.createCoord(...coord)}]`];

      return arr && arr[0];
    },

    dock() {
      for (let i = 0; i < START_POINTS.length; i++) {
        const cellElem = this.getDockCell(START_POINTS[i]);
        const discElem = document.getElementById(`disc-${i}`);
        const discName = discElem.getAttribute('data-name');
        const disc = this.game.getDisc(discName);

        const cell = cellElem.getAttribute('data-cell');
        const coord = this.game.parseCoord(cell);

        this.game.setPosition(disc, coord);
        this.placeDisc(cellElem, discElem);
      }
    },

    editUser() {
      modal.showModal('user-config-modal');
    },

    checkUser() {
      const user = localStorage.getItem('user');

      if (!user) {
        modal.showModal('user-config-modal');
      } else {
        this.game.setUser(user);
      }

      this.player = this.game.user;
    },

    dragEnd(elem, event) {
      const discName = event.dragElem.getAttribute('data-name');
      const disc = this.game.getDisc(discName);

      if (elem && elem.closest('.droppable')) {
        elem = elem.parentNode;
        const cell = elem.getAttribute('data-cell');
        const coord = this.game.parseCoord(cell);

        this.placeDisc(elem, event.dragElem, disc);

        if (disc.cell === cell) {
          return;
        }

        this.game.setPosition(disc, coord);

        const { user } = this.game;

        this.game.move(coord);

        socket.emit('fire', {
          user,
          cell
        });
      } else {
        this.resetPos(disc);
      }
    },

    placeDisc(cellElem, discElem) {
      if (!cellElem || !discElem) return;

      const container = document.getElementById('board-table');
      const containerRect = container.getBoundingClientRect();
      const containerScrollLeft = container.scrollLeft;

      const rect = cellElem.getBoundingClientRect();
      let { left, top } = rect;

      top -= discElem.clientHeight / 2;
      left -= discElem.clientWidth / 2;

      const dropELemRect = {
        left,
        top,
        relLeft: Math.round((left - containerRect.left) + containerScrollLeft),
        relTop: Math.round(top - containerRect.top)
      };

      setState({
        initialMousePos: undefined,
        startDragPosition: dropELemRect,
        currentDragPosition: dropELemRect,
        prevPosition: dropELemRect
      }, discElem);

      discElem.style.left = `${Math.floor(dropELemRect.relLeft)}px`;
      discElem.style.top = `${Math.floor(dropELemRect.relTop)}px`;
    },

    resetPos(disc) {
      this.game.resetDiscPos(disc);

      this.dock();

      disc.draggable.resetInitialPos = true;

      setTimeout(() => {
        disc.draggable.resetInitialPos = false;
      }, 0);
    },

    resetPreviousPos(disc) {
      disc.draggable.resetPreviousPos = true;

      setTimeout(() => {
        disc.draggable.resetPreviousPos = false;
      }, 0);
    },
  }
};
</script>
