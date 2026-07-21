import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Brick, RobloxGame } from '../types';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  RefreshCw, 
  Layers, 
  Eye, 
  Move, 
  Grid, 
  Copy, 
  Sparkles, 
  Sliders, 
  RotateCw, 
  Layout, 
  ArrowUp 
} from 'lucide-react';

interface GameMakerProps {
  onPublish: (newGame: RobloxGame) => void;
  creatorId: string;
  creatorName: string;
}

const CLASSIC_COLORS = [
  '#ef4444', // Red
  '#3b82f6', // Royal Blue
  '#eab308', // Bright Yellow
  '#22c55e', // Grass Green
  '#f97316', // Orange
  '#a855f7', // Purple
  '#64748b', // Steel Grey
  '#1e293b', // Dark Charcoal
  '#ffffff', // White
  '#06b6d4', // Teal Neon
];

export const GameMaker: React.FC<GameMakerProps> = ({
  onPublish,
  creatorId,
  creatorName,
}) => {
  const [gameName, setGameName] = useState<string>('');
  const [gameDesc, setGameDesc] = useState<string>('');
  const [bricks, setBricks] = useState<Brick[]>([
    // Default baseplate & spawn block so any game is playable immediately
    { id: 'b_base', type: 'block', color: '#22c55e', x: 0, y: -1, z: 0, scaleX: 60, scaleY: 2, scaleZ: 60 },
    { id: 'b_spawn', type: 'spawn', color: '#3b82f6', x: 0, y: 1, z: -15, scaleX: 4, scaleY: 1, scaleZ: 4 },
  ]);

  // Editor control states
  const [toolMode, setToolMode] = useState<'select' | 'place'>('place');
  const [selectedBrickId, setSelectedBrickId] = useState<string | null>(null);
  const [autoStack, setAutoStack] = useState<boolean>(true);
  const [layoutMode, setLayoutMode] = useState<'split' | '2d' | '3d'>('split');

  // Current brush / active parameters
  const [brushType, setBrushType] = useState<'block' | 'wedge' | 'spawn' | 'lava' | 'goal'>('block');
  const [brushColor, setBrushColor] = useState<string>('#ef4444');
  const [brushX, setBrushX] = useState<number>(0);
  const [brushY, setBrushY] = useState<number>(1);
  const [brushZ, setBrushZ] = useState<number>(0);
  const [brushScaleX, setBrushScaleX] = useState<number>(4);
  const [brushScaleY, setBrushScaleY] = useState<number>(2);
  const [brushScaleZ, setBrushScaleZ] = useState<number>(4);

  // Dragging states on 2D Blueprint canvas
  const [draggedBrickId, setDraggedBrickId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ dx: number; dz: number }>({ dx: 0, dz: 0 });

  const blueprintCanvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<'blueprint' | 'bricklist'>('blueprint');

  // 3D Canvas elements
  const threeCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const pivotGroupRef = useRef<THREE.Group | null>(null);

  // 3D Camera drag to rotate
  const isDragging3D = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cameraRotation = useRef<{ x: number; y: number }>({ x: -0.5, y: 0.6 }); // pitch, yaw

  // --- STACKER ASSIST CALCULATOR ---
  const findHighestYAt = (x: number, z: number, scaleX: number, scaleZ: number, excludeId?: string) => {
    let highestTop = 0; // Ground surface is Y: 0 because baseplate sits at Y: -1 with scaleY: 2 (top of baseplate = -1 + 1 = 0)
    bricks.forEach(b => {
      if (excludeId && b.id === excludeId) return;

      // Calculate bounding boxes on X & Z axis
      const bMinX = b.x - b.scaleX / 2;
      const bMaxX = b.x + b.scaleX / 2;
      const bMinZ = b.z - b.scaleZ / 2;
      const bMaxZ = b.z + b.scaleZ / 2;

      const newMinX = x - scaleX / 2;
      const newMaxX = x + scaleX / 2;
      const newMinZ = z - scaleZ / 2;
      const newMaxZ = z + scaleZ / 2;

      // Check if they overlap on the horizontal plane
      const overlapX = Math.max(0, Math.min(bMaxX, newMaxX) - Math.max(bMinX, newMinX));
      const overlapZ = Math.max(0, Math.min(bMaxZ, newMaxZ) - Math.max(bMinZ, newMinZ));

      if (overlapX > 0.05 && overlapZ > 0.05) {
        const topY = b.y + b.scaleY / 2;
        if (topY > highestTop) {
          highestTop = topY;
        }
      }
    });
    return highestTop;
  };

  // --- COMPONENT PROPERTIES SYNCHRONIZATION ---
  const updateSelectedBrick = (fields: Partial<Brick>) => {
    if (!selectedBrickId || selectedBrickId === 'b_base') return;
    setBricks(prev => prev.map(b => b.id === selectedBrickId ? { ...b, ...fields } : b));
  };

  const changeBrushX = (val: number) => {
    setBrushX(val);
    if (selectedBrickId) updateSelectedBrick({ x: val });
  };
  const changeBrushY = (val: number) => {
    setBrushY(val);
    if (selectedBrickId) updateSelectedBrick({ y: val });
  };
  const changeBrushZ = (val: number) => {
    setBrushZ(val);
    if (selectedBrickId) updateSelectedBrick({ z: val });
  };
  const changeBrushScaleX = (val: number) => {
    setBrushScaleX(val);
    if (selectedBrickId) updateSelectedBrick({ scaleX: val });
  };
  const changeBrushScaleY = (val: number) => {
    setBrushScaleY(val);
    if (selectedBrickId) updateSelectedBrick({ scaleY: val });
  };
  const changeBrushScaleZ = (val: number) => {
    setBrushScaleZ(val);
    if (selectedBrickId) updateSelectedBrick({ scaleZ: val });
  };
  const changeBrushColor = (val: string) => {
    setBrushColor(val);
    if (selectedBrickId) updateSelectedBrick({ color: val });
  };
  const changeBrushType = (val: 'block' | 'wedge' | 'spawn' | 'lava' | 'goal') => {
    setBrushType(val);
    if (selectedBrickId) updateSelectedBrick({ type: val });
  };

  // --- DUPLICATE BRICK ACTION ---
  const handleDuplicateSelected = () => {
    if (!selectedBrickId || selectedBrickId === 'b_base' || selectedBrickId === 'b_spawn') return;
    const item = bricks.find(b => b.id === selectedBrickId);
    if (!item) return;

    // Shift coordinates slightly so they see the clone clearly
    const newId = `b_dup_${Date.now()}`;
    const clonedBrick: Brick = {
      ...item,
      id: newId,
      x: item.x + 4,
      y: autoStack ? findHighestYAt(item.x + 4, item.z + 4, item.scaleX, item.scaleZ) + item.scaleY / 2 : item.y,
      z: item.z + 4,
    };

    setBricks(prev => [...prev, clonedBrick]);
    setSelectedBrickId(newId);

    // Sync properties
    setBrushX(clonedBrick.x);
    setBrushY(clonedBrick.y);
    setBrushZ(clonedBrick.z);
    setBrushScaleX(clonedBrick.scaleX);
    setBrushScaleY(clonedBrick.scaleY);
    setBrushScaleZ(clonedBrick.scaleZ);
    setBrushColor(clonedBrick.color);
    setBrushType(clonedBrick.type);
  };

  // --- DELETE BRICK ACTION ---
  const handleDeleteSelected = () => {
    if (!selectedBrickId || selectedBrickId === 'b_base' || selectedBrickId === 'b_spawn') return;
    setBricks(prev => prev.filter(b => b.id !== selectedBrickId));
    setSelectedBrickId(null);
  };

  // --- 1-CLICK PRE-MADE TEMPLATE LEVELS ---
  const handleLoadTemplate = (templateName: 'spiral' | 'lava' | 'towers') => {
    setSelectedBrickId(null);
    if (templateName === 'spiral') {
      const tempBricks: Brick[] = [
        { id: 'b_base', type: 'block', color: '#22c55e', x: 0, y: -1, z: 0, scaleX: 60, scaleY: 2, scaleZ: 60 },
        { id: 'b_spawn', type: 'spawn', color: '#3b82f6', x: 0, y: 1, z: -20, scaleX: 6, scaleY: 1, scaleZ: 6 },
      ];
      // Generate a classic vertical climbing spiral staircase
      for (let i = 0; i < 11; i++) {
        const angle = (i * Math.PI) / 5.5;
        const radius = 11;
        const sx = Math.round(Math.cos(angle) * radius);
        const sz = Math.round(Math.sin(angle) * radius);
        tempBricks.push({
          id: `t_spiral_${i}`,
          type: 'block',
          color: CLASSIC_COLORS[i % CLASSIC_COLORS.length],
          x: sx,
          y: i * 2 + 1,
          z: sz,
          scaleX: 5,
          scaleY: 2,
          scaleZ: 5,
        });
      }
      // Summit Goal Platform
      tempBricks.push({
        id: 't_spiral_summit',
        type: 'block',
        color: '#eab308',
        x: 0,
        y: 23,
        z: 0,
        scaleX: 8,
        scaleY: 2,
        scaleZ: 8,
      });
      tempBricks.push({
        id: 't_spiral_goal',
        type: 'goal',
        color: '#10b981',
        x: 0,
        y: 24.5,
        z: 0,
        scaleX: 4,
        scaleY: 1,
        scaleZ: 4,
      });
      setBricks(tempBricks);
    } else if (templateName === 'lava') {
      const tempBricks: Brick[] = [
        { id: 'b_base', type: 'block', color: '#1e293b', x: 0, y: -1, z: 0, scaleX: 60, scaleY: 2, scaleZ: 60 },
        { id: 'b_spawn', type: 'spawn', color: '#3b82f6', x: 0, y: 1, z: -22, scaleX: 6, scaleY: 1, scaleZ: 6 },
        // Lava obstacles
        { id: 'lava_pool_1', type: 'lava', color: '#ef4444', x: 0, y: 0.5, z: -6, scaleX: 28, scaleY: 1, scaleZ: 14 },
        { id: 'lava_pool_2', type: 'lava', color: '#ef4444', x: 0, y: 0.5, z: 8, scaleX: 20, scaleY: 1, scaleZ: 10 },
        // Jumping stones
        { id: 'step_1', type: 'block', color: '#eab308', x: -8, y: 1.5, z: -10, scaleX: 4, scaleY: 2, scaleZ: 4 },
        { id: 'step_2', type: 'block', color: '#eab308', x: -2, y: 2.5, z: -5, scaleX: 4, scaleY: 2, scaleZ: 4 },
        { id: 'step_3', type: 'block', color: '#eab308', x: 4, y: 3.5, z: 0, scaleX: 4, scaleY: 2, scaleZ: 4 },
        { id: 'step_4', type: 'block', color: '#f97316', x: -4, y: 4.5, z: 6, scaleX: 3, scaleY: 2, scaleZ: 3 },
        { id: 'step_5', type: 'block', color: '#f97316', x: 5, y: 5.5, z: 12, scaleX: 3, scaleY: 2, scaleZ: 3 },
        // High tower with reward goal pad
        { id: 'step_goal_tower', type: 'block', color: '#22c55e', x: 0, y: 6.5, z: 20, scaleX: 8, scaleY: 3, scaleZ: 8 },
        { id: 'step_goal', type: 'goal', color: '#10b981', x: 0, y: 8.5, z: 20, scaleX: 4, scaleY: 1, scaleZ: 4 },
      ];
      setBricks(tempBricks);
    } else if (templateName === 'towers') {
      const tempBricks: Brick[] = [
        { id: 'b_base', type: 'block', color: '#22c55e', x: 0, y: -1, z: 0, scaleX: 60, scaleY: 2, scaleZ: 60 },
        { id: 'b_spawn', type: 'spawn', color: '#3b82f6', x: -16, y: 1, z: -16, scaleX: 6, scaleY: 1, scaleZ: 6 },
        // Tower left side
        { id: 'tower_left_base', type: 'block', color: '#64748b', x: -16, y: 4, z: -16, scaleX: 10, scaleY: 8, scaleZ: 10 },
        { id: 'tower_left_roof', type: 'block', color: '#3b82f6', x: -16, y: 9.5, z: -16, scaleX: 8, scaleY: 3, scaleZ: 8 },
        // Tower right side
        { id: 'tower_right_base', type: 'block', color: '#64748b', x: 16, y: 6, z: 16, scaleX: 10, scaleY: 12, scaleZ: 10 },
        { id: 'tower_right_roof', type: 'block', color: '#ef4444', x: 16, y: 13.5, z: 16, scaleX: 8, scaleY: 3, scaleZ: 8 },
        // Suspended high neon cyan glass bridge
        { id: 'neon_bridge', type: 'block', color: '#06b6d4', x: 0, y: 11, z: 0, scaleX: 20, scaleY: 1, scaleZ: 4 },
        // Wedges climbing up to bridge
        { id: 'wedge_climb_l', type: 'wedge', color: '#f97316', x: -10, y: 3, z: -8, scaleX: 6, scaleY: 4, scaleZ: 4 },
        { id: 'wedge_climb_r', type: 'wedge', color: '#f97316', x: 10, y: 5, z: 8, scaleX: 6, scaleY: 6, scaleZ: 4 },
        // Goal pad on top of tower right roof
        { id: 'tower_goal_pad', type: 'goal', color: '#10b981', x: 16, y: 15.5, z: 16, scaleX: 4, scaleY: 1, scaleZ: 4 },
      ];
      setBricks(tempBricks);
    }
  };

  // --- CANVAS INTERACTION MECHANICS ---
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = blueprintCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scale = 4;
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;

    const robloxMouseX = (mouseX - offsetX) / scale;
    const robloxMouseZ = (mouseY - offsetY) / scale;

    if (toolMode === 'select') {
      // Find clicked brick (excluding locked baseplate)
      const clickedBrick = [...bricks].reverse().find((b) => {
        if (b.id === 'b_base') return false;
        const halfW = b.scaleX / 2;
        const halfH = b.scaleZ / 2;
        return (
          robloxMouseX >= b.x - halfW &&
          robloxMouseX <= b.x + halfW &&
          robloxMouseZ >= b.z - halfH &&
          robloxMouseZ <= b.z + halfH
        );
      });

      if (clickedBrick) {
        setSelectedBrickId(clickedBrick.id);
        setDraggedBrickId(clickedBrick.id);
        setDragOffset({
          dx: clickedBrick.x - robloxMouseX,
          dz: clickedBrick.z - robloxMouseZ,
        });

        // Set palette fields to match selected brick properties
        setBrushX(clickedBrick.x);
        setBrushY(clickedBrick.y);
        setBrushZ(clickedBrick.z);
        setBrushScaleX(clickedBrick.scaleX);
        setBrushScaleY(clickedBrick.scaleY);
        setBrushScaleZ(clickedBrick.scaleZ);
        setBrushColor(clickedBrick.color);
        setBrushType(clickedBrick.type);
      } else {
        setSelectedBrickId(null);
      }
    } else {
      // Place Mode: Click immediately stamps a new brick
      const snappedX = Math.round(robloxMouseX);
      const snappedZ = Math.round(robloxMouseZ);

      // Calculate vertical elevation height with Stacker Assist if active
      let targetY = brushY;
      if (autoStack) {
        const highestTop = findHighestYAt(snappedX, snappedZ, brushScaleX, brushScaleZ);
        targetY = highestTop + brushScaleY / 2;
      }

      const newId = `b_${Date.now()}`;
      const newBrick: Brick = {
        id: newId,
        type: brushType,
        color: brushType === 'lava' ? '#ef4444' : brushType === 'goal' ? '#10b981' : brushType === 'spawn' ? '#3b82f6' : brushColor,
        x: snappedX,
        y: targetY,
        z: snappedZ,
        scaleX: brushScaleX,
        scaleY: brushScaleY,
        scaleZ: brushScaleZ,
      };

      setBricks(prev => [...prev, newBrick]);
      setSelectedBrickId(newId);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = blueprintCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const scale = 4;
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;

    const robloxMouseX = (mouseX - offsetX) / scale;
    const robloxMouseZ = (mouseY - offsetY) / scale;

    const snappedX = Math.round(robloxMouseX);
    const snappedZ = Math.round(robloxMouseZ);

    if (toolMode === 'select' && draggedBrickId) {
      // Reposition dragged brick
      const newX = Math.round(robloxMouseX + dragOffset.dx);
      const newZ = Math.round(robloxMouseZ + dragOffset.dz);

      let newY = brushY;
      if (autoStack) {
        const highestTop = findHighestYAt(newX, newZ, brushScaleX, brushScaleZ, draggedBrickId);
        newY = highestTop + brushScaleY / 2;
      }

      setBricks(prevBricks =>
        prevBricks.map((b) =>
          b.id === draggedBrickId ? { ...b, x: newX, y: newY, z: newZ } : b
        )
      );

      setBrushX(newX);
      setBrushY(newY);
      setBrushZ(newZ);
    } else {
      // Update brush ghost placement hover preview
      setBrushX(snappedX);
      setBrushZ(snappedZ);
      if (autoStack) {
        const highestTop = findHighestYAt(snappedX, snappedZ, brushScaleX, brushScaleZ);
        setBrushY(highestTop + brushScaleY / 2);
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggedBrickId(null);
  };

  const addBrick = () => {
    const newId = `b_btn_${Date.now()}`;
    const newBrick: Brick = {
      id: newId,
      type: brushType,
      color: brushType === 'lava' ? '#ef4444' : brushType === 'goal' ? '#10b981' : brushType === 'spawn' ? '#3b82f6' : brushColor,
      x: brushX,
      y: brushY,
      z: brushZ,
      scaleX: brushScaleX,
      scaleY: brushScaleY,
      scaleZ: brushScaleZ,
    };
    setBricks([...bricks, newBrick]);
    setSelectedBrickId(newId);
  };

  const removeBrick = (id: string) => {
    if (id === 'b_base' || id === 'b_spawn') return;
    setBricks(bricks.filter(b => b.id !== id));
    if (selectedBrickId === id) setSelectedBrickId(null);
  };

  const clearAllCustom = () => {
    setSelectedBrickId(null);
    setBricks([
      { id: 'b_base', type: 'block', color: '#22c55e', x: 0, y: -1, z: 0, scaleX: 60, scaleY: 2, scaleZ: 60 },
      { id: 'b_spawn', type: 'spawn', color: '#3b82f6', x: 0, y: 1, z: -15, scaleX: 4, scaleY: 1, scaleZ: 4 },
    ]);
  };

  const handlePublish = () => {
    if (!gameName.trim()) {
      alert('Please provide a creative name for your Roblox game!');
      return;
    }

    const newGame: RobloxGame = {
      id: `custom_game_${Date.now()}`,
      name: gameName,
      description: gameDesc || 'A customized level built in the 2007 game construction engine!',
      creatorId,
      creatorName,
      visits: 0,
      likes: 0,
      dislikes: 0,
      bricks: [...bricks]
    };

    onPublish(newGame);
    setGameName('');
    setGameDesc('');
    clearAllCustom();
  };

  // --- REDRAW 2D BLUEPRINT GRID ---
  useEffect(() => {
    const canvas = blueprintCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background slate dark grid
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Centering axis markers
    ctx.strokeStyle = '#dc2626'; // center Y axis (left/right)
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, canvas.height);
    ctx.stroke();

    ctx.strokeStyle = '#3b82f6'; // center X axis (depth)
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    const scale = 4;
    const offsetX = canvas.width / 2;
    const offsetY = canvas.height / 2;

    // Draw active bricks
    bricks.forEach((b) => {
      const isSelected = b.id === selectedBrickId;
      ctx.fillStyle = b.color;
      ctx.strokeStyle = isSelected ? '#fbbf24' : '#ffffff';
      ctx.lineWidth = isSelected ? 2 : 1;

      const w = b.scaleX * scale;
      const h = b.scaleZ * scale;
      const px = offsetX + (b.x - b.scaleX / 2) * scale;
      const py = offsetY + (b.z - b.scaleZ / 2) * scale;

      ctx.fillRect(px, py, w, h);
      ctx.strokeRect(px, py, w, h);

      // Height labeling
      ctx.fillStyle = isSelected ? '#fbbf24' : '#ffffff';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(`Y:${b.y}`, px + 2, py + h / 2 + 3);

      // Marker for wedge direction
      if (b.type === 'wedge') {
        ctx.fillStyle = '#ffffffaa';
        ctx.beginPath();
        ctx.moveTo(px, py + h);
        ctx.lineTo(px + w / 2, py);
        ctx.lineTo(px + w, py + h);
        ctx.closePath();
        ctx.fill();
      }
    });

    // Draw brush placement preview if in Place mode
    if (toolMode === 'place') {
      ctx.fillStyle = brushType === 'lava' ? '#ef4444' : brushType === 'goal' ? '#10b981' : brushType === 'spawn' ? '#3b82f6' : brushColor;
      ctx.strokeStyle = '#eab308'; // Glowing gold border
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#eab308';

      const brushW = brushScaleX * scale;
      const brushH = brushScaleZ * scale;
      const brushPX = offsetX + (brushX - brushScaleX / 2) * scale;
      const brushPY = offsetY + (brushZ - brushScaleZ / 2) * scale;

      ctx.fillRect(brushPX, brushPY, brushW, brushH);
      ctx.strokeRect(brushPX, brushPY, brushW, brushH);

      // Label preview height
      ctx.fillStyle = '#eab308';
      ctx.font = 'bold 9px monospace';
      ctx.shadowBlur = 0;
      ctx.fillText(`Y:${brushY} [STAMP]`, brushPX + 2, brushPY - 3);
    }
  }, [bricks, selectedBrickId, toolMode, brushType, brushColor, brushX, brushY, brushZ, brushScaleX, brushScaleY, brushScaleZ, autoStack]);

  // --- INTERACTIVE THREE.JS 3D CANVAS INITIALIZATION ---
  useEffect(() => {
    if (layoutMode === '2d') {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
      return;
    }

    const canvas = threeCanvasRef.current;
    if (!canvas) return;

    const width = canvas.parentElement?.clientWidth || 380;
    const height = canvas.parentElement?.clientHeight || 320;

    // Build scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a); // premium dark studio slate
    sceneRef.current = scene;

    // Perspective Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Pivot group to rotate level easily
    const pivot = new THREE.Group();
    scene.add(pivot);
    pivotGroupRef.current = pivot;

    // Premium lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
    dirLight.position.set(30, 50, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    const d = 40;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0004;
    scene.add(dirLight);

    // Studio Grid helper on ground
    const gridHelper = new THREE.GridHelper(100, 100, 0x475569, 0x334155);
    gridHelper.position.y = -0.5;
    pivot.add(gridHelper);

    // Update camera orbital layout
    const updateCamera = () => {
      if (!camera) return;
      const distance = 50;
      const phi = cameraRotation.current.x;
      const theta = cameraRotation.current.y;

      camera.position.x = distance * Math.cos(phi) * Math.sin(theta);
      camera.position.y = distance * Math.sin(phi);
      camera.position.z = distance * Math.cos(phi) * Math.cos(theta);
      camera.lookAt(0, 4, 0);
    };
    updateCamera();

    // Mouse Listeners on 3D viewport for custom drag rotation
    const handleMouseDown3D = (e: MouseEvent) => {
      isDragging3D.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove3D = (e: MouseEvent) => {
      if (!isDragging3D.current) return;
      const deltaX = e.clientX - previousMousePosition.current.x;
      const deltaY = e.clientY - previousMousePosition.current.y;

      cameraRotation.current.y -= deltaX * 0.007;
      cameraRotation.current.x = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, cameraRotation.current.x + deltaY * 0.007));

      previousMousePosition.current = { x: e.clientX, y: e.clientY };
      updateCamera();
    };

    const handleMouseUp3D = () => {
      isDragging3D.current = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown3D);
    window.addEventListener('mousemove', handleMouseMove3D);
    window.addEventListener('mouseup', handleMouseUp3D);

    // Animation / tick frame loop
    let requestID: number;
    const animate = () => {
      requestID = requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // ResizeObserver to handle full responsive resizing
    const resizeObserver = new ResizeObserver(() => {
      const container = canvas.parentElement;
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight || 320;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    return () => {
      cancelAnimationFrame(requestID);
      canvas.removeEventListener('mousedown', handleMouseDown3D);
      window.removeEventListener('mousemove', handleMouseMove3D);
      window.removeEventListener('mouseup', handleMouseUp3D);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, [layoutMode]);

  // --- REDRAW 3D BRICK GEOMETRIES DYNAMICALLY ---
  useEffect(() => {
    const pivot = pivotGroupRef.current;
    if (!pivot) return;

    // Clear previous brick mesh children (preserve only GridHelper)
    const toRemove = pivot.children.filter(child => !(child instanceof THREE.GridHelper));
    toRemove.forEach(child => pivot.remove(child));

    // A. Add saved bricks to Three scene
    bricks.forEach(b => {
      let geometry: THREE.BufferGeometry;
      if (b.type === 'wedge') {
        geometry = new THREE.ConeGeometry(b.scaleX / 2, b.scaleY, 4);
        geometry.rotateY(Math.PI / 4);
      } else {
        geometry = new THREE.BoxGeometry(b.scaleX, b.scaleY, b.scaleZ);
      }

      let material: THREE.Material;
      const isSelected = b.id === selectedBrickId;
      const displayColor = isSelected ? '#fbbf24' : b.color; // highlight gold

      if (b.type === 'lava') {
        material = new THREE.MeshBasicMaterial({
          color: isSelected ? 0xfbbf24 : 0xef4444,
          transparent: true,
          opacity: 0.9,
        });
      } else if (b.type === 'goal') {
        material = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xfbbf24 : 0x10b981,
          roughness: 0.4,
          metalness: 0.2,
        });
      } else if (b.type === 'spawn') {
        material = new THREE.MeshStandardMaterial({
          color: isSelected ? 0xfbbf24 : 0x3b82f6,
          roughness: 0.5,
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(displayColor),
          roughness: 0.8,
          metalness: 0.1,
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(b.x, b.y, b.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      pivot.add(mesh);

      // Add thin white box wireframe for active selections
      if (isSelected) {
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 }));
        mesh.add(line);
      }
    });

    // B. Add active place/ghost block in 3D preview
    if (toolMode === 'place') {
      let ghostGeo: THREE.BufferGeometry;
      if (brushType === 'wedge') {
        ghostGeo = new THREE.ConeGeometry(brushScaleX / 2, brushScaleY, 4);
        ghostGeo.rotateY(Math.PI / 4);
      } else {
        ghostGeo = new THREE.BoxGeometry(brushScaleX, brushScaleY, brushScaleZ);
      }

      const ghostColor = brushType === 'lava' ? '#ef4444' : brushType === 'goal' ? '#10b981' : brushType === 'spawn' ? '#3b82f6' : brushColor;
      const ghostMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(ghostColor),
        transparent: true,
        opacity: 0.55,
      });

      const ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
      ghostMesh.position.set(brushX, brushY, brushZ);
      pivot.add(ghostMesh);

      // Golden bounding frame around stamp preview
      const edges = new THREE.EdgesGeometry(ghostGeo);
      const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xeab308, linewidth: 1.5 }));
      ghostMesh.add(line);
    }
  }, [bricks, selectedBrickId, toolMode, brushX, brushY, brushZ, brushScaleX, brushScaleY, brushScaleZ, brushColor, brushType]);

  // --- PRESET VIEW CAMERAS ---
  const handlePresetCamera = (angle: 'iso' | 'top' | 'front') => {
    if (angle === 'iso') {
      cameraRotation.current = { x: -0.5, y: 0.6 };
    } else if (angle === 'top') {
      cameraRotation.current = { x: -Math.PI / 2.05, y: 0 };
    } else if (angle === 'front') {
      cameraRotation.current = { x: 0, y: 0 };
    }

    if (cameraRef.current) {
      const distance = 50;
      const phi = cameraRotation.current.x;
      const theta = cameraRotation.current.y;
      cameraRef.current.position.x = distance * Math.cos(phi) * Math.sin(theta);
      cameraRef.current.position.y = distance * Math.sin(phi);
      cameraRef.current.position.z = distance * Math.cos(phi) * Math.cos(theta);
      cameraRef.current.lookAt(0, 4, 0);
    }
  };

  return (
    <div className="bg-[#fcf8f2] border-4 border-slate-700 rounded-lg overflow-hidden p-5 shadow-xl font-sans max-w-6xl mx-auto text-slate-800">
      
      {/* Premium Red Roblox Title banner */}
      <div className="bg-red-700 text-white px-5 py-3 rounded mb-5 flex justify-between items-center border-b-4 border-red-900 shadow">
        <div>
          <h2 className="text-xl font-serif font-extrabold tracking-tight flex items-center gap-2">
            <Sparkles className="text-yellow-400 fill-yellow-400" size={18} />
            <span>ROBLOX Studio Interactive Maker v2.0</span>
          </h2>
          <p className="text-xs text-red-100 font-medium">Design vertical obbies, stairs, and interactive structures with 3D live viewport!</p>
        </div>
        <div className="flex items-center gap-1 bg-red-800 border border-red-900 rounded px-2.5 py-1 text-[10px] font-bold">
          <span>Active Session</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block ml-1.5" />
        </div>
      </div>

      {/* QUICK TEMPLATES AND LOOKBAR */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
        {/* Templates selector */}
        <div className="md:col-span-8 bg-[#f5ebe2] border border-[#d8c8b8] rounded px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-600" size={16} />
            <h4 className="font-bold text-xs text-slate-700">1-Click Starter Templates:</h4>
          </div>
          <div className="flex gap-2 text-xs">
            <button
              id="template_spiral_btn"
              onClick={() => handleLoadTemplate('spiral')}
              className="bg-white hover:bg-slate-100 text-slate-800 font-bold py-1.5 px-3 rounded border border-slate-300 shadow-sm flex items-center gap-1 transition"
            >
              🏔️ Spiral stairs
            </button>
            <button
              id="template_lava_btn"
              onClick={() => handleLoadTemplate('lava')}
              className="bg-white hover:bg-slate-100 text-slate-800 font-bold py-1.5 px-3 rounded border border-slate-300 shadow-sm flex items-center gap-1 transition"
            >
              🔥 Lava Steppers
            </button>
            <button
              id="template_towers_btn"
              onClick={() => handleLoadTemplate('towers')}
              className="bg-white hover:bg-slate-100 text-slate-800 font-bold py-1.5 px-3 rounded border border-slate-300 shadow-sm flex items-center gap-1 transition"
            >
              🏰 Dual Towers
            </button>
          </div>
        </div>

        {/* View Layout buttons */}
        <div className="md:col-span-4 bg-[#f5ebe2] border border-[#d8c8b8] rounded px-4 py-3 flex items-center justify-between gap-2 shadow-sm">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layout size={14} className="text-slate-500" />
            Viewport:
          </span>
          <div className="flex bg-slate-200 p-0.5 rounded text-xs w-full max-w-[180px]">
            {(['split', '2d', '3d'] as const).map(layout => (
              <button
                id={`layout_${layout}_btn`}
                key={layout}
                onClick={() => setLayoutMode(layout)}
                className={`flex-1 py-1 px-1.5 rounded text-[10px] font-bold capitalize transition ${layoutMode === layout ? 'bg-red-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {layout}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Properties Palette & Brush configuration */}
        <div className="lg:col-span-4 bg-[#f3eae1] border-2 border-[#d0c0b0] rounded p-4 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-4">
            
            {/* Tool Selection (Select vs Place) */}
            <div className="space-y-1.5 border-b-2 border-slate-300 pb-3">
              <label className="text-xs font-black uppercase text-slate-600 tracking-wider block">Editor Tool Mode:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  id="tool_place_btn"
                  onClick={() => {
                    setToolMode('place');
                    setSelectedBrickId(null);
                  }}
                  className={`py-2 px-3 rounded font-bold border flex items-center justify-center gap-1.5 transition ${toolMode === 'place' ? 'bg-red-700 text-white border-red-800 shadow' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'}`}
                >
                  <Grid size={15} />
                  <span>Place Tool</span>
                </button>
                
                <button
                  id="tool_select_btn"
                  onClick={() => setToolMode('select')}
                  className={`py-2 px-3 rounded font-bold border flex items-center justify-center gap-1.5 transition ${toolMode === 'select' ? 'bg-red-700 text-white border-red-800 shadow' : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-300'}`}
                >
                  <Move size={15} />
                  <span>Select / Move</span>
                </button>
              </div>
            </div>

            {/* Selection info and clone/delete */}
            {selectedBrickId && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded p-3 text-xs space-y-2.5 animate-fade-in shadow-inner">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <Sliders size={13} />
                    Selected: {selectedBrickId === 'b_base' ? 'Baseplate' : selectedBrickId === 'b_spawn' ? 'Spawn Pad' : 'Custom Brick'}
                  </span>
                  {selectedBrickId !== 'b_base' && selectedBrickId !== 'b_spawn' && (
                    <button
                      id="maker_delete_selected_btn"
                      onClick={handleDeleteSelected}
                      className="text-red-600 hover:text-red-800 font-bold hover:underline flex items-center gap-0.5"
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
                
                {selectedBrickId !== 'b_base' && selectedBrickId !== 'b_spawn' && (
                  <button
                    id="maker_duplicate_btn"
                    onClick={handleDuplicateSelected}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 rounded shadow-sm text-[11px] flex items-center justify-center gap-1 transition"
                  >
                    <Copy size={12} />
                    <span>Duplicate / Clone Brick</span>
                  </button>
                )}
              </div>
            )}

            {/* Auto-Stack Option */}
            <div className="flex items-center justify-between bg-white border border-slate-300 p-2.5 rounded shadow-sm">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <ArrowUp size={14} className="text-red-600" />
                  🪄 Stacker Assist
                </span>
                <p className="text-[10px] text-slate-400">Stack blocks vertically automatically</p>
              </div>
              <input
                id="toggle_autostack"
                type="checkbox"
                checked={autoStack}
                onChange={(e) => setAutoStack(e.target.checked)}
                className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer"
              />
            </div>

            {/* Brick Material type selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Brick Material / Behavior:</label>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {(['block', 'wedge', 'spawn', 'lava', 'goal'] as const).map((t) => (
                  <button
                    id={`maker_brush_type_${t}`}
                    key={t}
                    onClick={() => changeBrushType(t)}
                    className={`py-1.5 px-2.5 rounded font-bold capitalize border text-left transition ${brushType === t ? 'bg-red-700 text-white border-red-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                  >
                    {t === 'block' ? '🧱 Block' : t === 'wedge' ? '📐 Wedge' : t === 'spawn' ? '📍 SpawnPad' : t === 'lava' ? '🔥 Lava Trap' : '⭐ GoalPad'}
                  </button>
                ))}
              </div>
            </div>

            {/* Paint Palette for blocks/wedges */}
            {brushType !== 'lava' && brushType !== 'goal' && brushType !== 'spawn' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Paint Brush Color:</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {CLASSIC_COLORS.map((color) => (
                    <button
                      id={`maker_brush_color_${color.replace('#', '')}`}
                      key={color}
                      onClick={() => changeBrushColor(color)}
                      className={`w-full h-7 rounded border-2 transition ${brushColor === color ? 'border-red-600 scale-110 shadow-md' : 'border-slate-300 hover:border-slate-500'}`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Spatial Position values (X, Y, Z) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Coordinates Position:</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block text-center">X (Left-Right)</span>
                  <input
                    id="maker_pos_x"
                    type="number"
                    value={brushX}
                    onChange={(e) => changeBrushX(Number(e.target.value))}
                    className="w-full text-center bg-white border border-slate-400 rounded text-xs py-1 font-bold font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block text-center">Y (Altitude/Ht)</span>
                  <input
                    id="maker_pos_y"
                    type="number"
                    value={brushY}
                    onChange={(e) => changeBrushY(Number(e.target.value))}
                    className="w-full text-center bg-white border border-slate-400 rounded text-xs py-1 font-bold font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block text-center">Z (In-Out)</span>
                  <input
                    id="maker_pos_z"
                    type="number"
                    value={brushZ}
                    onChange={(e) => changeBrushZ(Number(e.target.value))}
                    className="w-full text-center bg-white border border-slate-400 rounded text-xs py-1 font-bold font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Spatial Scales (X, Y, Z) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Scale / Block Dimensions:</label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block text-center">Width (Scale X)</span>
                  <input
                    id="maker_scale_x"
                    type="number"
                    min="1"
                    max="80"
                    value={brushScaleX}
                    onChange={(e) => changeBrushScaleX(Math.max(1, Number(e.target.value)))}
                    className="w-full text-center bg-white border border-slate-400 rounded text-xs py-1 font-bold font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block text-center">Height (Scale Y)</span>
                  <input
                    id="maker_scale_y"
                    type="number"
                    min="1"
                    max="40"
                    value={brushScaleY}
                    onChange={(e) => changeBrushScaleY(Math.max(1, Number(e.target.value)))}
                    className="w-full text-center bg-white border border-slate-400 rounded text-xs py-1 font-bold font-mono"
                  />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block text-center">Depth (Scale Z)</span>
                  <input
                    id="maker_scale_z"
                    type="number"
                    min="1"
                    max="80"
                    value={brushScaleZ}
                    onChange={(e) => changeBrushScaleZ(Math.max(1, Number(e.target.value)))}
                    className="w-full text-center bg-white border border-slate-400 rounded text-xs py-1 font-bold font-mono"
                  />
                </div>
              </div>
            </div>

          </div>

          <button
            id="maker_add_brick_direct_btn"
            onClick={addBrick}
            className="w-full mt-4 bg-red-700 text-white font-bold py-2.5 px-4 rounded text-xs hover:bg-red-600 shadow-md transition flex items-center justify-center gap-1.5"
          >
            <Plus size={16} />
            <span>Stamp/Place Brick</span>
          </button>
        </div>

        {/* RIGHT COLUMN: Real-Time side-by-side viewports */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          
          {/* Main Visualizer Panel Tabs */}
          <div className="flex justify-between items-center border-b-2 border-slate-300">
            <div className="flex">
              <button
                id="tab_2d_btn"
                onClick={() => setActiveTab('blueprint')}
                className={`py-2 px-4 font-bold text-xs sm:text-sm ${activeTab === 'blueprint' ? 'border-b-4 border-red-700 text-red-700 bg-[#f3eae1]' : 'text-slate-500 hover:text-slate-800'}`}
              >
                🗺️ Blueprint Grid (2D X/Z)
              </button>
              <button
                id="tab_brick_list_btn"
                onClick={() => setActiveTab('bricklist')}
                className={`py-2 px-4 font-bold text-xs sm:text-sm flex items-center gap-1.5 ${activeTab === 'bricklist' ? 'border-b-4 border-red-700 text-red-700 bg-[#f3eae1]' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <span>📋 Parts list</span>
                <span className="bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-[10px] font-mono">{bricks.length}</span>
              </button>
            </div>
            {layoutMode !== '2d' && (
              <span className="text-[10px] font-bold text-slate-400 italic bg-slate-100 px-2 py-1 rounded">
                🖱️ Drag on 3D box to Orbit view!
              </span>
            )}
          </div>

          {activeTab === 'blueprint' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* 2D CANVAS ELEMENT */}
              {(layoutMode === 'split' || layoutMode === '2d') && (
                <div className={`${layoutMode === 'split' ? 'md:col-span-6' : 'md:col-span-12'} space-y-1.5`}>
                  <div className="bg-slate-800 rounded border-2 border-slate-700 p-1 flex justify-center shadow-md">
                    <canvas
                      id="maker_blueprint_canvas"
                      ref={blueprintCanvasRef}
                      width={380}
                      height={320}
                      className="rounded shadow-inner border border-slate-900 cursor-crosshair max-w-full"
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium bg-slate-100 p-1.5 rounded border border-slate-200">
                    <span>🔴 Red: Y Axis (X equivalent)</span>
                    <span>🔵 Blue: X Axis (Z equivalent)</span>
                  </div>
                </div>
              )}

              {/* THREE.JS 3D VIEWPORT ELEMENT */}
              {(layoutMode === 'split' || layoutMode === '3d') && (
                <div className={`${layoutMode === 'split' ? 'md:col-span-6' : 'md:col-span-12'} space-y-1.5`}>
                  <div className="bg-slate-900 rounded border-2 border-slate-800 p-1 flex flex-col justify-between relative shadow-md" style={{ height: '330px' }}>
                    <canvas
                      id="maker_3d_canvas"
                      ref={threeCanvasRef}
                      className="w-full h-full rounded cursor-grab active:cursor-grabbing"
                    />
                    {/* View preset controllers Overlay */}
                    <div className="absolute top-3 right-3 flex gap-1 text-[9px] font-mono font-bold">
                      <button
                        id="cam_iso_btn"
                        onClick={() => handlePresetCamera('iso')}
                        className="bg-slate-800/95 text-white hover:bg-slate-700 border border-slate-600 px-2 py-1 rounded shadow"
                      >
                        📐 ISO
                      </button>
                      <button
                        id="cam_top_btn"
                        onClick={() => handlePresetCamera('top')}
                        className="bg-slate-800/95 text-white hover:bg-slate-700 border border-slate-600 px-2 py-1 rounded shadow"
                      >
                        🗺️ TOP
                      </button>
                      <button
                        id="cam_front_btn"
                        onClick={() => handlePresetCamera('front')}
                        className="bg-slate-800/95 text-white hover:bg-slate-700 border border-slate-600 px-2 py-1 rounded shadow"
                      >
                        🖼️ FRONT
                      </button>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono text-center bg-slate-900 text-slate-300 py-1 px-2 rounded">
                    3D Level Visualizer • drag to orbit view
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === 'bricklist' && (
            <div className="bg-white border-2 border-[#d0c0b0] rounded max-h-[340px] overflow-y-auto p-4 space-y-1.5 shadow-inner">
              <h4 className="font-bold text-xs text-slate-600 mb-2">Placed components in Roblox level ({bricks.length}):</h4>
              {bricks.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBrickId(b.id)}
                  className={`flex items-center justify-between border p-2 rounded text-xs transition cursor-pointer ${selectedBrickId === b.id ? 'bg-amber-50 border-amber-400 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 border-slate-200'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded border border-slate-400" style={{ backgroundColor: b.color }} />
                    <div>
                      <span className="font-mono capitalize font-bold text-slate-800">{b.type}</span>
                      <span className="text-[10px] text-slate-400 block sm:inline sm:ml-2">
                        XYZ: ({b.x}, {b.y}, {b.z}) Scale: ({b.scaleX}, {b.scaleY}, {b.scaleZ})
                      </span>
                    </div>
                  </div>
                  {b.id !== 'b_base' && b.id !== 'b_spawn' ? (
                    <button
                      id={`maker_delete_brick_${b.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeBrick(b.id);
                      }}
                      className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition"
                      title="Delete part"
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic bg-slate-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Locked</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* CATALOG PUBLISHING SUBMIT FORM */}
          <div className="bg-[#f0e4d8] border-2 border-[#d0c0b0] rounded p-4 space-y-4 shadow-sm">
            <h4 className="font-serif font-black text-slate-800 text-sm border-b border-slate-300 pb-1.5">
              Publish Level to Server List
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Game Server Title:</label>
                <input
                  id="maker_publish_name"
                  type="text"
                  placeholder="e.g. Classic Cross Roads, Spiral Heights 3D"
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded py-2 px-3 text-xs font-semibold text-slate-800 shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Server Description:</label>
                <input
                  id="maker_publish_desc"
                  type="text"
                  placeholder="Enter a fun, retro description..."
                  value={gameDesc}
                  onChange={(e) => setGameDesc(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded py-2 px-3 text-xs text-slate-800 shadow-sm"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2 justify-end">
              <button
                id="maker_clear_all_btn"
                onClick={clearAllCustom}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded text-xs transition flex items-center gap-1 shadow-sm"
              >
                <RefreshCw size={14} />
                <span>Reset Map</span>
              </button>
              
              <button
                id="maker_publish_final_btn"
                onClick={handlePublish}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-6 py-2 rounded text-xs transition flex items-center gap-1.5 shadow-md border-b-2 border-emerald-900"
              >
                <CheckCircle size={14} />
                <span>Publish Roblox Game Server!</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
