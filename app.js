const express = require("express");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();
app.use(express.json());

let database = null;

const inilizeDBAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};

inilizeDBAndServer();

//COVERT DBRESPONSE
const convertDBResponsePlayer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

//GET LIST OF PLAYER
app.get("/players/", async (request, response) => {
  const playerQuery = `
    SELECT
    * 
    FROM 
      player_details;`;
  const player = await database.all(playerQuery);
  response.send(
    player.map((eachPlayer) => convertDBResponsePlayer(eachPlayer))
  );
});

//GET perticular ONE PLAYER
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerQuery = `
    SELECT 
    *
     FROM
       player_details
    WHERE
       player_id = ${playerId};`;
  const player = await database.get(playerQuery);
  response.send(convertDBResponsePlayer(player));
});

//PUT METHOD update details specific players
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updateDetailsQuery = `
    UPDATE 
       player_details
    SET 
       player_name = '${playerName}'
    WHERE
        player_id = ${playerId};`;
  await database.run(updateDetailsQuery);
  response.send("Player Details Updated");
});
//covert DBRESPONSE MATCH DETAILS
const convertDBResponseMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//GET SPECIFIC CODE TO GET MATCH DETAILS
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
    * 
    FROM
       match_details
    WHERE
       match_id = ${matchId};`;
  const match = await database.get(getMatchQuery);
  response.send(convertDBResponseMatch(match));
});

//GET specific match and players
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const addTable = `
  SELECT 
    match_details.match_id AS matchId,
    match_details.match AS match,
    match_details.year AS year
  FROM
    match_details INNER JOIN player_match_score ON
    match_details.match_id = player_match_score.match_id
  WHERE
    player_id = ${playerId};`;
  const reqTable = await database.all(addTable);
  response.send(reqTable);
});

//GET SPECIFIC PLAYER MATCH DETAILS
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchIdQuery = `
  SELECT
  player_id AS playerId,
  player_name AS playerName
  FROM
    player_match_score NATURAL JOIN player_details
  WHERE 
    match_id = ${matchId};`;
  const reqTable = await database.all(matchIdQuery);
  response.send(reqTable);
});

//get sum of score etc
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getJoinedTable = `
    SELECT 
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(player_match_score.fours) AS totalFours,
    SUM(player_match_score.sixes) AS totalSixes
    FROM 
     player_details INNER JOIN player_match_score ON
     player_details.player_id = player_match_score.player_id
     WHERE 
       player_details.player_id = ${playerId};`;
  const finalTable = await database.get(getJoinedTable);
  response.send(finalTable);
});

module.exports = app;
