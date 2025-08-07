"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCourses, useSchools, usePublicCourses, Course as ApiCourse } from "@/lib/api";
import CourseCard from "@/components/CourseCard";
import CreateCourseDialog from "@/components/CreateCourseDialog";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const { courses, isLoading, error } = useCourses();
  const { schools } = useSchools();
  const { courses: publicCourses, isLoading: isLoadingPublicCourses } = usePublicCourses();
  const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Voice assistant states
  const [isAssistantEnlarged, setIsAssistantEnlarged] = useState(false);
  const [isDebounced, setIsDebounced] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [logoAtButtons, setLogoAtButtons] = useState(false);

  // Memoize derived data to avoid recalculations
  const {
    teachingCourses,
    learningCourses,
    hasTeachingCourses,
    hasLearningCourses,
    hasAnyCourses,
    showSegmentedTabs
  } = useMemo(() => {
    const teachingCourses = courses.filter(course => course.role === 'admin');
    const learningCourses = courses.filter(course => course.role !== 'admin');
    const hasTeachingCourses = teachingCourses.length > 0;
    const hasLearningCourses = learningCourses.length > 0;

    return {
      teachingCourses,
      learningCourses,
      hasTeachingCourses,
      hasLearningCourses,
      hasAnyCourses: hasTeachingCourses || hasLearningCourses,
      showSegmentedTabs: hasTeachingCourses && hasLearningCourses
    };
  }, [courses]);

  // Filter public courses based on search query
  const filteredPublicCourses = useMemo(() => {
    if (!searchQuery.trim()) return publicCourses;
    
    return publicCourses.filter(course =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.org?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [publicCourses, searchQuery]);

  // Memoize initialActiveTab calculation
  const initialActiveTab = useMemo(() =>
    hasLearningCourses && !hasTeachingCourses ? 'learning' : 'teaching',
    [hasLearningCourses, hasTeachingCourses]
  );

  const [activeTab, setActiveTab] = useState<'teaching' | 'learning'>(initialActiveTab);
  const [hasSchool, setHasSchool] = useState<boolean | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  // Update school state based on API data
  useEffect(() => {
    if (schools && schools.length > 0) {
      setHasSchool(true);
      setSchoolId(schools[0].id);
    } else {
      setHasSchool(false);
    }
  }, [schools]);

  // Handle tab changes only when related data changes
  useEffect(() => {
    if (activeTab === 'teaching' && !hasTeachingCourses && hasLearningCourses) {
      setActiveTab('learning');
    } else if (activeTab === 'learning' && !hasLearningCourses && hasTeachingCourses) {
      setActiveTab('teaching');
    }
  }, [hasTeachingCourses, hasLearningCourses, activeTab]);

  // Memoize event handlers
  const handleCreateCourseButtonClick = useCallback(() => {
    if (hasSchool && schoolId) {
      // If school already exists, show the course creation dialog
      setIsCreateCourseDialogOpen(true);
    } else {
      // If no school exists, redirect to school creation page
      router.push("/school/admin/create");
    }
  }, [hasSchool, schoolId, router]);

  // Handle success callback from CreateCourseDialog
  const handleCourseCreationSuccess = useCallback((courseData: { id: string; name: string }) => {
    if (hasSchool && schoolId) {
      // Redirect to the new course page - dialog will be unmounted during navigation
      router.push(`/school/admin/${schoolId}/courses/${courseData.id}`);
    } else {
      router.push("/school/admin/create");
    }
  }, [hasSchool, schoolId, router]);

  // Voice assistant handler
  const handleAssistantClick = async () => {
    if (isDebounced || isTTSActive) return;
    setIsDebounced(true);
    setIsAssistantEnlarged(true);
    setLogoAtButtons(true);
    setIsTTSActive(true);
    
    // TTS message for home page
    const message = "Hey, I'm Senpai! I can help you navigate your courses, create new content, or discover other available courses. What would you like to do?";
    if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(message);
      utter.lang = 'en-US';
      
      utter.onend = () => {
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
            
            // Process voice commands
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

  // Process voice commands
  const processVoiceCommand = (transcript: string) => {
    const command = transcript.toLowerCase();
    
    if (command.includes('create') && command.includes('course')) {
      handleCreateCourseButtonClick();
    } else if (command.includes('teaching') || command.includes('created by me')) {
      setActiveTab('teaching');
    } else if (command.includes('learning') || command.includes('enrolled')) {
      setActiveTab('learning');
    } else if (command.includes('search') && command.includes('course')) {
      // Focus on search input
      const searchInput = document.querySelector('input[placeholder="Search courses..."]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    } else {
      console.log('Command not recognized:', command);
    }
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

      <div className="min-h-screen bg-black text-white overflow-y-auto">
        {/* Use the reusable Header component */}
        <Header
          showCreateCourseButton={hasAnyCourses || (hasSchool ?? false)}
          showTryDemoButton={!hasLearningCourses}
        />

        {/* Main content */}
        <main className="max-w-6xl mx-auto pt-6 px-8 pb-12">
          {/* Loading state */}
          {(isLoading || isLoadingPublicCourses) && (
            <div className="flex justify-center items-center py-12">
              <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
            </div>
          )}

          {/* Content when loaded */}
          {!isLoading && !isLoadingPublicCourses && (
            <div className="flex flex-col items-center">
              {/* Segmented control for tabs */}
              {showSegmentedTabs && (
                <div className="flex justify-center mb-8">
                  <div className="inline-flex bg-[#222222] rounded-lg p-1 w-full sm:w-auto">
                    <button
                      className={`flex items-center justify-center px-1 xxs:px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm xxs:font-medium cursor-pointer flex-1 sm:flex-initial ${activeTab === 'teaching'
                        ? 'bg-[#333333] text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                      onClick={() => setActiveTab('teaching')}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 6.25278V19.2528M12 6.25278C10.8321 5.47686 9.24649 5 7.5 5C5.75351 5 4.16789 5.47686 3 6.25278V19.2528C4.16789 18.4769 5.75351 18 7.5 18C9.24649 18 10.8321 18.4769 12 19.2528M12 6.25278C13.1679 5.47686 14.7535 5 16.5 5C18.2465 5 19.8321 5.47686 21 6.25278V19.2528C19.8321 18.4769 18.2465 18 16.5 18C14.7535 18 13.1679 18.4769 12 19.2528" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Created by you
                    </button>
                    <button
                      className={`flex items-center justify-center px-1 xxs:px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm xxs:font-medium cursor-pointer flex-1 sm:flex-initial ${activeTab === 'learning'
                        ? 'bg-[#333333] text-white'
                        : 'text-gray-400 hover:text-white'
                        }`}
                      onClick={() => setActiveTab('learning')}
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Enrolled courses
                    </button>
                  </div>
                </div>
              )}

              {/* Display content based on courses availability */}
              <div className="mb-8 w-full max-w-4xl">
                {!hasTeachingCourses && !hasLearningCourses ? (
                  // No courses at all - show universal placeholder
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-medium mb-2">What if your next big idea became a course?</h2>
                    <p className="text-gray-400 mb-6">It might be easier than you think</p>
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={handleCreateCourseButtonClick}
                        className="px-6 py-3 bg-white text-black text-sm font-medium rounded-full hover:opacity-90 transition-opacity inline-block cursor-pointer"
                      >
                        Create course
                      </button>
                    </div>
                  </div>
                ) : !(hasLearningCourses && hasTeachingCourses) && (
                  // User has some courses, show appropriate heading
                  <h2 className="text-2xl font-medium mb-6 text-center">
                    Your courses
                  </h2>
                )}
              </div>

              {/* Course grid */}
              {hasAnyCourses && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl mb-12">
                  {(activeTab === 'teaching' ? teachingCourses : learningCourses).map((course) => (
                    <CourseCard
                      key={course.id}
                      course={{
                        ...course,
                        title: course.org?.slug ? `@${course.org.slug}/${course.title}` : course.title,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Other Courses Section - Always show */}
              <div className="w-full max-w-6xl">
                <div className="mb-6">
                  <h2 className="text-2xl font-medium mb-2 text-center">Other courses</h2>
                  <p className="text-gray-400 text-center mb-4">Discover more courses from your school</p>
                  
                  {/* Search Bar */}
                  <div className="flex justify-center mb-6">
                    <div className="relative w-full max-w-md">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Search courses..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-[#222222] border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPublicCourses.length > 0 ? (
                    filteredPublicCourses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={{
                          ...course,
                          title: course.org?.slug ? `@${course.org.slug}/${course.title}` : course.title,
                        }}
                      />
                    ))
                  ) : (
                    <div className="col-span-full text-center py-12">
                      <p className="text-gray-400 text-lg">
                        {searchQuery.trim() ? `No courses found for "${searchQuery}"` : "No courses available"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* AI Assistant Logo - Bottom Right / Center when enlarged */}
      <div className={`fixed z-50 flex flex-col items-end transition-all duration-500 ${
        isAssistantEnlarged 
          ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center' 
          : 'bottom-6 right-6'
      }`}>
        {/* Chat Bubble Label */}
        {!isAssistantEnlarged && (
          <div className="mb-3 relative animate-in fade-in duration-300">
            <div className="bg-white text-gray-800 text-sm px-4 py-3 rounded-2xl shadow-lg whitespace-nowrap border border-gray-100">
              Ask Senpai
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

      {/* Create Course Dialog */}
      <CreateCourseDialog
        open={isCreateCourseDialogOpen}
        onClose={() => setIsCreateCourseDialogOpen(false)}
        onSuccess={handleCourseCreationSuccess}
        schoolId={schoolId || undefined}
      />
    </>
  );
}
