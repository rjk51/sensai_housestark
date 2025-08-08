"use client";

import { Header } from "@/components/layout/header";
import { flushConversationBuffer, getLastAnalytics } from "@/lib/analytics";
import { useEffect, useState, useMemo } from "react";

export default function AnalyticsPage() {
  const [serverAnalytics, setServerAnalytics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Always attempt to flush on enter; if no new events, show cached analytics if available.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const resp = await flushConversationBuffer();
        if (mounted && resp) {
          setServerAnalytics(resp);
        } else if (mounted) {
          const cached = getLastAnalytics();
          if (cached) setServerAnalytics(cached);
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const interactionMetrics = serverAnalytics?.analytics?.interaction_metrics ?? null;
  const interestSwitchCount = useMemo(() => {
    const arr = interactionMetrics?.interest_switch;
    return Array.isArray(arr) ? arr.length : 0;
  }, [interactionMetrics]);
  const repeatAudioCount = useMemo(() => {
    const arr = interactionMetrics?.repeat_audio;
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((sum: number, item: any) => sum + (Number(item?.count ?? 0) || 0), 0);
  }, [interactionMetrics]);

  // Derive dynamic success cards from server response
  const derivedSuccessCards = useMemo(() => {
    const sm = serverAnalytics?.data?.analytics?.success_metrics;
    if (!sm) return [] as any[];
    const map: Array<{ key: string; action: string; category: string }> = [
      { key: 'course_completion', action: 'Course Completion', category: 'learning' },
      { key: 'milestone_achievement', action: 'Milestone Achievement', category: 'learning' },
      { key: 'voice_command_success', action: 'Voice Command Success', category: 'interaction' },
      { key: 'problem_solving', action: 'Problem Solving', category: 'coding' },
      { key: 'help_request_success', action: 'Help Request Success', category: 'interaction' },
    ];
    const now = new Date();
    const ts = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
    const aiText = serverAnalytics?.data?.analytics?.llm_resp?.success_metrics
      || serverAnalytics?.data?.analytics?.llm_resp?.recommendations
      || serverAnalytics?.data?.analytics?.llm_resp?.overall_assessment
      || 'N/A';
    return map
      .map(cfg => {
        const entry: any = sm[cfg.key] || {};
        const percentage = Number(entry?.percentage ?? 0);
        const details = String(entry?.details ?? '');
        return {
          id: cfg.key,
          timestamp: ts,
          action: cfg.action,
          course: 'N/A',
          details,
          successScore: percentage,
          aiResponse: aiText,
          category: cfg.category,
        };
      })
      .filter(card => card.successScore !== 0 || card.details);
  }, [serverAnalytics]);
  // Build dynamic data points from server response
  const dataPoints = useMemo(() => {
    const im = serverAnalytics?.data?.analytics?.interaction_metrics;
    const interestArray = Array.isArray(im?.interest_switch) ? im.interest_switch : [];
    const repeatArray = Array.isArray(im?.repeat_audio) ? im.repeat_audio : [];
    // We do not have durations from server; map each interest switch to 1 unit, and repeats by count
    const interestCount = interestArray.length;
    const repeatCount = repeatArray.reduce((sum: number, r: any) => sum + (Number(r?.count ?? 0) || 0), 0);
    if (interestCount === 0 && repeatCount === 0) {
      return [] as Array<{ label: string; seconds: number; repeat: number }>;
    }
    return [
      { label: "Interactions", seconds: interestCount, repeat: repeatCount },
    ];
  }, [serverAnalytics]);

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
  const groupWidth = dataPoints.length ? innerWidth / dataPoints.length : innerWidth;
  const barGap = 8;
  const barWidth = (groupWidth - barGap) / 2;
  const maxValue = dataPoints.length ? Math.max(
    ...dataPoints.map(d => Math.max(d.seconds, d.repeat))
  ) : 1;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header showCreateCourseButton={false} showTryDemoButton={false} />

      <main className="max-w-5xl mx-auto pt-10 px-6 pb-16">
        <h1 className="text-3xl font-light mb-6">Your analytics</h1>
        {isLoading && (
          <div className="mb-6 flex items-center gap-3 text-sm text-gray-300">
            <div className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin" />
            <span>Submitting buffered conversation for analysis…</span>
          </div>
        )}
        {!isLoading && !serverAnalytics && (
          <div className="text-sm text-gray-400">No analytics available yet. Interact with Senpai and return here.</div>
        )}
        
        {!isLoading && serverAnalytics && (
          <>
          {/* Success Metrics Section (server-driven if available, otherwise hardcoded) */}
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
              {(derivedSuccessCards.length > 0 ? derivedSuccessCards : successMetrics).map((metric: any) => (
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
                 <div className="text-2xl font-bold text-green-400">{serverAnalytics?.data?.analytics?.success_metrics?.overall_summary?.average_success_rate ?? 90}%</div>
                <div className="text-sm text-gray-400">Average Success Rate</div>
              </div>
              <div>
                 <div className="text-2xl font-bold text-blue-400">{serverAnalytics?.data?.analytics?.success_metrics?.overall_summary?.achievements ?? 5}</div>
                <div className="text-sm text-gray-400">Recent Achievements</div>
              </div>
              <div>
                 <div className="text-2xl font-bold text-purple-400">{serverAnalytics?.data?.analytics?.success_metrics?.overall_summary?.senpai_interaction_score ?? 95}%</div>
                <div className="text-sm text-gray-400">Senpai Interaction Score</div>
              </div>
            </div>
          </div>
        </section>

         {/* Removed legacy table */}

        {/* Graph: Interest switch (seconds) vs Repeat audio (count) */}
        <section className="mt-10">
          <h2 className="text-2xl font-light mb-2">Visual summary</h2>
          <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-4 overflow-x-auto">
            {/* Live counts from server if available */}
            <div className="mb-4 text-sm text-gray-300">
              <span className="mr-4">Interest switches: <span className="text-blue-400 font-semibold">{interestSwitchCount}</span></span>
              <span>Repeat audio: <span className="text-purple-400 font-semibold">{repeatAudioCount}</span></span>
            </div>
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
          <div className="bg-[#0f0f0f] border border-gray-800 rounded-lg p-6 text-gray-200">
            {serverAnalytics ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Overall Assessment</h4>
                  <p className="text-sm text-gray-300">{serverAnalytics.data?.analytics?.llm_resp?.overall_assessment || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Key Observations</h4>
                  <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                    {(serverAnalytics.data?.analytics?.llm_resp?.key_observations || []).map((o: string, idx: number) => (
                      <li key={idx}>{o}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white mb-1">Recommendations</h4>
                  <p className="text-sm text-gray-300">{serverAnalytics.data?.analytics?.llm_resp?.recommendations || 'N/A'}</p>
                </div>
              </div>
            ) : null}
          </div>
        </section>
          </div>
        </section>
        </>
        )}
      </main>
    </div>
  );
}

