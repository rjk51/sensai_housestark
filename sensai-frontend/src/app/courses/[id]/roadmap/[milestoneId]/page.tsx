"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import Image from "next/image";

interface Task {
  id: number;
  title: string;
  description: string;
  type: 'reading' | 'coding' | 'quiz' | 'project';
  estimatedTime: string;
  completed: boolean;
}

interface MilestoneData {
  id: number;
  title: string;
  description: string;
  tasks: Task[];
}

export default function MilestonePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id;
  const milestoneId = parseInt(params.milestoneId as string);

  // Voice assistant states
  const [isAssistantEnlarged, setIsAssistantEnlarged] = useState(false);
  const [isDebounced, setIsDebounced] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [speechError, setSpeechError] = useState("");
  const [isTTSActive, setIsTTSActive] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<number[]>([]);
  const [lastTTSMessage, setLastTTSMessage] = useState<string>("");
  const [wasManuallyStopped, setWasManuallyStopped] = useState(false);
  const milestoneData: Record<number, MilestoneData> = {
    1: {
      id: 1,
      title: "Foundations of ML",
      description: "Learn the fundamental concepts of machine learning, including types of learning, basic terminology, and core principles.",
      tasks: [
        {
          id: 1,
          title: "What is Machine Learning?",
          description: "Read about the basics of machine learning and understand different types of learning algorithms.",
          type: 'reading',
          estimatedTime: '30 min',
          completed: false
        },
        {
          id: 2,
          title: "ML Terminology Quiz",
          description: "Test your understanding of basic machine learning terminology and concepts.",
          type: 'quiz',
          estimatedTime: '15 min',
          completed: false
        },
        {
          id: 3,
          title: "Types of Machine Learning",
          description: "Explore supervised, unsupervised, and reinforcement learning with examples.",
          type: 'reading',
          estimatedTime: '45 min',
          completed: false
        },
        {
          id: 4,
          title: "Simple Linear Regression",
          description: "Implement a basic linear regression model from scratch using Python.",
          type: 'coding',
          estimatedTime: '2 hours',
          completed: false
        }
      ]
    },
    2: {
      id: 2,
      title: "Python & Data",
      description: "Master Python programming for data science and learn essential libraries like NumPy, Pandas, and Matplotlib.",
      tasks: [
        {
          id: 1,
          title: "Python Fundamentals Review",
          description: "Review Python basics including data structures, functions, and object-oriented programming.",
          type: 'reading',
          estimatedTime: '1 hour',
          completed: false
        },
        {
          id: 2,
          title: "NumPy Array Operations",
          description: "Learn to work with NumPy arrays and perform mathematical operations efficiently.",
          type: 'coding',
          estimatedTime: '1.5 hours',
          completed: false
        },
        {
          id: 3,
          title: "Data Manipulation with Pandas",
          description: "Master data loading, cleaning, and manipulation using the Pandas library.",
          type: 'coding',
          estimatedTime: '2 hours',
          completed: false
        },
        {
          id: 4,
          title: "Data Visualization Project",
          description: "Create comprehensive visualizations of a dataset using Matplotlib and Seaborn.",
          type: 'project',
          estimatedTime: '3 hours',
          completed: false
        }
      ]
    },
    3: {
      id: 3,
      title: "Supervised Learning",
      description: "Dive deep into supervised learning algorithms including classification and regression techniques.",
      tasks: [
        {
          id: 1,
          title: "Classification vs Regression",
          description: "Understand the difference between classification and regression problems with examples.",
          type: 'reading',
          estimatedTime: '30 min',
          completed: false
        },
        {
          id: 2,
          title: "Decision Trees Implementation",
          description: "Build a decision tree classifier from scratch and understand the algorithm.",
          type: 'coding',
          estimatedTime: '2 hours',
          completed: false
        },
        {
          id: 3,
          title: "Model Evaluation Metrics",
          description: "Learn about accuracy, precision, recall, F1-score, and other evaluation metrics.",
          type: 'quiz',
          estimatedTime: '20 min',
          completed: false
        },
        {
          id: 4,
          title: "Customer Churn Prediction",
          description: "Build a complete supervised learning model to predict customer churn.",
          type: 'project',
          estimatedTime: '4 hours',
          completed: false
        }
      ]
    },
    4: {
      id: 4,
      title: "Deep Learning",
      description: "Explore neural networks and deep learning architectures including CNNs and RNNs.",
      tasks: [
        {
          id: 1,
          title: "Neural Network Fundamentals",
          description: "Understand perceptrons, multi-layer networks, and backpropagation algorithm.",
          type: 'reading',
          estimatedTime: '1 hour',
          completed: false
        },
        {
          id: 2,
          title: "Build Your First Neural Network",
          description: "Implement a simple neural network using TensorFlow or PyTorch.",
          type: 'coding',
          estimatedTime: '2.5 hours',
          completed: false
        },
        {
          id: 3,
          title: "Convolutional Neural Networks",
          description: "Learn about CNNs and their application in image recognition tasks.",
          type: 'reading',
          estimatedTime: '45 min',
          completed: false
        },
        {
          id: 4,
          title: "Image Classification Project",
          description: "Build a CNN to classify images from the CIFAR-10 dataset.",
          type: 'project',
          estimatedTime: '5 hours',
          completed: false
        }
      ]
    },
    5: {
      id: 5,
      title: "Production ML",
      description: "Learn how to deploy and maintain machine learning models in production environments.",
      tasks: [
        {
          id: 1,
          title: "MLOps Fundamentals",
          description: "Understand the principles of MLOps and production ML workflows.",
          type: 'reading',
          estimatedTime: '45 min',
          completed: false
        },
        {
          id: 2,
          title: "Model Deployment with Flask",
          description: "Deploy your trained model as a REST API using Flask framework.",
          type: 'coding',
          estimatedTime: '3 hours',
          completed: false
        },
        {
          id: 3,
          title: "Model Monitoring and Maintenance",
          description: "Learn about model drift, monitoring, and retraining strategies.",
          type: 'reading',
          estimatedTime: '30 min',
          completed: false
        },
        {
          id: 4,
          title: "End-to-End ML Pipeline",
          description: "Build a complete ML pipeline from data ingestion to model deployment.",
          type: 'project',
          estimatedTime: '6 hours',
          completed: false
        }
      ]
    }
  };

  const currentMilestone = milestoneData[milestoneId];

  // Voice assistant handler
  const handleAssistantClick = async () => {
    if (isDebounced || isTTSActive) return;
    setIsDebounced(true);
    setIsAssistantEnlarged(true);
    setIsTTSActive(true);
    setWasManuallyStopped(false);
    
    // TTS message for milestone page
    const message = `Welcome to ${currentMilestone.title}! I can help you with the learning tasks in this milestone. What would you like to know?`;
    setLastTTSMessage(message);
    
    if ('speechSynthesis' in window) {
      const utter = new window.SpeechSynthesisUtterance(message);
      utter.lang = 'en-US';
      utter.rate = 0.9;
      
      // Set female voice preferences
      try {
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
          const highPitchVoice = voices.find(voice => voice.lang.startsWith('en'));
          if (highPitchVoice) {
            utter.voice = highPitchVoice;
          }
        }
      } catch {}
      
      utter.pitch = 1.2;
      
      utter.onend = () => {
        setIsTTSActive(false);

        // If manually stopped, just reset UI and do not start recognition
        if (wasManuallyStopped) {
          setWasManuallyStopped(false);
          setIsAssistantEnlarged(false);
          setIsDebounced(false);
          return;
        }

        // Start voice recognition
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

          recognition.onresult = async (event: any) => {
            const transcript = event.results[0][0].transcript;
            console.log('Speech recognition result:', transcript);
            setTranscription(transcript);
            setSpeechError("");
            
            // Prepare data for our local API
            const requestData = {
              text: transcript,
              milestone: {
                milestoneId: currentMilestone.id,
                milestoneTitle: currentMilestone.title,
                milestoneDescription: currentMilestone.description,
                completedTasks: completedTasks.length,
                totalTasks: currentMilestone.tasks.length,
                progressPercentage: Math.round((completedTasks.length / currentMilestone.tasks.length) * 100)
              },
              tasks: currentMilestone.tasks.map(task => ({
                id: task.id,
                title: task.title,
                description: task.description,
                type: task.type,
                estimatedTime: task.estimatedTime,
                completed: completedTasks.includes(task.id)
              }))
            };
            
            // Send request to our local API endpoint
            try {
              const response = await fetch('/api/milestone/speech', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
              });
              
              if (response.ok) {
                const data = await response.json();
                console.log('API response:', data);
                
                // Handle actions returned by the API
                if (data.action) {
                  switch (data.action.type) {
                    case 'complete_task':
                      if (data.action.taskId) {
                        handleTaskComplete(data.action.taskId);
                      }
                      break;
                    case 'start_task':
                      // Could scroll to the task or highlight it
                      if (data.action.taskId) {
                        console.log('Starting task:', data.action.taskId);
                        // Optional: Add visual feedback for starting a task
                      }
                      break;
                    case 'navigate':
                      if (data.action.target === 'roadmap') {
                        setTimeout(() => {
                          router.push(`/courses/${courseId}/roadmap`);
                        }, 2000); // Give time for TTS to finish
                      }
                      break;
                    case 'show_progress':
                      // Could add visual emphasis to progress bar
                      console.log('Showing progress');
                      break;
                  }
                }
                
                // Use the API response for TTS
                const responseText = data.response || 'I received your message but couldn\'t process it properly.';
                console.log('Using response text:', responseText);
                
                const responseUtter = new window.SpeechSynthesisUtterance(responseText);
                responseUtter.lang = 'en-US';
                responseUtter.rate = 0.9;
                responseUtter.pitch = 1.2;
                
                try {
                  const voices2 = window.speechSynthesis.getVoices();
                  const femaleVoice2 = voices2.find(voice => 
                    voice.lang.startsWith('en') && 
                    (voice.name.toLowerCase().includes('female') || 
                     voice.name.toLowerCase().includes('woman') ||
                     voice.name.toLowerCase().includes('samantha') ||
                     voice.name.toLowerCase().includes('susan') ||
                     voice.name.toLowerCase().includes('karen') ||
                     voice.name.toLowerCase().includes('victoria') ||
                     voice.name.toLowerCase().includes('zira'))
                  );
                  if (femaleVoice2) responseUtter.voice = femaleVoice2;
                } catch {}
                
                responseUtter.onend = () => {
                  resetUI();
                };
                
                window.speechSynthesis.speak(responseUtter);
              } else {
                setSpeechError('Failed to get response from assistant. Please try again.');
                resetUI();
              }
            } catch (error) {
              console.error('API request failed:', error);
              setSpeechError('Network error. Please check your connection and try again.');
              resetUI();
            }
            
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
      try {
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
        if (femaleVoice) utter.voice = femaleVoice;
      } catch {}
      utter.pitch = 1.2;
      utter.onend = () => {
        setIsTTSActive(false);
        setIsAssistantEnlarged(false);
        setIsDebounced(false);
      };
      window.speechSynthesis.speak(utter);
    }
  };

  if (!currentMilestone) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Milestone not found</h1>
          <button 
            onClick={() => router.push(`/courses/${courseId}/roadmap`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Roadmap
          </button>
        </div>
      </div>
    );
  }

  const handleTaskComplete = (taskId: number) => {
    setCompletedTasks(prev => 
      prev.includes(taskId) 
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'reading':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'coding':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        );
      case 'quiz':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'project':
        return (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'reading': return 'bg-blue-100 text-blue-800';
      case 'coding': return 'bg-green-100 text-green-800';
      case 'quiz': return 'bg-purple-100 text-purple-800';
      case 'project': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const completedCount = completedTasks.length;
  const totalTasks = currentMilestone.tasks.length;
  const progressPercentage = (completedCount / totalTasks) * 100;

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

      <div className="min-h-screen bg-black text-white">
      <Header showCreateCourseButton={false} showTryDemoButton={false} />
      
      <main className="max-w-4xl mx-auto pt-6 px-8 pb-12">
        {/* Back button */}
        <button 
          onClick={() => router.push(`/courses/${courseId}/roadmap`)}
          className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Roadmap
        </button>

        {/* Milestone Header */}
        <div className="bg-gray-900 rounded-lg p-8 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{currentMilestone.title}</h1>
              <p className="text-gray-400 text-lg">{currentMilestone.description}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-400">{completedCount}/{totalTasks}</div>
              <div className="text-sm text-gray-400">Tasks Completed</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold mb-6">Learning Tasks</h2>
          
          {currentMilestone.tasks.map((task) => {
            const isCompleted = completedTasks.includes(task.id);
            
            return (
              <div 
                key={task.id}
                className={`bg-gray-900 rounded-lg p-6 border-2 transition-all duration-200 ${
                  isCompleted 
                    ? 'border-green-500 bg-green-900/20' 
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className={`p-2 rounded-lg mr-3 ${getTaskTypeColor(task.type)}`}>
                        {getTaskIcon(task.type)}
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                          {task.title}
                        </h3>
                        <div className="flex items-center space-x-3 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${getTaskTypeColor(task.type)}`}>
                            {task.type}
                          </span>
                          <span className="text-sm text-gray-400">
                            ⏱️ {task.estimatedTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className={`text-gray-300 mb-4 ${isCompleted ? 'line-through text-gray-500' : ''}`}>
                      {task.description}
                    </p>
                    
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleTaskComplete(task.id)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          isCompleted
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isCompleted ? '✅ Completed' : 'Start Task'}
                      </button>
                      
                      {task.type === 'coding' && (
                        <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors">
                          Open Code Editor
                        </button>
                      )}
                      
                      {task.type === 'quiz' && (
                        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                          Take Quiz
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {isCompleted && (
                    <div className="ml-4">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Next Milestone Button */}
        {progressPercentage === 100 && milestoneId < 5 && (
          <div className="mt-12 text-center">
            <button 
              onClick={() => router.push(`/courses/${courseId}/roadmap/${milestoneId + 1}`)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              Continue to Next Milestone →
            </button>
          </div>
        )}

        {/* Course Completion */}
        {progressPercentage === 100 && milestoneId === 5 && (
          <div className="mt-12 text-center bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-lg p-8">
            <h3 className="text-2xl font-bold mb-2">🎉 Congratulations!</h3>
            <p className="text-gray-300 mb-4">You've completed all tasks in this milestone!</p>
            <p className="text-sm text-gray-400">This is the final milestone of the Machine Learning course.</p>
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
              Ask Senpai about tasks
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
