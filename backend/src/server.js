import chalk from "chalk";
//pour fastify
import fastify from "fastify";
import fastifyBcrypt from "fastify-bcrypt";
import cors from "@fastify/cors";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fastifyJWT from "@fastify/jwt";
import { Server } from 'socket.io';
import { createServer } from 'http';
//routes
import { usersRoutes } from "./routes/users.js";
import { gamesRoutes } from "./routes/games.js";
import Game from "./models/games.js";
//bdd
import { sequelize } from "./bdd.js";

//Test de la connexion
try {
	sequelize.authenticate();
	console.log(chalk.grey("Connecté à la base de données MySQL!"));
} catch (error) {
	console.error("Impossible de se connecter, erreur suivante :", error);
}

/**
 * API
 * avec fastify
 */
let blacklistedTokens = [];
const app = fastify();
//Ajout du plugin fastify-bcrypt pour le hash du mdp
await app
	.register(fastifyBcrypt, {
		saltWorkFactor: 12,
	})
	.register(cors, {
		origin: ["http://localhost:5173"],
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		credentials: true
	})
	.register(fastifySwagger, {
		openapi: {
			openapi: "3.0.0",
			info: {
				title: "Documentation de l'API JDR LOTR",
				description:
					"API développée pour un exercice avec React avec Fastify et Sequelize",
				version: "0.1.0",
			},
		},
	})
	.register(fastifySwaggerUi, {
		routePrefix: "/documentation",
		theme: {
			title: "Docs - JDR LOTR API",
		},
		uiConfig: {
			docExpansion: "list",
			deepLinking: false,
		},
		uiHooks: {
			onRequest: function (request, reply, next) {
				next();
			},
			preHandler: function (request, reply, next) {
				next();
			},
		},
		staticCSP: true,
		transformStaticCSP: (header) => header,
		transformSpecification: (swaggerObject, request, reply) => {
			return swaggerObject;
		},
		transformSpecificationClone: true,
	})
	.register(fastifyJWT, {
		secret: "unanneaupourlesgouvernertous",
	});
/**********
 * Routes
 **********/
app.get("/", (request, reply) => {
	reply.send({ documentationURL: "http://localhost:3000/documentation" });
});
// Fonction pour décoder et vérifier le token
app.decorate("authenticate", async (request, reply) => {
  try {
    const token = request.headers["authorization"].split(" ")[1];

    if (blacklistedTokens.includes(token)) {
      return reply
        .status(401)
        .send({ error: "Token invalide ou expiré" });
    }
    await request.jwtVerify();
  } catch (err) {
    reply.send(err);
  }
});
//gestion utilisateur
usersRoutes(app,blacklistedTokens);
//gestion des jeux
gamesRoutes(app);

/**********
 * START
 **********/
const start = async () => {
	try {
		await sequelize
			.sync({ alter: true })
			.then(() => {
				console.log(chalk.green("Base de données synchronisée."));
			})
			.catch((error) => {
				console.error(
					"Erreur de synchronisation de la base de données :",
					error
				);
			});

		// Démarrer Fastify d'abord
		await app.listen({ port: 3000, host: '0.0.0.0' });
		console.log(chalk.grey('Fastify server running at http://localhost:3000'));

		// Configurer Socket.IO pour utiliser le serveur Fastify
		const io = new Server(app.server, {
			cors: {
				origin: "http://localhost:5173",
				methods: ["GET", "POST"]
			}
		});

		 // Stockage des rooms actives
		const activeRooms = new Map();
		const activeGames = new Map();
		const cardsPerPlayer = 6;

		// Structure d'une carte
		const cardTypes = {
			distance: ['25', '50', '75', '100'],
			hazard: ['Stop', 'SpeedLimit', 'OutOfGas', 'Accident', 'FlatTire'],
			remedy: ['Go', 'EndOfLimit', 'Gasoline', 'Repairs', 'SpareTire'],
			safety: ['DrivingAce', 'FuelTruck', 'PunctureProof', 'RightOfWay']
		};

		 // Fonctions utilitaires pour le jeu
		function shuffleDeck() {
			const deck = [];
			
			// Distance cards (46 cards)
			const distanceCards = [
				...Array(10).fill({ type: 'distance', value: '25', points: 25 }),
				...Array(10).fill({ type: 'distance', value: '50', points: 50 }),
				...Array(10).fill({ type: 'distance', value: '75', points: 75 }),
				...Array(12).fill({ type: 'distance', value: '100', points: 100 }),
			];
		  
			// Hazard cards (30 cards)
			const hazardCards = [
				...Array(5).fill({ type: 'hazard', value: 'Stop' }),
				...Array(4).fill({ type: 'hazard', value: 'SpeedLimit' }),
				...Array(3).fill({ type: 'hazard', value: 'OutOfGas' }),
				...Array(3).fill({ type: 'hazard', value: 'FlatTire' }),
				...Array(3).fill({ type: 'hazard', value: 'Accident' }),
			];
		  
			// Remedy cards (38 cards)
			const remedyCards = [
				...Array(14).fill({ type: 'remedy', value: 'Go' }),
				...Array(6).fill({ type: 'remedy', value: 'EndOfLimit' }),
				...Array(6).fill({ type: 'remedy', value: 'Gasoline' }),
				...Array(6).fill({ type: 'remedy', value: 'SpareTire' }),
				...Array(6).fill({ type: 'remedy', value: 'Repairs' }),
			];
		  
			// Safety cards (4 cards)
			const safetyCards = [
				{ type: 'safety', value: 'RightOfWay' },
				{ type: 'safety', value: 'FuelTruck' },
				{ type: 'safety', value: 'PunctureProof' },
				{ type: 'safety', value: 'DrivingAce' },
			];
		  
			// Combine all cards and shuffle
			return [...distanceCards, ...hazardCards, ...remedyCards, ...safetyCards]
				.sort(() => Math.random() - 0.5);
		}
		  
		// Ajoutez ces fonctions de vérification des règles
		function canPlayCard(gameState, playerId, cardIndex) {
			const player = gameState.players.find(p => p.id === playerId);
			const card = player.hand[cardIndex];
			const playerState = player.state || {};
		  
			switch (card.type) {
			  case 'distance':
				return !playerState.speedLimit && 
					   !playerState.stop && 
					   (playerState.distance + card.points <= 1000);
			  
			  case 'hazard':
				const targetPlayer = gameState.players[(gameState.currentTurn + 1) % gameState.players.length];
				return !targetPlayer.state?.safeties?.[card.value];
			  
			  case 'remedy':
				return playerState[getHazardForRemedy(card.value)];
			  
			  case 'safety':
				return true;
			}
		}

		// Configuration des événements Socket.IO
		io.on("connection", (socket) => {
			console.log("Client connected:", socket.id);

			socket.on("createGame", (userId) => {
				const gameId = Math.random().toString(36).substring(7);
				const gameData = {
					gameId,
					players: [{ id: userId, socketId: socket.id }],
					state: 'waiting'
				};
				activeRooms.set(gameId, gameData);
				socket.join(gameId);
				socket.emit('gameCreated', gameData);
			});

			socket.on("joinGame", ({ gameId, userId }) => {
				const room = activeRooms.get(gameId);
				
				if (!room) {
					socket.emit('roomError', 'Room not found');
					return;
				}

				// Vérifier si le joueur est déjà dans la room
				if (room.players.some(player => player.id === userId)) {
					socket.emit('roomError', 'You are already in this room');
					return;
				}

				// Vérifier si la room est pleine (4 joueurs max)
				if (room.players.length >= 4) {
					socket.emit('roomError', 'Room is full (max 4 players)');
					return;
				}

				// Ajouter le nouveau joueur
				room.players.push({ id: userId, socketId: socket.id });
				
				// Mettre à jour l'état en fonction du nombre de joueurs
				room.state = room.players.length >= 2 ? 'ready' : 'waiting';
				activeRooms.set(gameId, room);
				
				socket.join(gameId);
				io.to(gameId).emit('playerJoined', room);
			});

			socket.on("disconnect", () => {
				activeRooms.forEach((room, gameId) => {
					const updatedPlayers = room.players.filter(p => p.socketId !== socket.id);
					if (updatedPlayers.length === 0) {
						activeRooms.delete(gameId);
					} else {
						room.players = updatedPlayers;
						// Mettre à jour l'état si moins de 2 joueurs
						room.state = updatedPlayers.length >= 2 ? 'ready' : 'waiting';
						activeRooms.set(gameId, room);
						io.to(gameId).emit('playerLeft', room);
					}
				});
				console.log("Client disconnected:", socket.id);
			});

			// Ajouter cette fonction pour obtenir les rooms d'un joueur
			socket.on("getPlayerRooms", (userId) => {
				const playerRooms = [];
				activeRooms.forEach((room) => {
					if (room.players.some(player => player.id === userId)) {
						playerRooms.push(room);
					}
				});
				console.log(`Sending rooms for user ${userId}:`, playerRooms);
				socket.emit('playerRooms', playerRooms);
			});

			socket.on("leaveGame", ({ gameId, userId }) => {
				const room = activeRooms.get(gameId);
				if (room) {
					room.players = room.players.filter(p => p.id !== userId);
					if (room.players.length === 0) {
						activeRooms.delete(gameId);
					} else {
						room.state = room.players.length >= 2 ? 'ready' : 'waiting';
						activeRooms.set(gameId, room);
						io.to(gameId).emit('playerLeft', room);
					}
					socket.leave(gameId);
					socket.emit('gameLeft', gameId);
				}
			});

			socket.on("startGame", async ({ gameId, userId }) => {
				try {
					const room = activeRooms.get(gameId);
					
					if (!room) {
					  socket.emit('roomError', 'Room not found');
					  return;
					}
				
					if (room.players.length < 2) {
					  socket.emit('roomError', 'Need at least 2 players to start');
					  return;
					}
				
					if (room.players[0].id !== userId) {
					  socket.emit('roomError', 'Only room creator can start the game');
					  return;
					}
				
					// Initialiser le jeu
					const gameState = {
					  gameId,
					  state: 'playing',
					  deck: shuffleDeck(),
					  players: room.players.map(player => ({
						...player,
						hand: [],
						pile: [],
						safety: [],
						speed: 50,
						distance: 0,
						state: {},
						canPlay: true
					  })),
					  currentTurn: 0,
					  scores: room.players.reduce((acc, player) => {
						acc[player.id] = 0;
						return acc;
					  }, {})
					};
				
					// Distribuer les cartes
					gameState.players.forEach(player => {
					  player.hand = gameState.deck.splice(0, 6);
					});
				
					// Sauvegarder dans la Map des jeux actifs
					activeGames.set(gameId, gameState);
				
					try {
					  // Sauvegarder en BDD avec uniquement les données nécessaires
					  await Game.create({
						id: gameId,
						state: 'playing',
						players: room.players, // Le setter du modèle s'occupera de la conversion en JSON
						createdBy: userId,
						lastUpdate: new Date()
					  });
				
					  // Mettre à jour la room
					  room.state = 'playing';
					  room.gameStarted = true;
					  activeRooms.set(gameId, room);
				
					  // Notifier tous les joueurs
					  io.to(gameId).emit('gameStarted', gameState);
					  io.to(gameId).emit('gameUpdate', gameState);
				
					} catch (dbError) {
					  console.error('Database error:', dbError);
					  console.error('Error details:', dbError.message);
					  // Si erreur BDD, nettoyer le gameState
					  activeGames.delete(gameId);
					  socket.emit('roomError', `Failed to save game: ${dbError.message}`);
					  return;
					}
				
				  } catch (error) {
					console.error('Error starting game:', error);
					socket.emit('roomError', 'Failed to initialize game');
				  }
			});

			socket.on("joinGameRoom", ({ gameId, userId }) => {
				const game = activeGames.get(gameId);
				if (!game) {
					socket.emit('gameError', 'Game not found');
					return;
				}
			  
				if (!game.players.some(p => p.id === userId)) {
					socket.emit('gameError', 'You are not part of this game');
					return;
				}
			  
				socket.join(gameId);
				socket.emit('gameUpdate', game);
			});
			  
			socket.on("leaveGameRoom", ({ gameId }) => {
				socket.leave(gameId);
			});

			// Dans la partie Socket.IO, ajoutez la gestion du jeu de carte
			socket.on("playCard", ({ gameId, cardIndex }) => {
				const game = activeGames.get(gameId);
				if (!game) {
				  socket.emit('gameError', 'Game not found');
				  return;
				}
			  
				const player = game.players[game.currentTurn];
				if (player.socketId !== socket.id) {
				  socket.emit('gameError', 'Not your turn');
				  return;
				}
			  
				if (!canPlayCard(game, player.id, cardIndex)) {
				  socket.emit('gameError', 'Cannot play this card');
				  return;
				}
			  
				const card = player.hand.splice(cardIndex, 1)[0];
				applyCardEffect(game, player.id, card);
				
				// Draw a new card
				if (game.deck.length > 0) {
				  player.hand.push(game.deck.pop());
				}
			  
				// Next turn
				game.currentTurn = (game.currentTurn + 1) % game.players.length;
				
				// Check for win condition
				if (player.distance >= 1000) {
				  game.state = 'finished';
				  game.winner = player.id;
				}
			  
				io.to(gameId).emit('gameUpdate', game);
			  });
		});

	} catch (err) {
		console.log(err);
		process.exit(1);
	}
};

start();
