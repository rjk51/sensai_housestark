"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import Image from "next/image";

export default function CourseRoadmap() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id;

  // Voice assistant states
  const [isAssistantEnlarged, setIsAssistantEnlarged] = useState(false);
  const [isDebounced, setIsDebounced] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [highlightedMilestone, setHighlightedMilestone] = useState<number | null>(null);
  const [botPosition, setBotPosition] = useState<{top: string, left: string}>({top: 'auto', left: 'auto'});
  const [lastTTSMessage, setLastTTSMessage] = useState<string>("");
  const [wasManuallyStopped, setWasManuallyStopped] = useState(false);

  // For now, we'll hardcode ML course roadmap data
  const mlRoadmapData = [
    {
      id: 1,
      title: "Foundations of ML",
      completed: false
    },
    {
      id: 2,
      title: "Python & Data",
      completed: false
    },
    {
      id: 3,
      title: "Supervised Learning",
      completed: false
    },
    {
      id: 4,
      title: "Deep Learning",
      completed: false
    },
    {
      id: 5,
      title: "Production ML",
      completed: false
    }
  ];

  // Calculate safe position for bot to avoid overlapping with highlighted milestone
  const calculateSafeBotPosition = (highlightedMilestoneId: number | null) => {
    if (highlightedMilestoneId === null) {
      return {top: 'auto', left: 'auto'}; // Default position (bottom-right)
    }

    const positions = [
      { x: 150, y: 60 },
      { x: 300, y: 150 },
      { x: 500, y: 220 },
      { x: 700, y: 290 },
      { x: 880, y: 380 }
    ];

    const milestonePosition = positions[highlightedMilestoneId - 1];
    if (!milestonePosition) {
      return {top: 'auto', left: 'auto'};
    }

    const milestoneTopPercent = (milestonePosition.y / 500) * 100;
    const milestoneLeftPercent = (milestonePosition.x / 1000) * 100;

    // Determine safe position based on milestone location
    let newTop = 'auto';
    let newLeft = 'auto';

    // If milestone is in the right half, move bot to left
    if (milestoneLeftPercent > 50) {
      newLeft = '6rem'; // Left side
    } else {
      newLeft = 'auto'; // Right side (default)
    }

    // If milestone is in the bottom half, move bot to top
    if (milestoneTopPercent > 50) {
      newTop = '6rem'; // Top
      newLeft = milestoneLeftPercent > 50 ? '6rem' : 'calc(100vw - 6rem - 4rem)'; // Adjust horizontal based on milestone position
    }

    return {top: newTop, left: newLeft};
  };

  // Generate milestone introduction message
  const generateMilestoneIntroduction = () => {
    let introduction = `Welcome to your Machine Learning roadmap! I'm Senpai, and I'll guide you through each milestone on this learning journey. `;
    
    mlRoadmapData.forEach((milestone, index) => {
      const description = milestone.completed 
        ? 'This milestone is completed and ready for review'
        : 'This milestone is ready for you to start learning';
      
      introduction += `Step ${index + 1}: ${milestone.title} - ${description}. `;
      if (index < mlRoadmapData.length - 1) {
        introduction += "Next, ";
      }
    });
    
    introduction += "Click on any milestone sign to start or review that topic!";
    return introduction;
  };

  // Voice assistant handler
  const handleAssistantClick = async () => {
    if (isDebounced || isTTSActive) return;
    setIsDebounced(true);
    setIsAssistantEnlarged(true);
    setIsTTSActive(true);
    setWasManuallyStopped(false);
    setHighlightedMilestone(null);
    
    // Generate milestone introduction message
    const message = generateMilestoneIntroduction();
    setLastTTSMessage(message);
    
    if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(message);
      utter.lang = 'en-US';
      utter.rate = 0.9; // Slightly slower for better understanding
      try {
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.lang.startsWith('en') && (
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('samantha') ||
            voice.name.toLowerCase().includes('susan') ||
            voice.name.toLowerCase().includes('karen') ||
            voice.name.toLowerCase().includes('victoria') ||
            voice.name.toLowerCase().includes('zira')
          )
        );
        if (femaleVoice) {
          utter.voice = femaleVoice;
        } else {
          const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
          if (englishVoice) utter.voice = englishVoice;
        }
      } catch {}
      
      // Set female voice preferences
      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('woman') ||
         voice.name.toLowerCase().includes('samantha') ||
         voice.name.toLowerCase().includes('susan') ||
         voice.name.toLowerCase().includes('karen') ||
         voice.name.toLowerCase().includes('victoria') ||
         voice.name.toLowerCase().includes('zira'))
      );
      
      if (femaleVoice) {
        utter.voice = femaleVoice;
      } else {
        // Fallback: try to find any voice with higher pitch (usually female)
        const highPitchVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (highPitchVoice) {
          utter.voice = highPitchVoice;
        }
      }
      
      // Additional settings for more natural female voice
      utter.pitch = 1.2; // Slightly higher pitch

      // Track which milestone is being mentioned
      let currentMilestoneIndex = 0;
      const milestoneKeywords = mlRoadmapData.map(milestone => milestone.title.toLowerCase());

      utter.onboundary = (event) => {
        if (!event.charIndex) return;
        const spoken = message.substring(0, event.charIndex + 1).toLowerCase();
        
        // Check if we've reached a new milestone mention
        for (let i = currentMilestoneIndex; i < milestoneKeywords.length; i++) {
          const stepPhrase = `step ${i + 1}`;
          if (spoken.includes(stepPhrase) || spoken.includes(milestoneKeywords[i])) {
            setHighlightedMilestone(mlRoadmapData[i].id);
            // Calculate and set safe bot position
            const safePosition = calculateSafeBotPosition(mlRoadmapData[i].id);
            setBotPosition(safePosition);
            currentMilestoneIndex = i + 1;
            break;
          }
        }
      };
      
      utter.onend = () => {
        setHighlightedMilestone(null);
        setBotPosition({top: 'auto', left: 'auto'}); // Reset to default position
        setIsTTSActive(false);

        // If manually stopped, reset and do not start recognition
        if (wasManuallyStopped) {
          setWasManuallyStopped(false);
          setIsAssistantEnlarged(false);
          setIsDebounced(false);
          return;
        }

        // After speaking, start voice recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          // @ts-ignore
          const SpeechRecognition = (window).SpeechRecognition || (window).webkitSpeechRecognition;
          // @ts-ignore
          const recognition = new SpeechRecognition();
          recognition.lang = 'en-US';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          let silenceTimeout: NodeJS.Timeout | null = null;

          const resetUI = () => {
            setIsAssistantEnlarged(false);
            setIsDebounced(false);
          };

          const stopRecognition = () => {
            recognition.stop();
            resetUI();
          };

          recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            console.log('Speech recognition result:', transcript);
            setTranscription(transcript);
            setSpeechError("");
            
            // Process voice commands for milestone selection
            processVoiceCommand(transcript);
            
            // If user keeps speaking, reset the 5s timer
            if (silenceTimeout) clearTimeout(silenceTimeout);
            silenceTimeout = setTimeout(() => {
              stopRecognition();
            }, 5000);
          };
          
          recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === "network") {
              setSpeechError("Speech recognition failed due to a network error. Please check your internet connection and try again.");
            } else if (event.error === "not-allowed") {
              setSpeechError("Microphone access denied. Please allow microphone access and try again.");
            } else {
              setSpeechError("Speech recognition error: " + event.error);
            }
            if (silenceTimeout) clearTimeout(silenceTimeout);
            resetUI();
          };
          
          recognition.onend = () => {
            // If recognition ended not by our timer, reset UI
            if (silenceTimeout) clearTimeout(silenceTimeout);
            resetUI();
          };
          
          recognition.start();
        } else {
          setSpeechError('Speech recognition not supported in this browser.');
          setIsAssistantEnlarged(false);
          setIsDebounced(false);
        }
      };
      
      window.speechSynthesis.speak(utter);
    } else {
      setSpeechError('Text-to-speech not supported in this browser.');
      setIsAssistantEnlarged(false);
      setIsDebounced(false);
    }
  };

  // Stop current TTS and reset UI
  const handleStopAssistant = () => {
    try {
      setWasManuallyStopped(true);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } finally {
      setIsTTSActive(false);
      setIsAssistantEnlarged(false);
      setIsDebounced(false);
      setHighlightedMilestone(null);
      setBotPosition({top: 'auto', left: 'auto'});
    }
  };

  // Repeat previous TTS prompt without starting recognition
  const handleRepeatAssistant = () => {
    if (!lastTTSMessage) return;
    if ('speechSynthesis' in window) {
      setIsAssistantEnlarged(true);
      setIsDebounced(true);
      setIsTTSActive(true);
      setWasManuallyStopped(false);

      const utter = new window.SpeechSynthesisUtterance(lastTTSMessage);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      utter.pitch = 1.2;
      try {
        const voices = window.speechSynthesis.getVoices();
        const femaleVoice = voices.find(voice => 
          voice.lang.startsWith('en') && (
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('samantha') ||
            voice.name.toLowerCase().includes('susan') ||
            voice.name.toLowerCase().includes('karen') ||
            voice.name.toLowerCase().includes('victoria') ||
            voice.name.toLowerCase().includes('zira')
          )
        );
        if (femaleVoice) utter.voice = femaleVoice;
      } catch {}
      utter.onend = () => {
        setIsTTSActive(false);
        setIsAssistantEnlarged(false);
        setIsDebounced(false);
      };
      window.speechSynthesis.speak(utter);
    }
  };

  // Process voice commands for milestone selection
  const processVoiceCommand = (transcript: string) => {
    const command = transcript.toLowerCase();
    
    // Check if user is asking for a specific milestone
    mlRoadmapData.forEach(milestone => {
      if (command.includes(milestone.title.toLowerCase()) || 
          command.includes(`step ${milestone.id}`)) {
        console.log(`Voice command matched milestone: ${milestone.title}`);
        setHighlightedMilestone(milestone.id);
        setTimeout(() => setHighlightedMilestone(null), 2000);
      }
    });
  };

  return (
    <>
      <style jsx global>{`
        button:focus {
          outline: none !important;
          box-shadow: none !important;
          border: none !important;
        }
        
        html, body {
          height: 100%;
          overflow-y: auto;
        }

        @keyframes burst-ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        .animation-delay-150 {
          animation-delay: 150ms;
        }
        .animation-delay-300 {
          animation-delay: 300ms;
        }
      `}
      </style>

      <div className="min-h-screen bg-black text-white overflow-hidden">
      <Header showCreateCourseButton={false} showTryDemoButton={false} />
      
      <main className="relative w-full h-screen">
        {/* Map Background */}
        <div className="absolute inset-0">
          <Image
            src="/images/map.png"
            alt="Learning Path Map"
            fill
            className="object-cover opacity-60"
          />
        </div>
        
        {/* Horizontal Road Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-7xl px-8">
            {/* Horizontal Road Path */}
            <svg width="100%" height="500" viewBox="0 0 1000 500" className="mb-4">
              {/* Road Background */}
              <path
                d="M80 40 Q300 180 500 220 Q700 260 950 420"
                stroke="#374151"
                strokeWidth="60"
                fill="none"
                strokeLinecap="round"
              />
              
              {/* Road Center Line */}
              <path
                d="M80 40 Q300 180 500 220 Q700 260 950 420"
                stroke="#FCD34D"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="15,15"
              />
            </svg>

            {/* Interactive Course Boxes */}
            {mlRoadmapData.map((milestone, index) => {
              const positions = [
                { x: 150, y: 60 },
                { x: 300, y: 150 },
                { x: 500, y: 220 },
                { x: 700, y: 290 },
                { x: 880, y: 380 }
              ];

              // Use percentage-based positioning relative to the container
              const position = positions[index];
              const leftPercent = (position.x / 1000) * 100; // Convert to percentage of SVG width
              const topPercent = (position.y / 500) * 100;   // Convert to percentage of SVG height

              return (
                <div
                  key={milestone.id}
                  className={`absolute cursor-pointer group transition-all duration-500 ${
                    highlightedMilestone === milestone.id 
                      ? 'z-50 scale-125 drop-shadow-2xl' 
                      : 'hover:z-40'
                  }`}
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onClick={() => {
                    console.log(`Clicked on milestone: ${milestone.title}`);
                    // Navigate to the individual milestone page
                    router.push(`/courses/${courseId}/roadmap/${milestone.id}`);
                  }}
                >
                  {/* Road Sign Post */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-8 bg-gray-600 rounded-sm shadow-lg"></div>
                  
                  {/* Direction Board */}
                  <div className="relative">
                    {/* Highlighted glow effect */}
                    {highlightedMilestone === milestone.id && (
                      <div className="absolute inset-0 bg-blue-400 rounded-md opacity-40 animate-pulse blur-sm transform scale-110"></div>
                    )}
                    
                    {/* Main sign board */}
                    <div className={`bg-gradient-to-r from-gray-100 to-white text-gray-900 px-3 py-2 rounded-md shadow-2xl border-2 border-gray-300 min-w-[150px] max-w-[180px] transform group-hover:scale-105 transition-all duration-300 group-hover:shadow-3xl relative ${
                      highlightedMilestone === milestone.id 
                        ? 'ring-4 ring-blue-400 ring-opacity-75 shadow-blue-400/50' 
                        : ''
                    }`}>
                      {/* Arrow pointing right */}
                      <div className="absolute right-0 top-1/2 transform translate-x-full -translate-y-1/2">
                        <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent"></div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-xs mb-1 text-gray-900 leading-tight">
                            {milestone.title}
                          </h3>
                          <p className="text-xs text-gray-600 leading-tight">
                            {milestone.completed ? 'Completed - Click to review' : 'Start learning this topic'}
                          </p>
                          <div className="mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              milestone.completed 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              Step {index + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Road sign reflective strips */}
                      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-t-md opacity-80 ${
                        highlightedMilestone === milestone.id ? 'animate-pulse' : ''
                      }`}></div>
                      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-b-md opacity-80 ${
                        highlightedMilestone === milestone.id ? 'animate-pulse' : ''
                      }`}></div>
                    </div>
                    
                    {/* Hover effect - additional glow */}
                    <div className="absolute inset-0 bg-blue-400 rounded-md opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>

      {/* AI Assistant Logo - Dynamic positioning to avoid milestone overlaps */}
      <div 
        className={`fixed z-50 flex flex-col items-end transition-all duration-700 ease-in-out ${
          isAssistantEnlarged 
            ? 'items-center' 
            : 'items-end'
        }`}
        style={{
          top: isAssistantEnlarged 
            ? (botPosition.top === 'auto' ? '50%' : botPosition.top)
            : 'auto',
          left: isAssistantEnlarged 
            ? (botPosition.top === 'auto' ? '50%' : botPosition.left)
            : (botPosition.left === 'auto' ? 'auto' : botPosition.left),
          right: isAssistantEnlarged 
            ? 'auto'
            : (botPosition.left === 'auto' ? '1.5rem' : 'auto'),
          bottom: isAssistantEnlarged 
            ? 'auto'
            : (botPosition.top === 'auto' ? '1.5rem' : 'auto'),
          transform: isAssistantEnlarged && botPosition.top === 'auto' 
            ? 'translate(-50%, -50%)' 
            : 'none'
        }}
      >
        {/* Controls: Stop and Repeat */}
        {isAssistantEnlarged && (
          <div className="mb-3 flex gap-2">
            <button
              onClick={handleStopAssistant}
              aria-label="Stop assistant"
              className="p-2 rounded-full bg-white text-black hover:opacity-90 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h12v12H6z" />
              </svg>
            </button>
            <button
              onClick={handleRepeatAssistant}
              aria-label="Repeat prompt"
              className="p-2 rounded-full bg-white text-black hover:opacity-90 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 6V3L8 7l4 4V8c2.757 0 5 2.243 5 5a5 5 0 01-8.66 3.536l-1.415 1.415A7 7 0 0019 13c0-3.86-3.14-7-7-7z"/>
              </svg>
            </button>
          </div>
        )}
        {/* Chat Bubble Label */}
        {!isAssistantEnlarged && (
          <div className="mb-3 relative animate-in fade-in duration-300">
            <div className="bg-white text-gray-800 text-sm px-4 py-3 rounded-2xl shadow-lg whitespace-nowrap border border-gray-100">
              Ask Senpai about milestones
            </div>
            {/* Chat bubble arrow pointing to the logo */}
            <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white"></div>
            <div className="absolute -bottom-1 right-6 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-gray-100"></div>
          </div>
        )}
        
        {/* Burst Animation Effect */}
        {isAssistantEnlarged && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Multiple burst circles */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-purple-400 rounded-full animate-ping opacity-75"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-blue-400 rounded-full animate-ping opacity-50 animation-delay-150"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-purple-300 rounded-full animate-ping opacity-25 animation-delay-300"></div>
          </div>
        )}
        
        {/* Assistant Button - Much Larger when clicked and centered */}
        <button 
          className={`bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black ${
            isAssistantEnlarged ? 'w-32 h-32 hover:scale-105 shadow-2xl ring-4 ring-purple-400' : 'w-16 h-16 hover:scale-110'
          }`}
          onClick={handleAssistantClick}
        >
          <Image
            src="/images/senpai-logo.gif"
            alt="AI Assistant"
            width={isAssistantEnlarged ? 128 : 64}
            height={isAssistantEnlarged ? 128 : 64}
            className="w-full h-full rounded-full object-cover"
          />
        </button>
      </div>

      {/* Show speech error if any */}
      {speechError && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50 text-center">
          {speechError}
        </div>
      )}
    </>
  );
}
