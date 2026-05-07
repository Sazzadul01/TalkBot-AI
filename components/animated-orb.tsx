"use client";

import { motion } from "framer-motion";
import type { AssistantState } from "@/hooks/use-voice-assistant";

interface AnimatedOrbProps {
  state: AssistantState;
  onClick?: () => void;
  audioData?: number[];
}

// Futuristic cyan/blue color scheme
const stateColors = {
  idle: {
    primary: "#00e5ff",
    secondary: "#00bfff",
    glow: "rgba(0, 229, 255, 0.4)",
  },
  listening: {
    primary: "#00e5ff",
    secondary: "#7df9ff",
    glow: "rgba(125, 249, 255, 0.5)",
  },
  thinking: {
    primary: "#00bfff",
    secondary: "#00e5ff",
    glow: "rgba(0, 191, 255, 0.5)",
  },
  searching: {
    primary: "#00bfff",
    secondary: "#0080ff",
    glow: "rgba(0, 128, 255, 0.6)",
  },
  speaking: {
    primary: "#7df9ff",
    secondary: "#00e5ff",
    glow: "rgba(125, 249, 255, 0.6)",
  },
};

export function AnimatedOrb({ state, onClick, audioData = [] }: AnimatedOrbProps) {
  const colors = stateColors[state];

  // Calculate dynamic scale from audio data when listening
  const avgVolume =
    state === "listening" && audioData.length > 0
      ? audioData.reduce((a, b) => a + b, 0) / audioData.length / 255
      : 0;

  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer focus:outline-none group"
      aria-label={`Voice assistant is ${state}. Click to activate.`}
    >
      {/* Outer glow pulse */}
      <motion.div
        className="absolute w-80 h-80 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
        }}
        animate={{
          opacity: state === "idle" ? [0.3, 0.5, 0.3] : [0.5, 0.8, 0.5],
          scale: state === "idle" ? [1, 1.2, 1] : [1, 1.4, 1],
        }}
        transition={{
          duration: state === "listening" ? 0.8 : state === "searching" ? 0.5 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Scanning ring for searching state */}
      {state === "searching" && (
        <motion.div
          className="absolute w-72 h-72 rounded-full border-2"
          style={{ borderColor: colors.primary }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: [0.5, 1.5],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}

      {/* Second scanning ring for searching */}
      {state === "searching" && (
        <motion.div
          className="absolute w-72 h-72 rounded-full border-2"
          style={{ borderColor: colors.secondary }}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{
            scale: [0.5, 1.5],
            opacity: [0.8, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.5,
          }}
        />
      )}

      {/* Middle glow layer */}
      <motion.div
        className="absolute w-64 h-64 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 60%)`,
        }}
        animate={{
          opacity: [0.4, 0.7, 0.4],
          scale: [1, 1.1 + avgVolume * 0.3, 1],
        }}
        transition={{
          duration: state === "listening" ? 0.3 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Rotating outer ring */}
      <motion.div
        className="absolute w-52 h-52 rounded-full border-2 border-dashed"
        style={{ borderColor: colors.secondary, opacity: 0.5 }}
        animate={{
          rotate: 360,
          opacity: state === "thinking" || state === "searching" ? 0.8 : 0.4,
        }}
        transition={{
          rotate: {
            duration: state === "thinking" ? 2 : state === "searching" ? 1.5 : 8,
            repeat: Infinity,
            ease: "linear",
          },
          opacity: { duration: 0.3 },
        }}
      />

      {/* Counter-rotating inner ring */}
      <motion.div
        className="absolute w-44 h-44 rounded-full border border-dashed"
        style={{ borderColor: colors.primary, opacity: 0.4 }}
        animate={{
          rotate: -360,
          opacity: state === "thinking" || state === "searching" ? 0.7 : 0.3,
        }}
        transition={{
          rotate: {
            duration: state === "thinking" ? 3 : state === "searching" ? 2 : 12,
            repeat: Infinity,
            ease: "linear",
          },
          opacity: { duration: 0.3 },
        }}
      />

      {/* Arc segments for futuristic look */}
      {[0, 90, 180, 270].map((rotation, i) => (
        <motion.div
          key={i}
          className="absolute w-48 h-48"
          style={{ rotate: `${rotation}deg` }}
        >
          <motion.div
            className="absolute top-0 left-1/2 w-1 h-4 -translate-x-1/2 rounded-full"
            style={{ backgroundColor: colors.primary }}
            animate={{
              opacity: state === "idle" ? [0.3, 0.6, 0.3] : [0.6, 1, 0.6],
              scaleY: state === "listening" ? [1, 1.5 + avgVolume, 1] : [1, 1.2, 1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        </motion.div>
      ))}

      {/* Main orb core */}
      <motion.div
        className="relative w-36 h-36 rounded-full flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          boxShadow: `0 0 60px ${colors.glow}, 0 0 100px ${colors.glow}, inset 0 0 30px rgba(255, 255, 255, 0.2)`,
        }}
        animate={{
          scale: state === "idle" 
            ? [1, 1.05, 1] 
            : state === "listening" 
            ? [1, 1.1 + avgVolume * 0.2, 1]
            : state === "speaking"
            ? [1, 1.15, 1, 1.1, 1]
            : [1, 1.08, 1],
        }}
        transition={{
          duration: state === "speaking" ? 0.5 : state === "listening" ? 0.3 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Inner highlight reflection */}
        <div
          className="absolute top-2 left-4 w-12 h-8 rounded-full opacity-50"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, transparent 100%)",
          }}
        />

        {/* State icons */}
        <motion.div
          className="relative z-10"
          animate={{
            scale: state === "speaking" ? [1, 1.2, 1] : 1,
          }}
          transition={{
            duration: 0.3,
            repeat: state === "speaking" ? Infinity : 0,
          }}
        >
          {state === "idle" && (
            <svg
              className="w-12 h-12 text-white opacity-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          )}

          {state === "listening" && (
            <div className="flex items-end gap-1 h-12">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 bg-white rounded-full"
                  animate={{
                    height: [12, 24 + (audioData[i * 6] || 0) / 8, 12],
                  }}
                  transition={{
                    duration: 0.2,
                    repeat: Infinity,
                    delay: i * 0.08,
                  }}
                />
              ))}
            </div>
          )}

          {state === "thinking" && (
            <motion.div
              className="w-10 h-10 border-4 border-white border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          )}

          {state === "searching" && (
            <motion.svg
              className="w-12 h-12 text-white opacity-90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </motion.svg>
          )}

          {state === "speaking" && (
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 bg-white rounded-full"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [0.6, 1, 0.6],
                  }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Click prompt for idle */}
      {state === "idle" && (
        <motion.p
          className="absolute -bottom-16 text-sm text-[#00e5ff]/70 whitespace-nowrap font-mono tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          TAP TO INITIALIZE
        </motion.p>
      )}
    </button>
  );
}
