import React, { useState, useEffect, useRef } from 'react';
import { getFoodPhotoUrls } from '../services/geminiService.js';
import { IconUtensils } from './Icons.jsx';

const CATEGORY_STYLES = {
  biryani:   { bg: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)', label: 'Biryani & Rice' },
  rice:      { bg: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)', label: 'Rice Dish' },
  curry:     { bg: 'linear-gradient(135deg, #B91C1C 0%, #7F1D1D 100%)', label: 'Curry & Gravy' },
  dal:       { bg: 'linear-gradient(135deg, #C2410C 0%, #7C2D12 100%)', label: 'Comfort Dal' },
  paneer:    { bg: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)', label: 'Paneer Specialty' },
  breakfast: { bg: 'linear-gradient(135deg, #BE123C 0%, #881337 100%)', label: 'Breakfast' },
  poha:      { bg: 'linear-gradient(135deg, #A16207 0%, #713F12 100%)', label: 'Poha & Grains' },
  paratha:   { bg: 'linear-gradient(135deg, #92400E 0%, #713F12 100%)', label: 'Roti & Paratha' },
  dosa:      { bg: 'linear-gradient(135deg, #C2410C 0%, #7C2D12 100%)', label: 'Dosa & Crepe' },
  sandwich:  { bg: 'linear-gradient(135deg, #4338CA 0%, #312E81 100%)', label: 'Toast & Wrap' },
  salad:     { bg: 'linear-gradient(135deg, #047857 0%, #064E3B 100%)', label: 'Fresh Salad' },
  soup:      { bg: 'linear-gradient(135deg, #C2410C 0%, #7C2D12 100%)', label: 'Warm Soup' },
  pasta:     { bg: 'linear-gradient(135deg, #BE185D 0%, #831843 100%)', label: 'Pasta & Noodles' },
  egg:       { bg: 'linear-gradient(135deg, #B45309 0%, #78350F 100%)', label: 'Egg Dish' },
  chicken:   { bg: 'linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%)', label: 'Savory Main' },
  dessert:   { bg: 'linear-gradient(135deg, #9D174D 0%, #70072E 100%)', label: 'Sweet Treat' },
  beverage:  { bg: 'linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%)', label: 'Chai & Drink' },
  default:   { bg: 'linear-gradient(135deg, #475569 0%, #1E293B 100%)', label: 'Chef Specialty' }
};

export function getCategoryInfo(title = '', query = '') {
  const t = `${title} ${query}`.toLowerCase();
  if (t.includes('biryani') || t.includes('pulao')) return CATEGORY_STYLES.biryani;
  if (t.includes('paneer') || t.includes('tikka')) return CATEGORY_STYLES.paneer;
  if (t.includes('dal') || t.includes('khichdi') || t.includes('chana') || t.includes('rajma')) return CATEGORY_STYLES.dal;
  if (t.includes('curry') || t.includes('masala') || t.includes('gravy')) return CATEGORY_STYLES.curry;
  if (t.includes('poha') || t.includes('upma') || t.includes('oats') || t.includes('cheela')) return CATEGORY_STYLES.poha;
  if (t.includes('paratha') || t.includes('roti') || t.includes('naan') || t.includes('thepla')) return CATEGORY_STYLES.paratha;
  if (t.includes('dosa') || t.includes('idli')) return CATEGORY_STYLES.dosa;
  if (t.includes('sandwich') || t.includes('toast') || t.includes('wrap') || t.includes('burger')) return CATEGORY_STYLES.sandwich;
  if (t.includes('salad') || t.includes('sprout')) return CATEGORY_STYLES.salad;
  if (t.includes('soup') || t.includes('shorba')) return CATEGORY_STYLES.soup;
  if (t.includes('pasta') || t.includes('noodle')) return CATEGORY_STYLES.pasta;
  if (t.includes('egg') || t.includes('bhurji') || t.includes('omelette')) return CATEGORY_STYLES.egg;
  if (t.includes('chicken') || t.includes('mutton') || t.includes('fish')) return CATEGORY_STYLES.chicken;
  if (t.includes('halwa') || t.includes('kheer') || t.includes('sweet') || t.includes('dessert')) return CATEGORY_STYLES.dessert;
  if (t.includes('chai') || t.includes('tea') || t.includes('coffee') || t.includes('smoothie') || t.includes('shake')) return CATEGORY_STYLES.beverage;
  if (t.includes('rice') || t.includes('jeera')) return CATEGORY_STYLES.rice;
  return CATEGORY_STYLES.default;
}

export default function FoodImage({
  src,
  backupSrc,
  alt = 'Culinary dish',
  title = '',
  query = '',
  height = '100%',
  style = {},
  className = ''
}) {
  const cat = getCategoryInfo(title, query);
  const photoUrls = getFoodPhotoUrls(title, query);

  const initialSrc = src || photoUrls.primary;
  const secondarySrc = backupSrc || photoUrls.backup;

  const [activeSrc, setActiveSrc] = useState(initialSrc);
  const [triedBackup, setTriedBackup] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [hasFailedAll, setHasFailedAll] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const freshInitial = src || photoUrls.primary;
    setActiveSrc(freshInitial);
    setTriedBackup(false);
    setHasFailedAll(false);
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src, title, query]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  });

  const handleLoad = () => {
    setLoaded(true);
  };

  const handleError = () => {
    if (!triedBackup && secondarySrc && secondarySrc !== activeSrc) {
      setTriedBackup(true);
      setActiveSrc(secondarySrc);
      setLoaded(false);
    } else {
      setHasFailedAll(true);
    }
  };

  // If both primary and backup failed, display the minimalist architectural culinary card
  if (hasFailedAll || !activeSrc) {
    return (
      <div
        style={{
          width: '100%',
          height: height,
          background: cat.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '16px',
          ...style
        }}
        className={className}
      >
        <div style={{
          position: 'absolute',
          top: '-20px',
          right: '-20px',
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-20px',
          width: '140px',
          height: '140px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)'
        }} />

        <div style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '10px',
          color: 'white'
        }}>
          <IconUtensils size={26} color="white" />
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '999px',
          padding: '4px 14px',
          color: 'white',
          fontSize: '0.74rem',
          fontWeight: '700',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          zIndex: 1
        }}>
          {cat.label}
        </div>
      </div>
    );
  }

  const isVisible = loaded || (imgRef.current?.complete && imgRef.current?.naturalWidth > 0);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: height,
        overflow: 'hidden',
        background: cat.bg,
        ...style
      }}
      className={className}
    >
      {/* Ambient background plate while photo is streaming */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: cat.bg,
        opacity: isVisible ? 0 : 1,
        transition: 'opacity 0.3s ease'
      }}>
        <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
          <IconUtensils size={24} color="rgba(255,255,255,0.7)" />
        </div>
        <span style={{
          color: 'rgba(255,255,255,0.9)',
          fontSize: '0.68rem',
          fontWeight: '700',
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          background: 'rgba(0,0,0,0.2)',
          padding: '2px 8px',
          borderRadius: '999px'
        }}>
          {cat.label}
        </span>
      </div>

      <img
        ref={imgRef}
        src={activeSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          display: 'block',
          position: 'relative',
          zIndex: 2
        }}
      />
    </div>
  );
}
