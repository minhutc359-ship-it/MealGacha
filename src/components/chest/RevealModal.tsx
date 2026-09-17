import { useEffect, useRef, useState } from 'react';
import { RewardInstance, MEAL_SLOT_LABELS, MEAL_SLOT_ICONS } from '../../domain/models';
import { PlacesModal } from '../places/PlacesModal';

interface Props {
  reward: RewardInstance;
  canOpenAgain: boolean;
  onClose(): void;
  onOpenAgain(): void;
  onGoCollection(): void;
}

const CATEGORY_EMOJI: Record<string, string> = {
  noodle: '🍜', rice: '🍚', bread: '🥖', 'rice-roll': '🍱', porridge: '🥣', combo: '🍽️',
  'fast-food': '🍗', western: '🍝', japanese: '🍣', korean: '🌶️', hotpot: '🍲', grilled: '🔥',
  roast: '🦆', pancake: '🥞',
};

export function RevealModal({ reward, canOpenAgain, onClose, onOpenAgain, onGoCollection }: Props) {
  const [showPlaces, setShowPlaces] = useState(false);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    setTimeout(() => firstFocusRef.current?.focus(), 50);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const dish = reward.dish;
  const emoji = CATEGORY_EMOJI[dish.category || ''] ?? '🍴';

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
        style={{ background: 'rgba(8,12,24,0.88)', backdropFilter: 'blur(10px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        role="dialog" aria-modal="true" aria-label={`Phần thưởng: ${dish.name}`}
      >
        <div
          className="w-full max-w-sm rounded-3xl overflow-hidden animate-reveal-card"
          style={{
            background: 'linear-gradient(160deg, #0f1a2e 0%, #080c18 100%)',
            border: '1.5px solid rgba(0,212,255,0.3)',
            boxShadow: '0 0 80px rgba(0,212,255,0.12), 0 24px 64px rgba(0,0,0,0.6)',
          }}
        >
          {/* Art area */}
          <div className="relative h-52 flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(168,85,247,0.06) 100%)' }}>
            {/* Radial glow */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 60%, rgba(0,212,255,0.12) 0%, transparent 70%)' }} />
            {/* Emoji */}
            <span className="relative z-10 select-none" style={{ fontSize: 90, filter: 'drop-shadow(0 0 24px rgba(0,212,255,0.5))' }}>{emoji}</span>
            {/* Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="text-xs px-2 py-1 rounded-full font-medium"
                style={{ background: 'rgba(0,212,255,0.15)', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)', backdropFilter: 'blur(4px)' }}>
                {MEAL_SLOT_ICONS[reward.mealSlot]} {MEAL_SLOT_LABELS[reward.mealSlot]}
              </span>
            </div>
            {reward.source === 'fusion' && (
              <div className="absolute top-3 right-3">
                <span className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)', backdropFilter: 'blur(4px)' }}>
                  ✨ Ghép món
                </span>
              </div>
            )}
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-12"
              style={{ background: 'linear-gradient(to top, #080c18, transparent)' }} />
          </div>

          {/* Info */}
          <div className="px-5 pb-5">
            <h2 className="text-2xl font-extrabold mb-0.5 mt-1" style={{ fontFamily: 'Exo 2, sans-serif', color: '#e8edf5' }}>{dish.name}</h2>
            {dish.category && (
              <p className="text-xs uppercase tracking-widest mb-4" style={{ color: '#6b7f99' }}>{dish.category}</p>
            )}

            {/* Actions */}
            <button
              ref={firstFocusRef}
              onClick={() => setShowPlaces(true)}
              className="w-full py-3 rounded-xl font-bold text-sm mb-3 transition-all"
              style={{ background: 'linear-gradient(135deg, #00d4ff, #0088cc)', color: '#080c18', boxShadow: '0 4px 16px rgba(0,212,255,0.3)' }}
            >
              📍 Tìm quán gần đây
            </button>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={onOpenAgain}
                disabled={!canOpenAgain}
                className="py-3 rounded-xl text-sm font-semibold border transition-all"
                style={canOpenAgain
                  ? { borderColor: 'rgba(245,166,35,0.35)', color: '#f5a623', background: 'rgba(245,166,35,0.07)' }
                  : { borderColor: 'rgba(107,127,153,0.15)', color: '#6b7f99', background: 'transparent', cursor: 'not-allowed' }
                }
              >
                🔑 Mở tiếp
              </button>
              <button
                onClick={onGoCollection}
                className="py-3 rounded-xl text-sm font-semibold border transition-all"
                style={{ borderColor: 'rgba(107,127,153,0.2)', color: '#a8b8d0', background: 'rgba(14,22,40,0.5)' }}
              >
                📦 Bộ sưu tập
              </button>
            </div>

            {!canOpenAgain && (
              <p className="text-center text-xs mt-2.5" style={{ color: '#6b7f99' }}>Hết chìa · Điểm danh ngày mai để nhận thêm</p>
            )}
          </div>
        </div>
      </div>

      {showPlaces && (
        <PlacesModal dish={dish} onClose={() => setShowPlaces(false)} />
      )}
    </>
  );
}
