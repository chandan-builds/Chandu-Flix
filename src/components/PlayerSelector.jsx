import { useState, useEffect } from 'react';
import './PlayerSelector.css';

const PlayerSelector = ({ onPlayerChange }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(() => {
    return localStorage.getItem('preferred_player') || 'peachify';
  });

  useEffect(() => {
    localStorage.setItem('preferred_player', selectedPlayer);
    onPlayerChange(selectedPlayer);
  }, [selectedPlayer, onPlayerChange]);

  return (
    <div className="player-selector-container">
      <label className="player-selector-label" htmlFor="player-select">
        Stream Server:
      </label>
      <select
        id="player-select"
        value={selectedPlayer}
        onChange={(e) => setSelectedPlayer(e.target.value)}
        className="player-select-dropdown"
      >
        <option value="peachify">Peachify Player (Multi-language & Quality)</option>
        <option value="vidking">VidKing Player (High Speed)</option>
      </select>
    </div>
  );
};

export default PlayerSelector;
