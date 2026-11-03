const ROLE_SET = ['RAJA', 'MANTRI', 'SIPAHI', 'CHOR'];

function generateGameCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function assignRoles(players) {
  const roles = shuffle([...ROLE_SET]);
  return players.reduce((map, player, index) => {
    map[player.userId.toString()] = roles[index];
    return map;
  }, {});
}

function calculateScores(game, accusedUserId = null, mantriGuessUserId = null) {
  const settings = game.settings || {};
  const results = [];
  const roleFor = (player) => {
    if (game.roles instanceof Map) return game.roles.get(player.userId.toString());
    return game.roles?.[player.userId.toString()];
  };

  const chorPlayer = game.players.find((player) => roleFor(player) === 'CHOR');
  const sipahi = game.players.find((player) => roleFor(player) === 'SIPAHI');
  const mantri = game.players.find((player) => roleFor(player) === 'MANTRI');
  const accusedIsChor = Boolean(accusedUserId && chorPlayer && chorPlayer.userId.toString() === accusedUserId.toString());
  const mantriIsCorrect = Boolean(mantriGuessUserId && chorPlayer && chorPlayer.userId.toString() === mantriGuessUserId.toString());

  for (const player of game.players) {
    const role = roleFor(player);
    let pts = 0;
    let result = 'NONE';

    if (role === 'RAJA') {
      pts = settings.raja ?? 1000;
      result = 'RAJA';
    } else if (role === 'MANTRI') {
      if (mantriIsCorrect) {
        pts = settings.mantriCorrect ?? 400;
        result = 'MANTRI_CORRECT';
      } else {
        pts = settings.mantriIncorrect ?? 0;
        result = 'MANTRI_INCORRECT';
      }
    } else if (role === 'SIPAHI') {
      if (accusedIsChor) {
        pts = settings.sipahiCorrect || 500;
        result = 'SIPAHI_CORRECT';
      } else {
        pts = settings.sipahiIncorrect || 0;
        result = 'SIPAHI_INCORRECT';
      }
    } else if (role === 'CHOR') {
      if (accusedIsChor) {
        pts = settings.chorCaught ?? 0;
        result = 'CHOR_CAUGHT';
      } else {
        pts = settings.chorEscapes || 300;
        result = 'CHOR_ESCAPED';
      }
    } else {
      pts = 0;
      result = 'UNASSIGNED';
    }

    results.push({ userId: player.userId, name: player.name, role, points: pts, result, winner: false });
  }

  let winnerId = null;
  if (accusedIsChor && sipahi) {
    winnerId = sipahi.userId;
  } else if (mantriIsCorrect && mantri) {
    winnerId = mantri.userId;
  } else if (chorPlayer) {
    winnerId = chorPlayer.userId;
  }

  for (const outcome of results) {
    if (winnerId && outcome.userId.toString() === winnerId.toString()) outcome.winner = true;
  }

  return { playerResults: results, winnerId };
}

module.exports = { generateGameCode, assignRoles, calculateScores };
