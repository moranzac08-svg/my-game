export interface AvatarColors {
  head: string;
  torso: string;
  leftArm: string;
  rightArm: string;
  leftLeg: string;
  rightLeg: string;
}

export type CatalogItemType = 'shirt' | 'pants' | 'accessory' | 'face' | 'animation_pack';

export interface CatalogItem {
  id: string;
  name: string;
  creatorId: string;
  creatorName: string;
  type: CatalogItemType;
  priceRobux: number;
  priceTickets: number;
  // Visual configuration for drawing in 2D/3D
  assetColor?: string; // For shirts/pants solid colors
  assetDesign?: string; // Classic decal style representation
  assetImageUrl?: string; // Image overlay for shirts or pants
  accessoryType?: 'hat' | 'shades' | 'hair' | 'wings' | 'cape';
  faceAssetUrl?: string; // Custom eyes/smile design
  walkAnimationSpeed?: number;
  jumpAnimationHeight?: number;
  animationType?: 'classic' | 'ninja' | 'superhero' | 'robot';
  isUserCreated?: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  tickets: number;
  robux: number;
  joinedDate: string;
  bio: string;
  avatarColors: AvatarColors;
  equippedItems: {
    shirt?: string; // catalog item id
    pants?: string; // catalog item id
    accessory?: string; // catalog item id
    face?: string; // catalog item id
    animationPack?: string; // catalog item id
    hair?: string; // catalog item id
  };
  inventory: string[]; // catalog item ids
  friends: string[]; // user ids
  friendRequests: string[]; // user ids (received)
  groups: string[]; // group ids
}

export interface Brick {
  id: string;
  type: 'block' | 'wedge' | 'spawn' | 'lava' | 'goal';
  color: string;
  x: number;
  y: number;
  z: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
}

export interface RobloxGame {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  visits: number;
  likes: number;
  dislikes: number;
  bricks: Brick[];
}

export interface GroupWallPost {
  id: string;
  authorName: string;
  content: string;
  timestamp: string;
}

export interface RobloxGroup {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  members: string[]; // user ids
  wall: GroupWallPost[];
  logoColor: string;
}

export interface ForumPost {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  timestamp: string;
}

export interface ForumThread {
  id: string;
  category: 'general' | 'building' | 'help' | 'offtopic';
  title: string;
  authorName: string;
  views: number;
  posts: ForumPost[];
  lastActive: string;
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface TradeOffer {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  senderItems: string[]; // catalog item ids
  receiverItems: string[]; // catalog item ids
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

export interface BlogArticle {
  id: string;
  title: string;
  author: string;
  content: string;
  date: string;
}
