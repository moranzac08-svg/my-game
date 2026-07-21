import { CatalogItem, RobloxGame, RobloxGroup, ForumThread, BlogArticle } from './types';

export const INITIAL_CATALOG: CatalogItem[] = [
  // Faces
  {
    id: 'f_default',
    name: 'Classic Smile',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'face',
    priceRobux: 0,
    priceTickets: 0,
    faceAssetUrl: 'smile', // draw classic simple smile
  },
  {
    id: 'f_awesome',
    name: 'Awesome Face',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'face',
    priceRobux: 50,
    priceTickets: 250,
    faceAssetUrl: 'awesome', // draw classic epic awesome smile yellow face
  },
  {
    id: 'f_chill',
    name: 'Chillin Face',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'face',
    priceRobux: 20,
    priceTickets: 100,
    faceAssetUrl: 'chill', // draw chill eyes with sunglasses/smirk
  },
  {
    id: 'f_silly',
    name: 'Silly Fun',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'face',
    priceRobux: 15,
    priceTickets: 80,
    faceAssetUrl: 'silly', // tongue out face
  },

  // Accessories (hats, shades, wings etc.)
  {
    id: 'acc_shades',
    name: 'Cool Shades',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'shades',
    priceRobux: 35,
    priceTickets: 150,
    assetColor: '#111111', // dark sunglasses
  },
  {
    id: 'acc_red_cap',
    name: 'Classic Red Roblox Cap',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hat',
    priceRobux: 10,
    priceTickets: 50,
    assetColor: '#ef4444',
  },
  {
    id: 'acc_fedora',
    name: 'Classic Black Fedora',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hat',
    priceRobux: 150,
    priceTickets: 800,
    assetColor: '#1f2937',
  },
  {
    id: 'acc_tophat',
    name: 'Vintage Top Hat',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hat',
    priceRobux: 120,
    priceTickets: 600,
    assetColor: '#111827',
  },
  {
    id: 'acc_wings',
    name: 'Classic Valkyrie Wings',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'wings',
    priceRobux: 500,
    priceTickets: 2500,
    assetColor: '#fef08a',
  },
  {
    id: 'hair_beautiful_brown',
    name: 'Beautiful Hair for Beautiful People',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hair',
    priceRobux: 95,
    priceTickets: 400,
    assetColor: '#78350f',
  },
  {
    id: 'hair_black_ponytail',
    name: 'Classic Black Ponytail',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hair',
    priceRobux: 40,
    priceTickets: 200,
    assetColor: '#111827',
  },
  {
    id: 'hair_blonde_spiky',
    name: 'Retro Blonde Spiky Hair',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hair',
    priceRobux: 80,
    priceTickets: 350,
    assetColor: '#fbbf24',
  },
  {
    id: 'hair_blue_anime',
    name: 'Classic Blue Anime Hair',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hair',
    priceRobux: 60,
    priceTickets: 280,
    assetColor: '#3b82f6',
  },
  {
    id: 'hair_emerald_mohawk',
    name: 'Classic Emerald Mohawk',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hair',
    priceRobux: 75,
    priceTickets: 300,
    assetColor: '#10b981',
  },
  {
    id: 'hair_crimson_rocker',
    name: 'Crimson Rocker Hair',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hair',
    priceRobux: 85,
    priceTickets: 380,
    assetColor: '#dc2626',
  },
  {
    id: 'hair_golden_locks',
    name: 'Golden Princess Locks',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hair',
    priceRobux: 100,
    priceTickets: 450,
    assetColor: '#fbbf24',
  },
  {
    id: 'hair_neon_pink_spikes',
    name: 'Neon Pink Spikes',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hair',
    priceRobux: 90,
    priceTickets: 420,
    assetColor: '#db2777',
  },
  {
    id: 'hair_silver_surfer',
    name: 'Silver Surfer Flow',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hair',
    priceRobux: 65,
    priceTickets: 290,
    assetColor: '#9ca3af',
  },
  {
    id: 'hair_purple_shag',
    name: 'Purple Retro Shag',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'accessory',
    accessoryType: 'hair',
    priceRobux: 70,
    priceTickets: 310,
    assetColor: '#7c3aed',
  },

  // Shirts
  {
    id: 's_classic',
    name: 'Classic Roblox Jacket',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'shirt',
    priceRobux: 5,
    priceTickets: 20,
    assetColor: '#1d4ed8', // classic dark blue jacket
    assetDesign: 'jacket',
  },
  {
    id: 's_tux',
    name: 'Vintage 2007 Tuxedo',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'shirt',
    priceRobux: 15,
    priceTickets: 75,
    assetColor: '#111827',
    assetDesign: 'tux',
  },
  {
    id: 's_stripe',
    name: 'Teal Stripe Tee',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'shirt',
    priceRobux: 0,
    priceTickets: 10,
    assetColor: '#0f766e',
    assetDesign: 'stripes',
  },
  {
    id: 's_builderman',
    name: 'Official Builderman Shirt',
    creatorId: 'builderman',
    creatorName: 'Builderman',
    type: 'shirt',
    priceRobux: 25,
    priceTickets: 120,
    assetColor: '#d97706',
    assetDesign: 'wrench',
  },

  // Pants
  {
    id: 'p_jeans',
    name: 'Classic Blue Jeans',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'pants',
    priceRobux: 0,
    priceTickets: 5,
    assetColor: '#2563eb',
    assetDesign: 'jeans',
  },
  {
    id: 'p_black',
    name: 'Retro Charcoal Slacks',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'pants',
    priceRobux: 5,
    priceTickets: 25,
    assetColor: '#1f2937',
    assetDesign: 'slacks',
  },
  {
    id: 'p_shorts',
    name: 'Red Sports Shorts',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'pants',
    priceRobux: 0,
    priceTickets: 12,
    assetColor: '#dc2626',
    assetDesign: 'shorts',
  },

  // Animation Packs
  {
    id: 'anim_classic',
    name: 'Classic Walk & Jump',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'animation_pack',
    priceRobux: 0,
    priceTickets: 0,
    animationType: 'classic',
    walkAnimationSpeed: 1,
    jumpAnimationHeight: 1,
  },
  {
    id: 'anim_ninja',
    name: 'Shadow Ninja Pack',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'animation_pack',
    priceRobux: 150,
    priceTickets: 800,
    animationType: 'ninja',
    walkAnimationSpeed: 1.4,
    jumpAnimationHeight: 1.2,
  },
  {
    id: 'anim_superhero',
    name: 'Levitating Superhero Pack',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'animation_pack',
    priceRobux: 200,
    priceTickets: 1000,
    animationType: 'superhero',
    walkAnimationSpeed: 1.2,
    jumpAnimationHeight: 1.4,
  },
  {
    id: 'anim_robot',
    name: 'Robotic Gears Pack',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    type: 'animation_pack',
    priceRobux: 100,
    priceTickets: 500,
    animationType: 'robot',
    walkAnimationSpeed: 0.8,
    jumpAnimationHeight: 0.9,
  }
];

export const INITIAL_GAMES: RobloxGame[] = [
  {
    id: 'g_crossroads',
    name: 'Classic Crossroads (2007)',
    description: 'The ultimate brickbattle battleground! Climb towers, fight on bridges, and avoid falling off. A historic Roblox landmark.',
    creatorId: 'roblox',
    creatorName: 'Roblox',
    visits: 0,
    likes: 0,
    dislikes: 0,
    bricks: [
      // Ground Plate
      { id: 'b0', type: 'block', color: '#15803d', x: 0, y: -1, z: 0, scaleX: 100, scaleY: 2, scaleZ: 100 },
      // Tower 1 (Blue Tower)
      { id: 'b1', type: 'block', color: '#1d4ed8', x: -15, y: 5, z: -15, scaleX: 8, scaleY: 10, scaleZ: 8 },
      { id: 'b2', type: 'block', color: '#1e40af', x: -15, y: 11, z: -15, scaleX: 10, scaleY: 2, scaleZ: 10 },
      { id: 'b3', type: 'spawn', color: '#60a5fa', x: -15, y: 12.5, z: -15, scaleX: 4, scaleY: 1, scaleZ: 4 },
      // Tower 2 (Yellow Tower)
      { id: 'b4', type: 'block', color: '#eab308', x: 15, y: 5, z: 15, scaleX: 8, scaleY: 10, scaleZ: 8 },
      { id: 'b5', type: 'block', color: '#ca8a04', x: 15, y: 11, z: 15, scaleX: 10, scaleY: 2, scaleZ: 10 },
      { id: 'b6', type: 'spawn', color: '#fef08a', x: 15, y: 12.5, z: 15, scaleX: 4, scaleY: 1, scaleZ: 4 },
      // Central Obelisk/Statue
      { id: 'b7', type: 'block', color: '#374151', x: 0, y: 4, z: 0, scaleX: 6, scaleY: 8, scaleZ: 6 },
      { id: 'b8', type: 'block', color: '#ef4444', x: 0, y: 9, z: 0, scaleX: 4, scaleY: 2, scaleZ: 4 },
      // Arch/Bridges
      { id: 'b9', type: 'block', color: '#4b5563', x: 0, y: 5, z: -20, scaleX: 20, scaleY: 1, scaleZ: 6 },
      // Wedge stairs to bridge
      { id: 'b10', type: 'wedge', color: '#4b5563', x: -12, y: 2, z: -20, scaleX: 4, scaleY: 4, scaleZ: 6 },
      { id: 'b11', type: 'wedge', color: '#4b5563', x: 12, y: 2, z: -20, scaleX: 4, scaleY: 4, scaleZ: 6 },
      // Lava Hazard Obstacle
      { id: 'b12', type: 'lava', color: '#ea580c', x: 0, y: 0.5, z: 15, scaleX: 6, scaleY: 1, scaleZ: 6 },
      // Goal Pad for badges
      { id: 'b13', type: 'goal', color: '#10b981', x: 0, y: 10.5, z: 0, scaleX: 3, scaleY: 1, scaleZ: 3 }
    ]
  },
  {
    id: 'g_glass_obby',
    name: 'Classic Glass Obby',
    description: 'Welcome to an old school Roblox Obby! Jump across the dangerous neon and lava blocks, climb to the top, and reach the Winner Pad!',
    creatorId: 'builderman',
    creatorName: 'Builderman',
    visits: 0,
    likes: 0,
    dislikes: 0,
    bricks: [
      // Starting plate
      { id: 'ob0', type: 'block', color: '#4b5563', x: 0, y: 0, z: -25, scaleX: 12, scaleY: 1, scaleZ: 12 },
      { id: 'ob1', type: 'spawn', color: '#ef4444', x: 0, y: 1, z: -25, scaleX: 4, scaleY: 1, scaleZ: 4 },
      // Jump Pads (ascending)
      { id: 'ob2', type: 'block', color: '#f97316', x: 0, y: 1.5, z: -15, scaleX: 4, scaleY: 1, scaleZ: 4 },
      { id: 'ob3', type: 'block', color: '#facc15', x: -5, y: 3.5, z: -8, scaleX: 4, scaleY: 1, scaleZ: 4 },
      { id: 'ob4', type: 'block', color: '#4ade80', x: 5, y: 5.5, z: 0, scaleX: 4, scaleY: 1, scaleZ: 4 },
      // Lava bridge
      { id: 'ob5', type: 'block', color: '#6b7280', x: 0, y: 7.5, z: 10, scaleX: 6, scaleY: 1, scaleZ: 12 },
      { id: 'ob6', type: 'lava', color: '#dc2626', x: 0, y: 8.1, z: 10, scaleX: 1, scaleY: 0.5, scaleZ: 12 }, // middle strip of lava
      // Wedge slope
      { id: 'ob7', type: 'wedge', color: '#06b6d4', x: 0, y: 9.5, z: 20, scaleX: 6, scaleY: 3, scaleZ: 6 },
      // Winner platform with goal
      { id: 'ob8', type: 'block', color: '#8b5cf6', x: 0, y: 11, z: 30, scaleX: 12, scaleY: 1, scaleZ: 12 },
      { id: 'ob9', type: 'goal', color: '#10b981', x: 0, y: 12, z: 30, scaleX: 5, scaleY: 1, scaleZ: 5 }
    ]
  },
  {
    id: 'g_brickbattle',
    name: 'Chaos Brickbattle Arena',
    description: 'Fast paced retro block action! Blast your friends, spawn inside defense fortifications, and claim victory!',
    creatorId: 'telamon',
    creatorName: 'Telamon',
    visits: 0,
    likes: 0,
    dislikes: 0,
    bricks: [
      { id: 'bb0', type: 'block', color: '#1e293b', x: 0, y: -0.5, z: 0, scaleX: 80, scaleY: 1, scaleZ: 80 },
      // Spawn blocks
      { id: 'bb1', type: 'spawn', color: '#ef4444', x: -25, y: 0.5, z: -25, scaleX: 6, scaleY: 1, scaleZ: 6 },
      { id: 'bb2', type: 'spawn', color: '#3b82f6', x: 25, y: 0.5, z: 25, scaleX: 6, scaleY: 1, scaleZ: 6 },
      // Ramparts
      { id: 'bb3', type: 'block', color: '#94a3b8', x: -15, y: 3, z: -15, scaleX: 12, scaleY: 6, scaleZ: 2 },
      { id: 'bb4', type: 'block', color: '#94a3b8', x: 15, y: 3, z: 15, scaleX: 12, scaleY: 6, scaleZ: 2 },
      // Center hazard
      { id: 'bb5', type: 'lava', color: '#b91c1c', x: 0, y: 0.5, z: 0, scaleX: 15, scaleY: 1, scaleZ: 15 },
      // Upper sniper deck
      { id: 'bb6', type: 'block', color: '#f1f5f9', x: 0, y: 10, z: 0, scaleX: 10, scaleY: 1, scaleZ: 10 },
      // Support pillars
      { id: 'bb7', type: 'block', color: '#475569', x: -4, y: 5, z: -4, scaleX: 2, scaleY: 10, scaleZ: 2 },
      { id: 'bb8', type: 'block', color: '#475569', x: 4, y: 5, z: 4, scaleX: 2, scaleY: 10, scaleZ: 2 }
    ]
  }
];

export const INITIAL_GROUPS: RobloxGroup[] = [];

export const INITIAL_FORUMS: ForumThread[] = [];

export const BLOG_POSTS: BlogArticle[] = [
  {
    id: 'b_1',
    title: 'Introducing Custom Shirts and Pants Customization!',
    author: 'Builderman',
    content: `Greetings Robloxians! Today we are introducing clothing creation. 

You can now design custom solid colors, patterns, and badges for your avatar. Create classic tees, pants, hoodies, and list them on the Catalog. Earn Robux and Tickets whenever other players purchase your clothes! 

Go to the Avatar Customization center, click on "Create Shirts/Pants" and draw your designs!`,
    date: '2007-06-25'
  },
  {
    id: 'b_2',
    title: 'A Look at the Future of 3D Rendering',
    author: 'Telamon',
    content: `Hey folks! We are working on a massive engine upgrade. 

Soon, you will be able to toggle the entire simulator into real-time interactive 3D! This includes lighting shadows, orthographic depth, and beautiful brick battlefields rendered with true perspective depth!

You can switch between Classic 2D and 3D mode in your client settings. We are testing mobile walking joysticks too! Let us know what you think on the General Forum.`,
    date: '2007-07-10'
  }
];
