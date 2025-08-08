"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { bufferConversationEvent } from "@/lib/analytics";

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
    const [isTTSActive, setIsTTSActive] = useState(false);
    const [logoAtButtons, setLogoAtButtons] = useState(false);
    const [highlightGoogle, setHighlightGoogle] = useState(false);
    const [highlightVoxa, setHighlightVoxa] = useState(false);
    const [logoPosition, setLogoPosition] = useState<'center' | 'google' | 'voxa'>('center');
    const [lastTTSMessage, setLastTTSMessage] = useState<string>("");
    const [wasManuallyStopped, setWasManuallyStopped] = useState(false);
    const [repeatCount, setRepeatCount] = useState(0);

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
        setWasManuallyStopped(false);
        // TTS message
        const message = "Hey my name is Senpai - I will be your partner in our learning journey. First - let’s log you in Sensai, you can do Google auth or voxa vocal auth.";
        setLastTTSMessage(message);
        if ('speechSynthesis' in window) {
            const utter = new window.SpeechSynthesisUtterance(message);
            utter.lang = 'en-US';
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
            
            // Set up a timer to check spoken text more frequently
            let checkInterval: NodeJS.Timeout;
            let currentCharIndex = 0;
            let lastGoogleIndex = -1;
            let lastVoxaIndex = -1;
            // Highlight logic based on spoken words
            utter.onboundary = (event) => {
                if (!event.charIndex) return;
                currentCharIndex = event.charIndex;
                const spoken = message.substring(0, event.charIndex + 1).toLowerCase();
                console.log('Spoken so far:', spoken); // Debug log
                
                // Find the latest occurrence of each phrase
                const googleIndex = spoken.lastIndexOf("google auth");
                const voxaIndex = Math.max(
                    spoken.lastIndexOf("voxa vocal auth"),
                    spoken.lastIndexOf("voxa auth"),
                    spoken.lastIndexOf("voxa"),
                    spoken.lastIndexOf("vocal auth")
                );
                
                // Update indices if we found new occurrences
                if (googleIndex > lastGoogleIndex) {
                    lastGoogleIndex = googleIndex;
                }
                if (voxaIndex > lastVoxaIndex) {
                    lastVoxaIndex = voxaIndex;
                }
                
                // Determine which button to highlight based on the most recent mention
                if (lastVoxaIndex > lastGoogleIndex) {
                    console.log('Highlighting Voxa (latest)'); // Debug log
                    setHighlightGoogle(false);
                    setHighlightVoxa(true);
                    setLogoPosition('voxa');
                } else if (lastGoogleIndex > lastVoxaIndex) {
                    console.log('Highlighting Google (latest)'); // Debug log
                    setHighlightGoogle(true);
                    setHighlightVoxa(false);
                    setLogoPosition('google');
                }
            };
            
            // Start a timer to check more frequently
            checkInterval = setInterval(() => {
                const spoken = message.substring(0, currentCharIndex + 1).toLowerCase();
                
                // Find the latest occurrence of each phrase
                const googleIndex = spoken.lastIndexOf("google auth");
                const voxaIndex = Math.max(
                    spoken.lastIndexOf("voxa vocal auth"),
                    spoken.lastIndexOf("voxa auth"),
                    spoken.lastIndexOf("voxa"),
                    spoken.lastIndexOf("vocal auth")
                );
                
                // Update indices if we found new occurrences
                if (googleIndex > lastGoogleIndex) {
                    lastGoogleIndex = googleIndex;
                }
                if (voxaIndex > lastVoxaIndex) {
                    lastVoxaIndex = voxaIndex;
                }
                
                // Determine which button to highlight based on the most recent mention
                if (lastVoxaIndex > lastGoogleIndex) {
                    console.log('Timer: Highlighting Voxa (latest)'); // Debug log
                    setHighlightGoogle(false);
                    setHighlightVoxa(true);
                    setLogoPosition('voxa');
                } else if (lastGoogleIndex > lastVoxaIndex) {
                    console.log('Timer: Highlighting Google (latest)'); // Debug log
                    setHighlightGoogle(true);
                    setHighlightVoxa(false);
                    setLogoPosition('google');
                }
            }, 100); // Check every 100ms
                        utter.onend = () => {
                // Clear the check interval
                if (checkInterval) {
                    clearInterval(checkInterval);
                }
                
                if (wasManuallyStopped) {
                    setWasManuallyStopped(false);
                    setHighlightGoogle(false);
                    setHighlightVoxa(false);
                    setLogoPosition('center');
                    setIsTTSActive(false);
                    setIsAssistantEnlarged(false);
                    setLogoAtButtons(false);
                    setIsDebounced(false);
                    return;
                }

                setHighlightGoogle(false);
                setHighlightVoxa(false);
                setLogoPosition('center');
                setIsTTSActive(false);
                setIsAssistantEnlarged(false);
                setLogoAtButtons(false);
                setIsDebounced(false);
            };
            window.speechSynthesis.speak(utter);
        } else {
            setIsAssistantEnlarged(false);
            setLogoAtButtons(false);
            setIsDebounced(false);
            setLogoPosition('center');
            setHighlightGoogle(false);
            setHighlightVoxa(false);
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
            setLogoAtButtons(false);
            setIsDebounced(false);
            setLogoPosition('center');
            setHighlightGoogle(false);
            setHighlightVoxa(false);
        }
    };

    // Repeat previous TTS prompt without starting recognition
    const handleRepeatAssistant = () => {
        if (!lastTTSMessage) return;
        if ('speechSynthesis' in window) {
            setRepeatCount((prev) => prev + 1);
            setIsAssistantEnlarged(true);
            setLogoAtButtons(true);
            setIsDebounced(true);
            setIsTTSActive(true);
            setWasManuallyStopped(false);
            bufferConversationEvent({ type: 'repeat', timestamp: Date.now() });

            const utter = new window.SpeechSynthesisUtterance(lastTTSMessage);
            utter.lang = 'en-US';
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
            utter.onend = () => {
                setIsTTSActive(false);
                setIsAssistantEnlarged(false);
                setLogoAtButtons(false);
                setIsDebounced(false);
            };
            window.speechSynthesis.speak(utter);
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
                <div className="w-full max-w-5xl mx-auto relative transition-all duration-500">


                {/* Content */}
                <div className="md:grid md:grid-cols-12 gap-8 items-center">


                    {/* Main copy - spans 7 columns on desktop */}
                    <div className={`md:col-span-7 mb-8 md:mb-0 text-center md:text-left transition-all duration-300 ${isAssistantEnlarged ? 'blur-md' : ''}`}>
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
                            <div className={`transition-all duration-300 ${isAssistantEnlarged && !highlightGoogle ? 'blur-md' : ''}`}>
                            <button
                                onClick={handleGoogleLogin}
                                    className={`flex items-center justify-center w-full py-3 px-4 bg-white border border-gray-300 rounded-full text-black hover:bg-gray-100 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer mx-4 ${
                                        highlightGoogle 
                                            ? 'ring-4 ring-purple-400 shadow-2xl scale-105 bg-yellow-50 border-purple-400' 
                                            : ''
                                    }`}
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
                            </div>

                            <div className={`transition-all duration-300 ${isAssistantEnlarged && !highlightVoxa ? 'blur-md' : ''}`}>
                            <button
                                onClick={handleVoxaLogin}
                                    className={`flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 border border-transparent rounded-full text-white hover:from-blue-700 hover:to-purple-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer mx-4 ${
                                        highlightVoxa 
                                            ? 'ring-4 ring-purple-400 shadow-2xl scale-105 from-blue-500 to-purple-500' 
                                            : ''
                                    }`}
                            >
                                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
                                    <path d="M8 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                                </svg>
                                Sign in with Voxa
                            </button>
                            </div>

                            <div className={`px-4 md:px-8 py-4 transition-all duration-300 ${isAssistantEnlarged ? 'blur-md' : ''}`}>
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

            {/* AI Assistant Logo - Bottom Right / Center when enlarged / Near buttons when highlighting */}
            <div className={`fixed z-50 flex flex-col items-end transition-all duration-500 ${
                isAssistantEnlarged 
                    ? logoPosition === 'center'
                    ? 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 items-center' 
                        : logoPosition === 'google'
                        ? 'top-1/3 left-1/4 transform -translate-x-1/2 -translate-y-1/2 items-center'
                        : 'top-1/3 right-1/4 transform -translate-x-1/2 -translate-y-1/2 items-center'
                    : 'bottom-6 right-6'
            }`}>
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