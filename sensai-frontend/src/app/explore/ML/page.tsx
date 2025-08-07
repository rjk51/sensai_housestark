"use client";

import ExplorePage from "@/components/ExplorePage";

export default function MLExplorePage() {
  const mlCourses = [
    {
      id: "python-basics",
      title: "Python for ML",
      description: "Learn Python fundamentals for machine learning",
      position: { top: "20%", left: "15%" }
    },
    {
      id: "statistics-ml",
      title: "Statistics & Probability",
      description: "Mathematical foundations for ML",
      position: { top: "35%", left: "30%" }
    },
    {
      id: "linear-algebra",
      title: "Linear Algebra",
      description: "Vectors, matrices, and eigenvalues",
      position: { top: "25%", left: "50%" }
    },
    {
      id: "supervised-learning",
      title: "Supervised Learning",
      description: "Classification and regression algorithms",
      position: { top: "50%", left: "25%" }
    },
    {
      id: "unsupervised-learning",
      title: "Unsupervised Learning",
      description: "Clustering and dimensionality reduction",
      position: { top: "60%", left: "45%" }
    },
    {
      id: "deep-learning",
      title: "Deep Learning",
      description: "Neural networks and deep architectures",
      position: { top: "40%", left: "70%" }
    },
    {
      id: "nlp",
      title: "Natural Language Processing",
      description: "Text analysis and language models",
      position: { top: "70%", left: "20%" }
    },
    {
      id: "computer-vision",
      title: "Computer Vision",
      description: "Image processing and recognition",
      position: { top: "80%", left: "60%" }
    }
  ];

  return (
    <ExplorePage
      title="Machine Learning"
      mapImageSrc="/images/map.png" // You can replace this with your actual image path
      mapImageAlt="Machine Learning Learning Path Map"
      description="Dive deep into the world of artificial intelligence and machine learning. From fundamentals to advanced algorithms."
      courses={mlCourses}
    />
  );
}
