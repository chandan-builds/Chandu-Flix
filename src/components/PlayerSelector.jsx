import { useState, useEffect } from 'react';
import './PlayerSelector.css';

const SERVERS = [
  { id: 'vidlink', name: 'VidLink', tag: '⚡ Native', tier: 'primary' },
  { id: 'peachify', name: 'Peachify', tag: '🔥 Best', tier: 'primary' },
  { id: 'vidking', name: 'VidKing', tag: 'Fast', tier: 'primary' },
  { id: 'moviebox', name: 'MovieBox', tag: 'Native Alt', tier: 'primary' },
  { id: 'vidsrc', name: 'VidSrc', tag: 'Clean', tier: 'secondary' },
  { id: 'twoembed', name: '2Embed', tag: 'Alt', tier: 'secondary' },
  { id: 'nontongo', name: 'NontonGo', tag: 'Alt', tier: 'secondary' },
  { id: 'smashy', name: 'Smashy', tag: 'Alt', tier: 'secondary' },
];

const PlayerSelector = ({ onPlayerChange }) => {
  const [selectedPlayer, setSelectedPlayer] = useState(() => {
    return localStorage.getItem('preferred_player') || 'vidlink';
  });

  useEffect(() => {
    localStorage.setItem('preferred_player', selectedPlayer);
    onPlayerChange(selectedPlayer);
  }, [selectedPlayer, onPlayerChange]);

  return (
    <div className="server-selector">
      <div className="server-selector-header">
        <span className="server-selector-label">
          <span className="server-label-dot" />
          Stream Servers
        </span>
        <span className="server-selector-hint">Switch if one doesn't load</span>
      </div>
      <div className="server-pills">
        {SERVERS.map((server) => (
          <button
            key={server.id}
            className={`server-pill ${selectedPlayer === server.id ? 'active' : ''} ${server.tier}`}
            onClick={() => setSelectedPlayer(server.id)}
          >
            <span className="server-pill-name">{server.name}</span>
            {server.tag && <span className="server-pill-tag">{server.tag}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default PlayerSelector;
