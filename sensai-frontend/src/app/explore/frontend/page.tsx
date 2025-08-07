"use client";

import ExplorePage from "@/components/ExplorePage";

export default function FrontendExplorePage() {
  const frontendCourses = [
    {
      id: "html-css",
      title: "HTML & CSS Fundamentals",
      description: "Building blocks of web development",
      position: { top: "15%", left: "20%" }
    },
    {
      id: "javascript-basics",
      title: "JavaScript Essentials",
      description: "Programming fundamentals for the web",
      position: { top: "30%", left: "35%" }
    },
    {
      id: "responsive-design",
      title: "Responsive Web Design",
      description: "Mobile-first design principles",
      position: { top: "25%", left: "60%" }
    },
    {
      id: "react-fundamentals",
      title: "React Fundamentals",
      description: "Component-based UI development",
      position: { top: "45%", left: "25%" }
    },
    {
      id: "state-management",
      title: "State Management",
      description: "Redux, Context API, and Zustand",
      position: { top: "55%", left: "50%" }
    },
    {
      id: "typescript",
      title: "TypeScript",
      description: "Type-safe JavaScript development",
      position: { top: "40%", left: "75%" }
    },
    {
      id: "nextjs",
      title: "Next.js Framework",
      description: "Full-stack React applications",
      position: { top: "70%", left: "30%" }
    },
    {
      id: "performance",
      title: "Web Performance",
      description: "Optimization and best practices",
      position: { top: "75%", left: "65%" }
    }
  ];

  return (
    <ExplorePage
      title="Frontend Development"
      mapImageSrc="/images/map.png" // You can replace this with your actual image path
      mapImageAlt="Frontend Development Learning Path Map"
      description="Master the art of creating beautiful, interactive user interfaces. From HTML/CSS basics to modern frameworks."
      courses={frontendCourses}
    />
  );
}
