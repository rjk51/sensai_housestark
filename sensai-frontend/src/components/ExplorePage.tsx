"use client";

import React from "react";
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

export default function ExplorePage({ 
  title, 
  mapImageSrc, 
  mapImageAlt, 
  description,
  courses 
}: ExplorePageProps) {
  const handleCourseClick = (courseId: string) => {
    // Handle course selection - you can implement navigation logic here
    console.log(`Selected course: ${courseId}`);
  };

  return (
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
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
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
                    {/* Main sign board */}
                    <div className="bg-gradient-to-r from-gray-100 to-white text-gray-900 px-3 py-2 rounded-md shadow-2xl border-2 border-gray-300 min-w-[150px] max-w-[180px] transform group-hover:scale-105 transition-all duration-300 group-hover:shadow-3xl">
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
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-t-md opacity-80"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 rounded-b-md opacity-80"></div>
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
            Click on any course sign to start your learning journey
          </p>
        </div>
      </main>
    </div>
  );
}
