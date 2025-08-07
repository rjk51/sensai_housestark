"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

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

// Create a separate component that uses useSearchParams
function LoginContent() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const [isAssistantEnlarged, setIsAssistantEnlarged] = useState(false);
    const [isDebounced, setIsDebounced] = useState(false);
    const [transcription, setTranscription] = useState("");
    const [speechError, setSpeechError] = useState("");
    const [isTTSActive, setIsTTSActive] = useState(false);
    const [logoAtButtons, setLogoAtButtons] = useState(false);
    const [highlightGoogle, setHighlightGoogle] = useState(false);
    const [highlightVoxa, setHighlightVoxa] = useState(false);

    // Redirect if already authenticated
    useEffect(() => {
        if (session) {
            router.push(callbackUrl);
        }
    }, [session, callbackUrl, router]);

    const handleGoogleLogin = () => {
        signIn("google", { callbackUrl });
    };

    const handleVoxaLogin = () => {
        // TODO: Implement Voxa authentication
        // For now, we'll add a placeholder that could redirect to Voxa's auth endpoint
        console.log("Voxa login clicked - implement Voxa OAuth flow");
        
        // Placeholder for future Voxa OAuth implementation
        // This could be similar to: signIn("voxa", { callbackUrl });
        // or a custom OAuth flow depending on Voxa's authentication method
        alert("Voxa authentication coming soon!");
    };

    const handleAssistantClick = async () => {
        if (isDebounced || isTTSActive) return;
        setIsDebounced(true);
        setIsAssistantEnlarged(true);
        setLogoAtButtons(true);
        setIsTTSActive(true);
        setHighlightGoogle(false);
        setHighlightVoxa(false);
        // TTS message
        const message = "Hey my name is Senpai - I will be your partner in our learning journey. First - let’s log you in Sensai, you can do Google auth or voxa vocal auth.";
        if ('speechSynthesis' in window) {
            const utter = new window.SpeechSynthesisUtterance(message);
            utter.lang = 'en-US';
            // Highlight logic based on spoken words
            utter.onboundary = (event) => {
                if (!event.charIndex) return;
                const spoken = message.substring(0, event.charIndex + 1).toLowerCase();
                if (spoken.includes("google auth")) {
                    setHighlightGoogle(true);
                    setHighlightVoxa(false);
                } else if (spoken.includes("voxa vocal auth")) {
                    setHighlightGoogle(false);
                    setHighlightVoxa(true);
                }
            };
            utter.onend = () => {
                setHighlightGoogle(false);
                setHighlightVoxa(false);
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

    // Show loading state while checking session
    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
                <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <style jsx>{burstStyles}</style>
            <div className="min-h-screen bg-black bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-900/20 via-black to-black flex flex-col justify-center items-center px-4 py-12">
                <div className={`w-full max-w-5xl mx-auto relative transition-all duration-500 ${isAssistantEnlarged ? 'blur-md' : ''}`}>


                {/* Content */}
                <div className="md:grid md:grid-cols-12 gap-8 items-center">


                    {/* Main copy - spans 7 columns on desktop */}
                    <div className="md:col-span-7 mb-8 md:mb-0 text-center md:text-left">
                        {/* Logo */}
                        <div className="flex justify-center md:justify-start mb-8">
                            <Image
                                src="/images/sensai-logo.svg"
                                alt="SensAI Logo"
                                width={240}
                                height={80}
                                className="w-[180px] md:w-[240px] h-auto"
                                priority
                            />
                        </div>

                        <h1 className="text-4xl md:text-5xl font-light text-white leading-tight">
                            <span className="text-white">Teach </span>
                            <span className="text-purple-400">smarter</span>
                        </h1>
                        <h1 className="text-4xl md:text-5xl font-light text-white leading-tight">
                            <span className="text-white">Reach </span>
                            <span className="text-purple-400">further</span>
                        </h1>

                        <p className="text-lg md:text-xl text-gray-300 mt-6 mb-6 max-w-md">
                            SensAI is an AI-powered LMS that coaches every learner by asking questions without giving away the answer and grades their responses like your favourite teaching assistant so that you can maximize your reach without sacrificing quality
                        </p>
                    </div>

                    {/* Login card - spans 5 columns on desktop */}
                    <div className="md:col-span-5">
                        <div className="mx-4 md:mx-0 space-y-4">
                            <button
                                onClick={handleGoogleLogin}
                                className="flex items-center justify-center w-full py-3 px-4 bg-white border border-gray-300 rounded-full text-black hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer mx-4"
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Sign in with Google
                            </button>

                            <button
                                onClick={handleVoxaLogin}
                                className="flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-full text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer mx-4"
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
                                    <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                </svg>
                                Sign in with Voxa
                            </button>

                            <div className="px-4 md:px-8 py-4">
                                <p className="text-xs text-gray-500">
                                    By continuing, you acknowledge that you understand and agree to the{" "}
                                    <Link href="https://hyperverge.notion.site/SensAI-Terms-of-Use-1627e7c237cb80dc9bd2dac685d42f31?pvs=73" className="text-purple-400 hover:underline">
                                        Terms & Conditions
                                    </Link>{" "}
                                    and{" "}
                                    <Link href="https://hyperverge.notion.site/SensAI-Privacy-Policy-1627e7c237cb80e5babae67e64642f27" className="text-purple-400 hover:underline">
                                        Privacy Policy
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Assistant Logo - Bottom Right / Center when enlarged */}
            <div className={`fixed z-50 flex flex-col items-end transition-all duration-500 ${
                isAssistantEnlarged 
                    ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center' 
                    : 'bottom-6 right-6'
            }`}>
                {/* Chat Bubble Label with Burst Animation */}
                {!isAssistantEnlarged && (
                    <div className="mb-3 relative animate-in fade-in duration-300">
                        <div className="bg-white text-gray-800 text-sm px-4 py-3 rounded-2xl shadow-lg whitespace-nowrap border border-gray-100">
                            Talk to Senpai
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
        </div>
        </>
    );
}

// Main component with Suspense boundary
export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-black px-4">
                <div className="w-12 h-12 border-t-2 border-b-2 border-white rounded-full animate-spin"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}