import { useEffect, useMemo, useState } from "react";
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

  const difficultyConfig = useMemo(
    () => ({
      easy: { label: "Fácil", smartChance: 0.25, mistakeChance: 0.55, depthLimit: 1, thinkMs: [300, 650] },
      medium: { label: "Medio", smartChance: 0.6, mistakeChance: 0.25, depthLimit: 3, thinkMs: [350, 750] },
      hard: { label: "Difícil", smartChance: 0.9, mistakeChance: 0.08, depthLimit: 7, thinkMs: [420, 900] },
      expert: { label: "Experto", smartChance: 0.97, mistakeChance: 0.03, depthLimit: 9, thinkMs: [480, 1050] },
      master: { label: "Maestro", smartChance: 0.995, mistakeChance: 0.01, depthLimit: 9, thinkMs: [520, 1150] },
      impossible: { label: "Imposible", smartChance: 1, mistakeChance: 0, depthLimit: 9, thinkMs: [560, 1250] },
    }),
    []
  );

  const difficultyOptions = useMemo(
    () => ["easy", "medium", "hard", "expert", "master", "impossible"],
    []
  );

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

    // win in 1 always
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
      setScore((prev) => ({ ...prev, player: prev.player + 1 }));
      setGameHistory((prev) => [
        ...prev,
        { winner: "Jugador", moves: newBoard.filter((c) => c !== null).length, difficulty },
      ]);
      return;
    }

    if (checkDraw(newBoard)) {
      setIsDraw(true);
      setScore((prev) => ({ ...prev, draws: prev.draws + 1 }));
      setGameHistory((prev) => [...prev, { winner: "Empate", moves: 9, difficulty }]);
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
          setScore((prev) => ({ ...prev, cpu: prev.cpu + 1 }));
          setGameHistory((prev) => [
            ...prev,
            { winner: "CPU", moves: afterCpu.filter((c) => c !== null).length, difficulty },
          ]);
        } else if (checkDraw(afterCpu)) {
          setIsDraw(true);
          setScore((prev) => ({ ...prev, draws: prev.draws + 1 }));
          setGameHistory((prev) => [...prev, { winner: "Empate", moves: 9, difficulty }]);
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
  };

  const renderCell = (index) => {
    const isHighlighted = highlightedCells.includes(index);
    const v = board[index];

    return (
      <button
        key={index}
        type="button"
        className={`ttt-cell btn ${isHighlighted ? "ttt-win" : ""} ${
          v === "X" ? "ttt-x" : v === "O" ? "ttt-o" : "ttt-empty"
        }`}
        onClick={() => handleCellClick(index)}
        disabled={!!v || !!winner || !isPlayerTurn || thinking}
        aria-label={`cell-${index}`}
      >
        {v ?? ""}
      </button>
    );
  };

  useEffect(() => {
    if (!winner && !isDraw && !thinking) {
      const timer = setTimeout(() => {
        console.log(isPlayerTurn ? "Tu turno (X)" : "CPU pensando...");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, winner, isDraw, thinking]);

  const footerDifficulty = difficultyConfig[difficulty]?.label ?? "—";

  return (
    <div className="min-vh-100 d-flex align-items-center py-4 ttt-bg">
      <div className="container">
        <div className="mx-auto" style={{ maxWidth: 980 }}>
          {/* Top Card */}
          <div className="card shadow-sm border-0 overflow-hidden">
            <div className="ttt-hero p-4 p-md-5">
              <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                <div>
                  <h1 className="h3 mb-1 fw-bold text-white">Tic Tac Toe</h1>
                  <p className="mb-0 text-white-50 small">Juego contra la máquina</p>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                  <span className="badge rounded-pill text-bg-light">
                    Dificultad: <span className="fw-semibold">{footerDifficulty}</span>
                  </span>
                  <span className="badge rounded-pill text-bg-dark">
                    X: Jugador • O: CPU
                  </span>
                </div>
              </div>
            </div>

            <div className="card-body p-3 p-md-4">
              <div className="row g-3 g-md-4">
                {/* LEFT */}
                <div className="col-12 col-lg-5">
                  {/* Score */}
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="fw-bold">Marcador</div>
                        <span className="text-muted small">Últimas 5 partidas</span>
                      </div>

                      <div className="row g-2 text-center">
                        <div className="col-4">
                          <div className="ttt-stat">
                            <div className="small text-muted">Jugador</div>
                            <div className="h5 mb-0 fw-bold ttt-c-primary">{score.player}</div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="ttt-stat">
                            <div className="small text-muted">Empates</div>
                            <div className="h5 mb-0 fw-bold ttt-c-cyan">{score.draws}</div>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="ttt-stat">
                            <div className="small text-muted">CPU</div>
                            <div className="h5 mb-0 fw-bold ttt-c-danger">{score.cpu}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body">
                      <div className="fw-bold mb-2">Dificultad</div>

                      <div className="d-flex flex-wrap gap-2">
                        {difficultyOptions.map((key) => (
                          <button
                            key={key}
                            type="button"
                            className={`btn btn-sm ${
                              difficulty === key ? "btn-primary" : "btn-outline-primary"
                            }`}
                            onClick={() => {
                              setDifficulty(key);
                              resetGame();
                            }}
                          >
                            {difficultyConfig[key].label}
                          </button>
                        ))}
                      </div>

                      <div className="mt-3 small text-muted">
                        {difficulty === "impossible"
                          ? "Imposible: la CPU juega perfecto. Solo empatas si juegas perfecto."
                          : difficulty === "master"
                          ? "Maestro: casi perfecta, muy difícil."
                          : difficulty === "expert"
                          ? "Experto: muy difícil, fallos raros."
                          : difficulty === "hard"
                          ? "Difícil: minimax profundo, pocos errores."
                          : difficulty === "medium"
                          ? "Medio: a veces inteligente, a veces aleatorio."
                          : "Fácil: comete muchos errores."}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center">
                      {thinking ? (
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <div className="spinner-border spinner-border-sm text-primary" role="status" />
                          <span className="small fw-semibold text-muted">CPU pensando...</span>
                        </div>
                      ) : winner ? (
                        <div className={`fw-bold ${winner.player === "X" ? "text-success" : "text-danger"}`}>
                          {winner.player === "X" ? "¡Ganaste! ✅" : "CPU gana ❌"}
                        </div>
                      ) : isDraw ? (
                        <div className="fw-bold text-info">¡Empate! 🤝</div>
                      ) : (
                        <div className="small fw-semibold text-muted">
                          {isPlayerTurn ? "Tu turno (X)" : "Turno de la CPU (O)"}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="col-12 col-lg-7">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="fw-bold">Tablero</div>
                        <div className="d-flex gap-2">
                          <button type="button" className="btn btn-sm btn-success" onClick={resetGame}>
                            Reiniciar
                          </button>
                          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={resetAll}>
                            Reset todo
                          </button>
                        </div>
                      </div>

                      <div className="ttt-board mx-auto">
                        {Array.from({ length: 9 }).map((_, i) => renderCell(i))}
                      </div>
                    </div>
                  </div>

                  {/* History */}
                  {gameHistory.length > 0 && (
                    <div className="card border-0 shadow-sm mt-3">
                      <div className="card-body">
                        <div className="fw-bold mb-2">Historial</div>
                        <div className="d-grid gap-2">
                          {gameHistory
                            .slice(-5)
                            .reverse()
                            .map((g, idx) => (
                              <div
                                key={idx}
                                className="d-flex align-items-center justify-content-between p-2 rounded-3 border bg-white"
                              >
                                <div className="small fw-semibold">
                                  {g.winner === "Jugador" ? (
                                    <span className="text-success">✅ Ganaste</span>
                                  ) : g.winner === "CPU" ? (
                                    <span className="text-danger">❌ Perdiste</span>
                                  ) : (
                                    <span className="text-info">🤝 Empate</span>
                                  )}
                                  <span className="text-muted"> • </span>
                                  <span className="text-muted">{difficultyConfig[g.difficulty]?.label ?? "—"}</span>
                                </div>
                                <div className="small text-muted">{g.moves} mov.</div>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center mt-4 small text-muted">
                React + Vite • Dificultad actual: <span className="fw-semibold">{footerDifficulty}</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-3 small text-muted">
     echo y creado poor justo bello
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
