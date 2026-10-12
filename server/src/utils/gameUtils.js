const ROLE_SET = ['RAJA', 'SIPAHI', 'CHOR', 'OTHER'];

function generateGameCode() {
  // simple 6 char code A-Z0-9
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

function calculateScores(game, accusedUserId = null) {
  // find roles
  const settings = game.settings || {};
  const results = [];
  let winnerId = null;
  // find chor
  const roleFor = (player) => game.roles.get ? game.roles.get(player.userId.toString()) : game.roles[player.userId.toString()];
  const chorPlayer = game.players.find(p => roleFor(p) === 'CHOR');
  const sipahi = game.players.find(p => roleFor(p) === 'SIPAHI');
  const accusedIsChor = Boolean(accusedUserId && chorPlayer && chorPlayer.userId.toString() === accusedUserId.toString());
  for (const p of game.players) {
    const role = roleFor(p);
    let pts = 0;
    let result = 'NONE';
    if (role === 'RAJA') { pts = settings.raja ?? 1000; result = 'RAJA'; }
    else if (role === 'SIPAHI') {
      if (accusedIsChor) { pts = settings.sipahiCorrect || 500; result = 'SIPAHI_CORRECT'; }
      else { pts = settings.sipahiIncorrect || 0; result = 'SIPAHI_INCORRECT'; }
    } else if (role === 'CHOR') {
      if (accusedIsChor) { pts = 0; result = 'CHOR_CAUGHT'; }
      else { pts = settings.chorEscapes || 300; result = 'CHOR_ESCAPED'; }
    } else { pts = settings.other ?? 100; result = 'OTHER'; }
    results.push({ userId: p.userId, name: p.name, role, points: pts, result, winner: false });
  }
  // determine winner: if sipahi correct, SIPAHI wins, else CHOR wins
  if (accusedIsChor && sipahi) {
    winnerId = sipahi.userId;
  } else if (!accusedIsChor && chorPlayer) {
    winnerId = chorPlayer.userId;
  }
  // mark winner flags
  for (const r of results) {
    if (winnerId && r.userId.toString() === winnerId.toString()) r.winner = true;
  }
  return { playerResults: results, winnerId };
}

module.exports = { generateGameCode, assignRoles, calculateScores };
