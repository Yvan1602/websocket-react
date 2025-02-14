import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const navigate = useNavigate();
  const [gameId, setGameId] = useState('');
  const [currentGame, setCurrentGame] = useState(null);
  const [playerRooms, setPlayerRooms] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!socket) return;

    // Fetch player's rooms immediately when socket connects
    const fetchPlayerRooms = () => {
      socket.emit('getPlayerRooms', user.id);
    };

    socket.on('connect', () => {
      console.log('Socket connected, fetching rooms...');
      fetchPlayerRooms();
    });

    socket.on('playerRooms', (rooms) => {
      console.log('Received rooms:', rooms);
      setPlayerRooms(rooms);
    });

    socket.on('gameCreated', (game) => {
      setCurrentGame(game);
      setPlayerRooms(prev => [...prev, game]);
      setError('');
      console.log('Game created:', game);
    });

    socket.on('playerJoined', (game) => {
      setCurrentGame(game);
      setPlayerRooms(prev => 
        prev.map(r => r.gameId === game.gameId ? game : r)
      );
      setError('');
      console.log('Game updated:', game);
    });

    socket.on('playerLeft', (game) => {
      setCurrentGame(prev => prev?.gameId === game.gameId ? game : prev);
      setPlayerRooms(prev => 
        prev.map(r => r.gameId === game.gameId ? game : r)
      );
      console.log('Player left:', game);
    });

    socket.on('gameLeft', (gameId) => {
      setCurrentGame(prev => prev?.gameId === gameId ? null : prev);
      setPlayerRooms(prev => prev.filter(r => r.gameId !== gameId));
    });

    socket.on('roomError', (message) => {
      setError(message);
      console.log('Room error:', message);
    });

    socket.on('gameStarted', (game) => {
      setCurrentGame(game);
      setPlayerRooms(prev => 
        prev.map(r => r.gameId === game.gameId ? game : r)
      );
      // Redirection vers la page de jeu
      navigate(`/game/${game.gameId}`);
      console.log('Game started:', game);
    });

    return () => {
      socket.off('connect');
      socket.off('playerRooms');
      socket.off('gameCreated');
      socket.off('playerJoined');
      socket.off('playerLeft');
      socket.off('gameLeft');
      socket.off('roomError');
      socket.off('gameStarted');
    };
  }, [socket, user.id, navigate]);

  const createGame = () => {
    if (socket) {
      socket.emit('createGame', user.id);
    }
  };

  const joinGame = () => {
    if (socket && gameId) {
      setError('');
      socket.emit('joinGame', { gameId, userId: user.id });
    }
  };

  const leaveGame = (gameId) => {
    if (socket) {
      socket.emit('leaveGame', { gameId, userId: user.id });
    }
  };

  const startGame = (gameId) => {
    if (socket) {
      socket.emit('startGame', { gameId, userId: user.id });
    }
  };

  return (
    <div className="p-6">
      <div className="flex gap-4 justify-center mb-4">
        <button onClick={createGame} className="btn btn-primary">
          Créer une partie
        </button>
        <div className="join">
          <input 
            type="text" 
            className="input input-bordered join-item" 
            placeholder="Game ID"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
          />
          <button onClick={joinGame} className="btn btn-secondary join-item">
            Rejoindre
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

      {playerRooms.length > 0 && (
        <div className="mb-4">
          <h2 className="text-xl mb-2">Vos parties</h2>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {playerRooms.map(room => (
              <div key={room.gameId} className="bg-base-300 p-4 rounded-box">
                <p>ID: {room.gameId}</p>
                <p>État: {room.state}</p>
                <p>Joueurs: {room.players.length}/4</p>
                <div className="mt-2">
                  <button 
                    onClick={() => leaveGame(room.gameId)}
                    className="btn btn-error btn-sm"
                  >
                    Quitter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {currentGame && (
        <div className="bg-base-300 p-4 rounded-box">
          <h2 className="text-xl mb-2">Partie en cours</h2>
          <p>ID: {currentGame.gameId}</p>
          <p>État: {currentGame.state} 
            {currentGame.state === 'waiting' && currentGame.players.length === 1 && ' (en attente d\'autres joueurs)'}
            {currentGame.state === 'waiting' && ' (minimum 2 joueurs requis)'}
            {currentGame.state === 'ready' && ' (prêt à commencer)'}
          </p>
          <div className="mt-4">
            <h3 className="text-lg mb-2">
              Joueurs: ({currentGame.players.length}/4)
            </h3>
            <ul className="list-disc pl-4">
              {currentGame.players.map((player, index) => (
                <li key={player.id} className="mb-2">
                  Joueur {index + 1}: {player.id === user.id ? 'Vous' : player.id}
                </li>
              ))}
            </ul>
            {currentGame.players.length < 4 && (
              <p className="text-sm mt-2">
                {4 - currentGame.players.length} place(s) restante(s)
              </p>
            )}
            {currentGame.state === 'ready' && 
             currentGame.players[0].id === user.id && (
              <button 
                onClick={() => startGame(currentGame.gameId)}
                className="btn btn-primary mt-4"
              >
                Lancer la partie
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
