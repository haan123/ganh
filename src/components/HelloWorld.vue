<template>
  <div class="container">
    <div class="user-board">
      <div :class="{
        'user': true,
        'badge': true,
        'badge-warning': game.isPlaying() && game.isMyTurn,
        'badge-dark': !game.isPlaying() || !game.isMyTurn
      }">
        {{player}}
        <span v-if="!game.isPlaying()" @click="editUser"><svgicon class="user__edit" icon="pencil" width="14" height="14" color="#f1f1f1"></svgicon></span>
      </div>
      <span v-bind:ref="arrow" class="arrow-icon" :style="{
        'display': game.isPlaying() ? 'block' : 'none'
      }">
        <span class="left-bar"></span>
        <span class="right-bar"></span>
      </span>
      <div :class="{
        'user': true,
        'badge': true,
        'badge-warning': game.isPlaying() && !game.isMyTurn,
        'badge-dark': !game.isPlaying() || game.isMyTurn
      }">{{oppPlayer}}</div>
    </div>
    <div class="widgets">
      <button @click="newGame" class="btn btn-danger btn-lg play">New Game</button>&nbsp;
    </div>

    <p class="game-guide">How to play <a href="https://www.youtube.com/watch?v=FU3auCFYGJc" target="_blank">Gánh Chess</a>.</p>

    <div id="board-container" :class="{
      'board-container': true,
      'is-playing': game.isPlaying()
    }">
      <div class="board__inner">
        <div class="board">
          <div id="board-table" class="table board__table">
            <div class="disc-container">
               <template v-for="disc in discs">
                <div :key="disc.name" :id="disc.name" v-draggable="disc.draggable" :class="{
                  'disc-wrap': true,
                  [`disc-${disc.type}`]: true,
                  'is-lost': !disc.cell
                }" :data-name="disc.name">
                  <div class="disc animated" data-dis-type="self-contained"></div>
                </div>
              </template>
            </div>
            <div class="dock-container">
              <template v-for="(dock, key) in docks">
                <div v-bind:ref="`dock[${key}]`" @click="dockClick" :data-dock="key" :class="{
                  dock: true,
                  animated: true,
                  [`is-next-${selectingDisc && selectingDisc.type}-move`]: dock.isNextMove,
                  [`dock-${key}`]: true
                }" :title="key" :key="`${key}`">
                  <div class="dock__drop droppable"></div>
                  <div class="reveal-ripple"></div>
                </div>
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

import disintegrate from '../core/disintegrate';
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
    socket.on('newGame', ({ discType, turn }) => {
      if (turn !== this.game.user) {
        discType = this.game.getOppDiscType(discType);
      }

      this.game.setup({
        discType
      });

      this.game.discs.map((disc) => {
        this.resetPos(disc);
      });

      this.game.setTurn(turn);

      document.title = document.title.replace(/\s?\([\w\W]+\)/g, '');
      document.title += ` (${turn})`;

      if (!this.game.isMyTurn) {
        dom.addClass(this.$refs.arrow, 'open');
        this.disableAllDrag();
      } else {
        dom.removeClass(this.$refs.arrow, 'open');
        this.enableDrag(discType);
      }

      this.game.unClickAllDiscs();
      this.game.clearAllNextMoves();

      this.game.play();
    });

    socket.on('editUser', (data) => {
      this.game.setUser(data.user);
    });

    socket.on('ready', (data) => {
      this.game.ready(true);
      this.oppPlayer = data.oppPlayer;
    });

    socket.on('moved', (data) => {
      if (!data) return;

      const {
        cell,
        currentTurn,
        discName,
        nextTurn
      } = data;

      const isMyTurn = currentTurn === this.game.user;
      const coord = this.game.parseCoord(cell);
      const disc = this.game.getDisc(discName);

      this.game.setPosition(disc, coord);
      this.game.move(coord);

      this.game.setTurn(nextTurn);

      if (!isMyTurn) {
        const elem = this.getDockCell(cell);
        const discWrap = this.getDiscWrap(discName);

        this.placeDisc(elem, discWrap);
      }

      document.title = document.title.replace(/\s?\([\w\W]+\)/g, '');

      if (this.game.isMyTurn) {
        dom.removeClass(this.$refs.arrow, 'open');
        document.title += ` (${this.game.user})`;
        this.enableDrag(this.game.getCurrentDiscType());
      } else {
        dom.addClass(this.$refs.arrow, 'open');
        document.title += ` (${this.oppPlayer})`;
        this.disableAllDrag();
      }

      if (this.game.hasWinner(currentTurn)) {
        if (currentTurn === this.game.user) {
          modal.showModal('modal-winner');
        } else {
          modal.showModal('modal-loose');
        }
      }

      this.moving = false;
    });

    const rowNo = 4;
    const colNo = 4;

    this.game = new Game({
      rowNo,
      disintegrate,
      colNo
    });

    this.game.discs.map((disc) => {
      disc.draggable = {
        container: 'board-table',
        onDragEnd: this.dragEnd,
        onDragStart: this.dragStart,
        resetInitialPos: false,
        resetPreviousPos: false,
        stopDragging: true
      };

      return disc;
    });

    return {
      game: this.game,
      arrow: 'arrow',
      rowNo,
      colNo,
      discs: this.game.discs,
      docks: this.game.docks,
      isMyTurn: this.game.isMyTurn,
      selectingDisc: null,
      oppPlayer: '(ᵔᴥᵔ)',
      player: '(ᵔᴥᵔ)'
    };
  },

  mounted() {
    this.checkUser();
    this.dock();
    this.ready();

    disintegrate.init();

    window.addEventListener("disesLoaded", function() {
      disintegrate.dises.forEach(function(disObj) {
        if(disObj.elem.dataset.disType === "self-contained") {
          function resetCSSAnimation(el) {
            el.style.animation = "none";
            setTimeout(function() {
                el.style.animation = "";
            }, 10);
          }
        }
      });
    });
  },

  methods: {
    newGame() {
      modal.showModal('new-game-modal');
    },

    ready() {
      const { user } = this.game;

      socket.emit('ready', {
        user
      });
    },

    disableAllDrag() {
      this.game.discs.map((disc) => {
        disc.draggable.stopDragging = true;
      });
    },

    disableDrag(discType) {
      this.game.discs.map((disc) => {
        if (discType === disc.type) {
          disc.draggable.stopDragging = true;
        }
      });
    },

    enableDrag(discType) {
      this.game.discs.map((disc) => {
        if (discType === disc.type) {
          disc.draggable.stopDragging = false;
        }
      });
    },

    getDockCell(coord) {
      if (typeof coord === 'string') {
        coord = this.game.parseCoord(coord);
      }

      const arr = this.$refs[`dock[${this.game.createCoord(...coord)}]`];

      return arr && arr[0];
    },

    getDiscWrap(name) {
      return document.getElementById(name);
    },

    getDiscElem(selector) {
      const discWrap = (selector.nodeType === 1 && dom.hasClass(selector, 'disc-wrap')) ? selector : this.getDiscWrap(selector);

      return discWrap && discWrap.querySelector('.disc');
    },

    dock() {
      for (let i = 0; i < START_POINTS.length; i++) {
        const cellElem = this.getDockCell(START_POINTS[i]);
        const discWrap = this.getDiscWrap(`disc-${i}`);
        const discName = discWrap.getAttribute('data-name');
        const disc = this.game.getDisc(discName);

        const cell = cellElem.getAttribute('data-dock');
        const coord = this.game.parseCoord(cell);

        this.game.setPosition(disc, coord);
        this.placeDisc(cellElem, discWrap);
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

    dockClick(e) {
      const cellElem = e.currentTarget;
      const coord = this.game.parseCoord(cellElem.dataset.dock);
      const dock = this.game.getDock(coord);
      const disc = this.game.getSelectingDisc();

      if (!disc) return;

      const discWrap = this.getDiscWrap(disc.name);

      if (dock.isNextMove) {
        this.game.setPosition(disc, coord);
        this.placeDisc(cellElem, discWrap);
        this.game.unClickAllDiscs();
        this.game.clearAllNextMoves();

        const { user } = this.game;

        socket.emit('move', {
          user,
          discName: disc.name,
          cell: cellElem.dataset.dock
        });
      }
    },

    dragStart(e) {
      var discWrap = e.currentTarget;
      const discName = discWrap.getAttribute('data-name');
      const discElem = this.getDiscElem(discName);
      const disc = this.game.getDisc(discName);

      this.isDiscClicked = false;

      this.startClick = new Date().getTime();

      dom.removeClass(discElem, 'bounce-in');
      setTimeout(() => {
        dom.addClass(discElem, 'is-holding');
      }, 0);

      this.selectTimer = setTimeout(() => {
        this.setSelect(disc);
      }, 250);
    },

    setSelectingDisc(disc) {
      disc.setSelect(true);
      this.selectingDisc = disc;
    },

    setSelect(disc) {
      this.game.setNextMoves(disc.name);
      this.setSelectingDisc(disc);
    },

    dragEnd(elem, event) {
      const dockELem = elem.closest('.dock');
      const discName = event.dragElem.getAttribute('data-name');
      const discElem = this.getDiscElem(discName);
      const disc = this.game.getDisc(discName);
      const dock = this.game.getDock(dockELem && dockELem.dataset.dock);

      this.endClick = new Date().getTime();

      setTimeout(() => {
        dom.removeClass(discElem, 'is-holding');
      }, 0);

      if (elem && elem.closest('.droppable') && dock && !dock.disc) {
        elem = elem.parentNode;
        const cell = elem.getAttribute('data-dock');

        if (disc.cell === cell || !this.game.isValidMove(disc.cell, cell)) {

          if (this.endClick - this.startClick <= 250) {
            this.isDiscClicked = true;

            this.setSelect(disc);
          }

          this.resetPreviousPos(disc);
          return;
        }

        this.game.unClickAllDiscs();
        this.game.clearAllNextMoves();

        this.placeDisc(elem, event.dragElem);

        const { user } = this.game;

        socket.emit('move', {
          user,
          discName,
          cell
        });
      } else {
        this.resetPreviousPos(disc);
      }
    },

    placeDisc(cellElem, discWrap) {
      if (!cellElem || !discWrap) return;

      const container = document.getElementById('board-table');
      const containerRect = container.getBoundingClientRect();
      const containerScrollLeft = container.scrollLeft;
      const discElem = this.getDiscElem(discWrap);

      const rect = cellElem.getBoundingClientRect();
      let { left, top } = rect;

      top -= (discWrap.clientHeight / 2) - (cellElem.clientHeight / 2);
      left -= (discWrap.clientWidth / 2) - (cellElem.clientWidth / 2);

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
      }, discWrap);

      discWrap.style.left = `${Math.floor(dropELemRect.relLeft)}px`;
      discWrap.style.top = `${Math.floor(dropELemRect.relTop)}px`;

      setTimeout(() => {
        dom.addClass(discElem, 'bounce-in');
      }, 0);
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
