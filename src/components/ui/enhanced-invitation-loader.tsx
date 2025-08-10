import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Heart, Sparkles, Cake, Building, Crown, Star, Gift, Diamond, Flower2 } from 'lucide-react';

interface EnhancedInvitationLoaderProps {
  guestName: string;
  eventName: string;
  onComplete?: () => void;
  isVisible: boolean;
  templateTheme?: any; // Full template theme_config from database
}

interface LoadingStage {
  id: string;
  message: string;
  duration: number;
  icon: React.ReactNode;
}

const getLoadingStages = (guestName: string, eventName: string, templateTheme?: any): LoadingStage[] => {
  // Use template theme configuration for loading messages
  const loadingMessages = templateTheme?.loadingMessages || {
    welcome: 'Welcome, {guestName}!',
    preparing: 'Preparing your invitation...',
    blessing: 'Blessing this celebration',
    celebration: 'A beautiful celebration awaits',
    final: 'Welcome to {eventName}'
  };

  return [
    {
      id: 'welcome',
      message: loadingMessages.welcome.replace('{guestName}', guestName),
      duration: 1200,
      icon: <Diamond className="w-8 h-8" />
    },
    {
      id: 'preparing',
      message: loadingMessages.preparing,
      duration: 1800,
      icon: <Crown className="w-8 h-8" />
    },
    {
      id: 'blessing',
      message: loadingMessages.blessing,
      duration: 1500,
      icon: <Sparkles className="w-8 h-8" />
    },
    {
      id: 'celebration',
      message: loadingMessages.celebration,
      duration: 1200,
      icon: <Heart className="w-8 h-8" />
    },
    {
      id: 'final',
      message: loadingMessages.final.replace('{eventName}', eventName),
      duration: 800,
      icon: <Flower2 className="w-8 h-8" />
    }
  ];
};

// Universal theme processor using database theme_config
const getDesignTheme = (templateTheme?: any) => {
  // Use templateTheme from database or fallback to defaults
  const theme = templateTheme || {
    background: 'linear-gradient(135deg, hsl(340, 60%, 90%) 0%, hsl(350, 40%, 85%) 50%, hsl(20, 50%, 88%) 100%)',
    particleColors: ['#FF69B4', '#D2691E', '#DAA520'],
    textColors: {
      primary: '#D2691E',
      secondary: '#FF69B4',
      accent: '#8B0000',
      blessing: '#DAA520'
    },
    overlayPattern: 'radial-gradient(circle at 50% 50%, hsla(350, 50%, 80%, 0.1) 0%, transparent 70%)',
    glowEffects: {
      iconGlow: '0 0 20px hsla(350, 60%, 70%, 0.3)',
      textGlow: '0 0 10px hsla(350, 60%, 70%, 0.2)',
      particleGlow: '0 0 8px hsla(350, 60%, 70%, 0.4)'
    }
  };

  return {
    backgroundStyle: {
      background: theme.background,
    },
    overlayPattern: {
      background: theme.overlayPattern,
    },
    textColors: theme.textColors,
    glowEffects: theme.glowEffects,
    particleColors: theme.particleColors
  };
};

export const EnhancedInvitationLoader = ({
  guestName,
  eventName,
  onComplete,
  isVisible,
  templateTheme
}: EnhancedInvitationLoaderProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; color: string }>>([]);

  // Use universal theme processing from database - memoize to prevent infinite re-renders
  const [stages] = useState(() => getLoadingStages(guestName, eventName, templateTheme));
  const [designTheme] = useState(() => getDesignTheme(templateTheme));
  const currentStage = stages[currentStageIndex];

  // Initialize sophisticated floating particles with multiple colors
  useEffect(() => {
    const particleArray = Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 4,
      color: designTheme.particleColors[Math.floor(Math.random() * designTheme.particleColors.length)]
    }));
    setParticles(particleArray);
  }, [designTheme.particleColors]);

  // Stage progression logic
  useEffect(() => {
    if (!isVisible || !currentStage) return;

    let progressInterval: NodeJS.Timeout;
    let stageTimeout: NodeJS.Timeout;

    // Smooth progress animation
    const updateProgress = () => {
      setProgress(prev => {
        const increment = 100 / (currentStage.duration / 30);
        return Math.min(prev + increment, 100);
      });
    };

    progressInterval = setInterval(updateProgress, 30);

    // Move to next stage
    stageTimeout = setTimeout(() => {
      if (currentStageIndex < stages.length - 1) {
        setCurrentStageIndex(prev => prev + 1);
        setProgress(0);
      } else {
        // All stages complete with graceful delay
        setTimeout(() => {
          onComplete?.();
        }, 500);
      }
    }, currentStage.duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stageTimeout);
    };
  }, [currentStageIndex, isVisible, currentStage?.duration, stages.length]);

  if (!isVisible || !currentStage) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={designTheme.backgroundStyle}
    >
      {/* Overlay Pattern for Rich Visual Texture */}
      <div 
        className="absolute inset-0"
        style={designTheme.overlayPattern}
      />

      {/* Sophisticated Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full opacity-40 animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              backgroundColor: particle.color,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${5 + Math.random() * 3}s`,
              boxShadow: designTheme.glowEffects.particleGlow,
              transform: `rotate(${Math.random() * 360}deg)`
            }}
          />
        ))}
      </div>

      {/* Elegant Main Content Container */}
      <div className="relative text-center px-12 max-w-lg mx-auto">
        {/* Magnificent Icon Container with Glow */}
        <div 
          className="mx-auto mb-12 w-28 h-28 rounded-full flex items-center justify-center relative backdrop-blur-md"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.1) 100%)',
            border: '2px solid rgba(255,255,255,0.3)',
            boxShadow: `
              ${designTheme.glowEffects.iconGlow},
              0 20px 40px rgba(0,0,0,0.15),
              inset 0 1px 0 rgba(255,255,255,0.5)
            `
          }}
        >
          <div 
            className="animate-bounce"
            style={{ 
              color: designTheme.textColors.primary,
              filter: `drop-shadow(${designTheme.glowEffects.textGlow})`
            }}
          >
            {currentStage.icon}
          </div>
          
          {/* Rotating Ring Effect */}
          <div 
            className="absolute inset-0 rounded-full animate-spin opacity-30"
            style={{
              background: `conic-gradient(from 0deg, transparent, ${designTheme.textColors.primary}, transparent)`,
              animationDuration: '4s'
            }}
          />
        </div>

        {/* Elegant Typography */}
        <div className="mb-12 space-y-4">
          <h2 
            className="text-3xl font-bold leading-tight tracking-wide"
            style={{ 
              color: designTheme.textColors.primary,
              textShadow: designTheme.glowEffects.textGlow,
              fontFamily: 'serif'
            }}
          >
            {currentStage.message}
          </h2>
          
          {/* Sophisticated Progress Bar */}
          <div className="w-full max-w-sm mx-auto mt-8">
            <div 
              className="w-full rounded-full h-2 overflow-hidden relative"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              <div 
                className="h-full rounded-full transition-all duration-200 ease-out relative"
                style={{ 
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${designTheme.textColors.primary} 0%, ${designTheme.textColors.secondary} 100%)`,
                  boxShadow: `0 0 15px ${designTheme.textColors.primary}40`
                }}
              >
                {/* Progress Shine Effect */}
                <div 
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                    animation: 'shimmer 2s infinite'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Elegant Stage Indicators */}
        <div className="flex justify-center space-x-3">
          {stages.map((_, index) => (
            <div
              key={index}
              className="transition-all duration-500 rounded-full relative"
              style={{
                width: index <= currentStageIndex ? '12px' : '8px',
                height: index <= currentStageIndex ? '12px' : '8px',
                backgroundColor: index <= currentStageIndex 
                  ? designTheme.textColors.primary 
                  : 'rgba(255,255,255,0.3)',
                boxShadow: index <= currentStageIndex 
                  ? `0 0 10px ${designTheme.textColors.primary}60` 
                  : 'none',
                transform: index <= currentStageIndex ? 'scale(1.2)' : 'scale(1)'
              }}
            >
              {/* Active indicator pulse */}
              {index === currentStageIndex && (
                <div 
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{
                    backgroundColor: designTheme.textColors.primary,
                    opacity: 0.4
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Royal Decorative Elements */}
      <div className="absolute top-16 right-16 opacity-30">
        <Crown 
          className="w-12 h-12 animate-pulse" 
          style={{ 
            color: designTheme.textColors.accent,
            filter: `drop-shadow(0 0 10px ${designTheme.textColors.accent}40)`
          }} 
        />
      </div>
      <div className="absolute bottom-16 left-16 opacity-30">
        <Diamond 
          className="w-10 h-10 animate-pulse" 
          style={{ 
            color: designTheme.textColors.secondary,
            filter: `drop-shadow(0 0 8px ${designTheme.textColors.secondary}40)`,
            animationDelay: '1s'
          }} 
        />
      </div>
      <div className="absolute top-32 left-24 opacity-25">
        <Flower2 
          className="w-8 h-8 animate-pulse" 
          style={{ 
            color: designTheme.textColors.blessing,
            filter: `drop-shadow(0 0 6px ${designTheme.textColors.blessing}40)`,
            animationDelay: '2s'
          }} 
        />
      </div>
      <div className="absolute bottom-32 right-24 opacity-25">
        <Star 
          className="w-6 h-6 animate-pulse" 
          style={{ 
            color: designTheme.textColors.primary,
            filter: `drop-shadow(0 0 8px ${designTheme.textColors.primary}40)`,
            animationDelay: '0.5s'
          }} 
        />
      </div>

      <style>
        {`@keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }`}
      </style>
    </div>
  );
};