import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  CatalogItem,
  RobloxGame,
  RobloxGroup,
  ForumThread,
  PrivateMessage,
  TradeOffer,
  BlogArticle,
  Brick
} from './types';
import {
  INITIAL_CATALOG,
  INITIAL_GAMES,
  INITIAL_GROUPS,
  INITIAL_FORUMS,
  BLOG_POSTS
} from './data';
import { AvatarRenderer } from './components/AvatarRenderer';
import { GamePlayer } from './components/GamePlayer';
import { GameMaker } from './components/GameMaker';
import { ClothingCreator } from './components/ClothingCreator';
import {
  Home,
  Gamepad2,
  ShoppingBag,
  User,
  Wrench,
  MessagesSquare,
  Users,
  Search,
  Mail,
  ArrowLeftRight,
  BookOpen,
  Settings as SettingsIcon,
  Plus,
  Coins,
  Ticket,
  Send,
  UserPlus,
  LogOut,
  UserCheck
} from 'lucide-react';

// Simulated online users details for search/friends/trades
interface SimulatedUser {
  id: string;
  username: string;
  bio: string;
  joinedDate: string;
  tickets: number;
  robux: number;
  avatarColors: {
    head: string; torso: string; leftArm: string; rightArm: string; leftLeg: string; rightLeg: string;
  };
  inventory: string[];
}

const SIMULATED_PLAYERS: SimulatedUser[] = [];

export default function App() {
  // --------------------------------------------------
  // 1. PERSISTENCE ENGINE & CORE LOCALSTATE
  // --------------------------------------------------
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('r07_user');
    if (saved) return JSON.parse(saved);
    return {
      id: 'player_2007',
      username: 'Player2007',
      tickets: 150,
      robux: 10,
      joinedDate: '2007-07-18',
      bio: 'Lover of physics baseplates and vintage bricks! Customise me in the Avatar tab.',
      avatarColors: {
        head: '#facc15',
        torso: '#ef4444',
        leftArm: '#facc15',
        rightArm: '#facc15',
        leftLeg: '#2563eb',
        rightLeg: '#2563eb',
      },
      equippedItems: {
        face: 'f_default',
        animationPack: 'anim_classic'
      },
      inventory: ['f_default', 'anim_classic', 's_stripe', 'p_jeans', 'hair_beautiful_brown', 'hair_black_ponytail', 'hair_blonde_spiky', 'hair_blue_anime', 'hair_emerald_mohawk', 'hair_crimson_rocker'],
      friends: [],
      friendRequests: [],
      groups: [],
    };
  });

  const [games, setGames] = useState<RobloxGame[]>(() => {
    const saved = localStorage.getItem('r07_games');
    if (saved) return JSON.parse(saved);
    return INITIAL_GAMES;
  });

  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    const saved = localStorage.getItem('r07_catalog');
    if (saved) return JSON.parse(saved);
    return INITIAL_CATALOG;
  });

  const [groups, setGroups] = useState<RobloxGroup[]>(() => {
    const saved = localStorage.getItem('r07_groups');
    if (saved) return JSON.parse(saved);
    return INITIAL_GROUPS;
  });

  const [threads, setThreads] = useState<ForumThread[]>(() => {
    const saved = localStorage.getItem('r07_threads');
    if (saved) return JSON.parse(saved);
    return INITIAL_FORUMS;
  });

  const [messages, setMessages] = useState<PrivateMessage[]>(() => {
    const saved = localStorage.getItem('r07_messages');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'msg_init_1',
        senderId: 'builderman',
        senderName: 'Builderman',
        receiverId: 'player_2007',
        receiverName: 'Player2007',
        subject: 'Welcome to Roblox 2007!',
        content: 'Hey there new builder! Welcome to the virtual playground. Explore crossroads, design custom catalog shirts, or write on the forums. Have fun building!',
        timestamp: '2007-07-18T10:00:00Z',
        isRead: false
      }
    ];
  });

  const [trades, setTrades] = useState<TradeOffer[]>(() => {
    const saved = localStorage.getItem('r07_trades');
    if (saved) return JSON.parse(saved);
    return [];
  });

  // Navigation state
  const [activeTab, setActiveTab] = useState<string>('home');
  const [selectedGame, setSelectedGame] = useState<RobloxGame | null>(null);
  const [isPlayingGame, setIsPlayingGame] = useState<boolean>(false);
  const [selectedForumThread, setSelectedForumThread] = useState<ForumThread | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<RobloxGroup | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<SimulatedUser | UserProfile | null>(null);

  // Input states
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'authorized'>('authorized');
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [bioInput, setBioInput] = useState<string>(currentUser.bio);
  const [catalogFilter, setCatalogFilter] = useState<string>('all');
  const [forumCategoryFilter, setForumCategoryFilter] = useState<string>('general');
  const [searchUserQuery, setSearchUserQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'build' | 'create_clothing'>('build');

  // Interactive message composition
  const [composeTo, setComposeTo] = useState<string>('');
  const [composeSubject, setComposeSubject] = useState<string>('');
  const [composeBody, setComposeBody] = useState<string>('');
  const [showMessageComposer, setShowMessageComposer] = useState<boolean>(false);

  // Group creation state
  const [showGroupCreator, setShowGroupCreator] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');
  const [newGroupColor, setNewGroupColor] = useState<string>('#ef4444');

  // Trade creation state
  const [showTradeComposer, setShowTradeComposer] = useState<boolean>(false);
  const [tradeWithUser, setTradeWithUser] = useState<SimulatedUser | null>(null);
  const [tradeOfferMyItems, setTradeOfferMyItems] = useState<string[]>([]);
  const [tradeOfferTheirItems, setTradeOfferTheirItems] = useState<string[]>([]);

  // Settings
  const [is3DModeGlobal, setIs3DModeGlobal] = useState<boolean>(true);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('r07_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('r07_games', JSON.stringify(games));
  }, [games]);

  useEffect(() => {
    localStorage.setItem('r07_catalog', JSON.stringify(catalog));
  }, [catalog]);

  useEffect(() => {
    localStorage.setItem('r07_groups', JSON.stringify(groups));
  }, [groups]);

  useEffect(() => {
    localStorage.setItem('r07_threads', JSON.stringify(threads));
  }, [threads]);

  useEffect(() => {
    localStorage.setItem('r07_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('r07_trades', JSON.stringify(trades));
  }, [trades]);

  // Free Tickets Adder
  const addFreeTickets = (amount: number = 100) => {
    setCurrentUser(prev => ({
      ...prev,
      tickets: prev.tickets + amount
    }));
  };

  // Convert custom items creator outputs
  const handlePublishCustomGame = (newGame: RobloxGame) => {
    setGames([newGame, ...games]);
    alert(`🎉 Game published successfully! You can find "${newGame.name}" under the Games tab right now.`);
    setActiveTab('games');
  };

  const handlePublishCustomClothing = (newItem: CatalogItem) => {
    setCatalog([newItem, ...catalog]);
    // Force give to publisher inventory automatically so they can wear it
    setCurrentUser(prev => ({
      ...prev,
      inventory: [...prev.inventory, newItem.id]
    }));
  };

  // Authentication Flows
  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    const newUser: UserProfile = {
      id: `u_${Date.now()}`,
      username: usernameInput.trim(),
      tickets: 100,
      robux: 10,
      joinedDate: new Date().toISOString().split('T')[0],
      bio: "A brand new Roblox builder in 2007!",
      avatarColors: { head: '#facc15', torso: '#ef4444', leftArm: '#facc15', rightArm: '#facc15', leftLeg: '#2563eb', rightLeg: '#2563eb' },
      equippedItems: { face: 'f_default', animationPack: 'anim_classic' },
      inventory: ['f_default', 'anim_classic', 's_stripe', 'p_jeans', 'hair_beautiful_brown', 'hair_black_ponytail', 'hair_blonde_spiky', 'hair_blue_anime', 'hair_emerald_mohawk', 'hair_crimson_rocker'],
      friends: [],
      friendRequests: [],
      groups: []
    };
    setCurrentUser(newUser);
    setAuthMode('authorized');
    setUsernameInput('');
    setPasswordInput('');
  };

  const handleLogIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;
    // Simulate logging in back to custom or standard session
    setCurrentUser(prev => ({
      ...prev,
      username: usernameInput.trim()
    }));
    setAuthMode('authorized');
    setUsernameInput('');
    setPasswordInput('');
  };

  // --------------------------------------------------
  // 3. CATALOG & PURCHASE LOGIC
  // --------------------------------------------------
  const handleBuyItem = (item: CatalogItem) => {
    if (currentUser.inventory.includes(item.id)) {
      alert('You already own this vintage collectible!');
      return;
    }

    const priceRobux = item.priceRobux;
    const priceTix = item.priceTickets;

    // Prompt user on choice of payment
    const buyWithTix = priceTix > 0 && currentUser.tickets >= priceTix;
    const buyWithRobux = priceRobux > 0 && currentUser.robux >= priceRobux;

    if (!buyWithTix && !buyWithRobux && (priceTix > 0 || priceRobux > 0)) {
      alert('Insufficient funds! Claim tickets in Settings or win games to earn Tix!');
      return;
    }

    let tixDeducted = 0;
    let robuxDeducted = 0;

    if (buyWithTix) {
      tixDeducted = priceTix;
    } else {
      robuxDeducted = priceRobux;
    }

    setCurrentUser(prev => ({
      ...prev,
      tickets: prev.tickets - tixDeducted,
      robux: prev.robux - robuxDeducted,
      inventory: [...prev.inventory, item.id]
    }));

    alert(`🛍️ Successfully purchased "${item.name}"! Equippable inside the Customize Avatar panel.`);
  };

  // --------------------------------------------------
  // 4. AVATAR skin/clothing equipping
  // --------------------------------------------------
  const toggleEquip = (itemId: string, type: string) => {
    setCurrentUser(prev => {
      const equipped = { ...prev.equippedItems };
      const item = catalog.find(i => i.id === itemId);
      const slot = (item?.type === 'accessory' && item?.accessoryType === 'hair') ? 'hair' : type;
      const currentVal = (equipped as any)[slot];

      if (currentVal === itemId) {
        // Unequip
        delete (equipped as any)[slot];
      } else {
        // Equip
        (equipped as any)[slot] = itemId;
      }

      return {
        ...prev,
        equippedItems: equipped
      };
    });
  };

  const updateSkinColor = (part: keyof typeof currentUser.avatarColors, color: string) => {
    setCurrentUser(prev => ({
      ...prev,
      avatarColors: {
        ...prev.avatarColors,
        [part]: color
      }
    }));
  };

  // --------------------------------------------------
  // 5. GROUP MEMBERSHIP & WALL POSTS
  // --------------------------------------------------
  const handleJoinGroup = (group: RobloxGroup) => {
    if (group.members.includes(currentUser.id)) return;
    setGroups(prev => prev.map(g => {
      if (g.id === group.id) {
        return { ...g, members: [...g.members, currentUser.id] };
      }
      return g;
    }));
    setCurrentUser(prev => ({
      ...prev,
      groups: [...prev.groups, group.id]
    }));
    alert(`Joined "${group.name}"! You are now an official member.`);
  };

  const handlePostToWall = (groupId: string, text: string) => {
    if (!text.trim()) return;
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          wall: [
            {
              id: `w_${Date.now()}`,
              authorName: currentUser.username,
              content: text,
              timestamp: new Date().toISOString()
            },
            ...g.wall
          ]
        };
      }
      return g;
    }));
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const newGroup: RobloxGroup = {
      id: `group_${Date.now()}`,
      name: newGroupName,
      description: newGroupDesc || 'A retro team of block builders!',
      creatorId: currentUser.id,
      creatorName: currentUser.username,
      members: [currentUser.id],
      logoColor: newGroupColor,
      wall: []
    };
    setGroups([newGroup, ...groups]);
    setCurrentUser(prev => ({
      ...prev,
      groups: [...prev.groups, newGroup.id]
    }));
    setNewGroupName('');
    setNewGroupDesc('');
    setShowGroupCreator(false);
    alert(`Created your group "${newGroup.name}"! Manage it here.`);
  };

  // --------------------------------------------------
  // 6. FORUM THREADS & REPLIES
  // --------------------------------------------------
  const handleCreateForumThread = (category: 'general' | 'building' | 'help' | 'offtopic', title: string, content: string) => {
    if (!title.trim() || !content.trim()) return;
    const newThread: ForumThread = {
      id: `ft_${Date.now()}`,
      category,
      title,
      authorName: currentUser.username,
      views: 1,
      lastActive: new Date().toISOString(),
      posts: [
        {
          id: `fp_${Date.now()}`,
          authorId: currentUser.id,
          authorName: currentUser.username,
          content,
          timestamp: new Date().toISOString()
        }
      ]
    };
    setThreads([newThread, ...threads]);
    alert('Thread posted on the community board!');
  };

  const handleReplyForumThread = (threadId: string, content: string) => {
    if (!content.trim()) return;
    setThreads(prev => prev.map(t => {
      if (t.id === threadId) {
        return {
          ...t,
          lastActive: new Date().toISOString(),
          posts: [
            ...t.posts,
            {
              id: `fp_${Date.now()}`,
              authorId: currentUser.id,
              authorName: currentUser.username,
              content,
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return t;
    }));
  };

  // --------------------------------------------------
  // 7. INBOX MESSAGES & SIMULATED AUTOREPLY LEGENDS
  // --------------------------------------------------
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeBody.trim()) return;

    const targetUser = SIMULATED_PLAYERS.find(p => p.username.toLowerCase() === composeTo.toLowerCase() || p.id === composeTo.toLowerCase());
    const targetName = targetUser ? targetUser.username : composeTo;
    const targetId = targetUser ? targetUser.id : composeTo.toLowerCase();

    const newMsg: PrivateMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.username,
      receiverId: targetId,
      receiverName: targetName,
      subject: composeSubject || 'No Subject',
      content: composeBody,
      timestamp: new Date().toISOString(),
      isRead: true
    };

    setMessages([newMsg, ...messages]);
    setShowMessageComposer(false);
    setComposeTo('');
    setComposeSubject('');
    setComposeBody('');
    alert('Envelope sent!');

    // Simulated Auto-Responses from Legends!
    if (targetUser) {
      setTimeout(() => {
        let replyText = "Hey there! Thanks for your letter. I'm busy building classic structures right now!";
        if (targetId === 'builderman') {
          replyText = `Hey! Thanks for messaging. Always remember: in ROBLOX Studio, select your bricks and check "Anchored" so they do not tumble. Also, play some Glass Obby, it builds real skill! - Builderman`;
        } else if (targetId === 'telamon') {
          replyText = `CHICKEN CHICKEN! Did you lunge with your sword at Crossroads? Also check out the Catalog, I just updated the list of awesome faces! Buy the Awesome Face, it is pure epic. - Telamon`;
        } else if (targetId === 'roblox') {
          replyText = `Thanks for participating in the golden age of Roblox! We are testing local 3D rendering modes right now, let us know how it runs in your settings! - Roblox Admin`;
        }

        const replyMsg: PrivateMessage = {
          id: `msg_reply_${Date.now()}`,
          senderId: targetId,
          senderName: targetName,
          receiverId: currentUser.id,
          receiverName: currentUser.username,
          subject: `Re: ${newMsg.subject}`,
          content: replyText,
          timestamp: new Date().toISOString(),
          isRead: false
        };

        setMessages(prev => [replyMsg, ...prev]);
      }, 3500);
    }
  };

  // --------------------------------------------------
  // 8. TRADING LOGIC
  // --------------------------------------------------
  const handleSendTradeOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tradeWithUser) return;
    if (tradeOfferMyItems.length === 0 && tradeOfferTheirItems.length === 0) {
      alert('Add items to the trade board first!');
      return;
    }

    const newTrade: TradeOffer = {
      id: `trade_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.username,
      receiverId: tradeWithUser.id,
      receiverName: tradeWithUser.username,
      senderItems: [...tradeOfferMyItems],
      receiverItems: [...tradeOfferTheirItems],
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    setTrades([newTrade, ...trades]);
    setShowTradeComposer(false);
    setTradeOfferMyItems([]);
    setTradeOfferTheirItems([]);
    alert(`Trade proposal sent to ${tradeWithUser.username}!`);

    // Simulated trade response automatically based on price balance!
    setTimeout(() => {
      // Calculate prices for evaluation
      const myValue = tradeOfferMyItems.reduce((acc, itemId) => {
        const item = catalog.find(i => i.id === itemId);
        return acc + (item?.priceRobux || 0);
      }, 0);

      const theirValue = tradeOfferTheirItems.reduce((acc, itemId) => {
        const item = catalog.find(i => i.id === itemId);
        return acc + (item?.priceRobux || 0);
      }, 0);

      const isFair = myValue >= theirValue - 10; // accept if close or better

      setTrades(prev => prev.map(t => {
        if (t.id === newTrade.id) {
          const status = isFair ? 'accepted' : 'declined';
          if (status === 'accepted') {
            // SWAP ITEMS
            setCurrentUser(curr => {
              const cleanedInventory = curr.inventory.filter(id => !tradeOfferMyItems.includes(id));
              return {
                ...curr,
                inventory: [...cleanedInventory, ...tradeOfferTheirItems]
              };
            });
          }
          return { ...t, status };
        }
        return t;
      }));

      // Send notifier letter to inbox explaining result
      const explainLetter: PrivateMessage = {
        id: `msg_trade_exp_${Date.now()}`,
        senderId: tradeWithUser.id,
        senderName: tradeWithUser.username,
        receiverId: currentUser.id,
        receiverName: currentUser.username,
        subject: isFair ? 'Trade Accepted!' : 'Trade Declined',
        content: isFair
          ? `Hey! This is a fair trade. I accepted your exchange proposal. Thank you!`
          : `Sorry, this deal is not balanced enough. My items have higher valuation. Lunge on!`,
        timestamp: new Date().toISOString(),
        isRead: false
      };
      setMessages(prev => [explainLetter, ...prev]);

    }, 4500);
  };

  // Handle Win Reward Inside Game Sandbox
  const handleGamePlayerWin = (tix: number, r$: number) => {
    setCurrentUser(prev => ({
      ...prev,
      tickets: prev.tickets + tix,
      robux: prev.robux + r$
    }));
  };

  return (
    <div className="min-h-screen bg-[#eedfc5] font-sans text-[#111827] flex flex-col selection:bg-red-200">
      
      {/* 2007 CLASSIC TOP HEADER */}
      <header className="bg-gradient-to-r from-[#003c82] to-[#0459c0] text-white border-b-4 border-yellow-500 shadow z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="bg-red-600 px-3 py-1 border-2 border-white rounded transform -rotate-1 shadow">
              <h1 className="text-xl font-serif font-black tracking-tighter text-white">R O B L O X</h1>
            </div>
            <span className="text-xs font-mono font-medium tracking-tight text-blue-100 hidden sm:inline">
              "Build Virtual Worlds Since 2007"
            </span>
          </div>

          {/* Player stats or Auth block */}
          {authMode === 'authorized' ? (
            <div className="flex items-center gap-4 text-xs font-mono bg-[#034ea2] px-4 py-1.5 rounded border border-[#1b6bca]">
              <div className="flex items-center gap-1 cursor-pointer hover:underline" onClick={() => setSelectedProfile(currentUser)}>
                <User size={13} className="text-yellow-400" />
                <span className="font-bold">{currentUser.username}</span>
              </div>
              
              <div className="h-4 w-px bg-[#1b6bca]" />

              {/* Robux Count */}
              <div className="flex items-center gap-1" title="Robux (R$)">
                <Coins size={13} className="text-amber-400" />
                <span className="font-bold text-amber-200">{currentUser.robux} R$</span>
              </div>

              {/* Tickets Count */}
              <div className="flex items-center gap-1.5" title="Tickets (Tix)">
                <Ticket size={13} className="text-amber-500" />
                <span className="font-bold text-yellow-300">{currentUser.tickets} Tix</span>
                <button
                  id="header_free_tix_btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    addFreeTickets(100);
                  }}
                  className="bg-yellow-500 hover:bg-yellow-400 active:scale-95 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded transition shadow cursor-pointer animate-pulse select-none"
                  title="Click to get free 100 Tix!"
                >
                  +100 TIX
                </button>
              </div>

              <div className="h-4 w-px bg-[#1b6bca]" />

              <button
                id="header_logout_btn"
                onClick={() => setAuthMode('login')}
                className="hover:text-red-300 flex items-center gap-1 transition"
              >
                <LogOut size={12} />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                id="header_sign_in_tab"
                onClick={() => setAuthMode('login')}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-3 py-1 rounded text-xs transition border border-red-800"
              >
                Sign In
              </button>
              <button
                id="header_sign_up_tab"
                onClick={() => setAuthMode('signup')}
                className="bg-white hover:bg-slate-100 text-red-700 font-bold px-3 py-1 rounded text-xs transition border border-slate-300"
              >
                Sign Up
              </button>
            </div>
          )}

        </div>
      </header>

      {/* MAIN BANNER NAVIGATION SYSTEM */}
      <nav className="bg-[#e4d1b3] border-b-2 border-[#cfbfa4] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex overflow-x-auto select-none">
          {[
            { id: 'home', label: '🏠 Home', icon: Home },
            { id: 'games', label: '🎮 Games', icon: Gamepad2 },
            { id: 'catalog', label: '🛍️ Catalog', icon: ShoppingBag },
            { id: 'avatar', label: '👕 Customize Avatar', icon: User },
            { id: 'create', label: '🛠️ Create', icon: Wrench },
            { id: 'forum', label: '💬 Forum', icon: MessagesSquare },
            { id: 'groups', label: '👥 Groups', icon: Users },
            { id: 'friends', label: '👋 People', icon: Search },
            { id: 'messages', label: '✉️ Messages', icon: Mail },
            { id: 'trade', label: '🔄 Trade Items', icon: ArrowLeftRight },
            { id: 'blog', label: '📖 Blog', icon: BookOpen },
            { id: 'settings', label: '⚙️ Settings', icon: SettingsIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                id={`nav_tab_${tab.id}`}
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsPlayingGame(false);
                  setSelectedGame(null);
                  setSelectedForumThread(null);
                  setSelectedGroup(null);
                  setSelectedProfile(null);
                }}
                className={`py-3 px-4 font-sans font-bold text-xs whitespace-nowrap transition border-b-4 flex items-center gap-1.5 ${isActive ? 'border-red-600 text-red-700 bg-[#fbf5e9]' : 'border-transparent text-slate-700 hover:text-red-700 hover:bg-[#eedfc5]'}`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* CORE PAGE SWITCHBOARD */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        
        {/* VIEWING EXTERNAL SIMULATED PROFILE (PEOPLE SEARCH OUTPUTS) */}
        {selectedProfile && (
          <div className="bg-[#fcf8f2] border-4 border-slate-700 rounded-lg p-6 max-w-3xl mx-auto space-y-6 shadow-xl relative animate-fade-in">
            <button
              id="back_profile_list"
              onClick={() => setSelectedProfile(null)}
              className="absolute top-4 right-4 text-xs font-bold bg-slate-200 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-300 transition"
            >
              ← Back
            </button>
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Character Render */}
              <div className="flex flex-col items-center">
                <AvatarRenderer
                  colors={selectedProfile.avatarColors}
                  equipped={(selectedProfile as any).equippedItems || {}}
                  size={190}
                />
                <span className="bg-green-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full mt-3 tracking-wider">
                  ● ONLINE
                </span>
              </div>

              <div className="flex-1 space-y-3 text-slate-800">
                <h2 className="text-3xl font-serif font-bold text-slate-900 border-b border-slate-300 pb-1">
                  {selectedProfile.username}
                </h2>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <p><span className="text-slate-400">Join Date:</span> {selectedProfile.joinedDate}</p>
                  <p><span className="text-slate-400">Membership:</span> Builders Club Premium</p>
                </div>
                <div className="bg-[#f4ebe1] p-3 rounded border border-[#d0c0b0] text-xs leading-relaxed italic">
                  "{selectedProfile.bio || 'This user is busy building Roblox!'}"
                </div>

                {/* Profile actions */}
                {selectedProfile.id !== currentUser.id && (
                  <div className="flex gap-2 pt-2">
                    <button
                      id="profile_message_btn"
                      onClick={() => {
                        setComposeTo(selectedProfile.username);
                        setShowMessageComposer(true);
                        setActiveTab('messages');
                        setSelectedProfile(null);
                      }}
                      className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded transition flex items-center gap-1.5"
                    >
                      <Mail size={13} />
                      <span>Send Mail</span>
                    </button>
                    
                    <button
                      id="profile_trade_btn"
                      onClick={() => {
                        setTradeWithUser(selectedProfile as SimulatedUser);
                        setShowTradeComposer(true);
                        setActiveTab('trade');
                        setSelectedProfile(null);
                      }}
                      className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 py-2 rounded transition flex items-center gap-1.5"
                    >
                      <ArrowLeftRight size={13} />
                      <span>Trade Collectibles</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NOT LOGGED IN OVERLAY FLOW */}
        {authMode !== 'authorized' && !selectedProfile && (
          <div className="bg-[#fcf8f2] border-4 border-slate-700 rounded-lg p-8 max-w-md mx-auto shadow-2xl mt-12">
            <div className="text-center space-y-2 mb-6">
              <span className="bg-red-700 text-white px-3 py-1 font-serif font-extrabold text-2xl tracking-widest rounded shadow">
                ROBLOX
              </span>
              <h2 className="text-lg font-serif font-bold pt-2">Vintage 2007 Client Portal</h2>
            </div>

            <form onSubmit={authMode === 'login' ? handleLogIn : handleSignUp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Username:</label>
                <input
                  id="auth_username_input"
                  type="text"
                  required
                  placeholder="e.g. BrickMaster, TelamonFan"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded py-2 px-3 text-sm font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Password:</label>
                <input
                  id="auth_password_input"
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded py-2 px-3 text-sm"
                />
              </div>

              <button
                id="auth_submit_btn"
                type="submit"
                className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-2.5 rounded text-sm transition shadow-md"
              >
                {authMode === 'login' ? '🔑 Enter Sandbox Client' : '🚀 Register Retro Account'}
              </button>

              <p className="text-center text-xs text-slate-500 pt-2">
                {authMode === 'login' ? (
                  <span>New player? <button type="button" onClick={() => setAuthMode('signup')} className="text-blue-600 font-bold hover:underline">Register now</button></span>
                ) : (
                  <span>Already registered? <button type="button" onClick={() => setAuthMode('login')} className="text-blue-600 font-bold hover:underline">Sign in</button></span>
                )}
              </p>
            </form>
          </div>
        )}

        {/* --------------------------------------------------
            TAB CONTENT: HOME
        -------------------------------------------------- */}
        {activeTab === 'home' && authMode === 'authorized' && !selectedProfile && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left: User Bio & Avatar preview */}
            <div className="md:col-span-4 bg-[#fcf8f2] border-4 border-slate-700 p-5 rounded-lg shadow-md space-y-4 flex flex-col items-center">
              <h2 className="text-xl font-serif font-bold text-slate-800 text-center border-b border-slate-300 pb-1 w-full">
                My Profile
              </h2>
              
              <AvatarRenderer
                colors={currentUser.avatarColors}
                equipped={currentUser.equippedItems}
                size={200}
              />

              <div className="text-center font-mono space-y-0.5">
                <h3 className="font-sans font-bold text-base text-slate-800">{currentUser.username}</h3>
                <p className="text-xs text-slate-400">Joined: {currentUser.joinedDate}</p>
              </div>

              {/* Edit bio */}
              <div className="w-full space-y-1 text-xs">
                <span className="font-bold text-slate-600">Bio / About Me:</span>
                <textarea
                  id="user_bio_textarea"
                  value={bioInput}
                  onChange={(e) => {
                    setBioInput(e.target.value);
                    setCurrentUser(prev => ({ ...prev, bio: e.target.value }));
                  }}
                  className="w-full h-16 bg-white border border-slate-300 p-2 rounded text-slate-700 text-xs resize-none"
                  placeholder="Write something classic..."
                />
              </div>

              {/* Tix / Robux indicators */}
              <div className="grid grid-cols-2 gap-3 w-full pt-1">
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-2.5 rounded text-center">
                  <span className="text-[10px] font-bold text-yellow-800 block">🎟️ Tickets (Tix)</span>
                  <span className="font-mono font-black text-sm text-yellow-700">{currentUser.tickets}</span>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-2.5 rounded text-center">
                  <span className="text-[10px] font-bold text-amber-800 block">💰 Robux (R$)</span>
                  <span className="font-mono font-black text-sm text-amber-700">{currentUser.robux}</span>
                </div>
              </div>
            </div>

            {/* Right: Splash News, Daily Login & Feed */}
            <div className="md:col-span-8 space-y-6">
              
              {/* Unlimited Free Tickets Dispenser */}
              <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white p-4 rounded-lg border-b-4 border-yellow-700 shadow flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm">🎟️ Infinite Free Tix Dispenser!</h3>
                  <p className="text-xs text-yellow-100">Click as many times as you like to instantly add +100 Tickets (Tix) to your balance!</p>
                </div>
                <button
                  id="claim_unlimited_tix_btn"
                  onClick={() => addFreeTickets(100)}
                  className="bg-white text-yellow-800 font-black text-xs px-5 py-2.5 rounded hover:bg-slate-50 transition tracking-wide shadow active:scale-95 transform cursor-pointer select-none"
                >
                  🎟️ GET +100 TIX
                </button>
              </div>

              {/* Splash Welcome Billboard */}
              <div className="bg-[#fcf8f2] border-4 border-slate-700 p-6 rounded-lg shadow-md space-y-3">
                <h3 className="text-lg font-serif font-bold text-red-700 border-b border-slate-300 pb-1 flex items-center gap-1">
                  <span>📢 Welcome to the Roblox 2007 Simulator!</span>
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed">
                  We are celebrating the absolute peak year of physics baseplates and classic brick battling! 
                  Design custom solid clothes in the <strong>Create</strong> tab and see them listed on the Marketplace. 
                  Play games like <strong>Classic Crossroads</strong> directly in your browser. Switch from 2D canvas side-scrolling physics to <strong>real 3D interactive mode</strong> in the settings anytime!
                </p>
                <div className="bg-[#f1ebe0] p-3 rounded border border-[#cfc0ac] text-[11px] text-slate-600 space-y-1">
                  <p className="font-bold text-slate-700">💡 Quick Pro-tips:</p>
                  <p>• Buy different **Animation Packs** (Ninja, Superhero, Robot) inside the Catalog to change how you move.</p>
                  <p>• Wear **Cool Shades** in the Avatar Customizer — they fit perfectly on your face automatically!</p>
                  <p>• Compose a private mail to Builderman or Telamon inside Messages for funny retro advice replies.</p>
                </div>
              </div>

              {/* Quick statistics feed */}
              <div className="bg-[#fcf8f2] border-4 border-slate-700 p-5 rounded-lg shadow-md space-y-3">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-300 pb-1">📊 Simulator Feed</h3>
                <div className="space-y-2 max-h-[140px] overflow-y-auto pr-2">
                  <div className="text-xs bg-slate-50 p-2.5 rounded border border-slate-200 flex justify-between">
                    <span className="font-medium text-slate-700">🔨 Custom Games available on Catalog:</span>
                    <span className="font-mono font-bold text-red-700">{games.length} games</span>
                  </div>
                  <div className="text-xs bg-slate-50 p-2.5 rounded border border-slate-200 flex justify-between">
                    <span className="font-medium text-slate-700">👥 Communities & builder groups online:</span>
                    <span className="font-mono font-bold text-blue-700">{groups.length} groups</span>
                  </div>
                  <div className="text-xs bg-slate-50 p-2.5 rounded border border-slate-200 flex justify-between">
                    <span className="font-medium text-slate-700">👕 Clothing assets uploaded:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      {catalog.filter(i => i.type === 'shirt' || i.type === 'pants').length} styles
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* --------------------------------------------------
            TAB CONTENT: GAMES
        -------------------------------------------------- */}
        {activeTab === 'games' && authMode === 'authorized' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* VIEWING ACTIVE RUNNING PLAYER */}
            {isPlayingGame && selectedGame ? (
              <div className="space-y-4">
                <button
                  id="exit_game_player"
                  onClick={() => setIsPlayingGame(false)}
                  className="bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded transition shadow"
                >
                  ← Exit Game Client (Back to Roblox)
                </button>
                
                <GamePlayer
                  game={selectedGame}
                  user={currentUser}
                  is3DMode={is3DModeGlobal}
                  onWin={handleGamePlayerWin}
                />
              </div>
            ) : selectedGame ? (
              // Individual Game details before clicking "Play"
              <div className="bg-[#fcf8f2] border-4 border-slate-700 p-6 rounded-lg max-w-4xl mx-auto shadow-xl grid grid-cols-1 md:grid-cols-12 gap-6 relative">
                
                <button
                  id="back_games_catalog"
                  onClick={() => setSelectedGame(null)}
                  className="absolute top-4 right-4 text-xs font-bold bg-slate-200 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-300 transition"
                >
                  ← Back to List
                </button>

                {/* Left side info */}
                <div className="md:col-span-8 space-y-4 text-slate-800">
                  <h2 className="text-3xl font-serif font-bold text-slate-900 border-b border-slate-300 pb-1">
                    {selectedGame.name}
                  </h2>
                  <p className="text-sm font-mono text-slate-500">
                    Creator: <span className="text-slate-800 underline font-semibold cursor-pointer" onClick={() => {
                      const simPlayer = SIMULATED_PLAYERS.find(p => p.username === selectedGame.creatorName);
                      if (simPlayer) setSelectedProfile(simPlayer);
                    }}>{selectedGame.creatorName}</span>
                  </p>
                  <div className="bg-[#f5eae1] p-4 rounded border border-[#d2c2b2] leading-relaxed text-sm">
                    {selectedGame.description}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                    <div className="bg-slate-100 p-2.5 rounded border">
                      <span className="text-[10px] text-slate-400 block">Total Visits</span>
                      <span className="font-bold">{selectedGame.visits}</span>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded border">
                      <span className="text-[10px] text-emerald-500 block">👍 Likes</span>
                      <span className="font-bold text-emerald-600">{selectedGame.likes}</span>
                    </div>
                    <div className="bg-slate-100 p-2.5 rounded border">
                      <span className="text-[10px] text-red-500 block">👎 Dislikes</span>
                      <span className="font-bold text-red-600">{selectedGame.dislikes}</span>
                    </div>
                  </div>

                  {/* Play Button */}
                  <button
                    id="play_game_btn"
                    onClick={() => {
                      // Increase visit count locally
                      setGames(prev => prev.map(g => g.id === selectedGame.id ? { ...g, visits: g.visits + 1 } : g));
                      setIsPlayingGame(true);
                    }}
                    className="w-full bg-green-600 hover:bg-green-500 text-white font-black py-4 px-6 rounded-lg text-lg tracking-wider hover:scale-[1.01] transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <span>PLAY IN BROWSER</span>
                  </button>
                </div>

                {/* Right side stats/comments */}
                <div className="md:col-span-4 bg-[#f5eae1] p-4 rounded-lg border-2 border-[#d2c2b2] space-y-3">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Level Comments:</h4>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 text-xs">
                    <div className="bg-white p-2 rounded border">
                      <p className="font-semibold text-red-700">Builderman:</p>
                      <p className="text-slate-600">Great job on this obby! The spawn blocks look nicely aligned.</p>
                    </div>
                    <div className="bg-white p-2 rounded border">
                      <p className="font-semibold text-blue-700">Telamon:</p>
                      <p className="text-slate-600">SWORD FIGHT ME HERE!</p>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              // GRID LIST OF ALL GAMES
              <div className="space-y-4">
                <div className="bg-[#fcf8f2] border-4 border-slate-700 p-4 rounded-lg shadow flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-slate-800">🎮 Active Game Servers</h2>
                    <p className="text-xs text-slate-500">Pick any vintage map, loaded with authentic interactive blocks.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {games.map((g) => (
                    <div
                      key={g.id}
                      onClick={() => setSelectedGame(g)}
                      className="bg-[#fcf8f2] border-4 border-slate-700 rounded-lg p-5 hover:border-red-600 cursor-pointer shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 space-y-3"
                    >
                      <div className="bg-sky-200 h-28 rounded border border-sky-300 flex items-center justify-center font-serif font-black text-slate-600 text-2xl select-none relative overflow-hidden">
                        {/* Custom background brick pattern aesthetic */}
                        <div className="absolute inset-0 opacity-10 bg-repeat bg-[radial-gradient(#111827_1px,transparent_1px)] [background-size:16px_16px]" />
                        🗺️ ROBLOX MAP
                      </div>
                      <div className="space-y-1 text-slate-800">
                        <h3 className="font-bold text-base leading-tight hover:text-red-700 transition">{g.name}</h3>
                        <p className="text-xs text-slate-400">Creator: {g.creatorName}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1">{g.description}</p>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2 border-t">
                        <span>👥 {g.visits} visits</span>
                        <span className="text-emerald-600 font-bold">👍 {g.likes} likes</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* --------------------------------------------------
            TAB CONTENT: CATALOG (MARKETPLACE)
        -------------------------------------------------- */}
        {activeTab === 'catalog' && authMode === 'authorized' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header / Filter bar */}
            <div className="bg-[#fcf8f2] border-4 border-slate-700 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <h2 className="text-lg font-serif font-bold text-slate-800">🛍️ Catalog Shop</h2>
                <p className="text-xs text-slate-500">Buy faces, custom shirts, pants, accessories, or walking animations using Tickets and Robux!</p>
              </div>

              {/* Filtering */}
              <div className="flex gap-1.5 overflow-x-auto text-xs font-semibold select-none">
                {[
                  { id: 'all', label: 'All Items' },
                  { id: 'hair', label: '💇 Hair Styles' },
                  { id: 'accessory', label: '👒 Accessories' },
                  { id: 'shirt', label: '👕 Shirts' },
                  { id: 'pants', label: '👖 Pants' },
                  { id: 'face', label: '😀 Faces' },
                  { id: 'animation_pack', label: '🏃 Animations' },
                ].map((f) => (
                  <button
                    id={`filter_${f.id}_btn`}
                    key={f.id}
                    onClick={() => setCatalogFilter(f.id)}
                    className={`py-1.5 px-3 rounded border transition ${catalogFilter === f.id ? 'bg-red-700 text-white border-red-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {catalog
                .filter(item => {
                  if (catalogFilter === 'all') return true;
                  if (catalogFilter === 'hair') {
                    return item.type === 'accessory' && item.accessoryType === 'hair';
                  }
                  if (catalogFilter === 'accessory') {
                    return item.type === 'accessory' && item.accessoryType !== 'hair';
                  }
                  return item.type === catalogFilter;
                })
                .map((item) => {
                  const owned = currentUser.inventory.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`bg-[#fcf8f2] border-4 rounded-lg p-4 shadow-sm relative space-y-3 flex flex-col justify-between transition ${owned ? 'border-slate-400 bg-slate-50/70' : 'border-slate-700 hover:border-red-600'}`}
                    >
                      {/* Badge if user published it */}
                      {item.isUserCreated && (
                        <span className="absolute top-2 left-2 bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                          MY CREATION
                        </span>
                      )}

                      {/* Display image / box preview */}
                      <div className="bg-slate-100 h-24 rounded border border-slate-200 flex items-center justify-center text-3xl font-bold select-none">
                        {item.type === 'shirt' ? '👕' : item.type === 'pants' ? '👖' : item.type === 'face' ? '😀' : item.type === 'animation_pack' ? '🏃' : '👒'}
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-xs text-slate-800 leading-tight line-clamp-1">{item.name}</h3>
                        <p className="text-[10px] text-slate-400">Creator: {item.creatorName}</p>
                        
                        {/* Price Display */}
                        <div className="flex gap-2 pt-1 font-mono text-[11px]">
                          {item.priceTickets > 0 && (
                            <span className="text-yellow-700 font-bold">🎟️ {item.priceTickets} Tix</span>
                          )}
                          {item.priceRobux > 0 && (
                            <span className="text-amber-700 font-bold">💰 {item.priceRobux} R$</span>
                          )}
                          {item.priceTickets === 0 && item.priceRobux === 0 && (
                            <span className="text-green-600 font-bold">FREE</span>
                          )}
                        </div>
                      </div>

                      {/* Buy trigger */}
                      <button
                        id={`buy_item_${item.id}_btn`}
                        onClick={() => handleBuyItem(item)}
                        disabled={owned}
                        className={`w-full py-1.5 rounded text-[11px] font-bold transition shadow-sm ${owned ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' : 'bg-red-700 hover:bg-red-600 text-white'}`}
                      >
                        {owned ? 'Already Owned' : '🛍️ Purchase'}
                      </button>
                    </div>
                  );
                })}
            </div>

          </div>
        )}

        {/* --------------------------------------------------
            TAB CONTENT: CUSTOMIZE AVATAR
        -------------------------------------------------- */}
        {activeTab === 'avatar' && authMode === 'authorized' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
            
            {/* Left Column: Live Character Render & skin paint palette */}
            <div className="lg:col-span-4 bg-[#fcf8f2] border-4 border-slate-700 p-5 rounded-lg shadow-md space-y-4 flex flex-col items-center">
              <h3 className="text-base font-serif font-bold text-slate-800 border-b border-slate-300 pb-1 w-full text-center">
                Character Configurator
              </h3>
              
              <AvatarRenderer
                colors={currentUser.avatarColors}
                equipped={currentUser.equippedItems}
                size={220}
              />

              {/* Skin color editor */}
              <div className="w-full space-y-2 pt-2 border-t">
                <span className="text-xs font-bold text-slate-600 block">🎨 Paint Limb skin color:</span>
                
                {/* Specific body part */}
                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
                  {(['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'] as const).map((part) => (
                    <div key={part} className="space-y-1">
                      <span className="text-slate-500 capitalize">{part.replace(/([A-Z])/g, ' $1')}:</span>
                      <div className="flex gap-1">
                        {['#facc15', '#ef4444', '#3b82f6', '#22c55e', '#ffffff', '#1f2937'].map((col) => (
                          <button
                            id={`paint_${part}_${col.replace('#', '')}_btn`}
                            key={col}
                            onClick={() => updateSkinColor(part, col)}
                            className={`w-4.5 h-4.5 rounded border transition ${currentUser.avatarColors[part] === col ? 'border-red-600 scale-110 shadow' : 'border-slate-300 hover:border-slate-500'}`}
                            style={{ backgroundColor: col }}
                            title={col}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Equipped and Inventories Grid */}
            <div className="lg:col-span-8 bg-[#fcf8f2] border-4 border-slate-700 p-5 rounded-lg shadow-md space-y-4">
              <h3 className="text-base font-bold text-slate-800 border-b border-slate-300 pb-1 flex items-center gap-1.5">
                <span>Inventory / Wear Wardrobe</span>
                <span className="bg-red-100 text-red-700 rounded-full px-2 py-0.5 text-xs">{currentUser.inventory.length} items</span>
              </h3>

              {/* Inventory items to wear */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                {currentUser.inventory.map((itemId) => {
                  const item = catalog.find(i => i.id === itemId);
                  if (!item) return null;
                  const slot = (item.type === 'accessory' && item.accessoryType === 'hair') ? 'hair' : item.type;
                  const equipped = (currentUser.equippedItems as any)[slot] === itemId;
                  return (
                    <div
                      key={itemId}
                      className={`p-3 rounded border-2 flex flex-col justify-between gap-2.5 transition ${equipped ? 'border-red-600 bg-red-50/20' : 'border-slate-300 bg-slate-50'}`}
                    >
                      <div className="space-y-1">
                        <span className="font-mono text-[9px] uppercase tracking-wide bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                          {item.type === 'accessory' && item.accessoryType === 'hair' ? 'hair' : item.type.replace('_', ' ')}
                        </span>
                        <h4 className="font-bold text-slate-800">{item.name}</h4>
                      </div>

                      <button
                        id={`equip_${item.id}_btn`}
                        onClick={() => toggleEquip(itemId, item.type)}
                        className={`w-full py-1 rounded text-[10px] font-bold transition shadow-sm ${equipped ? 'bg-red-700 text-white hover:bg-red-600' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                      >
                        {equipped ? '👔 UNEQUIP' : '👔 EQUIP'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* --------------------------------------------------
            TAB CONTENT: CREATE (BUILD & WORKSHOP)
        -------------------------------------------------- */}
        {activeTab === 'create' && authMode === 'authorized' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Sub navigation bar */}
            <div className="flex border-b-2 border-slate-300 text-sm font-bold">
              <button
                id="subtab_build_btn"
                onClick={() => setActiveSubTab('build')}
                className={`py-3 px-6 flex items-center gap-1.5 transition ${activeSubTab === 'build' ? 'border-b-4 border-red-700 text-red-700 bg-[#fcf8f2]' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Wrench size={16} />
                <span>ROBLOX Game Creator Studio</span>
              </button>
              <button
                id="subtab_clothing_btn"
                onClick={() => setActiveSubTab('create_clothing')}
                className={`py-3 px-6 flex items-center gap-1.5 transition ${activeSubTab === 'create_clothing' ? 'border-b-4 border-red-700 text-red-700 bg-[#fcf8f2]' : 'text-slate-500 hover:text-slate-800'}`}
              >
                👕 Clothing Design Workshop
              </button>
            </div>

            {/* Display correct component */}
            {activeSubTab === 'build' ? (
              <GameMaker
                onPublish={handlePublishCustomGame}
                creatorId={currentUser.id}
                creatorName={currentUser.username}
              />
            ) : (
              <ClothingCreator
                onPublishClothing={handlePublishCustomClothing}
                creatorId={currentUser.id}
                creatorName={currentUser.username}
              />
            )}

          </div>
        )}

        {/* --------------------------------------------------
            TAB CONTENT: FORUM
        -------------------------------------------------- */}
        {activeTab === 'forum' && authMode === 'authorized' && (
          <div className="space-y-6 animate-fade-in">
            
            {selectedForumThread ? (
              // View Specific Thread
              <div className="bg-[#fcf8f2] border-4 border-slate-700 p-6 rounded-lg max-w-4xl mx-auto shadow-xl relative space-y-6 text-slate-800">
                <button
                  id="back_forum_list"
                  onClick={() => setSelectedForumThread(null)}
                  className="absolute top-4 right-4 text-xs font-bold bg-slate-200 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-300 transition"
                >
                  ← Back to Forum
                </button>

                <div className="border-b-2 border-slate-400 pb-3">
                  <span className="bg-red-700 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                    Category: {selectedForumThread.category}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-slate-900 mt-1 leading-tight">
                    {selectedForumThread.title}
                  </h2>
                </div>

                {/* Posts List */}
                <div className="space-y-4">
                  {selectedForumThread.posts.map((post, index) => (
                    <div
                      key={post.id}
                      className="bg-white border-2 border-slate-300 rounded p-4 flex gap-4 text-xs relative"
                    >
                      <div className="w-24 border-r pr-3 flex flex-col items-center">
                        <span className="font-bold text-red-700 truncate block max-w-full">{post.authorName}</span>
                        <span className="text-[10px] text-slate-400">Builder</span>
                      </div>
                      
                      <div className="flex-1 space-y-1 min-w-0">
                        <span className="text-[10px] text-slate-400 block">{post.timestamp}</span>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                      </div>

                      {/* Marker for original poster */}
                      {index === 0 && (
                        <span className="absolute top-2 right-2 text-[9px] bg-slate-200 text-slate-500 font-mono font-bold px-1.5 py-0.5 rounded">
                          OP
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Post quick reply */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = (e.target as any).elements.reply_content;
                    if (!input.value.trim()) return;
                    handleReplyForumThread(selectedForumThread.id, input.value);
                    // Update active selected thread display list
                    setSelectedForumThread(prev => {
                      if (!prev) return null;
                      return {
                        ...prev,
                        posts: [
                          ...prev.posts,
                          {
                            id: `fp_${Date.now()}`,
                            authorId: currentUser.id,
                            authorName: currentUser.username,
                            content: input.value,
                            timestamp: new Date().toISOString()
                          }
                        ]
                      };
                    });
                    input.value = '';
                  }}
                  className="bg-[#f0e4d8] border border-[#d0c0b0] p-4 rounded space-y-2"
                >
                  <label className="text-xs font-bold text-slate-700 block">Post a quick reply:</label>
                  <textarea
                    name="reply_content"
                    required
                    className="w-full bg-white border border-slate-400 rounded p-2 text-xs h-20 resize-none text-slate-800"
                    placeholder="Write a helpful response..."
                  />
                  <div className="flex justify-end">
                    <button
                      id="forum_post_reply_btn"
                      type="submit"
                      className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-5 py-2 rounded transition"
                    >
                      Publish Post
                    </button>
                  </div>
                </form>

              </div>
            ) : (
              // MAIN LIST OF THREADS BY CATEGORY
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left side categories selection */}
                <div className="md:col-span-3 bg-[#fcf8f2] border-4 border-slate-700 p-4 rounded-lg shadow-md space-y-1">
                  <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider border-b-2 pb-1 mb-2">Category Rooms:</h4>
                  {[
                    { id: 'general', label: '💬 General Roblox' },
                    { id: 'building', label: '🔨 Building Help' },
                    { id: 'help', label: '🛡️ Help & Feedback' },
                    { id: 'offtopic', label: '🌴 Off-Topic' },
                  ].map((cat) => (
                    <button
                      id={`forum_cat_${cat.id}_btn`}
                      key={cat.id}
                      onClick={() => setForumCategoryFilter(cat.id)}
                      className={`w-full py-2 px-3 text-left rounded text-xs font-bold transition border ${forumCategoryFilter === cat.id ? 'bg-red-700 text-white border-red-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Right side thread list */}
                <div className="md:col-span-9 bg-[#fcf8f2] border-4 border-slate-700 p-5 rounded-lg shadow-md space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-slate-800 text-sm capitalize">
                      Active discussions inside {forumCategoryFilter}
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {threads
                      .filter(t => t.category === forumCategoryFilter)
                      .map((t) => (
                        <div
                          key={t.id}
                          onClick={() => {
                            // Increment views locally
                            setThreads(prev => prev.map(thread => thread.id === t.id ? { ...thread, views: thread.views + 1 } : thread));
                            setSelectedForumThread(t);
                          }}
                          className="bg-white hover:bg-slate-50 border-2 border-slate-300 p-3 rounded cursor-pointer transition flex justify-between items-center text-xs"
                        >
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-red-700 text-sm hover:underline">{t.title}</h4>
                            <p className="text-[10px] text-slate-400">Created by {t.authorName} • Active: {t.lastActive.split('T')[0]}</p>
                          </div>
                          
                          <div className="flex gap-4 text-right text-[10px] font-mono text-slate-500">
                            <div>
                              <span className="block font-bold">{t.posts.length}</span>
                              <span>replies</span>
                            </div>
                            <div>
                              <span className="block font-bold">{t.views}</span>
                              <span>views</span>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Create Thread form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const titleInput = form.elements.namedItem('t_title') as HTMLInputElement;
                      const contentText = form.elements.namedItem('t_content') as HTMLTextAreaElement;

                      handleCreateForumThread(
                        forumCategoryFilter as any,
                        titleInput.value,
                        contentText.value
                      );

                      form.reset();
                    }}
                    className="bg-[#f0e4d8] border border-[#d0c0b0] p-4 rounded space-y-3"
                  >
                    <h4 className="font-bold text-slate-800 text-xs">Start a New Discussion Thread:</h4>
                    <div className="space-y-1">
                      <input
                        name="t_title"
                        type="text"
                        required
                        placeholder="Thread Topic / Subject..."
                        className="w-full bg-white border border-slate-400 rounded py-1 px-2.5 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <textarea
                        name="t_content"
                        required
                        className="w-full bg-white border border-slate-400 rounded p-2 text-xs h-16 resize-none text-slate-800"
                        placeholder="Describe your question or discussion post..."
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        id="forum_post_thread_btn"
                        type="submit"
                        className="bg-red-700 hover:bg-red-600 text-white text-xs font-bold px-5 py-1.5 rounded transition"
                      >
                        Publish Thread
                      </button>
                    </div>
                  </form>

                </div>

              </div>
            )}

          </div>
        )}

        {/* --------------------------------------------------
            TAB CONTENT: GROUPS
        -------------------------------------------------- */}
        {activeTab === 'groups' && authMode === 'authorized' && (
          <div className="space-y-6 animate-fade-in">
            
            {selectedGroup ? (
              // View Specific Group page
              <div className="bg-[#fcf8f2] border-4 border-slate-700 p-6 rounded-lg max-w-4xl mx-auto shadow-xl relative space-y-6 text-slate-800">
                <button
                  id="back_groups_list"
                  onClick={() => setSelectedGroup(null)}
                  className="absolute top-4 right-4 text-xs font-bold bg-slate-200 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-300 transition"
                >
                  ← Back to List
                </button>

                <div className="flex flex-col sm:flex-row gap-4 items-center border-b-2 border-slate-300 pb-4">
                  <div className="w-16 h-16 rounded border border-slate-500 shadow flex items-center justify-center font-bold text-2xl text-white select-none" style={{ backgroundColor: selectedGroup.logoColor }}>
                    👥
                  </div>
                  <div className="space-y-0.5 text-center sm:text-left">
                    <h2 className="text-2xl font-serif font-bold text-slate-900">{selectedGroup.name}</h2>
                    <p className="text-xs text-slate-400">Created by: {selectedGroup.creatorName} • Members count: {selectedGroup.members.length}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: Description */}
                  <div className="md:col-span-8 space-y-4">
                    <div className="bg-white p-4 rounded border-2 leading-relaxed text-xs">
                      <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Group Description:</h4>
                      {selectedGroup.description}
                    </div>

                    {/* Join button */}
                    {!selectedGroup.members.includes(currentUser.id) ? (
                      <button
                        id="join_group_final_btn"
                        onClick={() => {
                          handleJoinGroup(selectedGroup);
                          setSelectedGroup(prev => {
                            if (!prev) return null;
                            return { ...prev, members: [...prev.members, currentUser.id] };
                          });
                        }}
                        className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 px-4 rounded text-xs transition shadow"
                      >
                        Join Group
                      </button>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-400 text-emerald-800 text-xs px-3 py-1.5 rounded text-center font-bold">
                        ✓ You are a member of this Group
                      </div>
                    )}

                    {/* Group Wall Posts */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider border-b pb-1">Group Wall:</h4>
                      
                      {/* Post form */}
                      {selectedGroup.members.includes(currentUser.id) && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const input = (e.target as any).elements.wall_input;
                            if (!input.value.trim()) return;
                            handlePostToWall(selectedGroup.id, input.value);
                            setSelectedGroup(prev => {
                              if (!prev) return null;
                              return {
                                ...prev,
                                wall: [
                                  {
                                    id: `w_${Date.now()}`,
                                    authorName: currentUser.username,
                                    content: input.value,
                                    timestamp: new Date().toISOString()
                                  },
                                  ...prev.wall
                                ]
                              };
                            });
                            input.value = '';
                          }}
                          className="flex gap-2"
                        >
                          <input
                            name="wall_input"
                            required
                            placeholder="Post a wall status update..."
                            className="flex-1 bg-white border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800"
                          />
                          <button
                            id="group_wall_post_btn"
                            type="submit"
                            className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-4 py-1 rounded transition"
                          >
                            Post
                          </button>
                        </form>
                      )}

                      <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                        {selectedGroup.wall.map((post) => (
                          <div key={post.id} className="bg-white border p-2.5 rounded text-xs leading-relaxed">
                            <p className="font-semibold text-slate-800">{post.authorName} <span className="font-mono text-[9px] text-slate-400 font-normal ml-1.5">{post.timestamp.split('T')[0]}</span></p>
                            <p className="text-slate-600 mt-0.5">{post.content}</p>
                          </div>
                        ))}
                        {selectedGroup.wall.length === 0 && (
                          <p className="text-slate-400 italic text-center py-4">No wall posts yet. Speak up!</p>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right Column Members list */}
                  <div className="md:col-span-4 bg-[#f5eae1] p-4 rounded-lg border-2 border-[#d2c2b2] space-y-2">
                    <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider pb-1 border-b">Members:</h4>
                    <div className="space-y-1.5 text-xs max-h-[220px] overflow-y-auto">
                      {selectedGroup.members.map((memId) => {
                        const sim = SIMULATED_PLAYERS.find(p => p.id === memId);
                        const name = sim ? sim.username : memId === 'player_2007' ? currentUser.username : memId;
                        return (
                          <div key={memId} className="bg-white px-2 py-1.5 rounded border flex items-center justify-between font-medium">
                            <span>{name}</span>
                            <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 uppercase">Member</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

              </div>
            ) : (
              // MAIN LIST of groups
              <div className="space-y-4">
                
                <div className="bg-[#fcf8f2] border-4 border-slate-700 p-4 rounded-lg shadow flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-serif font-bold text-slate-800">👥 Communities & Builder Groups</h2>
                    <p className="text-xs text-slate-500">Join official communities to talk about coding, scripting, and clothing creations.</p>
                  </div>
                  
                  <button
                    id="trigger_create_group_btn"
                    onClick={() => setShowGroupCreator(!showGroupCreator)}
                    className="bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded transition flex items-center gap-1 shadow"
                  >
                    <Plus size={14} />
                    <span>Create Custom Group</span>
                  </button>
                </div>

                {/* Create Group Form Modal Panel */}
                {showGroupCreator && (
                  <form
                    onSubmit={handleCreateGroup}
                    className="bg-[#f0e4d8] border-4 border-slate-700 p-5 rounded-lg max-w-md mx-auto space-y-4 text-slate-800"
                  >
                    <h3 className="font-bold text-sm text-slate-800 border-b pb-1">Start a Custom Roblox Group:</h3>
                    
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Group Name:</label>
                      <input
                        id="new_group_name_input"
                        type="text"
                        required
                        placeholder="e.g. Classic Brick Fans, Crossroads Elite"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="w-full bg-white border border-slate-400 rounded py-1.5 px-2.5 text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 block">Description:</label>
                      <textarea
                        id="new_group_desc_input"
                        placeholder="A neat description for your group..."
                        value={newGroupDesc}
                        onChange={(e) => setNewGroupDesc(e.target.value)}
                        className="w-full bg-white border border-slate-400 rounded p-2 text-xs h-16 resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">Logo Base Color:</label>
                      <div className="flex gap-2">
                        {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#111827'].map((col) => (
                          <button
                            id={`grp_color_${col.replace('#', '')}_btn`}
                            key={col}
                            type="button"
                            onClick={() => setNewGroupColor(col)}
                            className={`w-6 h-6 rounded border-2 transition ${newGroupColor === col ? 'border-red-600 scale-110' : 'border-slate-300'}`}
                            style={{ backgroundColor: col }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1 justify-end">
                      <button
                        id="cancel_group_creation_btn"
                        type="button"
                        onClick={() => setShowGroupCreator(false)}
                        className="bg-slate-300 text-slate-700 font-bold px-4 py-1.5 rounded text-xs hover:bg-slate-400 transition"
                      >
                        Cancel
                      </button>
                      <button
                        id="submit_group_creation_btn"
                        type="submit"
                        className="bg-red-700 text-white font-bold px-5 py-1.5 rounded text-xs hover:bg-red-600 transition"
                      >
                        Publish Group!
                      </button>
                    </div>
                  </form>
                )}

                {/* List of groups Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-2">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      onClick={() => setSelectedGroup(group)}
                      className="bg-[#fcf8f2] border-4 border-slate-700 rounded-lg p-5 hover:border-red-600 cursor-pointer shadow-md hover:shadow-lg transition flex items-start gap-4"
                    >
                      <div className="w-12 h-12 rounded border-2 border-slate-500 shadow flex items-center justify-center font-bold text-xl text-white select-none" style={{ backgroundColor: group.logoColor }}>
                        👥
                      </div>
                      <div className="space-y-0.5 text-slate-800 flex-1 min-w-0">
                        <h3 className="font-bold text-sm leading-tight hover:text-red-700 transition truncate">{group.name}</h3>
                        <p className="text-[10px] text-slate-400 truncate">Owner: {group.creatorName}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 pt-1">{group.description}</p>
                        <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-400 font-bold mt-2 font-mono">
                          {group.members.length} members
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

          </div>
        )}

        {/* --------------------------------------------------
            TAB CONTENT: PEOPLE (SEARCH FRIENDS)
        -------------------------------------------------- */}
        {activeTab === 'friends' && authMode === 'authorized' && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="bg-[#fcf8f2] border-4 border-slate-700 p-5 rounded-lg shadow-md space-y-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-slate-800">🔍 Search Roblox People</h2>
                <p className="text-xs text-slate-500">Find other creative Roblox builders, view profiles, trade items, or send emails.</p>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <input
                  id="people_search_bar"
                  type="text"
                  placeholder="Search username (e.g. Builderman, Telamon)..."
                  value={searchUserQuery}
                  onChange={(e) => setSearchUserQuery(e.target.value)}
                  className="w-full bg-white border border-slate-400 rounded py-2 px-3 text-xs pr-10 text-slate-800 font-medium"
                />
                <Search size={16} className="absolute right-3 top-2.5 text-slate-400" />
              </div>
            </div>

            {/* List players matching query */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SIMULATED_PLAYERS
                .filter(p => !searchUserQuery || p.username.toLowerCase().includes(searchUserQuery.toLowerCase()))
                .map((player) => {
                  const isFriend = currentUser.friends.includes(player.id);
                  return (
                    <div
                      key={player.id}
                      className="bg-[#fcf8f2] border-4 border-slate-700 p-5 rounded-lg shadow-md flex items-start gap-4"
                    >
                      {/* Character head or 2D preview */}
                      <div className="w-12 h-12 rounded bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-2xl select-none">
                        👨‍🔧
                      </div>
                      
                      <div className="space-y-0.5 text-slate-800 flex-1 min-w-0">
                        <h3 className="font-bold text-sm leading-tight hover:text-red-700 transition truncate">{player.username}</h3>
                        <p className="text-[10px] text-slate-400">Joined: {player.joinedDate}</p>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pt-1 italic">"{player.bio}"</p>
                        
                        <div className="flex gap-2 pt-2.5">
                          {/* Profile details */}
                          <button
                            id={`view_profile_${player.id}_btn`}
                            onClick={() => setSelectedProfile(player)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2.5 py-1 rounded text-[10px] transition"
                          >
                            👁️ Profile
                          </button>

                          {/* Add/Friend action */}
                          <button
                            id={`add_friend_${player.id}_btn`}
                            disabled={isFriend}
                            onClick={() => {
                              setCurrentUser(prev => ({
                                ...prev,
                                friends: [...prev.friends, player.id]
                              }));
                              alert(`Successfully added ${player.username} to your friend list!`);
                            }}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold transition shadow-sm flex items-center gap-1 ${isFriend ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-red-700 hover:bg-red-600 text-white'}`}
                          >
                            {isFriend ? <UserCheck size={10} /> : <UserPlus size={10} />}
                            <span>{isFriend ? 'Friends' : 'Add Friend'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

          </div>
        )}

        {/* --------------------------------------------------
            TAB CONTENT: MESSAGES
        -------------------------------------------------- */}
        {activeTab === 'messages' && authMode === 'authorized' && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="bg-[#fcf8f2] border-4 border-slate-700 p-5 rounded-lg shadow flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <h2 className="text-lg font-serif font-bold text-slate-800">✉️ Private Mailbox Envelope</h2>
                <p className="text-xs text-slate-500">Read messages, mail replies, and write classic letters.</p>
              </div>

              <button
                id="trigger_compose_mail_btn"
                onClick={() => setShowMessageComposer(!showMessageComposer)}
                className="bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded transition flex items-center gap-1 shadow"
              >
                <Plus size={14} />
                <span>Write New Message</span>
              </button>
            </div>

            {/* MESSAGE COMPOSER */}
            {showMessageComposer && (
              <form
                onSubmit={handleSendMessage}
                className="bg-[#f0e4d8] border-4 border-slate-700 p-5 rounded-lg max-w-md mx-auto space-y-4 text-slate-800"
              >
                <h3 className="font-bold text-sm text-slate-800 border-b pb-1">Compose Message:</h3>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">To Username:</label>
                  <select
                    id="mail_to_select"
                    required
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                    className="w-full bg-white border border-slate-400 rounded py-1.5 px-2.5 text-xs font-semibold"
                  >
                    <option value="">-- Choose recipient --</option>
                    {SIMULATED_PLAYERS.map(p => (
                      <option key={p.id} value={p.username}>{p.username}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Subject / Heading:</label>
                  <input
                    id="mail_subject_input"
                    type="text"
                    required
                    placeholder="Subject..."
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="w-full bg-white border border-slate-400 rounded py-1.5 px-2.5 text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Letter Content:</label>
                  <textarea
                    id="mail_body_textarea"
                    required
                    placeholder="Write your message details..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    className="w-full bg-white border border-slate-400 rounded p-2 text-xs h-24 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-1 justify-end">
                  <button
                    id="cancel_mail_compose_btn"
                    type="button"
                    onClick={() => setShowMessageComposer(false)}
                    className="bg-slate-300 text-slate-700 font-bold px-4 py-1.5 rounded text-xs hover:bg-slate-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit_mail_compose_btn"
                    type="submit"
                    className="bg-[#0f766e] text-white font-bold px-5 py-1.5 rounded text-xs hover:bg-teal-600 transition flex items-center gap-1"
                  >
                    <Send size={12} />
                    <span>Send envelope</span>
                  </button>
                </div>
              </form>
            )}

            {/* List inbox letters */}
            <div className="bg-[#fcf8f2] border-4 border-slate-700 p-5 rounded-lg shadow-md space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-1">Inbox Envelopes:</h3>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded border-2 text-xs flex flex-col sm:flex-row justify-between items-start gap-2.5 relative leading-relaxed ${msg.isRead ? 'bg-white border-slate-300 text-slate-700' : 'bg-red-50/20 border-red-500 text-slate-800 font-medium'}`}
                  >
                    {/* Unread dot */}
                    {!msg.isRead && (
                      <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-600 animate-ping" />
                    )}

                    <div className="space-y-1 flex-1 min-w-0">
                      <p className="font-mono text-[9px] text-slate-400 uppercase tracking-wide">
                        From: <span className="font-bold text-red-700">{msg.senderName}</span> • Date: {msg.timestamp.split('T')[0]}
                      </p>
                      <h4 className="font-bold text-sm text-slate-800">{msg.subject}</h4>
                      <p className="text-slate-600 whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    <button
                      id={`mark_read_${msg.id}_btn`}
                      onClick={() => {
                        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-[10px] font-bold px-2 py-1 rounded border hover:border-slate-400 transition"
                    >
                      {msg.isRead ? 'Mark Unread' : 'Mark Read'}
                    </button>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-slate-400 italic text-center py-8">Inbox is empty. Write letters to friends!</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* --------------------------------------------------
            TAB CONTENT: TRADE
        -------------------------------------------------- */}
        {activeTab === 'trade' && authMode === 'authorized' && (
          <div className="space-y-6 animate-fade-in">
            
            <div className="bg-[#fcf8f2] border-4 border-slate-700 p-5 rounded-lg shadow flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <h2 className="text-lg font-serif font-bold text-slate-800">🔄 Simulated Exchange Trading Board</h2>
                <p className="text-xs text-slate-500">Trade clothing collectibles from your inventory with legendary simulated players!</p>
              </div>

              <button
                id="trigger_trade_board_btn"
                onClick={() => {
                  if (SIMULATED_PLAYERS.length > 0) {
                    setTradeWithUser(SIMULATED_PLAYERS[0]);
                    setShowTradeComposer(!showTradeComposer);
                  } else {
                    alert('No online users to trade with right now!');
                  }
                }}
                className="bg-red-700 hover:bg-red-600 text-white font-bold text-xs px-4 py-2 rounded transition flex items-center gap-1 shadow"
              >
                <Plus size={14} />
                <span>Initialize Collectible Trade</span>
              </button>
            </div>

            {/* TRADE PROPOSAL COMPOSER */}
            {showTradeComposer && tradeWithUser && (
              <form
                onSubmit={handleSendTradeOffer}
                className="bg-[#fcf8f2] border-4 border-slate-700 p-6 rounded-lg max-w-2xl mx-auto space-y-6 text-slate-800 shadow-xl"
              >
                <h3 className="font-bold text-base text-slate-900 border-b pb-1 flex items-center gap-2">
                  <span>🔄 Propose Collectibles Trade with:</span>
                  <select
                    id="trade_target_user_select"
                    value={tradeWithUser.id}
                    onChange={(e) => {
                      const user = SIMULATED_PLAYERS.find(p => p.id === e.target.value);
                      if (user) setTradeWithUser(user);
                    }}
                    className="bg-white border p-1 rounded font-bold text-xs"
                  >
                    {SIMULATED_PLAYERS.map(p => (
                      <option key={p.id} value={p.id}>{p.username}</option>
                    ))}
                  </select>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* My inventory section (what I am offering) */}
                  <div className="bg-slate-50 p-4 rounded border-2 border-slate-300 space-y-3">
                    <h4 className="font-bold text-xs text-slate-700 border-b pb-0.5 uppercase tracking-wide">
                      🫴 My Collectibles (What I Offer):
                    </h4>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto text-xs pr-1">
                      {currentUser.inventory.map((itemId) => {
                        const item = catalog.find(i => i.id === itemId);
                        if (!item) return null;
                        const offered = tradeOfferMyItems.includes(itemId);
                        return (
                          <div key={itemId} className="flex justify-between items-center bg-white p-2 rounded border">
                            <span className="font-semibold">{item.name}</span>
                            <button
                              id={`trade_add_my_${item.id}_btn`}
                              type="button"
                              onClick={() => {
                                if (offered) {
                                  setTradeOfferMyItems(tradeOfferMyItems.filter(id => id !== itemId));
                                } else {
                                  setTradeOfferMyItems([...tradeOfferMyItems, itemId]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${offered ? 'bg-red-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                            >
                              {offered ? '✓ Offering' : '+ Offer'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Their inventory section (what I am requesting) */}
                  <div className="bg-slate-50 p-4 rounded border-2 border-slate-300 space-y-3">
                    <h4 className="font-bold text-xs text-slate-700 border-b pb-0.5 uppercase tracking-wide">
                      🫳 Their Collectibles (What I Request):
                    </h4>
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto text-xs pr-1">
                      {tradeWithUser.inventory.map((itemId) => {
                        const item = catalog.find(i => i.id === itemId);
                        if (!item) return null;
                        const requested = tradeOfferTheirItems.includes(itemId);
                        return (
                          <div key={itemId} className="flex justify-between items-center bg-white p-2 rounded border">
                            <span className="font-semibold">{item.name}</span>
                            <button
                              id={`trade_add_their_${item.id}_btn`}
                              type="button"
                              onClick={() => {
                                if (requested) {
                                  setTradeOfferTheirItems(tradeOfferTheirItems.filter(id => id !== itemId));
                                } else {
                                  setTradeOfferTheirItems([...tradeOfferTheirItems, itemId]);
                                }
                              }}
                              className={`px-2.5 py-1 rounded text-[10px] font-bold transition ${requested ? 'bg-red-700 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'}`}
                            >
                              {requested ? '✓ Requesting' : '+ Request'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>

                <div className="flex gap-2 pt-2 justify-end">
                  <button
                    id="cancel_trade_proposal_btn"
                    type="button"
                    onClick={() => {
                      setShowTradeComposer(false);
                      setTradeOfferMyItems([]);
                      setTradeOfferTheirItems([]);
                    }}
                    className="bg-slate-300 text-slate-700 font-bold px-5 py-2 rounded text-xs hover:bg-slate-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit_trade_proposal_btn"
                    type="submit"
                    className="bg-red-700 text-white font-bold px-6 py-2 rounded text-xs hover:bg-red-600 transition"
                  >
                    🚀 Propose Deal Exchange
                  </button>
                </div>
              </form>
            )}

            {/* List historic trades proposals */}
            <div className="bg-[#fcf8f2] border-4 border-slate-700 p-5 rounded-lg shadow-md space-y-3">
              <h3 className="font-bold text-slate-800 text-sm border-b pb-1">Exchange Proposals Ledger:</h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {trades.map((trade) => (
                  <div
                    key={trade.id}
                    className="bg-white border-2 border-slate-300 p-4 rounded text-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <p className="font-mono text-[9px] text-slate-400 uppercase">
                        Exchange Offer Proposed with: <span className="font-bold text-red-700">{trade.receiverName}</span>
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 text-[11px] pt-1 leading-relaxed">
                        <div>
                          <span className="font-semibold text-slate-500 block">Offer:</span>
                          {trade.senderItems.map(id => catalog.find(i => i.id === id)?.name).join(', ') || 'None'}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-500 block">Requested:</span>
                          {trade.receiverItems.map(id => catalog.find(i => i.id === id)?.name).join(', ') || 'None'}
                        </div>
                      </div>
                    </div>

                    <div>
                      {trade.status === 'pending' ? (
                        <span className="bg-amber-100 text-amber-700 font-bold border border-amber-300 px-3 py-1 rounded text-[10px]">
                          ⌛ PENDING
                        </span>
                      ) : trade.status === 'accepted' ? (
                        <span className="bg-emerald-100 text-emerald-700 font-bold border border-emerald-300 px-3 py-1 rounded text-[10px]">
                          ✓ ACCEPTED
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-700 font-bold border border-red-300 px-3 py-1 rounded text-[10px]">
                          ✗ DECLINED
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {trades.length === 0 && (
                  <p className="text-slate-400 italic text-center py-8">No trade history recorded. Propose clothing swaps!</p>
                )}
              </div>
            </div>

          </div>
        )}

        {/* --------------------------------------------------
            TAB CONTENT: BLOG
        -------------------------------------------------- */}
        {activeTab === 'blog' && authMode === 'authorized' && (
          <div className="space-y-6 animate-fade-in max-w-3xl mx-auto text-slate-800">
            {BLOG_POSTS.map((post) => (
              <div key={post.id} className="bg-[#fcf8f2] border-4 border-slate-700 p-6 rounded-lg shadow-md space-y-3">
                <div className="border-b border-slate-300 pb-2">
                  <span className="text-[10px] text-slate-400 font-mono">Date: {post.date} • Written by: {post.author}</span>
                  <h3 className="text-xl font-serif font-bold text-slate-950 mt-1">{post.title}</h3>
                </div>
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{post.content}</p>
              </div>
            ))}
          </div>
        )}

        {/* --------------------------------------------------
            TAB CONTENT: SETTINGS
        -------------------------------------------------- */}
        {activeTab === 'settings' && authMode === 'authorized' && (
          <div className="bg-[#fcf8f2] border-4 border-slate-700 p-6 rounded-lg max-w-xl mx-auto shadow-lg space-y-6 text-slate-800 animate-fade-in">
            <h2 className="text-xl font-serif font-bold text-slate-900 border-b-2 border-slate-400 pb-1.5 flex items-center gap-2">
              <SettingsIcon size={18} />
              <span>ROBLOX Client Settings Portal</span>
            </h2>

            {/* 3D Rendering Mode Toggle */}
            <div className="space-y-2 p-4 bg-slate-50 border border-slate-300 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">3D Graphics Mode Default</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Toggle 3D perspective camera & meshes across all sandbox games.</p>
                </div>
                
                <button
                  id="settings_toggle_3d_btn"
                  onClick={() => setIs3DModeGlobal(!is3DModeGlobal)}
                  className={`px-4 py-2 text-xs font-bold rounded shadow-sm border transition ${is3DModeGlobal ? 'bg-red-700 text-white border-red-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                >
                  {is3DModeGlobal ? '✓ 3D MODE ENABLED' : '✗ 2D CAMERA ONLY'}
                </button>
              </div>
            </div>

            {/* Developer Reset state button */}
            <div className="space-y-2 p-4 bg-slate-50 border border-slate-300 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Reset Client Progress</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">Clear localStorage sandbox records and begin with default values.</p>
                </div>
                
                <button
                  id="settings_reset_all_btn"
                  onClick={() => {
                    if (confirm('Are you sure you want to restore default Roblox 2007 simulation state? All created games and custom clothes will be cleared.')) {
                      localStorage.clear();
                      window.location.reload();
                    }
                  }}
                  className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2 rounded transition shadow-sm border border-red-800"
                >
                  RESET NOW
                </button>
              </div>
            </div>
            
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-[#eedfc5] border-t-2 border-[#cfbfa4] py-8 text-center text-xs text-slate-500 font-mono mt-12 space-y-1">
        <p>© 2007 ROBLOX Corporation. All rights reserved.</p>
        <p className="text-[10px]">Build virtual brick battle arenas and share creations with friends online.</p>
      </footer>

    </div>
  );
}
