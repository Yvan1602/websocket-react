import { DataTypes } from "@sequelize/core";
import { sequelize } from "../bdd.js";
import User from "./users.js";

const Game = sequelize.define("game", {
	id: {
		type: DataTypes.UUID,
		primaryKey: true,
		defaultValue: DataTypes.UUIDV4,
	},
	state: {
		type: DataTypes.ENUM("waiting", "ready", "playing", "finished"),
		allowNull: false,
		defaultValue: "waiting",
	},
	players: {
		type: DataTypes.JSON,
		allowNull: false,
		defaultValue: [],
	},
	currentTurn: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
	},
	scores: {
		type: DataTypes.JSON,
		defaultValue: {},
	},
	createdBy: {
		type: DataTypes.STRING,
		allowNull: false,
	},
});
Game.belongsTo(User, { targetKey: "id", foreignKey: "creator", as: "player1" });
Game.belongsTo(User, {
	allowNull: true,
	targetKey: "id",
	foreignKey: "player",
	as: "player2",
});
Game.belongsTo(User, {
	allowNull: true,
	targetKey: "id",
	foreignKey: "winner",
	as: "winPlayer",
});

export default Game;
