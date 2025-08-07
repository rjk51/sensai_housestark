"use client";

import React, { useState } from "react";
import Image from "next/image";

interface Course {
  id: string;
  title: string;
  description?: string;
  position: {
    top: string;
    left: string;
  };
}

interface ExplorePageProps {
  title: string;
  mapImageSrc: string;
  mapImageAlt: string;
  description?: string;
  courses: Course[];
}

// Custom styles for staggered burst animation
const burstStyles = `
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
`;

export default function ExplorePage({ 
  title, 
  mapImageSrc, 
  mapImageAlt, 
  description,
  courses 
}: ExplorePageProps) {
  const [isAssistantEnlarged, setIsAssistantEnlarged] = useState(false);
  const [isDebounced, setIsDebounced] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [logoAtButtons, setLogoAtButtons] = useState(false);
  const [highlightedCourse, setHighlightedCourse] = useState<string | null>(null);
  const [botPosition, setBotPosition] = useState<{top: string, left: string}>({top: 'auto', left: 'auto'});

  const handleCourseClick = (courseId: string) => {
    // Handle course selection - you can implement navigation logic here
    console.log(`Selected course: ${courseId}`);
  };

  // Calculate safe position for bot to avoid overlapping with highlighted course
  const calculateSafeBotPosition = (highlightedCourseId: string | null) => {
    if (!highlightedCourseId) {
      return {top: 'auto', left: 'auto'}; // Default position (bottom-right)
    }

    const highlightedCourse = courses.find(course => course.id === highlightedCourseId);
    if (!highlightedCourse) {
      return {top: 'auto', left: 'auto'};
    }

    const courseTop = parseFloat(highlightedCourse.position.top);
    const courseLeft = parseFloat(highlightedCourse.position.left);

    // Determine safe position based on course location
    let newTop = 'auto';
    let newLeft = 'auto';

    // If course is in the right half, move bot to left
    if (courseLeft > 50) {
      newLeft = '6rem'; // Left side
    } else {
      newLeft = 'auto'; // Right side (default)
    }

    // If course is in the bottom half, move bot to top
    if (courseTop > 50) {
      newTop = '6rem'; // Top
      newLeft = courseLeft > 50 ? '6rem' : 'calc(100vw - 6rem - 4rem)'; // Adjust horizontal based on course position
    }

    return {top: newTop, left: newLeft};
  };

  const generateCourseIntroduction = () => {
    const domain = title.toLowerCase();
    let introduction = `Hey! I'm Senpai, your learning companion. Welcome to the ${title} learning path! Let me guide you through the available courses on this map. `;
    
    courses.forEach((course, index) => {
      introduction += `${course.title}: ${course.description}. `;
      if (index < courses.length - 1) {
        introduction += "Next, we have ";
      }
    });
    
    introduction += "Click on any course sign to start your learning journey!";
    return introduction;
  };

  const handleAssistantClick = async () => {
    if (isDebounced || isTTSActive) return;
    setIsDebounced(true);
    setIsAssistantEnlarged(true);
    setLogoAtButtons(true);
    setIsTTSActive(true);
    setHighlightedCourse(null);

    // Generate course introduction message
    const message = generateCourseIntroduction();
    
    if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(message);
      utter.lang = 'en-US';
      utter.rate = 0.9; // Slightly slower for better understanding

      // Track which course is being mentioned
      let currentCourseIndex = 0;
      const courseNames = courses.map(course => course.title.toLowerCase());

      utter.onboundary = (event) => {
        if (!event.charIndex) return;
        const spoken = message.substring(0, event.charIndex + 1).toLowerCase();
        
        // Check if we've reached a new course mention
        for (let i = currentCourseIndex; i < courseNames.length; i++) {
          if (spoken.includes(courseNames[i])) {
            setHighlightedCourse(courses[i].id);
            // Calculate and set safe bot position
            const safePosition = calculateSafeBotPosition(courses[i].id);
            setBotPosition(safePosition);
            currentCourseIndex = i + 1;
            break;
          }
        }
      };

      utter.onend = () => {
        setHighlightedCourse(null);
        setBotPosition({top: 'auto', left: 'auto'}); // Reset to default position
        setIsTTSActive(false);
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
            setLogoAtButtons(false);
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
            
            // Process voice commands for course selection
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
          setLogoAtButtons(false);
          setIsDebounced(false);
        }
      };
      
      window.speechSynthesis.speak(utter);
    } else {
      setSpeechError('Text-to-speech not supported in this browser.');
      setIsAssistantEnlarged(false);
      setLogoAtButtons(false);
      setIsDebounced(false);
    }
  };

  // Process voice commands for course selection
  const processVoiceCommand = (transcript: string) => {
    const command = transcript.toLowerCase();
    
    // Check if user is asking for a specific course
    courses.forEach(course => {
      if (command.includes(course.title.toLowerCase())) {
        handleCourseClick(course.id);
        setHighlightedCourse(course.id);
        setTimeout(() => setHighlightedCourse(null), 2000);
      }
    });
  };

  return (
    <>
      <style jsx>{burstStyles}</style>
      <div className="min-h-screen bg-black text-white">
        {/* Header/Navigation could go here if needed */}
        
        {/* Main content */}
        <main className="max-w-6xl mx-auto pt-12 px-8 pb-12">
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 className="text-2xl md:text-5xl lg:text-6xl font-light mb-4">
              {title}
            </h1>
            {description && (
              <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                {description}
              </p>
            )}
          </div>

          {/* Map Image Section with Course Overlays */}
          <div className="flex justify-center mb-16">
            <div className="relative w-full" style={{ minHeight: "85vh" }}>
              <div className="relative w-full h-[85vh] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={mapImageSrc}
                  alt={mapImageAlt}
                  fill
                  className="object-cover"
                  priority
                />
                {/* Optional overlay for styling */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                
                {/* Course Direction Boards */}
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-500 ${
                      highlightedCourse === course.id 
                        ? 'z-50 scale-125 drop-shadow-2xl' 
                        : 'hover:z-40'
                    }`}
                    style={{
                      top: course.position.top,
                      left: course.position.left,
                    }}
                    onClick={() => handleCourseClick(course.id)}
                  >
                    {/* Road Sign Post */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-8 bg-gray-600 rounded-sm shadow-lg"></div>
                    
                    {/* Direction Board */}
                    <div className="relative">
                      {/* Highlighted glow effect */}
                      {highlightedCourse === course.id && (
                        <div className="absolute inset-0 bg-blue-400 rounded-md opacity-40 animate-pulse blur-sm transform scale-110"></div>
                      )}
                      
                      {/* Main sign board */}
                      <div className={`bg-gradient-to-r from-gray-100 to-white text-gray-900 px-3 py-2 rounded-md shadow-2xl border-2 border-gray-300 min-w-[150px] max-w-[180px] transform group-hover:scale-105 transition-all duration-300 group-hover:shadow-3xl relative ${
                        highlightedCourse === course.id 
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
                              {course.title}
                            </h3>
                            {course.description && (
                              <p className="text-xs text-gray-600 leading-tight">
                                {course.description}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        {/* Road sign reflective strips */}
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-t-md opacity-80 ${
                          highlightedCourse === course.id ? 'animate-pulse' : ''
                        }`}></div>
                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-b-md opacity-80 ${
                          highlightedCourse === course.id ? 'animate-pulse' : ''
                        }`}></div>
                      </div>
                      
                      {/* Hover effect - additional glow */}
                      <div className="absolute inset-0 bg-blue-400 rounded-md opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional content could go here */}
          <div className="text-center">
            <p className="text-gray-400">
              Click on any course sign to start your learning journey, or ask Senpai about the courses!
            </p>
          </div>
        </main>

        {/* AI Assistant Logo - Dynamic positioning to avoid course overlaps */}
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
          {/* Chat Bubble Label */}
          {!isAssistantEnlarged && (
            <div className="mb-3 relative animate-in fade-in duration-300">
              <div className="bg-white text-gray-800 text-sm px-4 py-3 rounded-2xl shadow-lg whitespace-nowrap border border-gray-100">
                Ask Senpai about courses
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
          
          {/* Assistant Button - Much Larger when clicked and dynamically positioned */}
          <button 
            className={`bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg hover:shadow-xl transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black ${
              isAssistantEnlarged ? 'w-24 h-24 hover:scale-105 shadow-2xl ring-4 ring-purple-400' : 'w-16 h-16 hover:scale-110'
            }`}
            onClick={handleAssistantClick}
          >
            <Image
              src="/images/senpai-logo.gif"
              alt="AI Assistant"
              width={isAssistantEnlarged ? 96 : 64}
              height={isAssistantEnlarged ? 96 : 64}
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
      </div>
    </>
  );
}
