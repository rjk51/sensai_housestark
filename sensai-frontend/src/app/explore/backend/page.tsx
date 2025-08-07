"use client";

import ExplorePage from "@/components/ExplorePage";

export default function BackendExplorePage() {
  const backendCourses = [
    {
      id: "programming-fundamentals",
      title: "Programming Fundamentals",
      description: "Core programming concepts and logic",
      position: { top: "18%", left: "22%" }
    },
    {
      id: "database-basics",
      title: "Database Fundamentals",
      description: "SQL, NoSQL, and data modeling",
      position: { top: "32%", left: "40%" }
    },
    {
      id: "api-design",
      title: "API Design & Development",
      description: "RESTful services and GraphQL",
      position: { top: "28%", left: "65%" }
    },
    {
      id: "server-architecture",
      title: "Server Architecture",
      description: "Building scalable server applications",
      position: { top: "48%", left: "28%" }
    },
    {
      id: "authentication",
      title: "Authentication & Security",
      description: "User auth, JWT, and security best practices",
      position: { top: "58%", left: "55%" }
    },
    {
      id: "cloud-deployment",
      title: "Cloud & Deployment",
      description: "AWS, Docker, and CI/CD pipelines",
      position: { top: "42%", left: "78%" }
    },
    {
      id: "microservices",
      title: "Microservices Architecture",
      description: "Distributed systems and service mesh",
      position: { top: "72%", left: "25%" }
    },
    {
      id: "performance-scaling",
      title: "Performance & Scaling",
      description: "Load balancing, caching, and optimization",
      position: { top: "78%", left: "68%" }
    }
  ];

  return (
    <ExplorePage
      title="Backend Development"
      mapImageSrc="/images/map.png" // You can replace this with your actual image path
      mapImageAlt="Backend Development Learning Path Map"
      description="Build robust server-side applications and APIs. Learn databases, authentication, and scalable architecture patterns."
      courses={backendCourses}
    />
  );
}
