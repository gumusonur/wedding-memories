/**
 * HLS Video Player Component
 *
 * Instagram-style video player that supports:
 * - HLS streaming for fast video playback
 * - Autoplay muted in feed mode
 * - Full controls in modal mode
 * - Resume playback from last position
 * - Mobile-optimized performance
 */

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import Hls from 'hls.js';
import type { MediaProps } from '../utils/types';

interface HLSVideoPlayerProps {
  media: MediaProps;
  className?: string;
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  loop?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onLoadedData?: () => void;
  startTime?: number; // Resume from specific time
  context?: 'feed' | 'modal' | 'thumb';
  style?: React.CSSProperties;
  onClick?: () => void;
  playOnHover?: boolean; // Play only on hover (desktop)
}

// Global state to track video positions for resume functionality
const videoTimestamps = new Map<string, number>();

export function HLSVideoPlayer({
  media,
  className = '',
  autoplay = false,
  muted = true,
  controls = false,
  loop = false,
  onTimeUpdate,
  onDurationChange,
  onLoadedData,
  startTime = 0,
  context = 'feed',
  style,
  onClick,
  playOnHover = false,
}: HLSVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Create unique key for this video
  const videoKey = `${media.guestName}-${media.videoId}`;

  // Initialize HLS player
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !media.hlsPlaylistUrl) return;

    // Clean up existing HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if HLS is supported natively or via hls.js
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native HLS support (Safari)
      video.src = media.hlsPlaylistUrl;
      setError(null);
    } else if (Hls.isSupported()) {
      // Use hls.js for other browsers
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90, // Keep 90 seconds of buffer for seeking
      });

      hls.loadSource(media.hlsPlaylistUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setError(null);
        // Set start time if provided or resume from stored position
        const resumeTime = startTime || videoTimestamps.get(videoKey) || 0;
        if (resumeTime > 0) {
          video.currentTime = resumeTime;
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('HLS Error:', data);
        setError('Video playback error');
        setIsLoading(false);
      });

      hlsRef.current = hls;
    } else {
      setError('Video playback not supported in this browser');
      setIsLoading(false);
    }

    // Cleanup function
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [media.hlsPlaylistUrl, startTime, videoKey]);

  // Video event handlers
  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
    onLoadedData?.();
  }, [onLoadedData]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const time = video.currentTime;
    setCurrentTime(time);

    // Store timestamp for resume functionality
    if (time > 1) {
      // Only store if we're past the first second
      videoTimestamps.set(videoKey, time);
    }

    onTimeUpdate?.(time);
  }, [onTimeUpdate, videoKey]);

  const handleDurationChange = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const videoDuration = video.duration;
    setDuration(videoDuration);
    onDurationChange?.(videoDuration);
  }, [onDurationChange]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    // Reset timestamp when video ends
    videoTimestamps.delete(videoKey);
  }, [videoKey]);

  // Control functions
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch((err) => {
        console.warn('Play failed:', err);
      });
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  }, []);

  // Format time for display
  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle video click
  const handleVideoClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else if (!controls && !playOnHover) {
      // In feed mode, clicking toggles play/pause (only if not hover-controlled)
      togglePlayPause();
    }
  }, [onClick, controls, togglePlayPause, playOnHover]);

  // Handle hover events for desktop
  const handleMouseEnter = useCallback(() => {
    if (playOnHover && !controls) {
      const video = videoRef.current;
      if (video && !isPlaying) {
        video.play().catch((err) => {
          console.warn('Hover play failed:', err);
        });
      }
    }
  }, [playOnHover, controls, isPlaying]);

  const handleMouseLeave = useCallback(() => {
    if (playOnHover && !controls) {
      const video = videoRef.current;
      if (video && isPlaying) {
        video.pause();
      }
    }
  }, [playOnHover, controls, isPlaying]);

  return (
    <div
      className={`relative ${className}`}
      style={style}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-400 border-t-transparent"></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">Loading video...</span>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center text-gray-600 dark:text-gray-300">
            <div className="text-sm font-medium mb-1">Unable to load video</div>
            <div className="text-xs opacity-75">{error}</div>
          </div>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className={`w-full h-full object-contain ${isLoading || error ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        playsInline
        preload={context === 'thumb' ? 'metadata' : 'auto'}
        onLoadedData={handleLoadedData}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={handleDurationChange}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onClick={handleVideoClick}
        controls={controls}
        style={{ cursor: onClick || !controls ? 'pointer' : 'default' }}
      />

      {/* Custom controls overlay for feed mode */}
      {!controls && !isLoading && !error && (
        <>
          {/* Play/Pause overlay - only show when not playing or for hover videos */}
          {(!isPlaying || playOnHover) && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div
                className={`bg-black/70 grid place-items-center size-10 rounded-full backdrop-blur-sm transition-opacity duration-200 ${
                  playOnHover && isPlaying ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <Play className="size-5 text-white" fill="white" />
              </div>
            </div>
          )}

          {/* Mute toggle for modal context */}
          {context === 'modal' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleMute();
              }}
              className="absolute top-4 right-4 bg-black/50 rounded-full p-2 backdrop-blur-sm hover:bg-black/70 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          )}

          {/* Progress indicator for modal */}
          {context === 'modal' && duration > 0 && (
            <div className="absolute bottom-4 left-4 right-4">
              <div className="bg-black/50 rounded-full px-3 py-1 text-white text-sm backdrop-blur-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Utility function to get stored video position
export function getStoredVideoPosition(guestName: string, videoId: string): number {
  return videoTimestamps.get(`${guestName}-${videoId}`) || 0;
}

// Utility function to clear stored video positions (e.g., on app cleanup)
export function clearStoredVideoPositions(): void {
  videoTimestamps.clear();
}

