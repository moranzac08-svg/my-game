import React from 'react';
import { AvatarColors, CatalogItem } from '../types';
import { INITIAL_CATALOG } from '../data';

interface AvatarRendererProps {
  colors: AvatarColors;
  equipped: {
    shirt?: string;
    pants?: string;
    accessory?: string;
    face?: string;
    hair?: string;
  };
  size?: number; // width/height in pixels
  className?: string;
}

export const AvatarRenderer: React.FC<AvatarRendererProps> = ({
  colors,
  equipped,
  size = 180,
  className = '',
}) => {
  // Find item details
  const shirtItem = equipped.shirt ? INITIAL_CATALOG.find(i => i.id === equipped.shirt) : null;
  const pantsItem = equipped.pants ? INITIAL_CATALOG.find(i => i.id === equipped.pants) : null;
  const accessoryItem = equipped.accessory ? INITIAL_CATALOG.find(i => i.id === equipped.accessory) : null;
  const faceItem = equipped.face ? INITIAL_CATALOG.find(i => i.id === equipped.face) : null;

  // Use default skin colors or fallbacks if empty
  const headColor = colors.head || '#facc15';
  const torsoColor = shirtItem?.assetColor || colors.torso || '#ef4444';
  const leftArmColor = shirtItem?.assetColor || colors.leftArm || '#facc15';
  const rightArmColor = shirtItem?.assetColor || colors.rightArm || '#facc15';
  const leftLegColor = pantsItem?.assetColor || colors.leftLeg || '#2563eb';
  const rightLegColor = pantsItem?.assetColor || colors.rightLeg || '#2563eb';

  return (
    <div
      className={`flex items-center justify-center bg-[#f3f4f6] rounded border-2 border-gray-400 overflow-hidden relative ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 150"
        width="100%"
        height="100%"
        className="drop-shadow-md select-none"
      >
        {/* BACKGROUND ACCENT STUDS (classic green grass theme) */}
        <defs>
          <radialGradient id="shadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#111827" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#111827" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Character Base Shadow */}
        <ellipse cx="60" cy="135" rx="35" ry="8" fill="url(#shadow)" />

        {/* Valkyrie Wings (Back Accessory) */}
        {accessoryItem?.accessoryType === 'wings' && (
          <g id="accessory_wings">
            {/* Left Wing */}
            <path d="M 40 45 L 15 25 L 10 40 L 25 55 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
            <path d="M 38 48 L 18 35 L 15 45 L 28 58 Z" fill="#ffffff" />
            {/* Right Wing */}
            <path d="M 80 45 L 105 25 L 110 40 L 95 55 Z" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
            <path d="M 82 48 L 102 35 L 105 45 L 92 58 Z" fill="#ffffff" />
          </g>
        )}

        {/* LEFT LEG */}
        <rect
          id="left_leg"
          x="41"
          y="88"
          width="18"
          height="45"
          rx="1"
          fill={leftLegColor}
          stroke="#111827"
          strokeWidth="1.5"
        />

        {/* RIGHT LEG */}
        <rect
          id="right_leg"
          x="61"
          y="88"
          width="18"
          height="45"
          rx="1"
          fill={rightLegColor}
          stroke="#111827"
          strokeWidth="1.5"
        />

        {/* LEFT ARM */}
        <rect
          id="left_arm"
          x="23"
          y="40"
          width="16"
          height="46"
          rx="1"
          fill={leftArmColor}
          stroke="#111827"
          strokeWidth="1.5"
        />

        {/* RIGHT ARM */}
        <rect
          id="right_arm"
          x="81"
          y="40"
          width="16"
          height="46"
          rx="1"
          fill={rightArmColor}
          stroke="#111827"
          strokeWidth="1.5"
        />

        {/* TORSO */}
        <rect
          id="torso"
          x="40"
          y="40"
          width="40"
          height="48"
          rx="1"
          fill={torsoColor}
          stroke="#111827"
          strokeWidth="1.5"
        />

        {/* SHIRT DESIGN OVERLAY */}
        {shirtItem && (
          <g id="shirt_overlay">
            {shirtItem.assetImageUrl && (
              <image
                href={shirtItem.assetImageUrl}
                x="42"
                y="42"
                width="36"
                height="44"
                preserveAspectRatio="xMidYMid meet"
              />
            )}
            {shirtItem.assetDesign === 'tux' && (
              <>
                {/* White shirt triangle */}
                <polygon points="50,40 70,40 60,56" fill="#ffffff" />
                {/* Red bow tie */}
                <polygon points="56,43 64,43 60,46" fill="#ef4444" />
                {/* Red bow tie */}
                <polygon points="56,47 64,47 60,44" fill="#ef4444" />
                {/* Tux buttons */}
                <circle cx="60" cy="51" r="1.2" fill="#111827" />
                <circle cx="60" cy="62" r="1.2" fill="#ffffff" />
                <circle cx="60" cy="70" r="1.2" fill="#ffffff" />
              </>
            )}
            {shirtItem.assetDesign === 'jacket' && (
              <>
                {/* Roblox R logo on pocket */}
                <rect x="46" y="48" width="6" height="6" fill="#ffffff" rx="0.5" />
                <text x="47.5" y="53" fontSize="5" fontFamily="sans-serif" fontWeight="bold" fill="#ef4444">R</text>
                {/* Zipper line */}
                <line x1="60" y1="40" x2="60" y2="88" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 1" />
              </>
            )}
            {shirtItem.assetDesign === 'stripes' && (
              <>
                {/* White horizontal stripes */}
                <rect x="41" y="48" width="38" height="4" fill="#ffffff" opacity="0.4" />
                <rect x="41" y="60" width="38" height="4" fill="#ffffff" opacity="0.4" />
                <rect x="41" y="72" width="38" height="4" fill="#ffffff" opacity="0.4" />
              </>
            )}
            {shirtItem.assetDesign === 'wrench' && (
              <>
                {/* Wrench graphic inside black circle */}
                <circle cx="60" cy="62" r="8" fill="#111827" />
                {/* Hammer/Wrench symbol */}
                <rect x="58" y="57" width="4" height="10" fill="#f59e0b" transform="rotate(45, 60, 62)" />
                <circle cx="60" cy="62" r="2" fill="#f59e0b" />
              </>
            )}
          </g>
        )}

        {/* HEAD neck joint */}
        <rect x="56" y="27" width="8" height="14" fill={headColor} stroke="#111827" strokeWidth="1.5" />

        {/* HEAD main block */}
        <rect
          id="head"
          x="48"
          y="15"
          width="24"
          height="24"
          rx="3"
          fill={headColor}
          stroke="#111827"
          strokeWidth="1.5"
        />

        {/* FACE DECAL */}
        <g id="face_decal">
          {!faceItem || faceItem.faceAssetUrl === 'smile' ? (
            // Classic Smile
            <>
              {/* Eyes */}
              <circle cx="55" cy="22" r="1.5" fill="#111827" />
              <circle cx="65" cy="22" r="1.5" fill="#111827" />
              {/* Smile arc */}
              <path d="M 54 27 Q 60 33 66 27" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : faceItem.faceAssetUrl === 'awesome' ? (
            // Epic Awesome Face
            <>
              {/* Yellow face backer to hide block eyes, draw big mouth */}
              <circle cx="60" cy="26" r="11" fill="#facc15" />
              {/* Laughing slanted eyes */}
              <path d="M 51 22 L 56 25 L 51 25" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M 69 22 L 64 25 L 69 25" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Big open mouth with red/tongue */}
              <path d="M 52 27 Q 60 37 68 27 Z" fill="#dc2626" stroke="#111827" strokeWidth="1.2" />
              <path d="M 55 31 Q 60 35 65 31" fill="#f87171" />
              {/* Red rosy cheeks */}
              <ellipse cx="50" cy="26" rx="2" ry="1.5" fill="#f87171" opacity="0.6" />
              <ellipse cx="70" cy="26" rx="2" ry="1.5" fill="#f87171" opacity="0.6" />
            </>
          ) : faceItem.faceAssetUrl === 'chill' ? (
            // Chillin Face with slight smirk & sunglasses-like squint
            <>
              {/* Smirk eyes */}
              <path d="M 52 21 Q 55 20 58 22" fill="none" stroke="#111827" strokeWidth="1.5" />
              <path d="M 62 21 Q 65 20 68 22" fill="none" stroke="#111827" strokeWidth="1.5" />
              <circle cx="55" cy="23.5" r="1" fill="#111827" />
              <circle cx="65" cy="23.5" r="1" fill="#111827" />
              {/* Smirk Mouth */}
              <path d="M 55 29 Q 63 29 65 26" fill="none" stroke="#111827" strokeWidth="1.5" strokeLinecap="round" />
            </>
          ) : faceItem.faceAssetUrl === 'silly' ? (
            // Silly Fun Face (wink and tongue out)
            <>
              {/* Left eye open, right eye wink */}
              <circle cx="55" cy="22" r="1.5" fill="#111827" />
              <path d="M 62 22 L 67 22" fill="none" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
              {/* Open mouth with tongue sticking out */}
              <path d="M 54 27 Q 60 32 64 27" fill="none" stroke="#111827" strokeWidth="1.5" />
              {/* Tongue */}
              <path d="M 57 28 C 57 33, 61 33, 61 28 Z" fill="#ef4444" stroke="#111827" strokeWidth="1" />
            </>
          ) : null}
        </g>

        {/* ACCESSORIES (Strict adjustments, cool shades on face, cap/hat on head) */}
        {accessoryItem?.accessoryType === 'shades' && (
          // Cool Shades - ALWAYS placed precisely on the head at the eye line!
          <g id="accessory_shades" transform="translate(45, 17)">
            {/* Sunglasses lenses and bridge */}
            <rect x="1" y="3" width="12" height="5" rx="1" fill="#111111" stroke="#374151" strokeWidth="0.5" />
            <rect x="15" y="3" width="12" height="5" rx="1" fill="#111111" stroke="#374151" strokeWidth="0.5" />
            <line x1="12" y1="5" x2="16" y2="5" stroke="#111111" strokeWidth="1.5" />
            {/* White shine accent */}
            <rect x="3" y="4" width="3" height="1.5" fill="#ffffff" opacity="0.6" />
            <rect x="17" y="4" width="3" height="1.5" fill="#ffffff" opacity="0.6" />
            {/* Frames extending back */}
            <path d="M 1 4 L -4 2" stroke="#111111" strokeWidth="1.5" />
            <path d="M 27 4 L 32 2" stroke="#111111" strokeWidth="1.5" />
          </g>
        )}

        {/* HAIR ACCS */}
        {equipped.hair && (
          <g id="accessory_hair">
            {equipped.hair === 'hair_beautiful_brown' && (
              <>
                {/* Wavy hair sides */}
                <path d="M 45 16 C 43 25, 44 32, 46 34 L 49 34 L 49 16 Z" fill="#78350f" stroke="#111827" strokeWidth="1" />
                <path d="M 75 16 C 77 25, 76 32, 74 34 L 71 34 L 71 16 Z" fill="#78350f" stroke="#111827" strokeWidth="1" />
                {/* Hair top dome */}
                <path d="M 46 16 Q 60 7 74 16 C 74 16, 73 13, 71 13 L 49 13 Q 47 13 46 16" fill="#78350f" stroke="#111827" strokeWidth="1" />
                {/* Fringe bangs */}
                <path d="M 48 15 Q 53 18 57 15 Q 63 19 72 15 L 72 17 L 48 17 Z" fill="#78350f" />
              </>
            )}
            {equipped.hair === 'hair_black_ponytail' && (
              <>
                {/* Ponytail extension */}
                <path d="M 70 20 C 78 18, 81 28, 77 34 C 75 30, 71 25, 70 20" fill="#111827" stroke="#111827" strokeWidth="1" />
                {/* Top cap hair */}
                <path d="M 47 16 Q 60 9 73 16" fill="none" stroke="#111827" strokeWidth="4" strokeLinecap="round" />
                <path d="M 48 15 Q 60 11 72 15 L 72 18 L 48 18 Z" fill="#1f2937" />
              </>
            )}
            {equipped.hair === 'hair_blonde_spiky' && (
              <>
                {/* Blonde Spiky Hair */}
                <polygon points="46,16 49,8 53,14 57,6 61,14 65,7 69,14 72,9 74,16" fill="#fbbf24" stroke="#111827" strokeWidth="1" />
                <path d="M 48 15 L 72 15 L 72 19 L 48 19 Z" fill="#fbbf24" />
              </>
            )}
            {equipped.hair === 'hair_blue_anime' && (
              <>
                {/* Anime swoosh hair */}
                <path d="M 46 16 Q 60 4 75 14 Q 65 10 50 18 Z" fill="#3b82f6" stroke="#111827" strokeWidth="1" />
                <path d="M 48 15 L 72 15 L 72 19 L 48 19 Z" fill="#3b82f6" />
                {/* Sideburn bangs */}
                <polygon points="48,15 45,24 50,20" fill="#3b82f6" />
                <polygon points="72,15 75,24 70,20" fill="#3b82f6" />
              </>
            )}
            {equipped.hair === 'hair_emerald_mohawk' && (
              <>
                {/* Emerald Mohawk */}
                <polygon points="56,15 54,4 58,10 60,3 62,10 64,4 66,15" fill="#10b981" stroke="#111827" strokeWidth="1" />
                <path d="M 52 14 L 68 14 L 66 18 L 54 18 Z" fill="#10b981" />
              </>
            )}
            {equipped.hair === 'hair_crimson_rocker' && (
              <>
                {/* Crimson Rocker Hair */}
                <path d="M 45 16 C 40 28, 42 38, 47 38 L 50 36 L 49 16 Z" fill="#dc2626" stroke="#111827" strokeWidth="1" />
                <path d="M 75 16 C 80 28, 78 38, 73 38 L 70 36 L 71 16 Z" fill="#dc2626" stroke="#111827" strokeWidth="1" />
                <polygon points="46,16 52,6 58,12 60,4 64,12 68,6 74,16" fill="#dc2626" stroke="#111827" strokeWidth="1" />
                <path d="M 48 15 L 72 15 L 72 19 L 48 19 Z" fill="#dc2626" />
              </>
            )}
            {equipped.hair === 'hair_golden_locks' && (
              <>
                {/* Golden locks side hair */}
                <path d="M 45 16 C 40 28, 41 42, 47 44 L 50 42 L 49 16 Z" fill="#fbbf24" stroke="#111827" strokeWidth="1" />
                <path d="M 75 16 C 80 28, 79 42, 73 44 L 70 42 L 71 16 Z" fill="#fbbf24" stroke="#111827" strokeWidth="1" />
                {/* Crown dome */}
                <path d="M 46 16 Q 60 7 74 16" fill="none" stroke="#111827" strokeWidth="1.5" />
                <path d="M 48 15 Q 60 11 72 15 L 72 18 L 48 18 Z" fill="#fbbf24" />
              </>
            )}
            {equipped.hair === 'hair_neon_pink_spikes' && (
              <>
                {/* Pink spiky spikes */}
                <polygon points="45,16 43,8 49,13 52,4 57,12 62,3 67,11 71,5 75,16" fill="#db2777" stroke="#111827" strokeWidth="1" />
                <path d="M 48 15 L 72 15 L 72 19 L 48 19 Z" fill="#db2777" />
              </>
            )}
            {equipped.hair === 'hair_silver_surfer' && (
              <>
                {/* Silver surfer flow back */}
                <path d="M 45 16 C 43 23, 44 28, 41 33 L 49 16 Z" fill="#9ca3af" stroke="#111827" strokeWidth="1" />
                <path d="M 74 16 C 77 23, 76 28, 79 33 L 71 16 Z" fill="#9ca3af" stroke="#111827" strokeWidth="1" />
                {/* Sleek top cap */}
                <path d="M 46 16 Q 60 7 74 16 C 74 16, 73 13, 71 13 L 49 13 Q 47 13 46 16" fill="#9ca3af" stroke="#111827" strokeWidth="1" />
                {/* Front hair line */}
                <path d="M 48 15 L 72 15 L 72 19 L 48 19 Z" fill="#9ca3af" />
              </>
            )}
            {equipped.hair === 'hair_purple_shag' && (
              <>
                {/* Purple shag side blocks */}
                <path d="M 45 16 C 42 26, 43 34, 46 36 L 49 36 L 49 16 Z" fill="#7c3aed" stroke="#111827" strokeWidth="1" />
                <path d="M 75 16 C 78 26, 77 34, 74 36 L 71 36 L 71 16 Z" fill="#7c3aed" stroke="#111827" strokeWidth="1" />
                {/* Top cap */}
                <polygon points="46,16 50,11 55,14 60,10 65,14 70,11 74,16" fill="#7c3aed" stroke="#111827" strokeWidth="1" />
                <path d="M 48 15 L 72 15 L 72 19 L 48 19 Z" fill="#7c3aed" />
              </>
            )}
          </g>
        )}

        {accessoryItem?.accessoryType === 'hat' && (
          <g id="accessory_hat">
            {equipped.accessory === 'acc_red_cap' && (
              <>
                {/* Red cap dome */}
                <path d="M 46 16 Q 60 4 74 16 Z" fill="#dc2626" stroke="#111827" strokeWidth="1" />
                {/* Cap Visor */}
                <path d="M 44 16 L 36 18 L 38 20 L 48 17 Z" fill="#ef4444" stroke="#111827" strokeWidth="1" />
                {/* Classic white Roblox text or circle */}
                <circle cx="60" cy="11" r="2.5" fill="#ffffff" />
                <text x="59" y="12" fontSize="3.5" fontWeight="bold" fill="#dc2626" textAnchor="middle">R</text>
              </>
            )}
            {equipped.accessory === 'acc_fedora' && (
              <>
                {/* Fedora Brim */}
                <ellipse cx="60" cy="16" rx="18" ry="3" fill="#1f2937" stroke="#111827" strokeWidth="1" />
                {/* Fedora Crown */}
                <path d="M 49 15 L 51 6 Q 60 5 69 6 L 71 15 Z" fill="#1f2937" stroke="#111827" strokeWidth="1" />
                {/* Red Ribbon */}
                <rect x="50" y="12" width="20" height="3" fill="#ef4444" />
              </>
            )}
            {equipped.accessory === 'acc_tophat' && (
              <>
                {/* Top hat Brim */}
                <ellipse cx="60" cy="16" rx="17" ry="2.5" fill="#111827" stroke="#111827" strokeWidth="1" />
                {/* Top hat tall crown */}
                <rect x="49" y="-2" width="22" height="17" fill="#111827" stroke="#111827" strokeWidth="1" />
                {/* Gold Band */}
                <rect x="49" y="11" width="22" height="4" fill="#eab308" />
              </>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
