"use client";

import { useEffect, useState, FormEvent, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedOrb } from "./animated-orb";
import { useVoiceAssistant } from "@/hooks/use-voice-assistant";
import { Send, Volume2 } from "lucide-react";

export function AssistantInterface() {
  const {
    state,
    transcript,
    response,
    messages,
    audioData,
    permissionStatus,
    statusMessage,
    isStreaming,
    startListening,
    activateManually,
    sendTextQuery,
  } = useVoiceAssistant({ wakeWord: "sazzad" });

  const [isStarted, setIsStarted] = useState(false);
  const [textInput, setTextInput] = useState("");
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll conversation
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, response]);

  const handleStart = () => {
    setIsStarted(true);
    startListening();
  };

  const handleOrbClick = () => {
    if (!isStarted) {
      handleStart();
    } else if (state === "idle") {
      activateManually();
    }
  };

  const handleTextSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (textInput.trim() && state === "idle") {
      setIsStarted(true);
      sendTextQuery(textInput);
      setTextInput("");
    }
  };

  // Get the latest user message and response for live subtitles
  const latestUserMessage = messages.filter(m => m.role === "user").pop()?.content || transcript;
  const latestAssistantMessage = response || messages.filter(m => m.role === "assistant").pop()?.content;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#030810]">
      {/* Animated background with scan lines */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030810] via-[#041020] to-[#030810]" />
        
        {/* Scan lines effect */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0, 229, 255, 0.1) 2px,
              rgba(0, 229, 255, 0.1) 4px
            )`,
          }}
        />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 229, 255, 0.3) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(0, 229, 255, 0.3) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Vignette */}
       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#030810_70%)]" />

{/* Floating particles */}
{Array.from({ length: 30 }).map((_, i) => {
  const x = typeof window !== "undefined"
    ? (i * 50) % window.innerWidth
    : i * 50;

  const y = typeof window !== "undefined"
    ? (i * 30) % window.innerHeight
    : i * 30;

  return (
    <motion.div
      key={i}
      className="absolute w-1 h-1 bg-[#00e5ff]/40 rounded-full"
      initial={{
        x,
        y,
      }}
      animate={{
        y: [y, y - 30, y + 30, y],
        opacity: [0.2, 0.6, 0.2],
        scale: [1, 1.5, 1],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        delay: i * 0.1,
      }}
    />
  );
})}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-4 w-full max-w-2xl">
        {/* Header */}
        <motion.div
          className="text-center mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00e5ff] via-[#7df9ff] to-[#00bfff] tracking-wider">
            SAZZAD
          </h1>
          <p className="text-[#00e5ff]/50 text-xs mt-2 tracking-[0.3em] uppercase font-mono">
            Advanced AI Interface v2.0
          </p>
        </motion.div>

        {/* Animated Orb */}
        <AnimatedOrb
          state={isStarted ? state : "idle"}
          onClick={handleOrbClick}
          audioData={audioData}
        />

        {/* Status indicator */}
        <motion.div
          className="flex items-center gap-3 font-mono"
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-[#00e5ff]"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 1, 0.5],
              boxShadow: [
                "0 0 5px #00e5ff",
                "0 0 15px #00e5ff",
                "0 0 5px #00e5ff",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.span 
            className="text-sm text-[#00e5ff]/80 tracking-wider"
            key={statusMessage}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {statusMessage}
          </motion.span>
        </motion.div>

        {/* Live conversation subtitles */}
        <AnimatePresence mode="wait">
          {(latestUserMessage || latestAssistantMessage) && isStarted && (
            <motion.div
              className="w-full space-y-3 min-h-[120px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* User message */}
              {latestUserMessage && (
                <motion.div
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={latestUserMessage}
                >
                  <span className="text-[#00e5ff]/60 text-xs font-mono tracking-wider mt-1 shrink-0">YOU:</span>
                  <p className="text-white/90 text-sm leading-relaxed">{latestUserMessage}</p>
                </motion.div>
              )}

              {/* Assistant response */}
              {latestAssistantMessage && (
                <motion.div
                  className="flex items-start gap-3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <span className="text-[#7df9ff] text-xs font-mono tracking-wider mt-1 shrink-0 flex items-center gap-1">
                    SAZZAD:
                    {state === "speaking" && (
                      <motion.span
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        <Volume2 className="w-3 h-3" />
                      </motion.span>
                    )}
                  </span>
                  <p className="text-[#7df9ff] text-sm leading-relaxed">
                    {latestAssistantMessage}
                    {isStreaming && (
                      <motion.span
                        className="inline-block w-2 h-4 ml-1 bg-[#00e5ff]"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                      />
                    )}
                  </p>
                </motion.div>
              )}
              <div ref={conversationEndRef} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Welcome message for new users */}
        <AnimatePresence>
          {!isStarted && (
            <motion.div
              className="text-center max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-white/60 text-sm mb-4 font-light">
                {permissionStatus === "denied" 
                  ? "Voice channel offline. Text interface ready."
                  : "Initialize voice channel or use text input below."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Text input */}
        <motion.form
          onSubmit={handleTextSubmit}
          className="w-full max-w-lg mt-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="relative flex items-center">
            <div className="absolute left-4 w-2 h-2 rounded-full bg-[#00e5ff]/50" />
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter command..."
              disabled={state !== "idle" && state !== "listening"}
              className="w-full bg-[#00e5ff]/5 backdrop-blur-sm border border-[#00e5ff]/20 rounded-full pl-10 pr-14 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5ff]/50 focus:bg-[#00e5ff]/10 transition-all disabled:opacity-40 font-mono text-sm tracking-wide"
            />
            <button
              type="submit"
              disabled={!textInput.trim() || (state !== "idle" && state !== "listening")}
              className="absolute right-2 p-2.5 rounded-full bg-[#00e5ff]/20 text-[#00e5ff] hover:bg-[#00e5ff]/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed border border-[#00e5ff]/30"
              aria-label="Send command"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {permissionStatus === "denied" && (
            <motion.p 
              className="text-[#00e5ff]/40 text-xs text-center mt-3 font-mono tracking-wider"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              AUDIO SYSTEMS UNAVAILABLE — TEXT MODE ACTIVE
            </motion.p>
          )}
        </motion.form>

        {/* Conversation history */}
        {messages.length > 2 && (
          <motion.details
            className="w-full max-w-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <summary className="text-[#00e5ff]/40 text-xs cursor-pointer hover:text-[#00e5ff]/60 transition-colors font-mono tracking-wider">
              VIEW SYSTEM LOG ({messages.length} ENTRIES)
            </summary>
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-[#00e5ff]/20">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`p-3 rounded border text-xs font-mono ${
                    msg.role === "user"
                      ? "bg-white/5 border-white/10 text-white/70"
                      : "bg-[#00e5ff]/5 border-[#00e5ff]/20 text-[#7df9ff]"
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider opacity-50">
                    {msg.role === "user" ? "INPUT" : "OUTPUT"}:
                  </span>
                  <p className="mt-1 leading-relaxed">{msg.content}</p>
                </div>
              ))}
            </div>
          </motion.details>
        )}
      </div>

      {/* Footer */}
      <motion.footer
        className="absolute bottom-4 text-[#00e5ff]/20 text-[10px] font-mono tracking-[0.2em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        POWERED BY GROQ • ELEVENLABS • SERPER
      </motion.footer>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-16 h-16 border-l-2 border-t-2 border-[#00e5ff]/20 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-16 h-16 border-r-2 border-t-2 border-[#00e5ff]/20 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-16 h-16 border-l-2 border-b-2 border-[#00e5ff]/20 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-16 h-16 border-r-2 border-b-2 border-[#00e5ff]/20 rounded-br-lg" />
    </div>
  );
}
