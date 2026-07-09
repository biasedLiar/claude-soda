// @ts-check
'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../public/app.db');
const outPath = path.resolve(__dirname, '../src/data/db.json');

const db = new Database(dbPath, { readonly: true });

const data = {
  players: db.prepare('SELECT * FROM Player ORDER BY id').all(),
  sodas: db.prepare('SELECT * FROM Soda ORDER BY id').all(),
  competitions: db.prepare('SELECT * FROM Competition ORDER BY id').all(),
  competitionSodas: db.prepare('SELECT * FROM CompetitionSoda ORDER BY competitionId, sodaId').all(),
  guesses: db.prepare('SELECT * FROM Guess ORDER BY id').all(),
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(data, null, 2));

console.log(
  `Generated src/data/db.json — ` +
  `${data.players.length} players, ${data.sodas.length} sodas, ` +
  `${data.competitions.length} competitions, ${data.guesses.length} guesses`
);
