import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Brick, CatalogItem, RobloxGame, UserProfile } from '../types';
import { INITIAL_CATALOG } from '../data';
import { Play, RotateCcw, Volume2, VolumeX, Smartphone, Monitor } from 'lucide-react';

interface GamePlayerProps {
  game: RobloxGame;
  user: UserProfile;
  is3DMode: boolean;
  onWin: (rewardTickets: number, rewardRobux: number) => void;
}

// Retro Web Audio SFX Generator
const playRetroSound = (type: 'jump' | 'oof' | 'win') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'jump') {
      // Short frequency sweep up
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } else if (type === 'oof') {
      // Classic "Oof" pitch slide down
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(65, ctx.currentTime + 0.2);
      
      // Add a lowpass filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);
      
      osc.disconnect(gain);
      osc.connect(filter);
      filter.connect(gain);
      
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'win') {
      // Fun 2007 celebrate chord arpeggio
      const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
      notes.forEach((freq, idx) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        g.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.12);
        g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.12 + 0.3);
        o.connect(g);
        g.connect(ctx.destination);
        o.start(ctx.currentTime + idx * 0.12);
        o.stop(ctx.currentTime + idx * 0.12 + 0.35);
      });
    }
  } catch (e) {
    console.warn('Audio synthesis block or failed to play:', e);
  }
};

export const GamePlayer: React.FC<GamePlayerProps> = ({
  game,
  user,
  is3DMode,
  onWin,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isDead, setIsDead] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [muted, setMuted] = useState<boolean>(false);
  const [showMobileControls, setShowMobileControls] = useState<boolean>(false);
  const [local3DMode, setLocal3DMode] = useState<boolean>(is3DMode);

  // Multiplayer variables & Chat log
  const [multiplayerPlayers, setMultiplayerPlayers] = useState<any[]>([]);
  const otherPlayersRef = useRef<Record<string, any>>({});
  const socketRef = useRef<WebSocket | null>(null);
  const [chatMessages, setChatMessages] = useState<{ id: string; username: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const lastSentPos = useRef({ x: 0, y: 0, z: 0, rotY: 0, isWalking: false });

  // Keyboard controls state
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Physics stats (2D Side Scroller view mapping of coordinates)
  // Roblox coordinates: X = Left/Right, Y = Altitude (Up/Down), Z = Depth (In/Out)
  const playerPos = useRef({ x: 0, y: 10, z: 0 });
  const playerVel = useRef({ x: 0, y: 0, z: 0 });
  const onGround = useRef(false);
  const camera2DPos = useRef({ x: 0, y: 0 });

  // Find equipped animations
  const animPackId = user.equippedItems.animationPack || 'anim_classic';
  const animPack = INITIAL_CATALOG.find(i => i.id === animPackId) || INITIAL_CATALOG[14]; // classic fallback
  const animationType = animPack.animationType || 'classic';

  // Find equipped items
  const shirtItem = user.equippedItems.shirt ? INITIAL_CATALOG.find(i => i.id === user.equippedItems.shirt) : null;
  const pantsItem = user.equippedItems.pants ? INITIAL_CATALOG.find(i => i.id === user.equippedItems.pants) : null;
  const accessoryItem = user.equippedItems.accessory ? INITIAL_CATALOG.find(i => i.id === user.equippedItems.accessory) : null;
  const faceItem = user.equippedItems.face ? INITIAL_CATALOG.find(i => i.id === user.equippedItems.face) : null;
  const hairItem = user.equippedItems.hair ? INITIAL_CATALOG.find(i => i.id === user.equippedItems.hair) : null;
  const equipped = user.equippedItems;

  // Track spawn location
  const spawnBrick = game.bricks.find(b => b.type === 'spawn') || { x: 0, y: 2, z: -20 };
  const initialX = spawnBrick.x;
  const initialY = spawnBrick.y + 4;
  const initialZ = spawnBrick.z;

  // Establish multiplayer connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}/api/multiplayer`;
    const socket = new WebSocket(socketUrl);
    socketRef.current = socket;

    socket.onopen = () => {
      socket.send(JSON.stringify({
        type: 'join',
        payload: {
          gameId: game.id,
          userId: user.id,
          username: user.username,
          avatarColors: user.avatarColors,
          equippedItems: user.equippedItems,
          shirtItem,
          pantsItem,
          accessoryItem,
          hairItem,
        }
      }));
    };

    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const { type, payload } = parsed;

        if (type === 'sync_players') {
          const playersMap: Record<string, any> = {};
          payload.players.forEach((p: any) => {
            playersMap[p.userId] = p;
          });
          otherPlayersRef.current = playersMap;
          setMultiplayerPlayers(Object.values(playersMap));
        } else if (type === 'player_joined') {
          const { player } = payload;
          if (player.userId !== user.id) {
            otherPlayersRef.current[player.userId] = player;
            setMultiplayerPlayers(Object.values(otherPlayersRef.current));
            
            setChatMessages(prev => [
              ...prev,
              {
                id: `sys_${Date.now()}`,
                username: 'System',
                text: `${player.username} joined the server!`,
              }
            ].slice(-15));
          }
        } else if (type === 'player_left') {
          const { userId } = payload;
          const leftPlayer = otherPlayersRef.current[userId];
          if (leftPlayer) {
            setChatMessages(prev => [
              ...prev,
              {
                id: `sys_${Date.now()}`,
                username: 'System',
                text: `${leftPlayer.username} left the server.`,
              }
            ].slice(-15));
          }
          delete otherPlayersRef.current[userId];
          setMultiplayerPlayers(Object.values(otherPlayersRef.current));
        } else if (type === 'player_moved') {
          const { userId, x, y, z, rotY, isWalking } = payload;
          if (otherPlayersRef.current[userId]) {
            otherPlayersRef.current[userId].x = x;
            otherPlayersRef.current[userId].y = y;
            otherPlayersRef.current[userId].z = z;
            otherPlayersRef.current[userId].rotY = rotY;
            otherPlayersRef.current[userId].isWalking = isWalking;
          }
        } else if (type === 'chat_received') {
          const { username, text } = payload;
          setChatMessages(prev => [
            ...prev,
            { id: `chat_${Date.now()}_${Math.random()}`, username, text },
          ].slice(-15));
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [game.id, user.id]);

  const sendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        type: 'chat',
        payload: {
          username: user.username,
          text: chatInput,
        },
      }));
    }
    setChatInput('');
  };

  const resetPlayer = () => {
    playerPos.current = { x: initialX, y: initialY, z: initialZ };
    playerVel.current = { x: 0, y: 0, z: 0 };
    setIsDead(false);
    setHasWon(false);
    camera2DPos.current = { x: 0, y: 0 };
  };

  useEffect(() => {
    resetPlayer();
  }, [game, local3DMode]);

  // Handle setting changes from parent
  useEffect(() => {
    setLocal3DMode(is3DMode);
  }, [is3DMode]);

  // Audio helper
  const playSound = (type: 'jump' | 'oof' | 'win') => {
    if (!muted) playRetroSound(type);
  };

  // Setup Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      // Prevent scrolling on arrows/space inside active play window
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --------------------------------------------------
  // 1. 2D ENGINE (HTML5 Canvas Side-Scroller Render & Physics)
  // --------------------------------------------------
  useEffect(() => {
    if (local3DMode) return; // ignore if 3D

    const canvas = canvas2DRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let walkAnimFrame = 0;

    const gameLoop = () => {
      if (!isPlaying) {
        animationId = requestAnimationFrame(gameLoop);
        return;
      }

      // 1. Input Handling
      const moveSpeed = 0.25 * (animPack.walkAnimationSpeed || 1);
      const jumpStrength = 0.45 * (animPack.jumpAnimationHeight || 1);

      let dx = 0;
      // Lock Z-axis movement velocity in 2D mode to 0 to prevent sliding out of collision lane
      let dz = 0;

      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx = -1;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx = 1;

      playerVel.current.x = dx * moveSpeed;
      playerVel.current.z = 0;
      playerPos.current.z = spawnBrick.z; // lock Z position strictly to spawn brick depth lane

      // Jump Trigger (in 2D, space, w, and arrowup triggers jump)
      if ((keysPressed.current[' '] || keysPressed.current['w'] || keysPressed.current['arrowup']) && onGround.current && !isDead && !hasWon) {
        playerVel.current.y = jumpStrength;
        onGround.current = false;
        playSound('jump');
      }

      // 2. Physics & Gravity
      if (!onGround.current) {
        playerVel.current.y -= 0.015; // gravity
      } else {
        playerVel.current.y = Math.max(0, playerVel.current.y);
      }

      // Apply speeds
      if (!isDead && !hasWon) {
        playerPos.current.x += playerVel.current.x;
        playerPos.current.y += playerVel.current.y;
        playerPos.current.z += playerVel.current.z;
      }

      // Collision Detection with Bricks
      let collidedWithFloor = false;
      
      game.bricks.forEach((brick) => {
        // Simple AABB calculations relative to side-scroller (X/Y projection)
        // Player box size: width 2, height 4, depth 2
        const playerHalfW = 1.0;
        const playerH = 3.6;

        const pMinX = playerPos.current.x - playerHalfW;
        const pMaxX = playerPos.current.x + playerHalfW;
        const pMinY = playerPos.current.y;
        const pMaxY = playerPos.current.y + playerH;

        const bMinX = brick.x - brick.scaleX / 2;
        const bMaxX = brick.x + brick.scaleX / 2;
        const bMinY = brick.y - brick.scaleY / 2;
        const bMaxY = brick.y + brick.scaleY / 2;
        const bMinZ = brick.z - brick.scaleZ / 2;
        const bMaxZ = brick.z + brick.scaleZ / 2;

        const pMinZ = playerPos.current.z - 1.0;
        const pMaxZ = playerPos.current.z + 1.0;

        // Check 2D overlap (including depth/Z axis so we only collide with elements in our depth lane)
        const overlapX = pMinX < bMaxX && pMaxX > bMinX;
        const overlapY = pMinY < bMaxY && pMaxY > bMinY;
        const overlapZ = pMinZ < bMaxZ && pMaxZ > bMinZ;

        if (overlapX && overlapY && overlapZ) {
          if (brick.type === 'lava' && !isDead) {
            setIsDead(true);
            playSound('oof');
            setTimeout(() => resetPlayer(), 1500);
          } else if (brick.type === 'goal' && !hasWon) {
            setHasWon(true);
            playSound('win');
            onWin(50, 10); // Reward tickets/robux
          } else {
            // Solid collision handling (rebound feet on solid blocks)
            // If falling down onto block
            if (playerVel.current.y <= 0 && pMinY <= bMaxY && pMinY >= bMaxY - 0.5) {
              playerPos.current.y = bMaxY;
              playerVel.current.y = 0;
              collidedWithFloor = true;
            }
          }
        }
      });

      onGround.current = collidedWithFloor;

      // Pit death
      if (playerPos.current.y < -15 && !isDead) {
        setIsDead(true);
        playSound('oof');
        setTimeout(() => resetPlayer(), 1500);
      }

      // 3. Rendering Canvas 2D
      ctx.fillStyle = '#bae6fd'; // sky blue
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Camera follow player (smooth offset with corrected vertical tracking)
      const targetCameraX = canvas.width / 2 - playerPos.current.x * 12;
      const targetCameraY = canvas.height * 0.7 + playerPos.current.y * 12;

      if (camera2DPos.current.x === 0 && camera2DPos.current.y === 0) {
        camera2DPos.current.x = targetCameraX;
        camera2DPos.current.y = targetCameraY;
      } else {
        camera2DPos.current.x += (targetCameraX - camera2DPos.current.x) * 0.15;
        camera2DPos.current.y += (targetCameraY - camera2DPos.current.y) * 0.15;
      }

      const cameraX = camera2DPos.current.x;
      const cameraY = camera2DPos.current.y;

      ctx.save();
      ctx.translate(cameraX, cameraY);

      // Draw Grid / Ground Line
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let i = -1000; i < 1000; i += 40) {
        ctx.beginPath();
        ctx.moveTo(i, -1000);
        ctx.lineTo(i, 1000);
        ctx.stroke();
      }

      // Draw Bricks
      game.bricks.forEach((brick) => {
        const bWidth = brick.scaleX * 12;
        const bHeight = brick.scaleY * 12;
        const bX = (brick.x - brick.scaleX / 2) * 12;
        const bY = -(brick.y + brick.scaleY / 2) * 12; // invert canvas Y

        // Render Bricks with vintage bevel look
        ctx.fillStyle = brick.color;
        ctx.fillRect(bX, bY, bWidth, bHeight);

        // Brick borders/stud details
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bX, bY, bWidth, bHeight);

        // Draw classic Roblox studs on top
        if (brick.type !== 'lava' && brick.type !== 'goal') {
          ctx.fillStyle = brick.color;
          const studCount = Math.floor(brick.scaleX);
          for (let s = 0; s < studCount; s++) {
            const sx = bX + (s + 0.25) * 12;
            const sy = bY - 2;
            ctx.fillRect(sx, sy, 6, 2);
            ctx.strokeRect(sx, sy, 6, 2);
          }
        }

        // Lava glow
        if (brick.type === 'lava') {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
          ctx.fillRect(bX - 2, bY - 2, bWidth + 4, bHeight + 4);
        }

        // Goal outline
        if (brick.type === 'goal') {
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 3;
          ctx.strokeRect(bX - 4, bY - 4, bWidth + 8, bHeight + 8);
          
          // Goal text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('WINNER', bX + bWidth / 2 - 18, bY + bHeight / 2 + 3);
        }

        // Spawn symbol
        if (brick.type === 'spawn') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(bX + bWidth / 2, bY + bHeight / 2, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(bX + bWidth / 2, bY + bHeight / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Draw Player R6 Avatar in 2D projection
      if (!isDead) {
        const px = playerPos.current.x * 12;
        const py = -playerPos.current.y * 12;

        walkAnimFrame += Math.abs(playerVel.current.x) > 0 ? 0.15 : 0;
        const walkSwing = Math.sin(walkAnimFrame);

        ctx.save();
        ctx.translate(px, py - 20); // Center at avatar middle

        // Determine specific style based on animation packs
        let leftLegAngle = walkSwing * 0.4;
        let rightLegAngle = -walkSwing * 0.4;
        let leftArmAngle = -walkSwing * 0.4;
        let rightArmAngle = walkSwing * 0.4;
        let levitateOffset = 0;

        if (animationType === 'ninja') {
          // Lean forward, limbs pulled back
          ctx.rotate(0.12);
          leftLegAngle = walkSwing * 0.3;
          rightLegAngle = -walkSwing * 0.3;
          leftArmAngle = -0.5 + walkSwing * 0.1;
          rightArmAngle = -0.5 - walkSwing * 0.1;
        } else if (animationType === 'superhero') {
          // Levitate float
          levitateOffset = Math.sin(Date.now() / 200) * 4 - 3;
          ctx.translate(0, levitateOffset);
          leftLegAngle = 0.1;
          rightLegAngle = -0.1;
          leftArmAngle = -0.4;
          rightArmAngle = 0.4;
        } else if (animationType === 'robot') {
          // Stiff clunky stomps
          leftLegAngle = Math.round(walkSwing) * 0.3;
          rightLegAngle = -Math.round(walkSwing) * 0.3;
          leftArmAngle = -Math.round(walkSwing) * 0.3;
          rightArmAngle = Math.round(walkSwing) * 0.3;
        }

        // --- Draw Block Character Parts ---
        const skinHead = user.avatarColors.head || '#facc15';
        const paintShirt = shirtItem?.assetColor || user.avatarColors.torso || '#ef4444';
        const paintPants = pantsItem?.assetColor || user.avatarColors.leftLeg || '#2563eb';

        // Valkyrie Wings (behind player)
        if (accessoryItem?.accessoryType === 'wings') {
          ctx.fillStyle = '#fef08a';
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1;
          // Left Wing
          ctx.beginPath();
          ctx.moveTo(-10, -5);
          ctx.lineTo(-30, -20);
          ctx.lineTo(-26, -5);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
          // Right Wing
          ctx.beginPath();
          ctx.moveTo(10, -5);
          ctx.lineTo(30, -20);
          ctx.lineTo(26, -5);
          ctx.closePath();
          ctx.fill(); ctx.stroke();
        }

        // Left Leg
        ctx.save();
        ctx.translate(-4, 12);
        ctx.rotate(leftLegAngle);
        ctx.fillStyle = paintPants;
        ctx.strokeStyle = '#111827';
        ctx.fillRect(-4, 0, 8, 16);
        ctx.strokeRect(-4, 0, 8, 16);
        ctx.restore();

        // Right Leg
        ctx.save();
        ctx.translate(4, 12);
        ctx.rotate(rightLegAngle);
        ctx.fillStyle = paintPants;
        ctx.strokeStyle = '#111827';
        ctx.fillRect(-4, 0, 8, 16);
        ctx.strokeRect(-4, 0, 8, 16);
        ctx.restore();

        // Torso
        ctx.fillStyle = paintShirt;
        ctx.strokeStyle = '#111827';
        ctx.fillRect(-8, -12, 16, 24);
        ctx.strokeRect(-8, -12, 16, 24);

        // Shirt overlay tie/design
        if (shirtItem?.assetImageUrl) {
          const img = new Image();
          img.src = shirtItem.assetImageUrl;
          if (img.complete) {
            ctx.drawImage(img, -7, -11, 14, 22);
          }
        }
        if (shirtItem?.assetDesign === 'tux') {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-4, -12);
          ctx.lineTo(4, -12);
          ctx.lineTo(0, -2);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-2, -10, 4, 2);
        } else if (shirtItem?.assetDesign === 'wrench') {
          ctx.fillStyle = '#111827';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Left Arm
        ctx.save();
        ctx.translate(-12, -12);
        ctx.rotate(leftArmAngle);
        ctx.fillStyle = paintShirt;
        ctx.strokeStyle = '#111827';
        ctx.fillRect(-4, 0, 8, 22);
        ctx.strokeRect(-4, 0, 8, 22);
        ctx.restore();

        // Right Arm
        ctx.save();
        ctx.translate(12, -12);
        ctx.rotate(rightArmAngle);
        ctx.fillStyle = paintShirt;
        ctx.strokeStyle = '#111827';
        ctx.fillRect(-4, 0, 8, 22);
        ctx.strokeRect(-4, 0, 8, 22);
        ctx.restore();

        // Neck
        ctx.fillStyle = skinHead;
        ctx.fillRect(-2, -18, 4, 6);

        // Head Block
        ctx.fillStyle = skinHead;
        ctx.strokeStyle = '#111827';
        ctx.fillRect(-6, -28, 12, 12);
        ctx.strokeRect(-6, -28, 12, 12);

        // Face details
        ctx.fillStyle = '#111827';
        if (!faceItem || faceItem.faceAssetUrl === 'smile') {
          ctx.fillRect(-3, -24, 1.5, 1.5);
          ctx.fillRect(1.5, -24, 1.5, 1.5);
          ctx.beginPath();
          ctx.arc(0, -21, 2, 0, Math.PI);
          ctx.stroke();
        } else if (faceItem.faceAssetUrl === 'awesome') {
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(0, -20, 2.5, 0, Math.PI);
          ctx.fill();
          ctx.fillStyle = '#111827';
          ctx.fillRect(-3, -24, 2, 1);
          ctx.fillRect(1, -24, 2, 1);
        } else if (faceItem.faceAssetUrl === 'chill') {
          ctx.fillRect(-3.5, -23.5, 1, 1);
          ctx.fillRect(2.5, -23.5, 1, 1);
          ctx.beginPath();
          ctx.moveTo(-2, -19);
          ctx.lineTo(2, -20);
          ctx.stroke();
        } else if (faceItem.faceAssetUrl === 'silly') {
          ctx.fillRect(-3.5, -24, 1.5, 1.5);
          ctx.fillRect(2, -23.5, 2, 1);
          // tongue
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-1, -19, 2, 3);
        }

        // Retro hair rendering on 2D head
        if (equipped.hair) {
          if (equipped.hair === 'hair_beautiful_brown') {
            ctx.fillStyle = '#78350f'; // brown
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = 1;
            
            // top dome hair
            ctx.beginPath();
            ctx.arc(0, -28, 7, Math.PI, 0);
            ctx.fill();
            ctx.stroke();

            // side flaps
            ctx.fillRect(-7.5, -28, 2.2, 8);
            ctx.strokeRect(-7.5, -28, 2.2, 8);
            ctx.fillRect(5.3, -28, 2.2, 8);
            ctx.strokeRect(5.3, -28, 2.2, 8);
          } else if (equipped.hair === 'hair_black_ponytail') {
            ctx.fillStyle = '#111827'; // black
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = 1;

            // top dome hair
            ctx.beginPath();
            ctx.arc(0, -28, 7, Math.PI, 0);
            ctx.fill();
            ctx.stroke();

            // ponytail tail sticking out back right
            ctx.beginPath();
            ctx.arc(6.5, -24, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
          } else if (equipped.hair === 'hair_blonde_spiky') {
            ctx.fillStyle = '#fbbf24'; // blonde
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = 1;

            // spikes on top
            ctx.beginPath();
            ctx.moveTo(-6, -28);
            ctx.lineTo(-4, -34);
            ctx.lineTo(-1, -28);
            ctx.lineTo(1, -35);
            ctx.lineTo(3, -28);
            ctx.lineTo(5, -34);
            ctx.lineTo(6, -28);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // forehead hair line
            ctx.fillRect(-6, -28, 12, 3);
          } else if (equipped.hair === 'hair_blue_anime') {
            ctx.fillStyle = '#3b82f6'; // blue
            ctx.strokeStyle = '#111827';
            ctx.lineWidth = 1;

            // anime swoosh
            ctx.beginPath();
            ctx.moveTo(-6, -28);
            ctx.quadraticCurveTo(0, -36, 8, -30);
            ctx.quadraticCurveTo(0, -28, -6, -28);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // sidebangs
            ctx.fillRect(-7.5, -28, 2, 6);
            ctx.fillRect(5.5, -28, 2, 6);
          }
        }

        // Accessories adjustments (Strict shades, hats, fedoras)
        if (accessoryItem?.accessoryType === 'shades') {
          ctx.fillStyle = '#111111';
          ctx.fillRect(-5, -24.5, 10, 2.5);
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(-5, -24.5, 10, 2.5);
        }

        if (equipped.accessory === 'acc_red_cap') {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(-7, -30, 14, 3);
          ctx.fillRect(-11, -28, 4, 1.5); // cap visor
        } else if (equipped.accessory === 'acc_fedora') {
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(-9, -29, 18, 1.5); // brim
          ctx.fillRect(-5, -34, 10, 5); // crown
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-5, -30, 10, 1); // ribbon
        } else if (equipped.accessory === 'acc_tophat') {
          ctx.fillStyle = '#111827';
          ctx.fillRect(-8, -29, 16, 1.5); // brim
          ctx.fillRect(-5, -42, 10, 13); // crown
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-5, -31, 10, 2); // band
        }

        ctx.restore();
      }

      // 3. Send player position to server
      if (!isDead) {
        const currentX = playerPos.current.x;
        const currentY = playerPos.current.y;
        const currentZ = playerPos.current.z;
        const currentIsWalking = Math.abs(playerVel.current.x) > 0 || Math.abs(playerVel.current.z) > 0;

        const dist = Math.hypot(
          currentX - lastSentPos.current.x,
          currentY - lastSentPos.current.y,
          currentZ - lastSentPos.current.z
        );

        if (dist > 0.05 || currentIsWalking !== lastSentPos.current.isWalking) {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: 'move',
              payload: {
                x: currentX,
                y: currentY,
                z: currentZ,
                rotY: 0,
                isWalking: currentIsWalking,
              }
            }));
          }
          lastSentPos.current = {
            x: currentX,
            y: currentY,
            z: currentZ,
            rotY: 0,
            isWalking: currentIsWalking,
          };
        }
      }

      // 4. Draw Other Players in 2D mode
      multiplayerPlayers.forEach((op) => {
        if (op.userId === user.id) return;

        const op_px = op.x * 12;
        const op_py = -op.y * 12;

        const op_walkSwing = op.isWalking ? Math.sin(Date.now() / 150) : 0;

        ctx.save();
        ctx.translate(op_px, op_py - 20);

        const opSkinHead = op.avatarColors?.head || '#facc15';
        const opPaintShirt = op.shirtItem?.assetColor || op.avatarColors?.torso || '#ef4444';
        const opPaintPants = op.pantsItem?.assetColor || op.avatarColors?.leftLeg || '#2563eb';

        // Draw Left Leg
        ctx.save();
        ctx.translate(-4, 12);
        ctx.rotate(op_walkSwing * 0.4);
        ctx.fillStyle = opPaintPants;
        ctx.strokeStyle = '#111827';
        ctx.fillRect(-4, 0, 8, 16);
        ctx.strokeRect(-4, 0, 8, 16);
        ctx.restore();

        // Draw Right Leg
        ctx.save();
        ctx.translate(4, 12);
        ctx.rotate(-op_walkSwing * 0.4);
        ctx.fillStyle = opPaintPants;
        ctx.strokeStyle = '#111827';
        ctx.fillRect(-4, 0, 8, 16);
        ctx.strokeRect(-4, 0, 8, 16);
        ctx.restore();

        // Torso
        ctx.fillStyle = opPaintShirt;
        ctx.strokeStyle = '#111827';
        ctx.fillRect(-8, -12, 16, 24);
        ctx.strokeRect(-8, -12, 16, 24);

        // Neck
        ctx.fillStyle = opSkinHead;
        ctx.fillRect(-2, -18, 4, 6);

        // Head Block
        ctx.fillStyle = opSkinHead;
        ctx.strokeStyle = '#111827';
        ctx.fillRect(-6, -28, 12, 12);
        ctx.strokeRect(-6, -28, 12, 12);

        // Smiley face
        ctx.fillStyle = '#111827';
        ctx.fillRect(-3, -24, 1.5, 1.5);
        ctx.fillRect(1.5, -24, 1.5, 1.5);
        ctx.beginPath();
        ctx.arc(0, -21, 2, 0, Math.PI);
        ctx.stroke();

        // Simple Billboard Name Tag above head
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.fillRect(-35, -42, 70, 11);
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.strokeRect(-35, -42, 70, 11);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(op.username, 0, -34);

        ctx.restore();
      });

      ctx.restore(); // Restore camera translation

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [game, isPlaying, isDead, hasWon, local3DMode, user, equipped, animPack, muted, multiplayerPlayers]);

  // --------------------------------------------------
  // 2. 3D ENGINE (Three.js Sandbox Mode Rendering)
  // --------------------------------------------------
  useEffect(() => {
    if (!local3DMode) return; // ignore if 2D

    const container = containerRef.current;
    if (!container) return;

    // A. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#7dd3fc'); // Sky Blue background

    const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Multiplayer other player mesh groups cache
    const otherPlayerMeshes: Record<string, THREE.Group> = {};

    const addHairToHead3D = (head: THREE.Mesh, hairId: string) => {
      if (!hairId) return;

      if (hairId === 'hair_beautiful_brown') {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
        
        // top cap
        const topGeo = new THREE.BoxGeometry(1.7, 0.3, 1.7);
        const topMesh = new THREE.Mesh(topGeo, hairMat);
        topMesh.position.y = 0.85;
        topMesh.castShadow = true;
        head.add(topMesh);

        // left side
        const leftGeo = new THREE.BoxGeometry(0.12, 1.0, 1.7);
        const leftMesh = new THREE.Mesh(leftGeo, hairMat);
        leftMesh.position.set(-0.85, 0.2, 0);
        leftMesh.castShadow = true;
        head.add(leftMesh);

        // right side
        const rightGeo = new THREE.BoxGeometry(0.12, 1.0, 1.7);
        const rightMesh = new THREE.Mesh(rightGeo, hairMat);
        rightMesh.position.set(0.85, 0.2, 0);
        rightMesh.castShadow = true;
        head.add(rightMesh);

      } else if (hairId === 'hair_black_ponytail') {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.8 });

        // top cap
        const topGeo = new THREE.BoxGeometry(1.7, 0.3, 1.7);
        const topMesh = new THREE.Mesh(topGeo, hairMat);
        topMesh.position.y = 0.85;
        topMesh.castShadow = true;
        head.add(topMesh);

        // ponytail extension back-right
        const ponyGeo = new THREE.BoxGeometry(0.4, 1.1, 0.4);
        const ponyMesh = new THREE.Mesh(ponyGeo, hairMat);
        ponyMesh.position.set(0.6, -0.1, -0.9);
        ponyMesh.rotation.z = -0.15;
        ponyMesh.castShadow = true;
        head.add(ponyMesh);

      } else if (hairId === 'hair_blonde_spiky') {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.8 });

        // top cap
        const topGeo = new THREE.BoxGeometry(1.7, 0.2, 1.7);
        const topMesh = new THREE.Mesh(topGeo, hairMat);
        topMesh.position.y = 0.85;
        topMesh.castShadow = true;
        head.add(topMesh);

        // spikes
        const s1Geo = new THREE.BoxGeometry(0.35, 0.6, 0.35);
        const s1 = new THREE.Mesh(s1Geo, hairMat);
        s1.position.set(-0.3, 1.1, 0.2);
        s1.rotation.z = 0.2;
        head.add(s1);

        const s2Geo = new THREE.BoxGeometry(0.4, 0.7, 0.4);
        const s2 = new THREE.Mesh(s2Geo, hairMat);
        s2.position.set(0.2, 1.15, -0.2);
        s2.rotation.x = -0.1;
        head.add(s2);

        const s3Geo = new THREE.BoxGeometry(0.3, 0.5, 0.3);
        const s3 = new THREE.Mesh(s3Geo, hairMat);
        s3.position.set(0.4, 1.05, 0.3);
        s3.rotation.z = -0.2;
        head.add(s3);

      } else if (hairId === 'hair_blue_anime') {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.8 });

        // top cap
        const topGeo = new THREE.BoxGeometry(1.7, 0.35, 1.7);
        const topMesh = new THREE.Mesh(topGeo, hairMat);
        topMesh.position.y = 0.85;
        topMesh.castShadow = true;
        head.add(topMesh);

        // front sweep over head/forehead
        const frontGeo = new THREE.BoxGeometry(1.4, 0.3, 0.4);
        const frontMesh = new THREE.Mesh(frontGeo, hairMat);
        frontMesh.position.set(0.1, 0.7, 0.85);
        frontMesh.castShadow = true;
        head.add(frontMesh);

        // sideburns left
        const sbLeftGeo = new THREE.BoxGeometry(0.12, 0.8, 0.5);
        const sbLeft = new THREE.Mesh(sbLeftGeo, hairMat);
        sbLeft.position.set(-0.85, 0.3, 0.2);
        sbLeft.castShadow = true;
        head.add(sbLeft);

        // sideburns right
        const sbRightGeo = new THREE.BoxGeometry(0.12, 0.8, 0.5);
        const sbRight = new THREE.Mesh(sbRightGeo, hairMat);
        sbRight.position.set(0.85, 0.3, 0.2);
        sbRight.castShadow = true;
        head.add(sbRight);
      } else if (hairId === 'hair_emerald_mohawk') {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.8 });
        // central strip boxes
        const capGeo = new THREE.BoxGeometry(0.5, 0.4, 1.8);
        const cap = new THREE.Mesh(capGeo, hairMat);
        cap.position.set(0, 0.9, 0);
        cap.castShadow = true;
        head.add(cap);

        const mohawkGeo = new THREE.BoxGeometry(0.3, 0.8, 1.4);
        const mohawk = new THREE.Mesh(mohawkGeo, hairMat);
        mohawk.position.set(0, 1.3, -0.1);
        mohawk.castShadow = true;
        head.add(mohawk);
      } else if (hairId === 'hair_crimson_rocker') {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.8 });
        // top block
        const topGeo = new THREE.BoxGeometry(1.8, 0.4, 1.8);
        const topMesh = new THREE.Mesh(topGeo, hairMat);
        topMesh.position.y = 0.85;
        topMesh.castShadow = true;
        head.add(topMesh);

        // left rocker mane
        const leftManeGeo = new THREE.BoxGeometry(0.15, 1.3, 1.8);
        const leftMane = new THREE.Mesh(leftManeGeo, hairMat);
        leftMane.position.set(-0.85, 0.1, 0);
        leftMane.castShadow = true;
        head.add(leftMane);

        // right rocker mane
        const rightManeGeo = new THREE.BoxGeometry(0.15, 1.3, 1.8);
        const rightMane = new THREE.Mesh(rightManeGeo, hairMat);
        rightMane.position.set(0.85, 0.1, 0);
        rightMane.castShadow = true;
        head.add(rightMane);
      } else if (hairId === 'hair_golden_locks') {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.8 });
        const topGeo = new THREE.BoxGeometry(1.8, 0.4, 1.8);
        const topMesh = new THREE.Mesh(topGeo, hairMat);
        topMesh.position.y = 0.85;
        topMesh.castShadow = true;
        head.add(topMesh);

        const leftLocksGeo = new THREE.BoxGeometry(0.2, 1.6, 1.2);
        const leftLocks = new THREE.Mesh(leftLocksGeo, hairMat);
        leftLocks.position.set(-0.85, -0.1, 0.2);
        leftLocks.castShadow = true;
        head.add(leftLocks);

        const rightLocksGeo = new THREE.BoxGeometry(0.2, 1.6, 1.2);
        const rightLocks = new THREE.Mesh(rightLocksGeo, hairMat);
        rightLocks.position.set(0.85, -0.1, 0.2);
        rightLocks.castShadow = true;
        head.add(rightLocks);
      } else if (hairId === 'hair_neon_pink_spikes') {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0xdb2777, roughness: 0.8 });
        const topGeo = new THREE.BoxGeometry(1.7, 0.25, 1.7);
        const topMesh = new THREE.Mesh(topGeo, hairMat);
        topMesh.position.y = 0.85;
        topMesh.castShadow = true;
        head.add(topMesh);

        for (let i = 0; i < 4; i++) {
          const sGeo = new THREE.BoxGeometry(0.35, 0.75, 0.35);
          const s = new THREE.Mesh(sGeo, hairMat);
          s.position.set((i - 1.5) * 0.45, 1.15, (i % 2 === 0 ? 0.25 : -0.25));
          s.rotation.x = (i % 2 === 0 ? 0.2 : -0.2);
          s.rotation.z = (i % 3 === 0 ? 0.15 : -0.15);
          s.castShadow = true;
          head.add(s);
        }
      } else if (hairId === 'hair_silver_surfer') {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x9ca3af, roughness: 0.8 });
        const topGeo = new THREE.BoxGeometry(1.7, 0.35, 1.8);
        const topMesh = new THREE.Mesh(topGeo, hairMat);
        topMesh.position.set(0, 0.85, -0.1);
        topMesh.castShadow = true;
        head.add(topMesh);

        const backGeo = new THREE.BoxGeometry(1.6, 0.6, 0.5);
        const backMesh = new THREE.Mesh(backGeo, hairMat);
        backMesh.position.set(0, 0.5, -0.9);
        backMesh.rotation.x = -0.15;
        backMesh.castShadow = true;
        head.add(backMesh);
      } else if (hairId === 'hair_purple_shag') {
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.8 });
        const topGeo = new THREE.BoxGeometry(1.8, 0.4, 1.8);
        const topMesh = new THREE.Mesh(topGeo, hairMat);
        topMesh.position.y = 0.85;
        topMesh.castShadow = true;
        head.add(topMesh);

        const sideLGeo = new THREE.BoxGeometry(0.2, 1.2, 1.7);
        const sideL = new THREE.Mesh(sideLGeo, hairMat);
        sideL.position.set(-0.85, 0.15, 0);
        sideL.castShadow = true;
        head.add(sideL);

        const sideRGeo = new THREE.BoxGeometry(0.2, 1.2, 1.7);
        const sideR = new THREE.Mesh(sideRGeo, hairMat);
        sideR.position.set(0.85, 0.15, 0);
        sideR.castShadow = true;
        head.add(sideR);
      }
    };

    const createOtherPlayer3DGroup = (op: any) => {
      const group = new THREE.Group();
      
      const skinHead = op.avatarColors?.head || '#facc15';
      const paintShirt = op.shirtItem?.assetColor || op.avatarColors?.torso || '#ef4444';
      const paintPants = op.pantsItem?.assetColor || op.avatarColors?.leftLeg || '#2563eb';

      // Head
      const headGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
      const headMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(skinHead), roughness: 0.7 });
      const headMesh = new THREE.Mesh(headGeo, headMat);
      headMesh.position.y = 3.6;
      headMesh.castShadow = true;
      group.add(headMesh);

      // Add hair to other player head in 3D
      const otherHairId = op.equippedItems?.hair || (op.hairItem ? op.hairItem.id : null);
      if (otherHairId) {
        addHairToHead3D(headMesh, otherHairId);
      }

      // Torso
      const torsoGeo = new THREE.BoxGeometry(2.2, 2.6, 1.1);
      const torsoMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(paintShirt), roughness: 0.7 });
      const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
      torsoMesh.position.y = 1.5;
      torsoMesh.castShadow = true;
      group.add(torsoMesh);

      // Limbs
      const armGeo = new THREE.BoxGeometry(0.8, 2.4, 0.8);
      const legGeo = new THREE.BoxGeometry(0.95, 2.4, 0.95);

      const leftArmMesh = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color(paintShirt), roughness: 0.7 }));
      leftArmMesh.position.set(-1.5, 1.5, 0);
      leftArmMesh.castShadow = true;
      group.add(leftArmMesh);

      const rightArmMesh = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color(paintShirt), roughness: 0.7 }));
      rightArmMesh.position.set(1.5, 1.5, 0);
      rightArmMesh.castShadow = true;
      group.add(rightArmMesh);

      const leftLegMesh = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color(paintPants), roughness: 0.7 }));
      leftLegMesh.position.set(0, -1.0, 0);
      const leftLegPivot = new THREE.Group();
      leftLegPivot.position.set(-0.52, 0.4, 0);
      leftLegPivot.add(leftLegMesh);
      group.add(leftLegPivot);

      const rightLegMesh = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: new THREE.Color(paintPants), roughness: 0.7 }));
      rightLegMesh.position.set(0, -1.0, 0);
      const rightLegPivot = new THREE.Group();
      rightLegPivot.position.set(0.52, 0.4, 0);
      rightLegPivot.add(rightLegMesh);
      group.add(rightLegPivot);

      // Nametag billboard
      const nameCanvas = document.createElement('canvas');
      nameCanvas.width = 128;
      nameCanvas.height = 32;
      const nameCtx = nameCanvas.getContext('2d');
      if (nameCtx) {
        nameCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        nameCtx.fillRect(0, 0, 128, 32);
        nameCtx.fillStyle = '#ffffff';
        nameCtx.font = 'bold 14px monospace';
        nameCtx.textAlign = 'center';
        nameCtx.fillText(op.username, 64, 20);
      }
      const nameTexture = new THREE.CanvasTexture(nameCanvas);
      const nameMat = new THREE.SpriteMaterial({ map: nameTexture });
      const nameSprite = new THREE.Sprite(nameMat);
      nameSprite.position.set(0, 5.0, 0);
      nameSprite.scale.set(3, 0.75, 1);
      group.add(nameSprite);

      group.userData = {
        leftLegPivot,
        rightLegPivot,
        leftArmMesh,
        rightArmMesh,
      };

      return group;
    };

    // B. Lights & Upgraded Shadows
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x334155, 0.45);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
    dirLight.position.set(30, 45, 20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048; // sharper shadows
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 150;
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    dirLight.shadow.bias = -0.0005; // avoid shadow acne
    scene.add(dirLight);

    // Create blocky 3D clouds drifting in the sky
    const cloudGroup = new THREE.Group();
    const cloudMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.85,
    });
    
    for (let c = 0; c < 5; c++) {
      const cloud = new THREE.Group();
      const segmentCount = 3 + Math.floor(Math.random() * 3);
      for (let s = 0; s < segmentCount; s++) {
        const segGeo = new THREE.BoxGeometry(
          8 + Math.random() * 12,
          2.5 + Math.random() * 1.5,
          6 + Math.random() * 8
        );
        const segMesh = new THREE.Mesh(segGeo, cloudMat);
        segMesh.position.set(
          s * 6 - (segmentCount * 3),
          Math.sin(s) * 1.0,
          Math.random() * 3 - 1.5
        );
        cloud.add(segMesh);
      }
      cloud.position.set(
        Math.random() * 120 - 60,
        25 + Math.random() * 10,
        Math.random() * 120 - 60
      );
      cloud.userData = { speed: 1.5 + Math.random() * 2, range: 100 };
      cloudGroup.add(cloud);
    }
    scene.add(cloudGroup);

    // Add subtle grid helper for visual building depth
    const gridHelper = new THREE.GridHelper(150, 150, 0x94a3b8, 0xe2e8f0);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // C. Render Bricks from game definition
    const brickMeshes: THREE.Mesh[] = [];
    
    game.bricks.forEach((brick) => {
      // Choose geometry based on type
      let geometry: THREE.BufferGeometry;
      if (brick.type === 'wedge') {
        // Create custom wedge / slope geometry
        geometry = new THREE.ConeGeometry(brick.scaleX / 2, brick.scaleY, 4);
        geometry.rotateY(Math.PI / 4); // turn to look like blocky slope
      } else {
        geometry = new THREE.BoxGeometry(brick.scaleX, brick.scaleY, brick.scaleZ);
      }

      // Material with classic retro slight roughness
      const matColor = new THREE.Color(brick.color);
      let material: THREE.Material;

      if (brick.type === 'lava') {
        material = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          transparent: true,
          opacity: 0.95,
        });
      } else if (brick.type === 'goal') {
        material = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          roughness: 0.4,
          metalness: 0.2
        });
      } else if (brick.type === 'spawn') {
        material = new THREE.MeshStandardMaterial({
          color: 0x3b82f6,
          roughness: 0.5,
        });
      } else {
        material = new THREE.MeshStandardMaterial({
          color: matColor,
          roughness: 0.8,
          metalness: 0.1,
        });
      }

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(brick.x, brick.y, brick.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Store reference to type & specs for collision engine
      mesh.userData = { type: brick.type, brick };

      scene.add(mesh);
      brickMeshes.push(mesh);
    });

    // D. Build R6 3D Player Avatar Group
    const playerGroup = new THREE.Group();
    scene.add(playerGroup);

    const skinHead = user.avatarColors.head || '#facc15';
    const paintShirt = shirtItem?.assetColor || user.avatarColors.torso || '#ef4444';
    const paintPants = pantsItem?.assetColor || user.avatarColors.leftLeg || '#2563eb';

    // Head (Box)
    const headGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
    const headMat = new THREE.MeshStandardMaterial({ color: skinHead, roughness: 0.7 });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.y = 3.6;
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    playerGroup.add(headMesh);

    // Torso (Box)
    const torsoGeo = new THREE.BoxGeometry(2.2, 2.6, 1.1);
    const torsoMat = new THREE.MeshStandardMaterial({ color: paintShirt, roughness: 0.7 });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.y = 1.5;
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    playerGroup.add(torsoMesh);

    // Load custom decal texture onto the front face of the Torso box if present
    if (shirtItem?.assetImageUrl) {
      const loader = new THREE.TextureLoader();
      if (!shirtItem.assetImageUrl.startsWith('data:')) {
        loader.setCrossOrigin('anonymous');
      }
      loader.load(
        shirtItem.assetImageUrl,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          const torsoMaterials = [
            torsoMat, // px (right)
            torsoMat, // nx (left)
            torsoMat, // py (top)
            torsoMat, // ny (bottom)
            new THREE.MeshStandardMaterial({
              map: texture,
              roughness: 0.7,
              transparent: true
            }), // pz (front decal)
            torsoMat  // nz (back)
          ];
          torsoMesh.material = torsoMaterials as any;
        },
        undefined,
        (err) => {
          console.warn('Failed to load shirt decal texture:', err);
        }
      );
    }

    // Limbs
    const armGeo = new THREE.BoxGeometry(0.8, 2.4, 0.8);
    const legGeo = new THREE.BoxGeometry(0.95, 2.4, 0.95);

    const leftArmMesh = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: paintShirt, roughness: 0.7 }));
    leftArmMesh.position.set(-1.5, 1.5, 0);
    leftArmMesh.castShadow = true;
    leftArmMesh.receiveShadow = true;
    playerGroup.add(leftArmMesh);

    const rightArmMesh = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: paintShirt, roughness: 0.7 }));
    rightArmMesh.position.set(1.5, 1.5, 0);
    rightArmMesh.castShadow = true;
    rightArmMesh.receiveShadow = true;
    playerGroup.add(rightArmMesh);

    const leftLegMesh = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: paintPants, roughness: 0.7 }));
    leftLegMesh.position.set(-0.52, -0.8, 0);
    leftLegMesh.castShadow = true;
    leftLegMesh.receiveShadow = true;
    // Nest leg to hinge properly
    const leftLegPivot = new THREE.Group();
    leftLegPivot.position.set(-0.52, 0.4, 0);
    leftLegMesh.position.set(0, -1.0, 0);
    leftLegPivot.add(leftLegMesh);
    playerGroup.add(leftLegPivot);

    const rightLegMesh = new THREE.Mesh(legGeo, new THREE.MeshStandardMaterial({ color: paintPants, roughness: 0.7 }));
    rightLegMesh.position.set(0.52, -0.8, 0);
    rightLegMesh.castShadow = true;
    rightLegMesh.receiveShadow = true;
    const rightLegPivot = new THREE.Group();
    rightLegPivot.position.set(0.52, 0.4, 0);
    rightLegMesh.position.set(0, -1.0, 0);
    rightLegPivot.add(rightLegMesh);
    playerGroup.add(rightLegPivot);

    // 3D Accessories (Strict Positioning adjustments)
    if (equipped.hair) {
      addHairToHead3D(headMesh, equipped.hair);
    }

    if (accessoryItem?.accessoryType === 'shades') {
      // Sunglasses placed directly on face!
      const shadeGeo = new THREE.BoxGeometry(1.7, 0.35, 0.25);
      const shadeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const shadeMesh = new THREE.Mesh(shadeGeo, shadeMat);
      shadeMesh.position.set(0, 0.1, 0.85); // project forward on face
      headMesh.add(shadeMesh);
    }

    if (equipped.accessory === 'acc_red_cap') {
      const capDomeGeo = new THREE.BoxGeometry(1.65, 0.4, 1.65);
      const capVisorGeo = new THREE.BoxGeometry(1.65, 0.08, 0.6);
      const capMat = new THREE.MeshLambertMaterial({ color: 0xdc2626 });
      
      const capDome = new THREE.Mesh(capDomeGeo, capMat);
      capDome.position.y = 0.85;
      
      const capVisor = new THREE.Mesh(capVisorGeo, capMat);
      capVisor.position.set(0, 0.65, 0.9);
      
      headMesh.add(capDome);
      headMesh.add(capVisor);
    } else if (equipped.accessory === 'acc_fedora') {
      const brimGeo = new THREE.BoxGeometry(2.3, 0.1, 2.3);
      const crownGeo = new THREE.BoxGeometry(1.4, 0.6, 1.4);
      const fedoraMat = new THREE.MeshLambertMaterial({ color: 0x1f2937 });
      
      const brim = new THREE.Mesh(brimGeo, fedoraMat);
      brim.position.y = 0.85;
      
      const crown = new THREE.Mesh(crownGeo, fedoraMat);
      crown.position.y = 1.2;
      
      const ribbonGeo = new THREE.BoxGeometry(1.45, 0.15, 1.45);
      const ribbon = new THREE.Mesh(ribbonGeo, new THREE.MeshLambertMaterial({ color: 0xef4444 }));
      ribbon.position.y = 0.95;

      headMesh.add(brim);
      headMesh.add(crown);
      headMesh.add(ribbon);
    } else if (equipped.accessory === 'acc_tophat') {
      const brimGeo = new THREE.BoxGeometry(2.2, 0.1, 2.2);
      const crownGeo = new THREE.CylinderGeometry(0.7, 0.7, 1.3, 8);
      const tophatMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
      
      const brim = new THREE.Mesh(brimGeo, tophatMat);
      brim.position.y = 0.85;
      
      const crown = new THREE.Mesh(crownGeo, tophatMat);
      crown.position.y = 1.5;
      
      const bandGeo = new THREE.CylinderGeometry(0.72, 0.72, 0.2, 8);
      const band = new THREE.Mesh(bandGeo, new THREE.MeshLambertMaterial({ color: 0xeab308 }));
      band.position.y = 1.0;

      headMesh.add(brim);
      headMesh.add(crown);
      headMesh.add(band);
    }

    if (accessoryItem?.accessoryType === 'wings') {
      const wingGeo = new THREE.BoxGeometry(0.15, 1.5, 3.2);
      const wingMat = new THREE.MeshLambertMaterial({ color: 0xfef08a });
      const wingMesh = new THREE.Mesh(wingGeo, wingMat);
      wingMesh.position.set(0, 0, -1.0); // mount to back of torso
      torsoMesh.add(wingMesh);
    }

    // Set initial player position
    playerGroup.position.set(initialX, initialY, initialZ);

    // E. 3D Engine Frame Loop
    let id3D: number;
    let clock = new THREE.Clock();

    const render3D = () => {
      if (!isPlaying) {
        id3D = requestAnimationFrame(render3D);
        return;
      }

      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // 1. Controls
      const speedModifier = animPack.walkAnimationSpeed || 1;
      const speed = 12 * speedModifier * delta;
      const jumpVel = 18 * (animPack.jumpAnimationHeight || 1);

      let moveX = 0;
      let moveZ = 0;

      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) moveX = -1;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) moveX = 1;
      if (keysPressed.current['w'] || keysPressed.current['arrowup']) moveZ = -1;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) moveZ = 1;

      // Adjust group heading rotation based on movement directions
      if (moveX !== 0 || moveZ !== 0) {
        const targetAngle = Math.atan2(moveX, moveZ);
        playerGroup.rotation.y = targetAngle;

        // Apply velocities (speed is already multiplied by delta)
        playerVel.current.x = moveX * speed;
        playerVel.current.z = moveZ * speed;
      } else {
        // Apply friction
        playerVel.current.x = 0;
        playerVel.current.z = 0;
      }

      // Jump Input
      if (keysPressed.current[' '] && onGround.current && !isDead && !hasWon) {
        playerVel.current.y = jumpVel;
        onGround.current = false;
        playSound('jump');
      }

      // 2. Physics & Gravity
      if (!onGround.current) {
        playerVel.current.y -= 45 * delta; // standard gravity in units/sec^2
      } else {
        playerVel.current.y = Math.max(0, playerVel.current.y);
      }

      if (!isDead && !hasWon) {
        playerGroup.position.x += playerVel.current.x;
        playerGroup.position.y += playerVel.current.y * delta; // integrate vertical velocity using delta
        playerGroup.position.z += playerVel.current.z;
      }

      // 3. Ground / Brick Collision
      let collidedGround = false;
      const pBox = new THREE.Box3().setFromObject(playerGroup);

      brickMeshes.forEach((mesh) => {
        const bBox = new THREE.Box3().setFromObject(mesh);

        if (pBox.intersectsBox(bBox)) {
          const type = mesh.userData.type;
          if (type === 'lava' && !isDead) {
            setIsDead(true);
            playSound('oof');
            setTimeout(() => resetPlayer(), 1500);
          } else if (type === 'goal' && !hasWon) {
            setHasWon(true);
            playSound('win');
            onWin(50, 10);
          } else if (type !== 'spawn') {
            // Rebound player above block surface
            const bBrick = mesh.userData.brick;
            const blockTop = bBrick.y + bBrick.scaleY / 2;
            if (playerGroup.position.y <= blockTop + 1.8 && playerVel.current.y <= 0) {
              playerGroup.position.y = blockTop + 1.8; // standing offset height matching R6 model bottom feet
              playerVel.current.y = 0;
              collidedGround = true;
            }
          }
        }
      });

      onGround.current = collidedGround;

      // Pit fall death
      if (playerGroup.position.y < -20 && !isDead) {
        setIsDead(true);
        playSound('oof');
        setTimeout(() => resetPlayer(), 1500);
      }

      // 4. Limbs Walking Animations based on equipped pack
      const isWalking = Math.abs(playerVel.current.x) > 0 || Math.abs(playerVel.current.z) > 0;
      const swingSpeed = 10;
      const swingAngle = Math.sin(time * swingSpeed);

      if (!isDead && !hasWon) {
        if (animationType === 'classic') {
          // Classic blocky swing
          if (isWalking) {
            leftLegPivot.rotation.x = swingAngle * 0.7;
            rightLegPivot.rotation.x = -swingAngle * 0.7;
            leftArmMesh.rotation.x = -swingAngle * 0.7;
            rightArmMesh.rotation.x = swingAngle * 0.7;
          } else {
            leftLegPivot.rotation.x = 0;
            rightLegPivot.rotation.x = 0;
            leftArmMesh.rotation.x = 0;
            rightArmMesh.rotation.x = 0;
          }
          playerGroup.position.y = Math.max(playerGroup.position.y, onGround.current ? playerGroup.position.y : -25);
        } else if (animationType === 'ninja') {
          // Ninja run: torso tilts forward, arms locked backwards
          playerGroup.rotation.x = isWalking ? 0.3 : 0;
          if (isWalking) {
            leftLegPivot.rotation.x = swingAngle * 0.5;
            rightLegPivot.rotation.x = -swingAngle * 0.5;
            leftArmMesh.rotation.x = -1.2;
            rightArmMesh.rotation.x = -1.2;
          } else {
            leftLegPivot.rotation.x = 0;
            rightLegPivot.rotation.x = 0;
            leftArmMesh.rotation.x = 0;
            rightArmMesh.rotation.x = 0;
          }
        } else if (animationType === 'superhero') {
          // Levitating hero: levitates off the ground, arms float out
          const hoverOffset = Math.sin(time * 3) * 0.25;
          playerGroup.position.y += hoverOffset * delta * 5;
          
          leftArmMesh.rotation.z = -0.3;
          rightArmMesh.rotation.z = 0.3;
          leftLegPivot.rotation.x = 0.1;
          rightLegPivot.rotation.x = -0.1;
        } else if (animationType === 'robot') {
          // Clunky robot
          if (isWalking) {
            const step = Math.round(Math.sin(time * 5));
            leftLegPivot.rotation.x = step * 0.5;
            rightLegPivot.rotation.x = -step * 0.5;
            leftArmMesh.rotation.x = -step * 0.4;
            rightArmMesh.rotation.x = step * 0.4;
          } else {
            leftLegPivot.rotation.x = 0;
            rightLegPivot.rotation.x = 0;
            leftArmMesh.rotation.x = 0;
            rightArmMesh.rotation.x = 0;
          }
        }
      }

      // Drift 3D clouds
      cloudGroup.children.forEach((cloud) => {
        cloud.position.x += cloud.userData.speed * delta;
        if (cloud.position.x > cloud.userData.range) {
          cloud.position.x = -cloud.userData.range;
        }
      });

      // 3D Multiplayer Player Position Broadcast
      if (!isDead) {
        const currentX = playerGroup.position.x;
        const currentY = playerGroup.position.y;
        const currentZ = playerGroup.position.z;
        const currentRotY = playerGroup.rotation.y;
        const currentIsWalking = isWalking;

        const dist = Math.hypot(
          currentX - lastSentPos.current.x,
          currentY - lastSentPos.current.y,
          currentZ - lastSentPos.current.z
        );

        if (
          dist > 0.05 ||
          currentRotY !== lastSentPos.current.rotY ||
          currentIsWalking !== lastSentPos.current.isWalking
        ) {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            socketRef.current.send(JSON.stringify({
              type: 'move',
              payload: {
                x: currentX,
                y: currentY,
                z: currentZ,
                rotY: currentRotY,
                isWalking: currentIsWalking,
              }
            }));
          }
          lastSentPos.current = {
            x: currentX,
            y: currentY,
            z: currentZ,
            rotY: currentRotY,
            isWalking: currentIsWalking,
          };
        }
      }

      // 3D Multiplayer Player Meshes Sync
      // A. Remove meshes of disconnected players
      Object.keys(otherPlayerMeshes).forEach((id) => {
        if (!otherPlayersRef.current[id]) {
          scene.remove(otherPlayerMeshes[id]);
          otherPlayerMeshes[id].traverse((child: any) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material.dispose();
              }
            }
          });
          delete otherPlayerMeshes[id];
        }
      });

      // B. Create or update positions of other players
      Object.keys(otherPlayersRef.current).forEach((id) => {
        const op = otherPlayersRef.current[id];
        if (!op) return;

        let opGroup = otherPlayerMeshes[id];
        if (!opGroup) {
          opGroup = createOtherPlayer3DGroup(op);
          scene.add(opGroup);
          otherPlayerMeshes[id] = opGroup;
        }

        opGroup.position.set(op.x, op.y, op.z);
        opGroup.rotation.y = op.rotY;

        const isOpWalking = op.isWalking;
        const opSwingAngle = isOpWalking ? Math.sin(time * 10) * 0.7 : 0;
        
        const { leftLegPivot, rightLegPivot, leftArmMesh, rightArmMesh } = opGroup.userData;
        if (leftLegPivot && rightLegPivot && leftArmMesh && rightArmMesh) {
          leftLegPivot.rotation.x = opSwingAngle;
          rightLegPivot.rotation.x = -opSwingAngle;
          leftArmMesh.rotation.x = -opSwingAngle;
          rightArmMesh.rotation.x = opSwingAngle;
        }
      });

      // 5. Camera Follow
      camera.position.set(
        playerGroup.position.x,
        playerGroup.position.y + 12,
        playerGroup.position.z + 24
      );
      camera.lookAt(playerGroup.position);

      renderer.render(scene, camera);
      id3D = requestAnimationFrame(render3D);
    };

    id3D = requestAnimationFrame(render3D);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    
    // Resize Observer for robust responsive layout checking
    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(container);

    // Cleanup
    return () => {
      cancelAnimationFrame(id3D);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();

      // Clean up multiplayer other player meshes
      Object.values(otherPlayerMeshes).forEach((group) => {
        scene.remove(group);
        group.traverse((child: any) => {
          if (child.geometry) child.geometry.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((m) => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        });
      });
    };
  }, [game, local3DMode, user, equipped, animPack, muted, isDead, hasWon]);

  // Handle Mobile Virtual Joystick interactions mapped to key simulated events
  const simulateKeyDown = (key: string) => {
    keysPressed.current[key] = true;
  };

  const simulateKeyUp = (key: string) => {
    keysPressed.current[key] = false;
  };

  return (
    <div className="flex flex-col bg-slate-900 rounded-lg overflow-hidden border-4 border-slate-700 shadow-2xl relative w-full h-[480px]">
      
      {/* HUD Bar */}
      <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between border-b-2 border-slate-700 z-10">
        <div className="flex items-center gap-3">
          <span className="bg-red-600 px-2 py-0.5 rounded text-xs font-bold tracking-wider">LIVE</span>
          <h3 className="font-sans font-bold text-sm tracking-tight">{game.name}</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            id="toggle_audio_btn"
            onClick={() => setMuted(!muted)}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition"
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          {/* Toggle local 3D setting */}
          <button
            id="toggle_3d_btn"
            onClick={() => setLocal3DMode(!local3DMode)}
            className="flex items-center gap-1 bg-slate-700 px-2.5 py-1 rounded text-xs font-semibold hover:bg-slate-600 transition"
          >
            {local3DMode ? <Monitor size={14} /> : <Smartphone size={14} />}
            <span>{local3DMode ? 'Switch to 2D Mode' : 'Switch to 3D Mode'}</span>
          </button>

          {/* Mobile Controller overlay toggle */}
          <button
            id="toggle_mobile_ctrl_btn"
            onClick={() => setShowMobileControls(!showMobileControls)}
            className={`p-1 rounded transition ${showMobileControls ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            title="Mobile Controls Overlay"
          >
            <Smartphone size={18} />
          </button>

          {/* Reset button */}
          <button
            id="reset_game_btn"
            onClick={() => resetPlayer()}
            className="p-1 bg-slate-700 hover:bg-red-600 rounded text-slate-300 hover:text-white transition"
            title="Reset/Respawn Character"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* RENDER CANVAS CONTAINER */}
      <div className="flex-1 relative overflow-hidden bg-[#7dd3fc]">
        
        {/* 2007 CHAT OVERLAY */}
        <div className="absolute top-2 left-2 w-64 h-36 flex flex-col z-10 pointer-events-none select-none">
          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto bg-slate-900/60 border border-slate-700/50 rounded-t p-1.5 space-y-1 scrollbar-thin pointer-events-auto">
            {chatMessages.length === 0 && (
              <p className="text-[10px] text-slate-300 font-mono italic">Chat is empty. Type below to talk!</p>
            )}
            {chatMessages.map((msg) => {
              const isSystem = msg.username === 'System';
              return (
                <div key={msg.id} className="text-[10px] font-mono leading-tight">
                  {isSystem ? (
                    <span className="text-yellow-400 font-bold">{msg.text}</span>
                  ) : (
                    <>
                      <span className="text-blue-300 font-bold mr-1">{msg.username}:</span>
                      <span className="text-white break-words">{msg.text}</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          {/* Chat Input form */}
          <form onSubmit={sendChatMessage} className="flex pointer-events-auto">
            <input
              id="game_chat_input"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Press Enter or type here to chat..."
              className="flex-1 bg-slate-950/80 border-t-0 border-x border-b border-slate-700/80 rounded-b px-2 py-1 text-[10px] text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              maxLength={100}
            />
            <button
              id="game_chat_send_btn"
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 px-2 text-[10px] text-white font-bold rounded-br font-sans border-t-0 border-b border-r border-slate-700/80 transition"
            >
              Send
            </button>
          </form>
        </div>

        {/* PLAYER LIST ROSTER (Vintage 2007 Style) */}
        <div className="absolute top-2 right-2 w-36 bg-slate-900/85 border border-slate-700/80 rounded p-1.5 z-10 font-mono text-[9px] pointer-events-auto shadow-md">
          <div className="border-b border-slate-700 pb-1 mb-1 text-slate-300 font-bold flex justify-between items-center">
            <span>Players</span>
            <span className="bg-slate-800 text-slate-400 px-1 rounded-sm text-[8px]">{multiplayerPlayers.length + 1}</span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {/* Local player */}
            <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="truncate">{user.username} (You)</span>
            </div>
            {/* Other players */}
            {multiplayerPlayers.map((op) => {
              if (op.userId === user.id) return null;
              return (
                <div key={op.userId} className="flex items-center gap-1.5 text-slate-200">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  <span className="truncate">{op.username}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2D CANVAS */}
        {!local3DMode && (
          <canvas
            id="roblox_canvas_2d"
            ref={canvas2DRef}
            width={800}
            height={440}
            className="w-full h-full object-cover block"
          />
        )}

        {/* 3D CANVAS PORTAL */}
        {local3DMode && (
          <div
            id="roblox_canvas_3d_container"
            ref={containerRef}
            className="w-full h-full block"
          />
        )}

        {/* IN-GAME DEATH OVERLAY */}
        {isDead && (
          <div className="absolute inset-0 bg-red-900/60 flex flex-col items-center justify-center backdrop-blur-sm z-20 animate-fade-in">
            <h2 className="text-white text-5xl font-mono font-black tracking-widest drop-shadow-lg animate-bounce">Oof!</h2>
            <p className="text-red-200 font-sans font-medium text-sm mt-2">Respawning at SpawnPad...</p>
          </div>
        )}

        {/* IN-GAME WIN OVERLAY */}
        {hasWon && (
          <div className="absolute inset-0 bg-emerald-950/80 flex flex-col items-center justify-center backdrop-blur-md z-20 animate-fade-in">
            <h2 className="text-emerald-400 text-4xl font-sans font-black tracking-tight text-center drop-shadow-md">🎉 VICTORY! 🎉</h2>
            <p className="text-emerald-100 font-sans text-sm text-center mt-2 max-w-sm">
              You reached the Goal Pad! You earned a shiny classic badge and bonus ticket rewards.
            </p>
            <div className="mt-4 flex gap-3">
              <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-3 py-1 rounded text-xs font-semibold">
                +50 Tickets (Tix)
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded text-xs font-semibold">
                +10 Robux (R$)
              </span>
            </div>
            <button
              id="respawn_win_btn"
              onClick={() => resetPlayer()}
              className="mt-6 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-md font-bold transition shadow-md"
            >
              Play Again
            </button>
          </div>
        )}

        {/* MOBILE CONTROLS OVERLAY (D-Pad and Jump) */}
        {showMobileControls && (
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between pointer-events-none z-30 select-none">
            
            {/* Left/Right Directional Arrows */}
            <div className="flex gap-2 pointer-events-auto bg-slate-900/80 p-2.5 rounded-xl border border-slate-700 backdrop-blur-sm">
              <button
                id="mob_left_btn"
                onTouchStart={() => simulateKeyDown('arrowleft')}
                onTouchEnd={() => simulateKeyUp('arrowleft')}
                onMouseDown={() => simulateKeyDown('arrowleft')}
                onMouseUp={() => simulateKeyUp('arrowleft')}
                className="w-14 h-14 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-white rounded-lg flex items-center justify-center font-bold active:scale-95 transition text-2xl"
              >
                ◀
              </button>
              
              <button
                id="mob_down_btn"
                onTouchStart={() => simulateKeyDown('arrowdown')}
                onTouchEnd={() => simulateKeyUp('arrowdown')}
                onMouseDown={() => simulateKeyDown('arrowdown')}
                onMouseUp={() => simulateKeyUp('arrowdown')}
                className="w-14 h-14 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-white rounded-lg flex items-center justify-center font-bold active:scale-95 transition text-2xl"
              >
                ▼
              </button>

              <button
                id="mob_up_btn"
                onTouchStart={() => simulateKeyDown('arrowup')}
                onTouchEnd={() => simulateKeyUp('arrowup')}
                onMouseDown={() => simulateKeyDown('arrowup')}
                onMouseUp={() => simulateKeyUp('arrowup')}
                className="w-14 h-14 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-white rounded-lg flex items-center justify-center font-bold active:scale-95 transition text-2xl"
              >
                ▲
              </button>

              <button
                id="mob_right_btn"
                onTouchStart={() => simulateKeyDown('arrowright')}
                onTouchEnd={() => simulateKeyUp('arrowright')}
                onMouseDown={() => simulateKeyDown('arrowright')}
                onMouseUp={() => simulateKeyUp('arrowright')}
                className="w-14 h-14 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 text-white rounded-lg flex items-center justify-center font-bold active:scale-95 transition text-2xl"
              >
                ▶
              </button>
            </div>

            {/* Jump Button */}
            <div className="pointer-events-auto">
              <button
                id="mob_jump_btn"
                onTouchStart={() => simulateKeyDown(' ')}
                onTouchEnd={() => simulateKeyUp(' ')}
                onMouseDown={() => simulateKeyDown(' ')}
                onMouseUp={() => simulateKeyUp(' ')}
                className="w-20 h-20 bg-indigo-600 active:bg-indigo-500 border-4 border-indigo-400 text-white font-black rounded-full flex items-center justify-center tracking-wide active:scale-90 shadow-lg transform transition text-sm"
              >
                JUMP
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
