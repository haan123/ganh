const Koa = require('koa');
const path = require('path');
const views = require('koa-nunjucks-next');
const Router = require('koa-router');
const convert = require('koa-convert');
const serveStatic = require('koa-better-static');

// initialize the app
const app = new Koa();
const game = {
  room1: {}
};

app.use(convert(serveStatic(path.resolve(__dirname, 'dist'), {
  maxage: 86400000
})));

app.use(views(path.resolve(__dirname, 'dist'), {
  minify: {
    minifyJS: true,
    minifyCSS: true,
    preserveLineBreaks: true,
    conservativeCollapse: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    quoteCharacter: '"'
  },
  autoescape: true,
  globals: {
    env: process.env.NODE_ENV
  }
}));

function getOppPlayer(players = [], user) {
  return players.find((client) => client.user !== user);
}

function getPlayer(players = [], user) {
  return players.find((client) => client.user === user);
}

function isReadyToPlay(players) {
  return players.length === 2;
}

function setNextPlayerTurn(room, players, player) {
  const nextPlayer = players.find(p => p.user !== player.user);

  room.turn = nextPlayer.user;

  return nextPlayer.user;
}

const router = new Router();

router.get('*', async (ctx, next) => {
  await ctx.render('index');
});

app.use(router.routes());

const io = require('socket.io')(app.listen(process.env.PORT || 3000, function() {
  console.log('Listening on http://localhost:' + (process.env.PORT || 3000));
}));

io.on('connection', function (socket) {
  socket.on('newGame', function (data) {
    console.log(`${data.user} set up new game`);

    const { user, discType } = data;
    const { players } = game.room1;
    const oppPlayer = getOppPlayer(players, user);

    if (!players || !players.length || !oppPlayer) return;

    game.room1.turn = user;

    io.sockets.emit('newGame', {
      turn: user,
      discType
    });
  });

  socket.on('ready', function (data) {
    if (!data.user) return;

    console.log(`${data.user} is ready`);

    const keys = Object.keys(io.sockets.connected);

    if (!game.room1.players) game.room1.players = [];

    const players = game.room1.players.filter((player) => {
      return (keys.indexOf(player.sid) !== -1) && (data.user !== player.user);
    });

    data.sid = socket.id;
    players.push(data);

    const isReady = isReadyToPlay(players);

    game.room1.players = players;

    if (isReady) {
      players.map((p) => {
        const sock = io.sockets.connected[p.sid];
        const { user } = getOppPlayer(players, p.user);

        if (sock) {
          sock.emit('ready', {
            oppPlayer: user
          });
        }
      });
    }
  });

  socket.on('move', function (data) {
    console.log(`${data.user} moved`);

    const { user, discName } = data;
    let { cell } = data;
    const { room1 } = game;
    const { players } = room1;
    const player = getPlayer(players, user);
    const oppPlayer = getOppPlayer(players, user);

    if (!player || !oppPlayer) return;

    const nextTurn = setNextPlayerTurn(room1, players, player);

    players.map((p) => {
      const sock = io.sockets.connected[p.sid];

      let moveData = {
        currentTurn: user,
        nextTurn,
        discName,
        cell
      };

      if (sock) {
        sock.emit('moved', moveData);
      }
    });

  });
});
