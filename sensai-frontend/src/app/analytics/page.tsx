"use client";

import { Header } from "@/components/layout/header";
import { flushConversationBuffer } from "@/lib/analytics";
import { useEffect } from "react";

export default function AnalyticsPage() {
  // Flush buffered analytics when viewing this page
  useEffect(() => {
    flushConversationBuffer();
  }, []);
  const dataPoints = [
    { label: "Roadmap → Course", seconds: 3, repeat: 1 },
    { label: "Course → Roadmap", seconds: 2, repeat: 0 },
    { label: "Milestone → Course", seconds: 5, repeat: 2 },
  ];

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
            {`Overall, the conversation shows healthy engagement. The user explored the roadmap, navigated to a course page, and then returned to the roadmap within a short window, indicating active discovery behavior. The assistant’s guidance was concise and context-aware, and repeating audio was used sparingly for clarification rather than due to confusion. 

Key observations:
- Interest switches are quick (2–5s), consistent with scanning multiple learning paths.
- Repeat audio events (0–2) suggest the narration pace is acceptable for the user.
- The user appears motivated to proceed to milestones, with no signs of frustration.

Recommendation: Continue with brief, step-wise instructions and surface next-step CTAs (e.g., “Open code editor”, “Start quiz”) when the user reaches milestones to maintain momentum.`}
          </div>
        </section>
      </main>
    </div>
  );
}

