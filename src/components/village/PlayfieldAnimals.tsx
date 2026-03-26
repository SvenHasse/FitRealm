// PlayfieldAnimals.tsx
// Animated farm animals roaming the isometric playfield.
// Uses pre-rendered sprite sheets (walk 8 frames, idle 4 frames).
// Animals pick random empty tiles, walk there, idle, repeat.

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Image, View } from 'react-native';
import { AnimalSprites, FarmAnimalType } from '../../assets/animals';
import { gridToScreen, TILE_W, TILE_H } from '../../utils/isometric';

// ─── Config ──────────────────────────────────────────────────────────────────

const ANIMAL_SIZE = TILE_W * 0.65; // sprite size relative to tile
const WALK_FRAME_MS = 120;         // ms per walk frame
const IDLE_FRAME_MS = 300;         // ms per idle frame
const MOVE_SPEED_MS = 2000;        // ms to move one tile

interface AnimalInstance {
  id: string;
  type: FarmAnimalType;
  row: number;
  col: number;
  targetRow: number;
  targetCol: number;
  moveProgress: number;     // 0-1 lerp between current and target tile
  isMoving: boolean;
  idleCountdown: number;    // ms until next move
  frameIndex: number;
  frameTimer: number;
}

interface Props {
  gridSize: number;
  occupiedTiles: Set<string>; // "row,col" strings of tiles with buildings
  svgOffsetX: number;
  svgOffsetY: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getEmptyNeighbors(row: number, col: number, gridSize: number, occupied: Set<string>) {
  return [[-1, 0], [1, 0], [0, -1], [0, 1]]
    .map(([dr, dc]) => ({ row: row + dr, col: col + dc }))
    .filter(t => t.row >= 0 && t.row < gridSize && t.col >= 0 && t.col < gridSize)
    .filter(t => !occupied.has(`${t.row},${t.col}`));
}

function createAnimals(gridSize: number, occupied: Set<string>): AnimalInstance[] {
  const types: FarmAnimalType[] = ['cow', 'sheep', 'pig', 'horse'];
  return types.map((type, i) => {
    let row: number, col: number;
    // Find an empty tile
    do {
      row = randomInt(1, gridSize - 2);
      col = randomInt(1, gridSize - 2);
    } while (occupied.has(`${row},${col}`));

    return {
      id: `animal_${i}`,
      type,
      row, col,
      targetRow: row,
      targetCol: col,
      moveProgress: 0,
      isMoving: false,
      idleCountdown: randomInt(2000, 5000),
      frameIndex: 0,
      frameTimer: 0,
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export const PlayfieldAnimals: React.FC<Props> = React.memo(({
  gridSize,
  occupiedTiles,
  svgOffsetX,
  svgOffsetY,
}) => {
  const [animals, setAnimals] = useState<AnimalInstance[]>(() =>
    createAnimals(gridSize, occupiedTiles)
  );
  const lastTick = useRef(Date.now());

  // Game loop — ~20fps is enough for sprite animation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = now - lastTick.current;
      lastTick.current = now;

      setAnimals(prev => prev.map(a => {
        const next = { ...a };

        // Frame animation
        next.frameTimer += dt;
        const frameMs = next.isMoving ? WALK_FRAME_MS : IDLE_FRAME_MS;
        if (next.frameTimer >= frameMs) {
          next.frameTimer = 0;
          const maxFrames = next.isMoving ? 8 : 4;
          next.frameIndex = (next.frameIndex + 1) % maxFrames;
        }

        if (next.isMoving) {
          // Move toward target
          next.moveProgress += dt / MOVE_SPEED_MS;
          if (next.moveProgress >= 1) {
            next.row = next.targetRow;
            next.col = next.targetCol;
            next.moveProgress = 0;
            next.isMoving = false;
            next.idleCountdown = randomInt(2000, 6000);
            next.frameIndex = 0;
          }
        } else {
          // Idle countdown
          next.idleCountdown -= dt;
          if (next.idleCountdown <= 0) {
            const neighbors = getEmptyNeighbors(next.row, next.col, gridSize, occupiedTiles);
            if (neighbors.length > 0) {
              const target = neighbors[Math.floor(Math.random() * neighbors.length)];
              next.targetRow = target.row;
              next.targetCol = target.col;
              next.moveProgress = 0;
              next.isMoving = true;
              next.frameIndex = 0;
            } else {
              next.idleCountdown = 1000; // try again later
            }
          }
        }

        return next;
      }));
    }, 50); // 20fps tick

    return () => clearInterval(interval);
  }, [gridSize, occupiedTiles]);

  return (
    <>
      {animals.map(a => {
        // Lerp screen position between current and target tile
        const from = gridToScreen(a.row, a.col, gridSize);
        const to = gridToScreen(a.targetRow, a.targetCol, gridSize);
        const screenX = from.x + (to.x - from.x) * a.moveProgress;
        const screenY = from.y + (to.y - from.y) * a.moveProgress;

        // Get current frame
        const sprites = AnimalSprites[a.type];
        const frames = a.isMoving ? sprites.walk : sprites.idle;
        const frame = frames[a.frameIndex % frames.length];

        return (
          <View
            key={a.id}
            style={{
              position: 'absolute',
              left: svgOffsetX + screenX + TILE_W / 2 - ANIMAL_SIZE / 2,
              top: svgOffsetY + screenY + TILE_H / 2 - ANIMAL_SIZE * 0.8,
              width: ANIMAL_SIZE,
              height: ANIMAL_SIZE,
              zIndex: Math.round(screenY + TILE_H + 10),
            }}
            pointerEvents="none"
          >
            <Image
              source={frame}
              style={{ width: ANIMAL_SIZE, height: ANIMAL_SIZE }}
              resizeMode="contain"
            />
          </View>
        );
      })}
    </>
  );
});
