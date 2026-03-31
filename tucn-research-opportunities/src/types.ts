export interface Opportunity {
  id: string;
  title: string;
  tags: string[];
  description: string;
  abstract: string;
  author: {
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
}

export const MOCK_OPPORTUNITIES: Opportunity[] = [
  {
    id: "29401",
    title: "Neural Network Optimization for Quantum Interfaces",
    tags: ["AI", "QUANTUM COMPUTING", "RESEARCH"],
    description: "Join our interdisciplinary team in high-frequency neural processing. Weekly stipends available for dedicated students.",
    abstract: "This editorial explores the intersection of high-frequency neural processing and quantum-gate efficiency. We are seeking undergraduate and graduate contributors to assist in documenting the performance metrics of the new Q-Symmetry framework. Selected participants will contribute to a peer-reviewed publication and present findings at the upcoming Trans-Academic Symposium.",
    author: {
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
    }
  },
  {
    id: "29402",
    title: "Real-time Ray Tracing in Vulkan",
    tags: ["GRAPHICS", "C++", "VULKAN"],
    description: "Research assistant needed for rendering engine optimizations using hardware-accelerated ray tracing.",
    abstract: "This project provides hands-on experience with modern rendering APIs. We are investigating novel denoising algorithms for real-time global illumination. Students will work directly with modern GPUs.",
    author: {
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
    }
  },
  {
    id: "29404",
    title: "Distributed Edge Machine Learning",
    tags: ["MACHINE LEARNING", "EDGE COMPUTING"],
    description: "Develop federated learning protocols for IoT sensing networks.",
    abstract: "This grant focuses on bringing machine learning directly to tiny edge devices. We minimize power consumption while ensuring the devices can cooperatively train a shared model.",
    author: {
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
