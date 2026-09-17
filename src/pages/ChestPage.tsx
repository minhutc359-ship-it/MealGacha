import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { MealSlot, RewardInstance, MEAL_SLOT_LABELS, MEAL_SLOT_ICONS } from '../domain/models';
import { canCheckIn } from '../domain/checkIn';
import { getCurrentHour, getDateKey } from '../domain/dateKey';
import { RevealModal } from '../components/chest/RevealModal';

type ChestState = 'idle' | 'inserting' | 'charging' | 'shaking' | 'burst' | 'revealed';

function defaultSlot(): MealSlot {
  const h = getCurrentHour();
  if (h >= 5 && h < 11) return 'breakfast';
  if (h >= 11 && h < 16) return 'lunch';
  return 'dinner';
}

const SLOT_COLORS: Record<MealSlot, { border: string; bg: string; glow: string; text: string; grad: string }> = {
  breakfast: { border: '#f5a623', bg: 'rgba(245,166,35,0.12)', glow: 'rgba(245,166,35,0.45)', text: '#f5a623', grad: 'linear-gradient(135deg,#f5a623,#e8920a)' },
  lunch:     { border: '#00d4ff', bg: 'rgba(0,212,255,0.12)',  glow: 'rgba(0,212,255,0.45)',  text: '#00d4ff', grad: 'linear-gradient(135deg,#00d4ff,#0088cc)' },
  dinner:    { border: '#a855f7', bg: 'rgba(168,85,247,0.12)', glow: 'rgba(168,85,247,0.45)', text: '#a855f7', grad: 'linear-gradient(135deg,#a855f7,#7c3aed)' },
};

function makeDelay(ms: number, cancelRef: React.MutableRefObject<boolean>) {
  return new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, ms);
    const poll = setInterval(() => {
      if (cancelRef.current) { clearTimeout(timer); clearInterval(poll); resolve(); }
    }, 50);
    // also clear poll when timer fires
    setTimeout(() => clearInterval(poll), ms + 10);
  });
}

// Static particles generated once
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 2,
  dur: 4 + Math.random() * 6,
  del: Math.random() * 6,
  op: 0.2 + Math.random() * 0.5,
}));

export function ChestPage() {
  const user = useAppStore((s) => s.user);
  const checkIn = useAppStore((s) => s.checkIn);
  const openChest = useAppStore((s) => s.openChest);
  const showToast = useAppStore((s) => s.showToast);
  const navigate = useNavigate();

  const [slot, setSlot] = useState<MealSlot>(defaultSlot);
  const [chestState, setChestState] = useState<ChestState>('idle');
  const [reward, setReward] = useState<RewardInstance | null>(null);
  const [showReveal, setShowReveal] = useState(false);
  const [skipAnim, setSkipAnim] = useState(false);
  const processingRef = useRef(false);
  const skipRef = useRef(false); // cancels delays mid-animation

  const canOpen = user.keys >= 1 && chestState === 'idle';
  const isCheckedIn = !canCheckIn(user);
  const colors = SLOT_COLORS[slot];

  // Compute today's reward count for progress display
  const todayDate = getDateKey();
  const todayCount = user.rewards.filter((r) => r.acquiredDate === todayDate).length;

  const runAnimation = useCallback(async (): Promise<void> => {
    skipRef.current = false;
    setChestState('inserting');
    await makeDelay(350, skipRef);
    setChestState('charging');
    await makeDelay(700, skipRef);
    setChestState('shaking');
    await makeDelay(650, skipRef);
    setChestState('burst');
    await makeDelay(450, skipRef);
    setChestState('revealed');
  }, []);

  const triggerOpen = useCallback(async () => {
    if (processingRef.current || chestState !== 'idle') return;
    processingRef.current = true;

    const result = openChest(slot);
    if (result.error) {
      showToast(result.error, 'error');
      processingRef.current = false;
      return;
    }
    const r = result.reward!;

    if (!skipAnim) await runAnimation();

    setReward(r);
    setShowReveal(true);
    processingRef.current = false;
  }, [chestState, slot, openChest, showToast, skipAnim, runAnimation]);

  const handleRevealClose = () => {
    setShowReveal(false);
    setReward(null);
    setChestState('idle');
  };

  const handleOpenAgain = () => {
    handleRevealClose();
    // Auto-trigger next open after modal closes
    setTimeout(() => triggerOpen(), 80);
  };

  return (
    <div className="relative min-h-dvh pb-20 flex flex-col max-w-md mx-auto px-4 pt-4 overflow-hidden">
      {/* Ambient particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              left: `${p.x}%`, top: `${p.y}%`,
              width: p.size, height: p.size,
              background: colors.border,
              opacity: p.op,
              animation: `float-particle ${p.dur}s ease-in-out ${p.del}s infinite alternate`,
              '--dx': `${(Math.random() - 0.5) * 30}px`,
            } as React.CSSProperties}
          />
        ))}
        {/* Radial gradient backdrop */}
        <div className="absolute inset-0 transition-all duration-1000"
          style={{ background: `radial-gradient(ellipse 60% 50% at 50% 100%, ${colors.glow.replace('0.45', '0.06')} 0%, transparent 70%)` }} />
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-wide" style={{ fontFamily: 'Exo 2, sans-serif', color: '#e8edf5' }}>
            RƯƠNG VỊ GIÁC
          </h1>
          <p className="text-xs" style={{ color: '#6b7f99' }}>Mở rương, chốt món.</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
            style={{ borderColor: 'rgba(245,166,35,0.3)', background: 'rgba(245,166,35,0.08)' }}>
            <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" style={{ color: '#f5a623' }}>
              <circle cx="7" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L18 18M14 14.5l2-2M16 16.5l2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-base font-bold" style={{ color: '#f5a623', fontFamily: 'Exo 2, sans-serif' }}>{user.keys}</span>
            <span className="text-xs text-[#6b7f99]">chìa</span>
          </div>
          {todayCount > 0 && (
            <p className="text-xs" style={{ color: '#6b7f99' }}>Hôm nay: {todayCount} phần thưởng</p>
          )}
        </div>
      </div>

      {/* Check-in card */}
      <button
        onClick={() => { if (!isCheckedIn) checkIn(); }}
        disabled={isCheckedIn}
        className="relative z-10 w-full flex items-center gap-3 px-4 py-3 rounded-2xl border mb-4 transition-all"
        style={{
          borderColor: isCheckedIn ? 'rgba(107,127,153,0.15)' : 'rgba(245,166,35,0.4)',
          background: isCheckedIn ? 'rgba(14,22,40,0.5)' : 'rgba(245,166,35,0.07)',
          boxShadow: isCheckedIn ? 'none' : '0 0 20px rgba(245,166,35,0.1)',
          cursor: isCheckedIn ? 'default' : 'pointer',
        }}
      >
        <span className={`text-2xl ${!isCheckedIn ? 'animate-key-bounce' : 'grayscale opacity-50'}`}>🔑</span>
        <div className="flex-1 text-left">
          <p className="text-sm font-semibold" style={{ color: isCheckedIn ? '#6b7f99' : '#f5a623' }}>
            {isCheckedIn ? 'Đã điểm danh hôm nay' : 'Điểm danh · nhận 10 chìa khóa'}
          </p>
          <p className="text-xs" style={{ color: '#6b7f99' }}>{isCheckedIn ? 'Quay lại ngày mai!' : 'Mỗi ngày một lần'}</p>
        </div>
        {isCheckedIn
          ? <span className="text-green-400 text-xl leading-none">✓</span>
          : <span className="text-sm font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(245,166,35,0.2)', color: '#f5a623' }}>+10</span>
        }
      </button>

      {/* Banner tabs */}
      <div className="relative z-10 grid grid-cols-3 gap-2 mb-5">
        {(['breakfast', 'lunch', 'dinner'] as MealSlot[]).map((s) => {
          const active = slot === s;
          const c = SLOT_COLORS[s];
          return (
            <button
              key={s}
              onClick={() => setSlot(s)}
              className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all"
              style={{
                borderColor: active ? c.border : 'rgba(107,127,153,0.12)',
                background: active ? c.bg : 'rgba(14,22,40,0.5)',
                boxShadow: active ? `0 0 20px ${c.glow}, inset 0 0 12px ${c.bg}` : 'none',
                transform: active ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              <span className="text-2xl">{MEAL_SLOT_ICONS[s]}</span>
              <span className="text-xs font-semibold" style={{ color: active ? c.text : '#6b7f99' }}>
                {MEAL_SLOT_LABELS[s]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chest stage */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center gap-5">
        <ChestVisual state={chestState} colors={colors} />

        {/* Skip button: visible during animation or as checkbox when idle */}
        {chestState !== 'idle' && chestState !== 'revealed' ? (
          <button
            onClick={() => { skipRef.current = true; }}
            className="text-xs px-3 py-1.5 rounded-full border transition-all"
            style={{ borderColor: 'rgba(107,127,153,0.25)', color: '#6b7f99', background: 'rgba(14,22,40,0.6)' }}
          >
            ⏩ Bỏ qua animation
          </button>
        ) : (
          <label className="flex items-center gap-2 text-xs cursor-pointer select-none" style={{ color: '#6b7f99' }}>
            <input type="checkbox" checked={skipAnim} onChange={(e) => setSkipAnim(e.target.checked)}
              className="accent-[#00d4ff] w-3.5 h-3.5 cursor-pointer" />
            Bỏ qua animation
          </label>
        )}

        <button
          onClick={triggerOpen}
          disabled={!canOpen}
          className="relative z-10 w-full py-4 rounded-2xl font-extrabold text-xl tracking-wide transition-all overflow-hidden"
          style={{
            fontFamily: 'Exo 2, sans-serif',
            background: canOpen ? colors.grad : 'rgba(107,127,153,0.12)',
            color: canOpen ? '#080c18' : '#6b7f99',
            boxShadow: canOpen ? `0 6px 28px ${colors.glow}` : 'none',
            cursor: canOpen ? 'pointer' : 'not-allowed',
          }}
        >
          {chestState !== 'idle' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              {chestState === 'inserting' ? 'Đưa chìa...' : chestState === 'charging' ? 'Tích năng lượng...' : chestState === 'shaking' ? 'Rương rung...' : 'Bùng sáng!'}
            </span>
          ) : (
            <span>Mở rương · 1 🔑</span>
          )}
        </button>

        {user.keys === 0 && chestState === 'idle' && (
          <p className="text-sm text-center" style={{ color: '#f5a623' }}>
            Hết chìa! Điểm danh hôm nay hoặc chờ ngày mai.
          </p>
        )}
      </div>

      {showReveal && reward && (
        <RevealModal
          reward={reward}
          canOpenAgain={user.keys >= 1}
          onClose={handleRevealClose}
          onOpenAgain={handleOpenAgain}
          onGoCollection={() => { handleRevealClose(); navigate('/collection'); }}
        />
      )}
    </div>
  );
}

/* ─── Chest visual ─────────────────────────────────────────────────── */
function ChestVisual({ state, colors }: { state: ChestState; colors: typeof SLOT_COLORS[MealSlot] }) {
  const isActive = state !== 'idle';
  const isShaking = state === 'shaking';
  const isCharging = state === 'charging' || isShaking;
  const isBurst = state === 'burst';

  return (
    <div className="relative flex items-center justify-center" style={{ width: 220, height: 220 }}>
      {/* Outer glow rings */}
      <div className="absolute inset-0 rounded-full transition-all duration-700"
        style={{ background: `radial-gradient(circle, ${colors.glow} 0%, transparent 65%)`, opacity: isCharging ? 0.7 : 0.25 }} />
      {isCharging && (
        <div className="absolute inset-4 rounded-full animate-chest-glow"
          style={{ border: `2px solid ${colors.border}`, opacity: 0.4 }} />
      )}

      {/* Burst particles */}
      {isBurst && Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        return (
          <div key={i} className="absolute rounded-full"
            style={{
              width: 6, height: 6,
              background: colors.border,
              top: '50%', left: '50%',
              '--dx': `${Math.cos(angle) * 70}px`,
              animation: 'float-particle 0.6s ease-out forwards',
              animationDelay: `${i * 0.03}s`,
              transform: 'translate(-50%,-50%)',
              boxShadow: `0 0 6px ${colors.border}`,
            } as React.CSSProperties} />
        );
      })}

      {/* Chest box */}
      <div
        className={`relative z-10 flex items-center justify-center rounded-3xl transition-all ${isShaking ? 'animate-chest-shake' : ''} ${isBurst ? 'animate-burst-out' : ''}`}
        style={{
          width: 160, height: 160,
          background: `linear-gradient(145deg, ${colors.bg}, rgba(8,12,24,0.95))`,
          border: `2px solid ${colors.border}`,
          boxShadow: isActive
            ? `0 0 40px ${colors.glow}, 0 0 80px ${colors.glow.replace('0.45', '0.2')}, inset 0 0 24px ${colors.bg}`
            : `0 0 12px ${colors.glow.replace('0.45', '0.2')}`,
        }}
      >
        <ChestSVG isCharging={isCharging} color={colors.border} />
      </div>
    </div>
  );
}

function ChestSVG({ isCharging, color }: { isCharging: boolean; color: string }) {
  return (
    <svg viewBox="0 0 90 90" fill="none" className="w-24 h-24">
      {/* Shadow */}
      <ellipse cx="45" cy="84" rx="28" ry="5" fill="rgba(0,0,0,0.3)" />
      {/* Chest body */}
      <rect x="10" y="40" width="70" height="38" rx="7" fill={color} fillOpacity="0.1" stroke={color} strokeWidth="2.5" />
      {/* Chest lid */}
      <path d="M10 40 Q10 20 45 20 Q80 20 80 40Z"
        fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2.5"
        style={{ transform: isCharging ? 'rotate(-10deg) translateY(-4px)' : 'none', transformOrigin: '45px 40px', transition: 'transform 0.4s ease' }} />
      {/* Horizontal band */}
      <rect x="10" y="37" width="70" height="8" rx="3" fill={color} fillOpacity="0.25" stroke={color} strokeWidth="1.5" />
      {/* Lock body */}
      <rect x="36" y="51" width="18" height="13" rx="3" fill={color} fillOpacity="0.5" stroke={color} strokeWidth="1.5" />
      {/* Lock shackle */}
      <path d="M39 51v-4a6 6 0 0112 0v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      {/* Lock keyhole */}
      <circle cx="45" cy="57" r="2.5" fill="rgba(8,12,24,0.7)" />
      <path d="M45 59v3" stroke="rgba(8,12,24,0.7)" strokeWidth="2" strokeLinecap="round" />
      {/* Fork icon (left) */}
      <path d="M25 30v-9M25 21c-2.5 0-4 1.5-4 3.5S22.5 28 25 28" stroke={color} strokeWidth="1.5" strokeLinecap="round" fillOpacity="0.6" />
      <path d="M25 28v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Knife icon (right) */}
      <path d="M65 21v9M65 21c-1.5 0-5 2-5 4.5v3.5M65 28.5v1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      {/* Energy sparks when charging */}
      {isCharging && (
        <>
          <line x1="14" y1="62" x2="26" y2="62" stroke={color} strokeWidth="2" strokeLinecap="round" className="animate-pulse-glow" />
          <line x1="64" y1="62" x2="76" y2="62" stroke={color} strokeWidth="2" strokeLinecap="round" className="animate-pulse-glow" />
          <line x1="45" y1="72" x2="45" y2="78" stroke={color} strokeWidth="2" strokeLinecap="round" className="animate-pulse-glow" />
          <circle cx="18" cy="48" r="2" fill={color} className="animate-pulse-glow" />
          <circle cx="72" cy="48" r="2" fill={color} className="animate-pulse-glow" />
        </>
      )}
    </svg>
  );
}
