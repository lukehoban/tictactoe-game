"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Circle, RotateCcw, Trophy, Brain } from "lucide-react";

type CellValue = "X" | "O" | null;
type Board = CellValue[];
type GameStatus = "playing" | "won" | "draw";

interface Score {
  player: number;
  computer: number;
  draws: number;
}

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
  [0, 4, 8], [2, 4, 6] // diagonals
];

export default function Home() {
  const [board, setBoard] = useState<Board>(Array(9).fill(null));
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [gameStatus, setGameStatus] = useState<GameStatus>("playing");
  const [winner, setWinner] = useState<string | null>(null);
  const [score, setScore] = useState<Score>({ player: 0, computer: 0, draws: 0 });

  const checkWinner = useCallback((board: Board): CellValue => {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }
    return null;
  }, []);

  const checkDraw = useCallback((board: Board): boolean => {
    return board.every(cell => cell !== null);
  }, []);

  const getAvailableMoves = useCallback((board: Board): number[] => {
    return board.map((cell, index) => cell === null ? index : -1).filter(index => index !== -1);
  }, []);

  // Simple AI: Try to win, block player from winning, otherwise random move
  const getComputerMove = useCallback((board: Board): number => {
    const availableMoves = getAvailableMoves(board);
    
    // Try to win
    for (const move of availableMoves) {
      const testBoard = [...board];
      testBoard[move] = "O";
      if (checkWinner(testBoard) === "O") {
        return move;
      }
    }

    // Block player from winning
    for (const move of availableMoves) {
      const testBoard = [...board];
      testBoard[move] = "X";
      if (checkWinner(testBoard) === "X") {
        return move;
      }
    }

    // Take center if available
    if (availableMoves.includes(4)) {
      return 4;
    }

    // Take corners
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(corner => availableMoves.includes(corner));
    if (availableCorners.length > 0) {
      return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    }

    // Random move
    return availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }, [getAvailableMoves, checkWinner]);

  const handleCellClick = useCallback((index: number) => {
    if (board[index] || gameStatus !== "playing" || !isPlayerTurn) return;

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);

    const winner = checkWinner(newBoard);
    if (winner) {
      setGameStatus("won");
      setWinner("Player");
      setScore(prev => ({ ...prev, player: prev.player + 1 }));
      return;
    }

    if (checkDraw(newBoard)) {
      setGameStatus("draw");
      setScore(prev => ({ ...prev, draws: prev.draws + 1 }));
      return;
    }

    setIsPlayerTurn(false);
  }, [board, gameStatus, isPlayerTurn, checkWinner, checkDraw]);

  // Computer move effect
  useEffect(() => {
    if (!isPlayerTurn && gameStatus === "playing") {
      const timer = setTimeout(() => {
        const computerMove = getComputerMove(board);
        const newBoard = [...board];
        newBoard[computerMove] = "O";
        setBoard(newBoard);

        const winner = checkWinner(newBoard);
        if (winner) {
          setGameStatus("won");
          setWinner("Computer");
          setScore(prev => ({ ...prev, computer: prev.computer + 1 }));
          return;
        }

        if (checkDraw(newBoard)) {
          setGameStatus("draw");
          setScore(prev => ({ ...prev, draws: prev.draws + 1 }));
          return;
        }

        setIsPlayerTurn(true);
      }, 500); // Small delay for better UX

      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, gameStatus, board, getComputerMove, checkWinner, checkDraw]);

  const resetGame = useCallback(() => {
    setBoard(Array(9).fill(null));
    setIsPlayerTurn(true);
    setGameStatus("playing");
    setWinner(null);
  }, []);

  const resetScore = useCallback(() => {
    setScore({ player: 0, computer: 0, draws: 0 });
  }, []);

  const renderCell = (index: number) => {
    const value = board[index];
    return (
      <Button
        key={index}
        variant="outline"
        className="h-20 w-20 sm:h-24 sm:w-24 text-4xl font-bold border-2 hover:bg-accent/50 transition-all duration-200"
        onClick={() => handleCellClick(index)}
        disabled={value !== null || gameStatus !== "playing" || !isPlayerTurn}
      >
        {value === "X" && <X className="h-8 w-8 sm:h-10 sm:w-10 text-blue-500" />}
        {value === "O" && <Circle className="h-8 w-8 sm:h-10 sm:w-10 text-red-500" />}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold flex items-center justify-center gap-2">
              <Trophy className="text-yellow-500" />
              Tic-Tac-Toe
            </CardTitle>
            <div className="flex justify-center gap-4 mt-4">
              <Badge variant="secondary" className="px-3 py-1">
                Player: {score.player}
              </Badge>
              <Badge variant="secondary" className="px-3 py-1">
                Computer: {score.computer}
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                Draws: {score.draws}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              {gameStatus === "playing" && (
                <div className="flex items-center justify-center gap-2">
                  {isPlayerTurn ? (
                    <>
                      <X className="h-5 w-5 text-blue-500" />
                      <span>Your turn</span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-5 w-5 text-red-500 animate-pulse" />
                      <span>Computer thinking...</span>
                    </>
                  )}
                </div>
              )}
              {gameStatus === "won" && (
                <div className="text-lg font-semibold">
                  {winner === "Player" ? (
                    <span className="text-green-500">🎉 You won!</span>
                  ) : (
                    <span className="text-red-500">😅 Computer wins!</span>
                  )}
                </div>
              )}
              {gameStatus === "draw" && (
                <div className="text-lg font-semibold text-yellow-500">
                  🤝 It&apos;s a draw!
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {Array.from({ length: 9 }, (_, index) => renderCell(index))}
            </div>

            <div className="flex gap-2 justify-center">
              <Button onClick={resetGame} className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                New Game
              </Button>
              <Button variant="outline" onClick={resetScore}>
                Reset Score
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
