"use client";

import { Header } from "@/components/layout/header";

export default function AnalyticsPage() {
  const dataPoints = [
    { label: "Roadmap → Course", seconds: 3, repeat: 1 },
    { label: "Course → Roadmap", seconds: 2, repeat: 0 },
    { label: "Milestone → Course", seconds: 5, repeat: 2 },
  ];

  // Hardcoded success metrics data
  const successMetrics = [
    {
      id: 1,
      timestamp: "2024-12-10 14:30:15",
      action: "Course Completion",
      course: "Machine Learning Fundamentals",
      details: "Completed all 8 milestones with 92% quiz accuracy",
      successScore: 92,
      aiResponse: "Excellent progress! User demonstrated strong understanding of ML concepts.",
      category: "learning"
    },
    {
      id: 2,
      timestamp: "2024-12-10 11:15:42",
      action: "Voice Command Success",
      course: "Frontend Development",
      details: "Successfully navigated to course roadmap using voice assistant",
      successScore: 95,
      aiResponse: "Perfect voice interaction. User efficiently used Senpai for navigation.",
      category: "interaction"
    },
    {
      id: 3,
      timestamp: "2024-12-09 16:22:08",
      action: "Milestone Achievement",
      course: "Backend APIs",
      details: "Completed 'REST API Design' milestone on first attempt",
      successScore: 88,
      aiResponse: "Great job! User grasped REST concepts quickly without confusion.",
      category: "learning"
    },
    {
      id: 4,
      timestamp: "2024-12-09 09:45:33",
      action: "Problem Solving",
      course: "Data Structures",
      details: "Solved binary tree traversal problem in 12 minutes",
      successScore: 85,
      aiResponse: "Solid problem-solving skills. Senpai's hints were well-utilized.",
      category: "coding"
    },
    {
      id: 5,
      timestamp: "2024-12-08 13:18:27",
      action: "Help Request Success",
      course: "React Components",
      details: "Asked Senpai for help with state management and applied solution correctly",
      successScore: 90,
      aiResponse: "User effectively leveraged AI assistance for practical problem solving.",
      category: "interaction"
    }
  ];

  const getSuccessColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 80) return "text-yellow-400";
    return "text-orange-400";
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "learning": return "bg-blue-500/20 text-blue-300";
      case "interaction": return "bg-purple-500/20 text-purple-300";
      case "coding": return "bg-green-500/20 text-green-300";
      default: return "bg-gray-500/20 text-gray-300";
    }
  };

  const chartWidth = 720;
  const chartHeight = 220;
  const padding = { top: 16, right: 16, bottom: 56, left: 36 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;
  const groupWidth = innerWidth / dataPoints.length;
  const barGap = 8;
  const barWidth = (groupWidth - barGap) / 2;
  const maxValue = Math.max(
    ...dataPoints.map(d => Math.max(d.seconds, d.repeat))
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Header showCreateCourseButton={false} showTryDemoButton={false} />

      <main className="max-w-5xl mx-auto pt-10 px-6 pb-16">
        <h1 className="text-3xl font-light mb-6">Your analytics</h1>
        
        {/* Success Metrics Section */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-light">Success Metrics</h2>
            <div className="flex items-center gap-2 text-sm text-purple-400">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.739 9 11 5.16-1.261 9-5.45 9-11V7l-10-5z"/>
              </svg>
              <span>Monitored by Senpai</span>
            </div>
          </div>
          
          {/* Success Metrics Cards */}
          <div className="grid gap-4 mb-6">
            {successMetrics.map((metric) => (
              <div key={metric.id} className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-white">{metric.action}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(metric.category)}`}>
                        {metric.category}
                      </span>
                      <span className={`text-sm font-semibold ${getSuccessColor(metric.successScore)}`}>
                        {metric.successScore}%
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mb-1">
                      {metric.course} • {metric.timestamp}
                    </div>
                    <div className="text-sm text-gray-200 mb-3">
                      {metric.details}
                    </div>
                  </div>
                </div>
                
                {/* Senpai AI Response */}
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <img 
                      src="/images/senpai-logo.gif" 
                      alt="Senpai" 
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="text-sm font-medium text-purple-300">Senpai Analysis</span>
                  </div>
                  <p className="text-sm text-gray-200">{metric.aiResponse}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Success Summary */}
          <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-medium text-white">Overall Success Summary</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">90%</div>
                <div className="text-sm text-gray-400">Average Success Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">5</div>
                <div className="text-sm text-gray-400">Recent Achievements</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">95%</div>
                <div className="text-sm text-gray-400">Senpai Interaction Score</div>
              </div>
            </div>
          </div>
        </section>

        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-[#0f0f0f]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">interest_switch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">repeat_audio</th>
              </tr>
            </thead>
            <tbody className="bg-black divide-y divide-gray-900">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">roadmap to course page 3 seconds</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">1</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">course page to roadmap 2 seconds</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">0</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">milestone to course page 5 seconds</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">2</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Graph: Interest switch (seconds) vs Repeat audio (count) */}
        <section className="mt-10">
          <h2 className="text-2xl font-light mb-2">Visual summary</h2>
          <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-4 overflow-x-auto">
            <div className="min-w-[760px]">
              <svg
                width={chartWidth}
                height={chartHeight}
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                role="img"
                aria-label="Interest switch seconds and repeat audio count"
              >
                {/* Axes */}
                <g transform={`translate(${padding.left},${padding.top})`}>
                  {/* Y grid */}
                  {Array.from({ length: 5 }).map((_, i) => {
                    const y = (innerHeight / 4) * i;
                    return (
                      <line
                        key={`grid-${i}`}
                        x1={0}
                        y1={y}
                        x2={innerWidth}
                        y2={y}
                        stroke="#1f2937"
                        strokeWidth={1}
                      />
                    );
                  })}
                  {/* Bars */}
                  {dataPoints.map((d, i) => {
                    const xGroup = i * groupWidth;
                    const hSeconds = (d.seconds / maxValue) * innerHeight;
                    const hRepeat = (d.repeat / maxValue) * innerHeight;
                    return (
                      <g key={d.label} transform={`translate(${xGroup},0)`}>
                        {/* Seconds bar (blue) */}
                        <rect
                          x={0}
                          y={innerHeight - hSeconds}
                          width={barWidth}
                          height={hSeconds}
                          fill="#3b82f6"
                          rx={4}
                        />
                        {/* Repeat bar (purple) */}
                        <rect
                          x={barWidth + barGap}
                          y={innerHeight - hRepeat}
                          width={barWidth}
                          height={hRepeat}
                          fill="#a855f7"
                          rx={4}
                        />
                        {/* X labels */}
                        <text
                          x={barWidth}
                          y={innerHeight + 18}
                          fill="#9ca3af"
                          fontSize={12}
                          textAnchor="middle"
                        >
                          {d.label}
                        </text>
                      </g>
                    );
                  })}
                  {/* Y axis label */}
                  <text x={-padding.left + 4} y={-6} fill="#9ca3af" fontSize={11}>
                    value (normalized)
                  </text>
                </g>
                {/* Legend */}
                <g transform={`translate(${padding.left},${chartHeight - 18})`}>
                  <rect width={12} height={12} fill="#3b82f6" rx={2} />
                  <text x={18} y={10} fill="#d1d5db" fontSize={12}>interest_switch (seconds)</text>
                  <rect x={220} width={12} height={12} fill="#a855f7" rx={2} />
                  <text x={238} y={10} fill="#d1d5db" fontSize={12}>repeat_audio (count)</text>
                </g>
              </svg>
            </div>
          </div>
        </section>

        {/* LLM Assessment Section */}
        <section className="mt-10">
          <h2 className="text-2xl font-light mb-2">LLM_RESP</h2>
          <h3 className="text-sm text-gray-400 mb-4">assessing convo between the user and the agent senpai</h3>
          <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-6 text-gray-200 whitespace-pre-line">
                    {/* LLM Assessment Section */}
        <section className="mt-10">
          <h2 className="text-2xl font-light mb-2">LLM_RESP</h2>
          <h3 className="text-sm text-gray-400 mb-4">assessing convo between the user and the agent senpai</h3>
          <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-6 text-gray-200 whitespace-pre-line">
            {`Overall, the conversation shows healthy engagement. The user explored the roadmap, navigated to a course page, and then returned to the roadmap within a short window, indicating active discovery behavior. The assistant's guidance was concise and context-aware, and repeating audio was used sparingly for clarification rather than due to confusion.

Success Metrics Analysis:
The user demonstrates exceptional learning progress with a 90% average success rate across different categories. Voice interactions with Senpai are particularly strong (95% success rate), indicating effective AI-human collaboration. Recent achievements show consistent milestone completion and problem-solving capabilities.

Key observations:
- Interest switches are quick (2–5s), consistent with scanning multiple learning paths.
- Repeat audio events (0–2) suggest the narration pace is acceptable for the user.
- The user appears motivated to proceed to milestones, with no signs of frustration.
- Strong success pattern in voice command usage and course completion rates.
- Effective utilization of Senpai's assistance for learning and navigation.

Recommendation: Continue with brief, step-wise instructions and surface next-step CTAs (e.g., "Open code editor", "Start quiz") when the user reaches milestones to maintain momentum. The high success metrics suggest the current interaction model is highly effective for this user.`}
          </div>
        </section>
          </div>
        </section>
      </main>
    </div>
  );
}

