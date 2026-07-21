import React, { useState } from 'react';
import { CatalogItem } from '../types';
import { Palette, Tag, ShieldCheck } from 'lucide-react';

interface ClothingCreatorProps {
  onPublishClothing: (newItem: CatalogItem) => void;
  creatorId: string;
  creatorName: string;
}

const PALETTE_COLORS = [
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#10b981', // Green
  '#f59e0b', // Yellow/Orange
  '#111827', // Black
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ffffff', // White
  '#0f766e', // Teal
  '#78350f', // Brown
];

const DECAL_PRESETS = [
  { name: 'None (Clean Fabric)', url: '' },
  { name: '🔥 Fire Flame', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50,10 C65,35 80,50 80,70 C80,85 65,95 50,95 C35,95 20,85 20,70 C20,50 35,35 50,10 Z" fill="%23f97316"/><path d="M50,35 C58,50 68,60 68,75 C68,85 58,90 50,90 C42,90 32,85 32,75 C32,60 42,50 50,35 Z" fill="%23eab308"/></svg>' },
  { name: '👑 Gold Badge', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,15 63,38 90,38 68,54 77,80 50,64 23,80 32,54 10,38 37,38" fill="%23eab308" stroke="black" stroke-width="3"/></svg>' },
  { name: '🧱 Classic R', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23dc2626"/><rect x="25" y="25" width="50" height="50" fill="white"/><rect x="40" y="40" width="20" height="20" fill="%23dc2626" transform="rotate(15 50 50)"/></svg>' },
  { name: '🙂 Awesome Face', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="45" fill="%23facc15" stroke="black" stroke-width="3"/><circle cx="35" cy="35" r="5" fill="black"/><circle cx="65" cy="35" r="5" fill="black"/><path d="M 30 55 Q 50 75 70 55 Z" fill="%23dc2626" stroke="black" stroke-width="3"/></svg>' },
  { name: '👕 Guest 07', url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%233b82f6"/><text x="50" y="65" font-size="45" font-family="sans-serif" font-weight="black" fill="white" text-anchor="middle">07</text></svg>' },
];

export const ClothingCreator: React.FC<ClothingCreatorProps> = ({
  onPublishClothing,
  creatorId,
  creatorName,
}) => {
  const [clothingType, setClothingType] = useState<'shirt' | 'pants'>('shirt');
  const [clothingName, setClothingName] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#3b82f6');
  const [selectedDesign, setSelectedDesign] = useState<'stripes' | 'jacket' | 'tux' | 'wrench' | 'custom'>('stripes');
  const [customImageUrl, setCustomImageUrl] = useState<string>('');
  const [priceRobux, setPriceRobux] = useState<number>(10);
  const [priceTix, setPriceTix] = useState<number>(50);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clothingName.trim()) {
      alert('Please name your vintage creation!');
      return;
    }

    const newItem: CatalogItem = {
      id: `clothing_${clothingType}_${Date.now()}`,
      name: clothingName,
      creatorId,
      creatorName,
      type: clothingType,
      priceRobux: Math.max(0, priceRobux),
      priceTickets: Math.max(0, priceTix),
      assetColor: selectedColor,
      assetDesign: selectedDesign === 'custom' ? 'custom' : selectedDesign,
      assetImageUrl: (selectedDesign === 'custom' || customImageUrl) ? customImageUrl : undefined,
      isUserCreated: true,
    };

    onPublishClothing(newItem);
    setClothingName('');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  return (
    <div className="bg-[#fcf8f2] border-4 border-slate-700 p-6 rounded-lg max-w-xl mx-auto shadow-lg">
      
      {/* Title */}
      <div className="bg-[#0f766e] text-white px-4 py-3 rounded mb-6 flex justify-between items-center border-b-4 border-teal-900">
        <div>
          <h2 className="text-lg font-bold font-serif">Roblox clothing creation workshop</h2>
          <p className="text-xs text-teal-100">Design classic solid or patterned shirts and pants!</p>
        </div>
        <Palette size={20} className="text-teal-200" />
      </div>

      <form onSubmit={handleCreate} className="space-y-4 text-slate-800">
        
        {/* Type selector */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Type of Clothing:</label>
          <div className="flex gap-2">
            <button
              id="create_shirt_btn"
              type="button"
              onClick={() => setClothingType('shirt')}
              className={`flex-1 py-2 font-bold rounded border text-sm transition ${clothingType === 'shirt' ? 'bg-[#0f766e] text-white border-teal-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            >
              👕 Classic Shirt
            </button>
            <button
              id="create_pants_btn"
              type="button"
              onClick={() => setClothingType('pants')}
              className={`flex-1 py-2 font-bold rounded border text-sm transition ${clothingType === 'pants' ? 'bg-[#0f766e] text-white border-teal-800' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'}`}
            >
              👖 Classic Pants
            </button>
          </div>
        </div>

        {/* Clothing Name */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">Creation Title:</label>
          <div className="relative">
            <input
              id="clothing_title_input"
              type="text"
              placeholder={clothingType === 'shirt' ? "e.g. Red Striped Tee, Cool Tux" : "e.g. Classic Slacks, Board Shorts"}
              value={clothingName}
              onChange={(e) => setClothingName(e.target.value)}
              className="w-full bg-white border border-slate-400 rounded py-1.5 px-3 text-xs pr-8"
              maxLength={26}
            />
            <Tag size={14} className="absolute right-2.5 top-2.5 text-slate-400" />
          </div>
        </div>

        {/* Pick Color Palette */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 block">Pick Base Fabric Color:</label>
          <div className="grid grid-cols-5 gap-2">
            {PALETTE_COLORS.map((color) => (
              <button
                id={`fab_color_${color.replace('#', '')}_btn`}
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`h-8 rounded border-2 transition ${selectedColor === color ? 'border-teal-600 scale-105 shadow' : 'border-slate-300 hover:border-slate-500'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Design Pattern Selection */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">Pick Fabric Overlay / Pattern:</label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              id="pattern_stripes_btn"
              type="button"
              onClick={() => setSelectedDesign('stripes')}
              className={`py-1.5 px-2 rounded border transition text-left ${selectedDesign === 'stripes' ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold' : 'bg-white border-slate-300'}`}
            >
              🏁 Retro Stripes
            </button>
            <button
              id="pattern_jacket_btn"
              type="button"
              onClick={() => setSelectedDesign('jacket')}
              className={`py-1.5 px-2 rounded border transition text-left ${selectedDesign === 'jacket' ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold' : 'bg-white border-slate-300'}`}
            >
              🧥 Vintage Zipper Jacket
            </button>
            <button
              id="pattern_tux_btn"
              type="button"
              onClick={() => setSelectedDesign('tux')}
              className={`py-1.5 px-2 rounded border transition text-left ${selectedDesign === 'tux' ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold' : 'bg-white border-slate-300'}`}
            >
              🤵 Elegance Tuxedo
            </button>
            <button
              id="pattern_wrench_btn"
              type="button"
              onClick={() => setSelectedDesign('wrench')}
              className={`py-1.5 px-2 rounded border transition text-left ${selectedDesign === 'wrench' ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold' : 'bg-white border-slate-300'}`}
            >
              🛠️ Builderman Wrench
            </button>
            <button
              id="pattern_custom_btn"
              type="button"
              onClick={() => {
                setSelectedDesign('custom');
                if (!customImageUrl) setCustomImageUrl(DECAL_PRESETS[1].url); // select Fire Flame by default
              }}
              className={`py-1.5 px-2 rounded border transition text-left col-span-2 ${selectedDesign === 'custom' ? 'bg-teal-50 border-teal-500 text-teal-800 font-bold' : 'bg-white border-slate-300'}`}
            >
              🖼️ Custom Image Decal
            </button>
          </div>
        </div>

        {/* Custom Decal Settings */}
        {selectedDesign === 'custom' && (
          <div className="bg-white p-3 rounded border border-slate-300 space-y-3 animate-fade-in text-xs">
            <span className="text-[11px] font-bold text-slate-700 block">🌟 Select a Classic 2007 Decal Template:</span>
            <div className="grid grid-cols-3 gap-1.5">
              {DECAL_PRESETS.map((p) => {
                const active = customImageUrl === p.url;
                return (
                  <button
                    id={`decal_preset_${p.name.replace(/[^a-zA-Z0-9]/g, '_')}`}
                    key={p.name}
                    type="button"
                    onClick={() => setCustomImageUrl(p.url)}
                    className={`py-1.5 px-2 rounded border text-[10px] font-bold text-center transition ${active ? 'bg-[#0f766e] text-white border-teal-800' : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'}`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
            
            <div className="space-y-1 pt-1">
              <label className="text-[10px] font-bold text-slate-600 block">Or Paste Any Custom Decal Image URL:</label>
              <input
                id="clothing_image_url_input"
                type="text"
                placeholder="https://example.com/logo.png"
                value={customImageUrl}
                onChange={(e) => setCustomImageUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-400 rounded py-1.5 px-2.5 text-xs font-semibold text-slate-800 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Pricing settings */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 block">Set Selling Price in Catalog:</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-amber-700 font-bold block mb-0.5">💰 Price Robux (R$)</span>
              <input
                id="cloth_price_robux"
                type="number"
                min="0"
                value={priceRobux}
                onChange={(e) => setPriceRobux(Math.max(0, Number(e.target.value)))}
                className="w-full bg-white border border-slate-400 rounded py-1 px-2.5 text-xs font-semibold text-amber-700"
              />
            </div>
            <div>
              <span className="text-[10px] text-amber-600 font-bold block mb-0.5">🎟️ Price Tickets (Tix)</span>
              <input
                id="cloth_price_tix"
                type="number"
                min="0"
                value={priceTix}
                onChange={(e) => setPriceTix(Math.max(0, Number(e.target.value)))}
                className="w-full bg-white border border-slate-400 rounded py-1 px-2.5 text-xs font-semibold text-amber-600"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          id="publish_clothing_btn"
          type="submit"
          className="w-full bg-[#0f766e] hover:bg-teal-600 text-white font-bold py-2 px-4 rounded text-xs transition flex items-center justify-center gap-1.5 shadow"
        >
          <ShieldCheck size={16} />
          <span>Publish Clothes to Catalog</span>
        </button>

        {showSuccess && (
          <div className="bg-teal-50 border border-teal-400 text-teal-800 text-xs px-3 py-2 rounded-md font-semibold text-center animate-pulse">
            🎉 Successfully uploaded "{clothingName}" to the Roblox Marketplace!
          </div>
        )}

      </form>
    </div>
  );
};
