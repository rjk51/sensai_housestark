import { NextRequest, NextResponse } from 'next/server';

interface MilestoneContext {
  milestoneId: number;
  milestoneTitle: string;
  milestoneDescription: string;
  completedTasks: number;
  totalTasks: number;
  progressPercentage: number;
}

interface Task {
  id: number;
  title: string;
  description: string;
  type: string;
  estimatedTime: string;
  completed: boolean;
}

interface RequestBody {
  text: string;
  milestone: MilestoneContext;
  tasks: Task[];
}

interface ResponseData {
  response: string;
  action?: {
    type: 'complete_task' | 'start_task' | 'navigate' | 'show_progress' | 'none';
    taskId?: number;
    target?: string;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<ResponseData>> {
  try {
    const body: RequestBody = await request.json();
    const { text, milestone, tasks } = body;

    // Convert text to lowercase for easier matching
    const userQuery = text.toLowerCase().trim();

    // Intent recognition and action mapping
    let response = '';
    let action: ResponseData['action'] = { type: 'none' };

    // Progress inquiries
    if (userQuery.includes('progress') || userQuery.includes('how many') || userQuery.includes('completed')) {
      response = `You have completed ${milestone.completedTasks} out of ${milestone.totalTasks} tasks in ${milestone.milestoneTitle}. That's ${milestone.progressPercentage}% complete!`;
      action = { type: 'show_progress' };
    }
    
    // Task completion requests
    else if (userQuery.includes('complete') || userQuery.includes('mark as done') || userQuery.includes('finish')) {
      const taskKeywords = extractTaskKeywords(userQuery);
      const taskToComplete = findTaskByKeywords(tasks, taskKeywords);
      
      if (taskToComplete) {
        if (taskToComplete.completed) {
          response = `The task "${taskToComplete.title}" is already completed! Great work!`;
        } else {
          response = `Great! I'll mark "${taskToComplete.title}" as completed for you. Keep up the excellent work!`;
          action = { type: 'complete_task', taskId: taskToComplete.id };
        }
      } else {
        response = `I couldn't identify which task you'd like to complete. Please be more specific about the task name.`;
      }
    }
    
    // Task starting requests
    else if (userQuery.includes('start') || userQuery.includes('begin') || userQuery.includes('work on')) {
      const taskKeywords = extractTaskKeywords(userQuery);
      const taskToStart = findTaskByKeywords(tasks, taskKeywords);
      
      if (taskToStart) {
        if (taskToStart.completed) {
          response = `The task "${taskToStart.title}" is already completed! Would you like to work on another task?`;
        } else {
          response = `Perfect! Let's start working on "${taskToStart.title}". This is a ${taskToStart.type} task that should take about ${taskToStart.estimatedTime}.`;
          action = { type: 'start_task', taskId: taskToStart.id };
        }
      } else {
        response = `I couldn't identify which task you'd like to start. Please be more specific about the task name.`;
      }
    }
    
    // Task type filtering
    else if (userQuery.includes('coding') || userQuery.includes('programming')) {
      const codingTasks = tasks.filter(task => task.type === 'coding');
      if (codingTasks.length > 0) {
        const taskList = codingTasks.map(task => `• ${task.title} (${task.estimatedTime}) - ${task.completed ? 'COMPLETED' : 'PENDING'}`).join('\n');
        response = `Here are the coding tasks in ${milestone.milestoneTitle}:\n${taskList}`;
      } else {
        response = `There are no coding tasks in this milestone.`;
      }
    }
    
    else if (userQuery.includes('quiz') || userQuery.includes('test')) {
      const quizTasks = tasks.filter(task => task.type === 'quiz');
      if (quizTasks.length > 0) {
        const taskList = quizTasks.map(task => `• ${task.title} (${task.estimatedTime}) - ${task.completed ? 'COMPLETED' : 'PENDING'}`).join('\n');
        response = `Here are the quiz tasks in ${milestone.milestoneTitle}:\n${taskList}`;
      } else {
        response = `There are no quiz tasks in this milestone.`;
      }
    }
    
    else if (userQuery.includes('reading')) {
      const readingTasks = tasks.filter(task => task.type === 'reading');
      if (readingTasks.length > 0) {
        const taskList = readingTasks.map(task => `• ${task.title} (${task.estimatedTime}) - ${task.completed ? 'COMPLETED' : 'PENDING'}`).join('\n');
        response = `Here are the reading tasks in ${milestone.milestoneTitle}:\n${taskList}`;
      } else {
        response = `There are no reading tasks in this milestone.`;
      }
    }
    
    else if (userQuery.includes('project')) {
      const projectTasks = tasks.filter(task => task.type === 'project');
      if (projectTasks.length > 0) {
        const taskList = projectTasks.map(task => `• ${task.title} (${task.estimatedTime}) - ${task.completed ? 'COMPLETED' : 'PENDING'}`).join('\n');
        response = `Here are the project tasks in ${milestone.milestoneTitle}:\n${taskList}`;
      } else {
        response = `There are no project tasks in this milestone.`;
      }
    }
    
    // List all tasks
    else if (userQuery.includes('list') || userQuery.includes('show all') || userQuery.includes('what tasks')) {
      const taskList = tasks.map(task => `• ${task.title} (${task.type}, ${task.estimatedTime}) - ${task.completed ? 'COMPLETED' : 'PENDING'}`).join('\n');
      response = `Here are all tasks in ${milestone.milestoneTitle}:\n${taskList}`;
    }
    
    // Next task recommendation
    else if (userQuery.includes('next') || userQuery.includes('what should i do') || userQuery.includes('recommend')) {
      const nextTask = tasks.find(task => !task.completed);
      if (nextTask) {
        response = `I recommend working on "${nextTask.title}" next. It's a ${nextTask.type} task that should take about ${nextTask.estimatedTime}. ${nextTask.description}`;
        action = { type: 'start_task', taskId: nextTask.id };
      } else {
        response = `Congratulations! You've completed all tasks in this milestone. You're ready to move to the next one!`;
      }
    }
    
    // Navigation requests
    else if (userQuery.includes('roadmap') || userQuery.includes('go back')) {
      response = `Taking you back to the roadmap overview.`;
      action = { type: 'navigate', target: 'roadmap' };
    }
    
    // Help and general guidance
    else if (userQuery.includes('help') || userQuery.includes('what can you do')) {
      response = `I can help you with your learning tasks! You can ask me to:
• Complete or start specific tasks
• Show your progress
• List tasks by type (coding, quiz, reading, project)
• Recommend what to do next
• Navigate back to the roadmap
Try saying things like "complete the quiz task" or "show my progress"`;
    }
    
    // Default response for unrecognized queries
    else {
      response = `I understand you said "${text}". I can help you manage your tasks in ${milestone.milestoneTitle}. Try asking me about your progress, completing tasks, or what to work on next!`;
    }

    return NextResponse.json({ response, action });
    
  } catch (error) {
    console.error('Error processing speech request:', error);
    return NextResponse.json(
      { 
        response: 'Sorry, I encountered an error processing your request. Please try again.',
        action: { type: 'none' }
      },
      { status: 500 }
    );
  }
}

// Helper function to extract task-related keywords from user query
function extractTaskKeywords(query: string): string[] {
  // Remove common words and extract meaningful terms
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'task', 'complete', 'start', 'begin', 'work', 'on'];
  const words = query.split(' ').filter(word => 
    word.length > 2 && !commonWords.includes(word.toLowerCase())
  );
  return words;
}

// Helper function to find task by keywords
function findTaskByKeywords(tasks: Task[], keywords: string[]): Task | null {
  if (keywords.length === 0) return null;

  // Score each task based on keyword matches
  const taskScores = tasks.map(task => {
    const taskText = (task.title + ' ' + task.description).toLowerCase();
    const score = keywords.reduce((acc, keyword) => {
      return acc + (taskText.includes(keyword.toLowerCase()) ? 1 : 0);
    }, 0);
    return { task, score };
  });

  // Find the task with the highest score
  const bestMatch = taskScores.reduce((best, current) => 
    current.score > best.score ? current : best
  );

  // Return the task if it has at least one keyword match
  return bestMatch.score > 0 ? bestMatch.task : null;
}
