import React, { useContext, useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';

const Card = ({ card, onClick, isPlayable }) => {
  const getCardColor = () => {
    switch (card.type) {
      case 'distance': return 'bg-green-600';
      case 'hazard': return 'bg-red-600';
      case 'remedy': return 'bg-blue-600';
      case 'safety': return 'bg-yellow-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div 
      onClick={() => isPlayable && onClick()}
      className={`${getCardColor()} p-4 rounded-lg shadow-lg cursor-pointer 
                  transform transition-transform duration-200 hover:scale-105
                  ${isPlayable ? 'opacity-100' : 'opacity-50'}`}
    >
      <h3 className="text-white font-bold mb-2">{card.value}</h3>
      {card.points && <p className="text-white">{card.points} km</p>}
    </div>
  );
};

const Game = () => {
  const { gameId } = useParams();
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('gameUpdate', (updatedGame) => {
      setGameState(updatedGame);
      // Animation de carte jouée
      if (updatedGame.lastPlayedCard) {
        // TODO: Ajouter animation
      }
    });

    socket.on('gameError', (message) => {
      setError(message);
      setTimeout(() => setError(null), 3000);
    });

    socket.emit('joinGameRoom', { gameId, userId: user.id });

    return () => {
      socket.off('gameUpdate');
      socket.off('gameError');
      socket.emit('leaveGameRoom', { gameId });
    };
  }, [socket, gameId, user.id]);

  const playCard = (cardIndex) => {
    if (socket) {
      socket.emit('playCard', { gameId, cardIndex });
    }
  };

  if (!gameState) return <div>Loading...</div>;

  const currentPlayer = gameState.players.find(p => p.id === user.id);
  const isCurrentTurn = gameState.currentTurn === gameState.players.findIndex(p => p.id === user.id);

  return (
    <div className="p-6">
      {error && (
        <div className="alert alert-error mb-4 animate-bounce">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section des joueurs */}
        <div className="bg-base-300 p-4 rounded-box">
          <h2 className="text-xl mb-4">Joueurs</h2>
          <div className="space-y-4">
            {gameState.players.map((player, index) => (
              <div 
                key={player.id}
                className={`p-4 rounded ${
                  gameState.currentTurn === index 
                    ? 'bg-primary text-primary-content' 
                    : 'bg-base-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{player.id === user.id ? 'Vous' : player.id}</span>
                  <span>{player.distance} km</span>
                </div>
                {/* Status effects */}
                <div className="flex gap-2 mt-2">
                  {player.state?.speedLimit && 
                    <span className="badge badge-warning">Limite</span>}
                  {player.state?.stop && 
                    <span className="badge badge-error">Stop</span>}
                  {/* Add other status effects */}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section de jeu */}
        <div className="bg-base-300 p-4 rounded-box">
          <h2 className="text-xl mb-4">Votre main</h2>
          <div className="grid grid-cols-3 gap-4">
            {currentPlayer?.hand.map((card, index) => (
              <Card
                key={index}
                card={card}
                isPlayable={isCurrentTurn}
                onClick={() => playCard(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Game;