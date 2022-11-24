const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertPlayerDetailsDbToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDetailsDbToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersDetails = `
    SELECT * FROM player_details ORDER BY player_id;
    `;
  const playersArray = await db.all(getPlayersDetails);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDetailsDbToResponseObject(eachPlayer)
    )
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT * FROM player_details WHERE player_id = ${playerId};
    `;
  const player = await db.get(getPlayer);
  response.send(convertPlayerDetailsDbToResponseObject(player));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayer = `
    UPDATE player_details SET
    player_name = '${playerName}'
    WHERE player_id = ${playerId};
    `;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetails = `
    SELECT * FROM match_details WHERE match_id = ${matchId};
    `;
  const getMatch = await db.get(getMatchDetails);
  response.send(convertMatchDetailsDbToResponseObject(getMatch));
});

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const playerMatches = `
    SELECT match_id, match, year FROM match_details 
    NATURAL JOIN player_match_score
    WHERE player_id =${playerId};
    `;
  const getPlayersArray = await db.all(playerMatches);
  response.send(
    getPlayersArray.map((eachMatch) =>
      convertMatchDetailsDbToResponseObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const playerMatch = `
    SELECT player_id, player_name 
    FROM player_details
    NATURAL JOIN player_match_score 
    WHERE match_id = ${matchId};
    `;
  const getPlayerDetails = await db.all(playerMatch);
  response.send(
    getPlayerDetails.map((eachMatch) =>
      convertPlayerDetailsDbToResponseObject(eachMatch)
    )
  );
});

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStaticsQuery = `
          SELECT 
             player_id AS playerId,
             player_name AS playerName,
             SUM(score) AS totalScore,
             SUM(fours) AS totalFours,
             SUM(sixes) AS totalSixes
        FROM 
           player_details NATURAL JOIN player_match_score
        WHERE
           player_details.player_id = ${playerId};
    `;
  const sumRes = await db.get(getStaticsQuery);
  response.send(sumRes);
});

module.exports = app;
