<template>
  <div id="new-game-modal" class="modal-container">
    <div class="modal-background">
      <div class="modal">
        <div class="user">
          <div class="form-group">
            <label class="user__ticker">Pick color:</label>
            <div class="form-check form-check-inline">
              <input id="inlineRadio1" v-bind:ref="rd1" class="form-check-input ticker-ipt" type="radio" name="ticker" value="a" checked>
              <label class="form-check-label disc-a" for="inlineRadio1">
                <div class="disc disc-sample-a"></div>
              </label>
            </div>
            <div class="form-check form-check-inline">
              <input id="inlineRadio2" v-bind:ref="rd2" class="form-check-input ticker-ipt" type="radio" name="ticker" value="b">
              <label class="form-check-label disc-b" for="inlineRadio2">
                <div class="disc disc-sample-b"></div>
              </label>
            </div>
          </div>
        </div>
        <button v-on:click="start" class="btn btn-success user__start">Start</button>
      </div>
    </div>
  </div>
</template>

<script>
/* eslint no-plusplus: 0 */
/* eslint comma-dangle: 0 */
/* eslint class-methods-use-this: 0 */
/* eslint consistent-return: 0 */
/* eslint array-callback-return: 0 */

import modal from '../core/modal';

const socket = io(window.SOCKET_URL);

export default {
  props: ['game'],

  data() {
    return {
      rd1: 'rd1',
      rd2: 'rd2'
    };
  },

  methods: {
    start() {
      const discType = this.$refs.rd1.checked ? 'a' : 'b';

      socket.emit('newGame', {
        discType,
        user: this.game.user
      });

      modal.hideModal('user-config-modal');
      modal.hideModal('new-game-modal');
    }
  }
};
</script>

<style lang="scss">
  .user__ticker {
    vertical-align: middle;
  }

  .ticker-ipt {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
</style>
