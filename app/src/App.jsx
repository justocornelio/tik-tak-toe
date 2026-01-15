"use client";

import { useEffect, useMemo, useState } from "react";
import { Trophy, RefreshCw, Zap, Brain, TrendingUp, Star } from "lucide-react";
import "./App.css";

function App() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [score, setScore] = useState({ player: 0, cpu: 0, draws: 0 });
  const [difficulty, setDifficulty] = useState("easy");
  const [gameHistory, setGameHistory] = useState([]);
  const [highlightedCells, setHighlightedCells] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState({ wins: 0, required: 3 });
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [streak, setStreak] = useState(0);

  const difficultyConfig = useMemo(
    () => ({
      easy: { 
        label: "Fácil", 
        icon: "🌱",
        smartChance: 0.25, 
        mistakeChance: 0.55, 
        depthLimit: 1, 
        thinkMs: [200, 400],
        description: "Ideal para principiantes"
      },
      medium: { 
        label: "Intermedio", 
        icon: "⚡",
        smartChance: 0.6, 
        mistakeChance: 0.25, 
        depthLimit: 3, 
        thinkMs: [300, 600],
        description: "Un desafío equilibrado"
      },
      hard: { 
        label: "Difícil", 
        icon: "🔥",
        smartChance: 0.9, 
        mistakeChance: 0.08, 
        depthLimit: 7, 
        thinkMs: [400, 800],
        description: "Para jugadores experimentados"
      },
      expert: { 
        label: "Experto", 
        icon: "🧠",
        smartChance: 0.97, 
        mistakeChance: 0.03, 
        depthLimit: 9, 
        thinkMs: [500, 1000],
        description: "Requiere estrategia avanzada"
      },
      master: { 
        label: "Maestro", 
        icon: "👑",
        smartChance: 0.995, 
        mistakeChance: 0.01, 
        depthLimit: 9, 
        thinkMs: [600, 1200],
        description: "Casi perfecto"
      }
    }),
    []
  );

  const levelConfig = useMemo(
    () => ({
      1: { 
        difficulty: "easy", 
        name: "Principiante", 
        requiredWins: 3,
        icon: "🌱"
      },
      2: { 
        difficulty: "medium", 
        name: "Aprendiz", 
        requiredWins: 4,
        icon: "⚡"
      },
      3: { 
        difficulty: "hard", 
        name: "Competitivo", 
        requiredWins: 5,
        icon: "🔥"
      },
      4: { 
        difficulty: "expert", 
        name: "Estratega", 
        requiredWins: 6,
        icon: "🧠"
      },
      5: { 
        difficulty: "master", 
        name: "Maestro", 
        requiredWins: 7,
        icon: "👑"
      },
      6: { 
        difficulty: "random", 
        name: "Campeón", 
        requiredWins: 10,
        icon: "🏆"
      }
    }),
    []
  );

  const getRandomDifficulty = (exclude = null) => {
    const difficulties = Object.keys(difficultyConfig);
    let randomDiff;
    do {
      randomDiff = difficulties[Math.floor(Math.random() * difficulties.length)];
    } while (exclude && randomDiff === exclude);
    return randomDiff;
  };

  useEffect(() => {
    const level = levelConfig[currentLevel];
    if (level.difficulty === "random") {
      setDifficulty(getRandomDifficulty());
    } else {
      setDifficulty(level.difficulty);
    }
  }, [currentLevel, levelConfig]);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2],[3, 4, 5],[6, 7, 8],
      [0, 3, 6],[1, 4, 7],[2, 5, 8],
      [0, 4, 8],[2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { player: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const checkDraw = (squares) => squares.every((c) => c !== null) && !calculateWinner(squares);

  const getEmptyCells = (squares) =>
    squares.map((c, i) => (c === null ? i : null)).filter((x) => x !== null);

  const positionalScore = (index) => {
    if (index === 4) return 3;
    if ([0, 2, 6, 8].includes(index)) return 2;
    return 1;
  };

  const findImmediateTactic = (currentBoard, me = "O") => {
    const empty = getEmptyCells(currentBoard);
    const opponent = me === "O" ? "X" : "O";

    for (const idx of empty) {
      const b = [...currentBoard];
      b[idx] = me;
      if (calculateWinner(b)?.player === me) return idx;
    }

    for (const idx of empty) {
      const b = [...currentBoard];
      b[idx] = opponent;
      if (calculateWinner(b)?.player === opponent) return idx;
    }

    return null;
  };

  const minimax = (squares, depth, isMaximizing, alpha, beta, depthLimit) => {
    const result = calculateWinner(squares);
    if (result?.player === "O") return 100 - depth;
    if (result?.player === "X") return depth - 100;
    if (checkDraw(squares)) return 0;
    if (depth >= depthLimit) return 0;

    const empty = getEmptyCells(squares);

    if (isMaximizing) {
      let best = -Infinity;
      for (const idx of empty) {
        squares[idx] = "O";
        const score = minimax(squares, depth + 1, false, alpha, beta, depthLimit);
        squares[idx] = null;

        const tieBreak = positionalScore(idx) * 0.01;
        best = Math.max(best, score + tieBreak);

        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const idx of empty) {
        squares[idx] = "X";
        const score = minimax(squares, depth + 1, true, alpha, beta, depthLimit);
        squares[idx] = null;

        best = Math.min(best, score);
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  };

  const findBestMove = (currentBoard, depthLimit) => {
    const empty = getEmptyCells(currentBoard);
    if (empty.length === 0) return null;

    const tactic = findImmediateTactic(currentBoard, "O");
    if (tactic !== null) return tactic;

    let bestScore = -Infinity;
    let bestMove = empty[0];

    for (const idx of empty) {
      currentBoard[idx] = "O";
      const score = minimax(currentBoard, 0, false, -Infinity, Infinity, depthLimit);
      currentBoard[idx] = null;

      if (score > bestScore) {
        bestScore = score;
        bestMove = idx;
      } else if (score === bestScore) {
        if (positionalScore(idx) > positionalScore(bestMove)) bestMove = idx;
      }
    }
    return bestMove;
  };

  const cpuMove = (currentBoard) => {
    const empty = getEmptyCells(currentBoard);
    if (empty.length === 0) return null;

    const cfg = difficultyConfig[difficulty] ?? difficultyConfig.easy;
    const shouldMistake = Math.random() < cfg.mistakeChance;

    for (const idx of empty) {
      const b = [...currentBoard];
      b[idx] = "O";
      if (calculateWinner(b)?.player === "O") return idx;
    }

    const smartQuick = () => {
      const tactic = findImmediateTactic(currentBoard, "O");
      if (tactic !== null) return tactic;
      if (currentBoard[4] === null) return 4;

      const corners = [0, 2, 6, 8].filter((i) => currentBoard[i] === null);
      if (corners.length) return corners[Math.floor(Math.random() * corners.length)];

      return empty[Math.floor(Math.random() * empty.length)];
    };

    if (shouldMistake) {
      const safeMoves = empty.filter((idx) => {
        const b = [...currentBoard];
        b[idx] = "O";
        const nextEmpty = getEmptyCells(b);
        for (const j of nextEmpty) {
          const bb = [...b];
          bb[j] = "X";
          if (calculateWinner(bb)?.player === "X") return false;
        }
        return true;
      });
      const pool = safeMoves.length ? safeMoves : empty;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    const useSmart = Math.random() < cfg.smartChance;
    if (!useSmart) return smartQuick();

    return findBestMove([...currentBoard], cfg.depthLimit);
  };

  const handleLevelUp = () => {
    setShowLevelUp(true);
    setTimeout(() => {
      setShowLevelUp(false);
      const nextLevel = currentLevel + 1;
      if (nextLevel <= Object.keys(levelConfig).length) {
        setCurrentLevel(nextLevel);
        const newLevel = levelConfig[nextLevel];
        setLevelProgress({ wins: 0, required: newLevel.requiredWins });
        resetGame();
      }
    }, 2000);
  };

  const handleCellClick = (index) => {
    if (board[index] || winner || !isPlayerTurn || thinking) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setIsPlayerTurn(false);

    const winResult = calculateWinner(newBoard);
    if (winResult) {
      setWinner(winResult);
      setHighlightedCells(winResult.line);
      
      if (winResult.player === "X") {
        const newStreak = streak + 1;
        setStreak(newStreak);
        
        const newPlayerScore = score.player + 1;
        setScore((prev) => ({ ...prev, player: newPlayerScore }));
        
        const newWins = levelProgress.wins + 1;
        if (newWins >= levelProgress.required) {
          handleLevelUp();
        } else {
          setLevelProgress(prev => ({ ...prev, wins: newWins }));
        }
      } else {
        setStreak(0);
        setScore((prev) => ({ ...prev, cpu: prev.cpu + 1 }));
      }
      
      setGameHistory((prev) => [
        ...prev,
        { winner: winResult.player === "X" ? "Jugador" : "CPU", moves: newBoard.filter((c) => c !== null).length, difficulty, level: currentLevel },
      ]);
      return;
    }

    if (checkDraw(newBoard)) {
      setIsDraw(true);
      setStreak(0);
      setScore((prev) => ({ ...prev, draws: prev.draws + 1 }));
      setGameHistory((prev) => [...prev, { winner: "Empate", moves: 9, difficulty, level: currentLevel }]);
      return;
    }

    setThinking(true);
    const cfg = difficultyConfig[difficulty] ?? difficultyConfig.easy;
    const [minMs, maxMs] = cfg.thinkMs;
    const delay = minMs + Math.random() * (maxMs - minMs);

    setTimeout(() => {
      const cpuIndex = cpuMove(newBoard);

      if (cpuIndex !== null) {
        const afterCpu = [...newBoard];
        afterCpu[cpuIndex] = "O";
        setBoard(afterCpu);

        const cpuWin = calculateWinner(afterCpu);
        if (cpuWin) {
          setWinner(cpuWin);
          setHighlightedCells(cpuWin.line);
          setStreak(0);
          setScore((prev) => ({ ...prev, cpu: prev.cpu + 1 }));
          setGameHistory((prev) => [
            ...prev,
            { winner: "CPU", moves: afterCpu.filter((c) => c !== null).length, difficulty, level: currentLevel },
          ]);
        } else if (checkDraw(afterCpu)) {
          setIsDraw(true);
          setStreak(0);
          setScore((prev) => ({ ...prev, draws: prev.draws + 1 }));
          setGameHistory((prev) => [...prev, { winner: "Empate", moves: 9, difficulty, level: currentLevel }]);
        } else {
          setIsPlayerTurn(true);
        }
      }

      setThinking(false);
    }, delay);
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setWinner(null);
    setIsDraw(false);
    setHighlightedCells([]);
    setThinking(false);
  };

  const resetAll = () => {
    resetGame();
    setScore({ player: 0, cpu: 0, draws: 0 });
    setGameHistory([]);
    setCurrentLevel(1);
    setLevelProgress({ wins: 0, required: 3 });
    setStreak(0);
  };

  const renderCell = (index) => {
    const isHighlighted = highlightedCells.includes(index);
    const v = board[index];

    return (
      <button
        key={index}
        type="button"
        className={`ttt-cell ${isHighlighted ? 'ttt-cell-highlighted' : ''} ${v === "X" ? 'ttt-cell-x' : v === "O" ? 'ttt-cell-o' : 'ttt-cell-empty'}`}
        onClick={() => handleCellClick(index)}
        disabled={!!v || !!winner || !isPlayerTurn || thinking}
        aria-label={`Celda ${index} ${v ? `con ${v}` : 'vacía'}`}
      >
        {v === "X" ? "✕" : v === "O" ? "○" : ""}
      </button>
    );
  };

  const currentLevelInfo = levelConfig[currentLevel];
  const currentDiffInfo = difficultyConfig[difficulty];

  return (
    <div className="ttt-app">
      {/* Nivel Up Animation */}
      {showLevelUp && (
        <div className="ttt-level-up-overlay">
          <div className="ttt-level-up-modal">
            <Trophy className="ttt-level-up-icon" />
            <h2 className="ttt-level-up-title">¡Nivel Completado!</h2>
            <p className="ttt-level-up-subtitle">Avanzas al nivel {currentLevel + 1}</p>
            <div className="ttt-level-up-next">
              {levelConfig[currentLevel + 1]?.icon} {levelConfig[currentLevel + 1]?.name}
            </div>
          </div>
        </div>
      )}

      <div className="ttt-container">
        {/* Header */}
        <header className="ttt-header">
          <div className="ttt-header-content">
            <div className="ttt-header-title">
              <h1 className="ttt-title">Tic Tac Toe</h1>
              <p className="ttt-subtitle">Demuestra tu estrategia</p>
            </div>
            
            {/* Level Indicator */}
            <div className="ttt-header-controls">
              <div className={`ttt-level-indicator ttt-level-${currentLevel}`}>
                <div className="ttt-level-indicator-content">
                  <span className="ttt-level-icon">{currentLevelInfo.icon}</span>
                  <div className="ttt-level-info">
                    <div className="ttt-level-number">Nivel {currentLevel}</div>
                    <div className="ttt-level-name">{currentLevelInfo.name}</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={resetAll}
                className="ttt-reset-all-button"
              >
                <RefreshCw size={18} />
                Reiniciar todo
              </button>
            </div>
          </div>
        </header>

        <div className="ttt-grid">
          {/* Left Panel */}
          <div className="ttt-left-panel">
            {/* Score Card */}
            <div className="ttt-card">
              <div className="ttt-card-header">
                <h2 className="ttt-card-title">Marcador</h2>
                <div className="ttt-streak">
                  <Zap size={16} className="ttt-streak-icon" />
                  <span className="ttt-streak-text">Racha: {streak}</span>
                </div>
              </div>
              
              <div className="ttt-score-grid">
                <div className="ttt-score-item ttt-score-player">
                  <div className="ttt-score-label">Jugador</div>
                  <div className="ttt-score-value">{score.player}</div>
                  <div className="ttt-score-symbol">✕</div>
                </div>
                
                <div className="ttt-score-item ttt-score-draws">
                  <div className="ttt-score-label">Empates</div>
                  <div className="ttt-score-value">{score.draws}</div>
                  <div className="ttt-score-symbol">–</div>
                </div>
                
                <div className="ttt-score-item ttt-score-cpu">
                  <div className="ttt-score-label">CPU</div>
                  <div className="ttt-score-value">{score.cpu}</div>
                  <div className="ttt-score-symbol">○</div>
                </div>
              </div>
            </div>

            {/* Progress Card */}
            <div className="ttt-card">
              <div className="ttt-card-header">
                <h2 className="ttt-card-title">Progreso del Nivel</h2>
                <TrendingUp size={18} className="ttt-card-icon" />
              </div>
              
              <div className="ttt-progress-container">
                <div className="ttt-progress-info">
                  <span className="ttt-progress-label">Victorias: {levelProgress.wins}/{levelProgress.required}</span>
                  <span className="ttt-progress-percent">
                    {Math.round((levelProgress.wins / levelProgress.required) * 100)}%
                  </span>
                </div>
                <div className="ttt-progress-bar">
                  <div 
                    className="ttt-progress-fill"
                    style={{ width: `${(levelProgress.wins / levelProgress.required) * 100}%` }}
                  />
                </div>
              </div>
              
              <div className="ttt-progress-hint">
                Necesitas {levelProgress.required - levelProgress.wins} victoria(s) más para subir de nivel
              </div>
            </div>

            {/* Difficulty Info */}
            <div className="ttt-card">
              <div className="ttt-card-header">
                <h2 className="ttt-card-title">Dificultad</h2>
                <div className={`ttt-difficulty-badge ttt-difficulty-${difficulty}`}>
                  {currentDiffInfo.icon} {currentDiffInfo.label}
                </div>
              </div>
              
              <div className="ttt-stats-grid">
                <div className="ttt-stat-item">
                  <span className="ttt-stat-label">Inteligencia</span>
                  <span className="ttt-stat-value">{Math.round(currentDiffInfo.smartChance * 100)}%</span>
                </div>
                <div className="ttt-stat-item">
                  <span className="ttt-stat-label">Prob. de error</span>
                  <span className="ttt-stat-value">{Math.round(currentDiffInfo.mistakeChance * 100)}%</span>
                </div>
                <div className="ttt-stat-item">
                  <span className="ttt-stat-label">Velocidad CPU</span>
                  <span className="ttt-stat-value">{currentDiffInfo.thinkMs[0]}-{currentDiffInfo.thinkMs[1]}ms</span>
                </div>
              </div>
              
              <div className="ttt-difficulty-description">
                <p>{currentDiffInfo.description}</p>
              </div>
            </div>
          </div>

          {/* Main Game Area */}
          <div className="ttt-right-panel">
            {/* Game Board */}
            <div className="ttt-card ttt-game-board">
              <div className="ttt-board-header">
                <div>
                  <h2 className="ttt-card-title">Tablero</h2>
                  <div className="ttt-player-indicators">
                    <span className="ttt-player-indicator ttt-player-x">
                      <span className="ttt-player-dot"></span>
                      <span>Jugador (X)</span>
                    </span>
                    <span className="ttt-player-indicator ttt-player-o">
                      <span className="ttt-player-dot"></span>
                      <span>CPU (O)</span>
                    </span>
                  </div>
                </div>
                
                <div className="ttt-board-controls">
                  <button
                    onClick={resetGame}
                    className="ttt-new-game-button"
                  >
                    Nuevo juego
                  </button>
                </div>
              </div>

              {/* Game Status */}
              <div className="ttt-status-container">
                {thinking ? (
                  <div className="ttt-status ttt-status-thinking">
                    <div className="ttt-spinner"></div>
                    <span className="ttt-status-text">CPU pensando...</span>
                  </div>
                ) : winner ? (
                  <div className={`ttt-status ${winner.player === "X" ? 'ttt-status-win' : 'ttt-status-lose'}`}>
                    <div className="ttt-status-content">
                      <div className={`ttt-status-title ${winner.player === "X" ? 'ttt-status-title-win' : 'ttt-status-title-lose'}`}>
                        {winner.player === "X" ? "¡Victoria! 🎉" : "CPU gana"}
                      </div>
                      <div className="ttt-status-subtitle">
                        {winner.player === "X" ? `+1 victoria (${streak} de racha)` : "Sigue intentando"}
                      </div>
                    </div>
                  </div>
                ) : isDraw ? (
                  <div className="ttt-status ttt-status-draw">
                    <div className="ttt-status-content">
                      <div className="ttt-status-title">¡Empate! 🤝</div>
                      <div className="ttt-status-subtitle">Muy parejo</div>
                    </div>
                  </div>
                ) : (
                  <div className="ttt-status ttt-status-turn">
                    <div className="ttt-status-content">
                      <div className="ttt-status-title">
                        {isPlayerTurn ? "Tu turno (✕)" : "Turno de la CPU (○)"}
                      </div>
                      <div className="ttt-status-subtitle">
                        {isPlayerTurn ? "Selecciona una casilla" : "Esperando jugada..."}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Board Grid */}
              <div className="ttt-board-grid">
                {Array.from({ length: 9 }).map((_, i) => renderCell(i))}
              </div>

              <div className="ttt-board-hint">
                Haz clic en una casilla vacía para colocar tu ficha
              </div>
            </div>

            {/* Game History */}
            {gameHistory.length > 0 && (
              <div className="ttt-card ttt-history">
                <h2 className="ttt-card-title">Historial reciente</h2>
                <div className="ttt-history-list">
                  {gameHistory
                    .slice(-6)
                    .reverse()
                    .map((game, idx) => (
                      <div
                        key={idx}
                        className="ttt-history-item"
                      >
                        <div className="ttt-history-content">
                          {game.winner === "Jugador" ? (
                            <div className="ttt-history-icon ttt-history-win">
                              <span>✓</span>
                            </div>
                          ) : game.winner === "CPU" ? (
                            <div className="ttt-history-icon ttt-history-lose">
                              <span>✗</span>
                            </div>
                          ) : (
                            <div className="ttt-history-icon ttt-history-draw">
                              <span>–</span>
                            </div>
                          )}
                          
                          <div className="ttt-history-info">
                            <div className="ttt-history-result">
                              {game.winner === "Jugador" ? "Victoria" : 
                               game.winner === "CPU" ? "Derrota" : "Empate"}
                            </div>
                            <div className="ttt-history-details">
                              Nivel {game.level} • {game.moves} movimientos
                            </div>
                          </div>
                        </div>
                        
                        <div className="ttt-history-difficulty">
                          {difficultyConfig[game.difficulty]?.icon} {difficultyConfig[game.difficulty]?.label}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="ttt-footer">
          <div className="ttt-footer-content">
            <div className="ttt-footer-left">
              <span className="ttt-footer-title">Estrategia Tic Tac Toe</span> • Sistema de niveles progresivos
            </div>
            <div className="ttt-footer-right">
              <div className="ttt-footer-item">
                <Brain size={16} className="ttt-footer-icon" />
                <span>IA adaptativa</span>
              </div>
              <div className="ttt-footer-item">
                <span>Nivel {currentLevel}</span>
              </div>
              <div className="ttt-footer-item">
                <Star size={16} className="ttt-footer-icon" />
                <span>Racha: {streak}</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;