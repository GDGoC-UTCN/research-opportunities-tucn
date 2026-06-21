export interface ApplicationField {
  id: string;
  question: string;
}

export interface Opportunity {
  id: string;
  title: string;
  tags: string[];
  description: string;
  abstract: string;
  author: {
    id: string;
    name: string;
    department: string;
    avatar: string;
  };
  deadline: string;
  postDate: string;
  duration: string;
  stipend: string;
  requirements: {
    technical: string[];
    eligibility: string[];
  };
  applicationFields?: ApplicationField[];
  // whether the professor requires CV / transcript when students apply
  requireCv?: boolean;
  requireTranscript?: boolean;
  status?: 'active' | 'archived';
}

export interface OpportunityQuestion {
  id: string;
  opportunityId: string;
  opportunityTitle?: string;
  questionText: string;
  answerText?: string | null;
  status: 'open' | 'answered';
  isPublic: boolean;
  isOwnQuestion?: boolean;
  studentName?: string | null;
  createdAt?: string | null;
  answeredAt?: string | null;
}

export type Role = 'student' | 'professor' | 'admin';

export interface User {
  id: string;
  name: string;
  role: Role;
  avatar: string;
  department?: string;
  // for professor accounts: whether admin approved this account
  approved?: boolean;
  email?: string;
}

export interface UserProfile {
  user: User;
  linkedinUrl: string;
  avatar?: UploadedFile;
  cvFile?: UploadedFile;
  transcriptFile?: UploadedFile;
  // Professor public-profile fields
  bio?: string;
  websiteUrl?: string;
  labName?: string;
  researchInterests?: string[];
  // Student recommendation inputs
  skills?: string[];
  preferredTags?: string[];
}

export interface ProfessorSummary {
  id: string;
  name: string;
  department?: string | null;
  avatar: string;
  labName?: string | null;
  researchInterests: string[];
  bio?: string | null;
  activeOpportunityCount: number;
}

export interface ProfessorProfile extends ProfessorSummary {
  linkedinUrl?: string | null;
  websiteUrl?: string | null;
  opportunities: Opportunity[];
}

export interface Recommendation {
  opportunity: Opportunity;
  score: number;
  reasons: string[];
  saved: boolean;
}

export interface AppNotification {
  id: string;
  type?: string | null;
  title: string;
  message?: string | null;
  link_url?: string | null;
  read: number;
  created_at?: string | null;
}

export interface SavedOpportunity {
  id: string;
  savedAt: string;
  opportunity: Opportunity;
}

export interface MyOpportunityApplicationSummary {
  id: string;
  opportunityId: string;
  status: ApplicationStatus;
  date: string;
  professorReply?: string;
  replyDate?: string;
}

export interface MyOpportunityItem {
  id: string;
  path: string;
  savedAt?: string;
  opportunity: Opportunity;
  application?: MyOpportunityApplicationSummary;
}

export interface MyOpportunities {
  saved: MyOpportunityItem[];
  applied: MyOpportunityItem[];
  accepted: MyOpportunityItem[];
  rejected: MyOpportunityItem[];
}

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';

export interface ApplicationAnswer {
  fieldId: string;
  question: string;
  answer: string;
}

export interface UploadedFile {
  name: string;
  size: number;       // bytes
  type: string;       // MIME
  file?: File;        // selected browser file before upload
  downloadUrl?: string;
  dataUrl?: string;   // legacy base64 data URL for older rows only
  legacy?: boolean;
}

export interface ApplicationDocumentOptions {
  useProfileCv: boolean;
  useProfileTranscript: boolean;
  saveUploadedCvToProfile: boolean;
  saveUploadedTranscriptToProfile: boolean;
}

export interface Application {
  id: string;
  opportunityId: string;
  studentId: string;
  studentName: string;
  message: string;
  date: string;
  status: ApplicationStatus;
  answers?: ApplicationAnswer[];
  cvFile?: UploadedFile;
  transcriptFile?: UploadedFile;
  professorReply?: string;
  replyDate?: string;
}

export const MOCK_STUDENT: User = {
  id: "s1",
  name: "Alexandru Pop",
  role: 'student',
  avatar: "https://picsum.photos/seed/alexandru/100/100"
};

export const MOCK_STUDENT_2: User = {
  id: "s2",
  name: "Maria Ionescu",
  role: 'student',
  avatar: "https://picsum.photos/seed/maria/100/100"
};

export const MOCK_PROFESSOR: User = {
  id: "p1",
  name: "Dr. Andrew Julian",
  role: 'professor',
  department: "Computer Science",
  avatar: "https://picsum.photos/seed/julian/100/100"
};

export const MOCK_ADMIN: User = {
  id: 'admin1',
  name: 'AIRi Admin',
  role: 'admin',
  avatar: 'https://picsum.photos/seed/admin/100/100',
  approved: true,
};

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "29401",
    title: "Neural Network Optimization for Quantum Interfaces",
    tags: ["AI", "QUANTUM COMPUTING", "RESEARCH"],
    description: "Join our interdisciplinary team in high-frequency neural processing. Weekly stipends available for dedicated students.",
    abstract: "This editorial explores the intersection of high-frequency neural processing and quantum-gate efficiency. We are seeking undergraduate and graduate contributors to assist in documenting the performance metrics of the new Q-Symmetry framework. Selected participants will contribute to a peer-reviewed publication and present findings at the upcoming Trans-Academic Symposium.",
    author: {
      id: "p1",
      name: "Dr. Andrew Julian",
      department: "Computer Science",
      avatar: "https://picsum.photos/seed/julian/100/100"
    },
    deadline: "October 15, 2026",
    postDate: "Sept 12, 2026",
    duration: "6 Months",
    stipend: "$4,200 / Quarter",
    requirements: {
      technical: ["Proficiency in Python and PyTorch", "Understanding of Linear Algebra", "Prior experience with Qiskit or similar tools"],
      eligibility: ["Minimum GPA 8.5 / 10", "Enrolled in STEM program"]
    },
    applicationFields: [
      { id: "f1", question: "Describe your experience with PyTorch or similar deep learning frameworks." },
      { id: "f2", question: "Have you worked with quantum computing tools (e.g. Qiskit)? Please elaborate." },
      { id: "f3", question: "Why are you interested in this specific project?" }
    ]
  },
  {
    id: "29402",
    title: "Real-time Ray Tracing in Vulkan",
    tags: ["GRAPHICS", "C++", "VULKAN"],
    description: "Research assistant needed for rendering engine optimizations using hardware-accelerated ray tracing.",
    abstract: "This project provides hands-on experience with modern rendering APIs. We are investigating novel denoising algorithms for real-time global illumination. Students will work directly with modern GPUs.",
    author: {
      id: "p2",
      name: "Prof. Sarah Jenkins",
      department: "Software Engineering",
      avatar: "https://picsum.photos/seed/sarah/100/100"
    },
    deadline: "November 1, 2026",
    postDate: "Sept 15, 2026",
    duration: "4 Months",
    stipend: "Unpaid",
    requirements: {
      technical: ["Strong C++ knowledge", "Computer Graphics basics"],
      eligibility: ["3rd or 4th year students"]
    }
  },
  {
    id: "29403",
    title: "Computer Vision for Autonomous Drones",
    tags: ["ROBOTICS", "COMPUTER VISION", "AI"],
    description: "Assist the AI Lab in detecting objects in low-visibility environments for autonomous drones.",
    abstract: "Work closely with our robotics team to improve computer vision accuracy. You will deploy models directly on edge devices (NVIDIA Jetson) and test drones in real environments.",
    author: {
      id: "p3",
      name: "Julian Chen",
      department: "Automation",
      avatar: "https://picsum.photos/seed/chen/100/100"
    },
    deadline: "October 5, 2026",
    postDate: "Sept 10, 2026",
    duration: "3 Months",
    stipend: "$1,500 / Month",
    requirements: {
      technical: ["OpenCV", "ROS2", "Python/C++"],
      eligibility: ["Automation or CS students"]
    },
    applicationFields: [
      { id: "f1", question: "Describe a computer vision project you have worked on." },
      { id: "f2", question: "What is your experience with ROS2 or similar robotics middleware?" }
    ]
  },
  {
    id: "29404",
    title: "Distributed Edge Machine Learning",
    tags: ["MACHINE LEARNING", "EDGE COMPUTING"],
    description: "Develop federated learning protocols for IoT sensing networks.",
    abstract: "This grant focuses on bringing machine learning directly to tiny edge devices. We minimize power consumption while ensuring the devices can cooperatively train a shared model.",
    author: {
      id: "p4",
      name: "Dr. Elena Vasilescu",
      department: "Telecommunications",
      avatar: "https://picsum.photos/seed/elena/100/100"
    },
    deadline: "December 10, 2026",
    postDate: "Sept 20, 2026",
    duration: "1 Year",
    stipend: "Travel Grant Available",
    requirements: {
      technical: ["Embedded Systems", "C", "Machine Learning"],
      eligibility: ["Master's or PhD Students only"]
    }
  },
  {
    id: "29405",
    title: "Smart Grid Power Infrastructure Security",
    tags: ["CYBERSECURITY", "EMBEDDED", "FUNDING"],
    description: "Join the Electrical Engineering team to analyze vulnerabilities in renewable energy grids.",
    abstract: "Security vulnerabilities in smart grids can lead to blackouts if left unchecked. We are mapping hardware flaws in common substations and proposing software countermeasures.",
    author: {
      id: "p5",
      name: "Dr. Vasile Muresan",
      department: "Electrical Engineering",
      avatar: "https://picsum.photos/seed/miller/100/100"
    },
    deadline: "October 20, 2026",
    postDate: "Sept 25, 2026",
    duration: "8 Months",
    stipend: "EU Grant",
    requirements: {
      technical: ["Network Protocols", "Microcontrollers", "Reverse Engineering"],
      eligibility: ["Full-time students"]
    }
  },
  {
    id: "29406",
    title: "Natural Language Processing for Romanian Medical Texts",
    tags: ["NLP", "AI", "HEALTHCARE"],
    description: "Submit your proposal for advancing medical LLMs for Romanian hospital records.",
    abstract: "Extracting entities from unstructured medical data in Romanian. We aim to create a dataset and fine-tune open-source LLMs specifically for medical diagnostics in Romanian.",
    author: {
      id: "p6",
      name: "Anna Sokolova",
      department: "Computer Science",
      avatar: "https://picsum.photos/seed/anna/100/100"
    },
    deadline: "November 15, 2026",
    postDate: "Sept 28, 2026",
    duration: "6 Months",
    stipend: "Up to €5,000",
    requirements: {
      technical: ["PyTorch or HuggingFace Transformers", "Romanian native proficiency"],
      eligibility: ["Any CS/Math student"]
    }
  },
  {
    id: "29407",
    title: "IoT Solutions for Smart City Traffic Management",
    tags: ["IOT", "SMART CITY", "NETWORKING"],
    description: "Build adaptive traffic light controllers using LoRaWAN sensors.",
    abstract: "The project uses live traffic data to dynamically adjust city intersection signals. Requires background in hardware prototyping and wireless sensor networks.",
    author: {
      id: "p7",
      name: "Prof. Ionut Dan",
      department: "Telecommunications",
      avatar: "https://picsum.photos/seed/lucas/100/100"
    },
    deadline: "December 5, 2026",
    postDate: "Oct 2, 2026",
    duration: "4 Months",
    stipend: "$500 / Month",
    requirements: {
      technical: ["LoRaWAN", "Raspberry Pi/Arduino", "Python"],
      eligibility: ["Undergraduate students"]
    }
  }
];

export const MOCK_APPLICATIONS: Application[] = [
  {
    id: "app1",
    opportunityId: "29401",
    studentId: "s1",
    studentName: "Alexandru Pop",
    message: "I have extensive experience with PyTorch and quantum computing simulations. I would love to contribute to the Q-Symmetry framework and help document its performance metrics.",
    date: "Oct 1, 2026",
    status: "accepted",
    answers: [
      { fieldId: "f1", question: "Describe your experience with PyTorch or similar deep learning frameworks.", answer: "I have used PyTorch for two years in academic projects, including implementing a transformer model from scratch and training custom CNNs on CIFAR-10." },
      { fieldId: "f2", question: "Have you worked with quantum computing tools (e.g. Qiskit)? Please elaborate.", answer: "Yes, I completed IBM's Qiskit summer school and built a small variational quantum eigensolver as a personal project." },
      { fieldId: "f3", question: "Why are you interested in this specific project?", answer: "The intersection of neural networks and quantum gates is exactly the research direction I want to pursue for my master's thesis." }
    ],
    professorReply: "Thank you for your application, Alexandru! Your PyTorch background is exactly what we need. Please reach out at andrew.julian@cs.utcluj.ro to arrange an onboarding meeting next week.",
    replyDate: "Oct 3, 2026"
  },
  {
    id: "app2",
    opportunityId: "29403",
    studentId: "s1",
    studentName: "Alexandru Pop",
    message: "I am proficient in OpenCV and have worked with ROS2 for a semester project. I am very interested in the drone vision work and can dedicate 20 hours per week.",
    date: "Sept 15, 2026",
    status: "rejected",
    answers: [
      { fieldId: "f1", question: "Describe a computer vision project you have worked on.", answer: "I built a lane detection system for a miniature RC car using OpenCV and a Raspberry Pi camera as part of my third-year lab course." },
      { fieldId: "f2", question: "What is your experience with ROS2 or similar robotics middleware?", answer: "I followed the official ROS2 Humble tutorials and integrated a basic publisher/subscriber system for a semester robotics assignment." }
    ],
    professorReply: "Hi Alexandru, we appreciate your interest. Unfortunately we have filled all positions for this cycle with students who have more hands-on robotics hardware hardware experience. We encourage you to apply next semester!",
    replyDate: "Sept 20, 2026"
  },
  {
    id: "app3",
    opportunityId: "29406",
    studentId: "s1",
    studentName: "Alexandru Pop",
    message: "As a native Romanian speaker with experience fine-tuning HuggingFace models, I believe I would be a great fit for the medical NLP project. I have attached my CV and a relevant project repository.",
    date: "Oct 5, 2026",
    status: "pending"
  },
  {
    id: "app4",
    opportunityId: "29401",
    studentId: "s2",
    studentName: "Maria Ionescu",
    message: "I am very interested in the hardware implementation aspects of the Q-Symmetry framework. I have attached my portfolio with my previous FPGA projects.",
    date: "Oct 2, 2026",
    status: "pending",
    answers: [
      { fieldId: "f1", question: "Describe your experience with PyTorch or similar deep learning frameworks.", answer: "I have mostly worked with Tensorflow so far, but I am learning PyTorch for this project." },
      { fieldId: "f2", question: "Have you worked with quantum computing tools (e.g. Qiskit)? Please elaborate.", answer: "I have taken theoretical courses on Quantum Algorithms, but have not yet programmed using Qiskit." },
      { fieldId: "f3", question: "Why are you interested in this specific project?", answer: "I want to gain hands-on experience bridging the gap between quantum gates and neural network implementations." }
    ]
  },
  {
    id: "app5",
    opportunityId: "29401",
    studentId: "s3",
    studentName: "Mihai Vasile",
    message: "I am confident my mathematics background makes me an ideal candidate for this project.",
    date: "Oct 4, 2026",
    status: "rejected",
    answers: [
      { fieldId: "f1", question: "Describe your experience with PyTorch or similar deep learning frameworks.", answer: "None directly, but strong math foundation." },
      { fieldId: "f2", question: "Have you worked with quantum computing tools (e.g. Qiskit)? Please elaborate.", answer: "No." },
      { fieldId: "f3", question: "Why are you interested in this specific project?", answer: "Looking for an exciting thesis topic." }
    ],
    professorReply: "Hi Mihai, thanks for your interest. We strictly require PyTorch experience for this position. Best of luck!",
    replyDate: "Oct 5, 2026"
  }
];
