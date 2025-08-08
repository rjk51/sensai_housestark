"use client";

import { Header } from "@/components/layout/header";

export default function AnalyticsPage() {
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">llm_response</th>
              </tr>
            </thead>
            <tbody className="bg-black divide-y divide-gray-900">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">roadmap to course page 3 seconds</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">1</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">Welcome message played</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-2 00">course page to roadmap 2 seconds</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">0</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">Explained course details</td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">milestone to course page 5 seconds</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">2</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">Guided next steps</td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

