// Pure constants/data relocated verbatim from the original AdminDashboard.jsx.
// NOTE (pre-existing, flagged not fixed): both `COLORS` and `mockData` were
// declared inside the original component but never referenced in the JSX.
// They are preserved here unchanged.

export const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#00ff00",
];

// Mock data for development
export const mockData = {
  // User Statistics
  testStats: {
    totalAttempts: 1247,
    passedAttempts: 967,
    failedAttempts: 280,
    averageScore: 78.5,
  },
  // Course Statistics
  totalCourses: 89,
  publishedCourses: 67,
  totalLessons: 456,
  totalVideos: 789,
  totalPDFs: 234,

  totalTestAttempts: 2341,
  passedTests: 1876,

  // Progress & Engagement
  courseCompletions: 892,
  avgCourseProgress: 68.5,
  totalHomeworkSubmissions: 1456,

  topCourses: [
    {
      id: 1,
      title: "React Development Masterclass",
      enrollments: 45,
      completionRate: 78,
      averageScore: 82,
    },
    {
      id: 2,
      title: "Node.js Backend Development",
      enrollments: 38,
      completionRate: 65,
      averageScore: 75,
    },
    {
      id: 3,
      title: "JavaScript Fundamentals",
      enrollments: 52,
      completionRate: 89,
      averageScore: 88,
    },
    {
      id: 4,
      title: "Database Design & SQL",
      enrollments: 29,
      completionRate: 72,
      averageScore: 79,
    },
  ],
};
