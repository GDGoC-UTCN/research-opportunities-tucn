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
    title: "Neural Network optimization for Quantum Computing Interfaces",
    tags: ["RESEARCH", "FUNDING", "FALL 2024"],
    description: "Join our interdisciplinary team in digitizing historical faculty manuscripts. Weekly stipends available for dedicated students.",
    abstract: "This editorial explores the intersection of high-frequency neural processing and quantum-gate efficiency. We are seeking undergraduate and graduate contributors to assist in documenting the performance metrics of the new Q-Symmetry framework. Selected participants will contribute to a peer-reviewed publication and present findings at the upcoming Trans-Academic Symposium.",
    author: {
      name: "Dr. Andrew Julian",
      department: "Faculty of Arts",
      avatar: "https://picsum.photos/seed/julian/100/100"
    },
    deadline: "October 15, 2024",
    postDate: "Sept 12, 2024",
    duration: "6 Months",
    stipend: "$4,200 / Quarter",
    requirements: {
      technical: ["Proficiency in Python and PyTorch", "Understanding of Linear Algebra", "Prior experience with Qiskit or similar tools"],
      eligibility: ["Minimum GPA 3.7 / 4.0", "Enrolled in STEM program"]
    }
  },
  {
    id: "29402",
    title: "Quantum Computing: Practical Applications",
    tags: ["WORKSHOP"],
    description: "A three-day intensive workshop focused on Qiskit and cloud-based quantum processing units.",
    abstract: "This workshop provides hands-on experience with quantum algorithms and their real-world applications in cryptography and optimization.",
    author: {
      name: "Sarah Jenkins",
      department: "STEM Research Unit",
      avatar: "https://picsum.photos/seed/sarah/100/100"
    },
    deadline: "November 1, 2024",
    postDate: "Sept 15, 2024",
    duration: "3 Days",
    stipend: "N/A",
    requirements: {
      technical: ["Basic Python knowledge"],
      eligibility: ["All students welcome"]
    }
  },
  {
    id: "29403",
    title: "AI Ethics & Policy Student Consultant",
    tags: ["INTERNSHIP", "URGENT"],
    description: "Assist the University Ethics Committee in drafting guidelines for generative AI usage in academic papers.",
    abstract: "Work closely with policy makers to define the ethical boundaries of AI in higher education.",
    author: {
      name: "Julian Chen",
      department: "Ethics Board",
      avatar: "https://picsum.photos/seed/chen/100/100"
    },
    deadline: "October 5, 2024",
    postDate: "Sept 10, 2024",
    duration: "3 Months",
    stipend: "$1,500 / Month",
    requirements: {
      technical: ["Strong writing skills", "Interest in Ethics"],
      eligibility: ["Humanities or Law students preferred"]
    }
  },
  {
    id: "29404",
    title: "Annual Doctoral Colloquium 2024",
    tags: ["EVENT"],
    description: "Keynote speakers from across Europe discuss the future of archival sciences in the digital age.",
    abstract: "A gathering of doctoral students to present their research and network with industry leaders.",
    author: {
      name: "Dr. Elena Vasilescu",
      department: "Postgrad Deanery",
      avatar: "https://picsum.photos/seed/elena/100/100"
    },
    deadline: "December 10, 2024",
    postDate: "Sept 20, 2024",
    duration: "2 Days",
    stipend: "Travel Grant Available",
    requirements: {
      technical: ["Research abstract submission"],
      eligibility: ["PhD Students only"]
    }
  },
  {
    id: "29405",
    title: "TUCN Tigers: Basketball Tryouts",
    tags: ["SPORTS"],
    description: "Join the university varsity team. Open to all students with competitive experience.",
    abstract: "The TUCN Tigers are looking for new talent to join our championship-winning basketball team.",
    author: {
      name: "Coach Miller",
      department: "Athletics Dept",
      avatar: "https://picsum.photos/seed/miller/100/100"
    },
    deadline: "October 20, 2024",
    postDate: "Sept 25, 2024",
    duration: "Full Season",
    stipend: "Sports Scholarship",
    requirements: {
      technical: ["Competitive basketball experience"],
      eligibility: ["Full-time students"]
    }
  },
  {
    id: "29406",
    title: "Sustainable Campus Project Grants",
    tags: ["GRANT"],
    description: "Submit your proposal for making TUCN greener. Funding up to €5,000 per project.",
    abstract: "Grants aimed at student-led initiatives that promote sustainability on campus.",
    author: {
      name: "Anna Sokolova",
      department: "Green Initiatives",
      avatar: "https://picsum.photos/seed/anna/100/100"
    },
    deadline: "November 15, 2024",
    postDate: "Sept 28, 2024",
    duration: "Project Based",
    stipend: "Up to €5,000",
    requirements: {
      technical: ["Detailed project proposal"],
      eligibility: ["Student groups"]
    }
  },
  {
    id: "29407",
    title: "Summer Exchange: University of Tokyo",
    tags: ["EXCHANGE", "ERASMUS"],
    description: "Limited spots available for the 2024 Tech-Culture exchange program. Japanese N3 preferred.",
    abstract: "A unique opportunity to study at one of the world's leading technical universities.",
    author: {
      name: "International Office",
      department: "External Relations",
      avatar: "https://picsum.photos/seed/tokyo/100/100"
    },
    deadline: "January 15, 2025",
    postDate: "Oct 1, 2024",
    duration: "3 Months",
    stipend: "Erasmus+ Grant",
    requirements: {
      technical: ["Japanese N3 (preferred)"],
      eligibility: ["Engineering students"]
    }
  },
  {
    id: "29408",
    title: "Mentorship: Software Engineering",
    tags: ["ALUMNI"],
    description: "Connect with alumni currently at Google, Meta, and Microsoft for career guidance.",
    abstract: "Get one-on-one mentorship from experienced software engineers in the industry.",
    author: {
      name: "Alumni Relations",
      department: "Student Services",
      avatar: "https://picsum.photos/seed/alumni/100/100"
    },
    deadline: "Ongoing",
    postDate: "Oct 5, 2024",
    duration: "Flexible",
    stipend: "N/A",
    requirements: {
      technical: ["Interest in Software Engineering"],
      eligibility: ["Final year students"]
    }
  },
  {
    id: "29409",
    title: "Blockchain for Supply Chain Management",
    tags: ["RESEARCH", "FUNDING"],
    description: "Explore the use of blockchain technology in optimizing global supply chains.",
    abstract: "This project investigates the transparency and efficiency gains of blockchain in logistics.",
    author: {
      name: "Dr. Robert Smith",
      department: "Business School",
      avatar: "https://picsum.photos/seed/smith/100/100"
    },
    deadline: "November 30, 2024",
    postDate: "Oct 10, 2024",
    duration: "12 Months",
    stipend: "$5,000 / Semester",
    requirements: {
      technical: ["Solidity", "Smart Contracts"],
      eligibility: ["Graduate students"]
    }
  },
  {
    id: "29410",
    title: "Cybersecurity Awareness Campaign",
    tags: ["VOLUNTEER"],
    description: "Help educate the campus community about cybersecurity best practices.",
    abstract: "A student-led initiative to improve digital safety across the university.",
    author: {
      name: "IT Services",
      department: "Campus IT",
      avatar: "https://picsum.photos/seed/it/100/100"
    },
    deadline: "Ongoing",
    postDate: "Oct 12, 2024",
    duration: "Semester long",
    stipend: "Certificate of Appreciation",
    requirements: {
      technical: ["Basic cybersecurity knowledge"],
      eligibility: ["All students"]
    }
  },
  {
    id: "29411",
    title: "Robotics Club: Annual Competition",
    tags: ["COMPETITION", "SPORTS"],
    description: "Build and compete with your own robots in our annual campus-wide competition.",
    abstract: "The ultimate test of engineering and programming skills for robotics enthusiasts.",
    author: {
      name: "Robotics Society",
      department: "Engineering Faculty",
      avatar: "https://picsum.photos/seed/robot/100/100"
    },
    deadline: "March 1, 2025",
    postDate: "Oct 15, 2024",
    duration: "6 Months prep",
    stipend: "Prizes up to €2,000",
    requirements: {
      technical: ["C++", "Arduino", "Mechanical Design"],
      eligibility: ["Engineering students"]
    }
  },
  {
    id: "29412",
    title: "Renewable Energy Research Assistant",
    tags: ["RESEARCH", "URGENT"],
    description: "Assist in data collection for solar panel efficiency studies on campus rooftops.",
    abstract: "Hands-on research in the field of renewable energy and sustainability.",
    author: {
      name: "Prof. Green",
      department: "Energy Dept",
      avatar: "https://picsum.photos/seed/green/100/100"
    },
    deadline: "October 30, 2024",
    postDate: "Oct 18, 2024",
    duration: "4 Months",
    stipend: "$20/hour",
    requirements: {
      technical: ["Data analysis", "Excel"],
      eligibility: ["Undergraduate students"]
    }
  },
  {
    id: "29413",
    title: "Creative Writing Workshop",
    tags: ["WORKSHOP"],
    description: "Unleash your creativity in this weekly workshop led by published authors.",
    abstract: "A supportive environment for aspiring writers to hone their craft and share their work.",
    author: {
      name: "Literary Circle",
      department: "Humanities",
      avatar: "https://picsum.photos/seed/write/100/100"
    },
    deadline: "Ongoing",
    postDate: "Oct 20, 2024",
    duration: "Weekly",
    stipend: "N/A",
    requirements: {
      technical: ["Passion for writing"],
      eligibility: ["All students"]
    }
  },
  {
    id: "29414",
    title: "Digital Marketing Internship",
    tags: ["INTERNSHIP"],
    description: "Gain experience in social media management and content creation for the university.",
    abstract: "Work with the communications team to enhance the university's online presence.",
    author: {
      name: "Marketing Team",
      department: "Communications",
      avatar: "https://picsum.photos/seed/market/100/100"
    },
    deadline: "November 10, 2024",
    postDate: "Oct 22, 2024",
    duration: "6 Months",
    stipend: "$1,200 / Month",
    requirements: {
      technical: ["Social media savvy", "Graphic design basics"],
      eligibility: ["Marketing or Media students"]
    }
  },
  {
    id: "29415",
    title: "Data Science for Social Good",
    tags: ["RESEARCH", "GRANT"],
    description: "Apply data science techniques to solve pressing social issues in our local community.",
    abstract: "Using data to drive positive change and inform policy decisions.",
    author: {
      name: "Data Lab",
      department: "Computer Science",
      avatar: "https://picsum.photos/seed/data/100/100"
    },
    deadline: "December 1, 2024",
    postDate: "Oct 25, 2024",
    duration: "1 Year",
    stipend: "Grant funded",
    requirements: {
      technical: ["Python", "R", "Statistics"],
      eligibility: ["Graduate students"]
    }
  },
  {
    id: "29416",
    title: "University Choir: Auditions",
    tags: ["EVENT", "ARTS"],
    description: "Do you love to sing? Join the university choir for our winter concert series.",
    abstract: "Auditions for all voice types for our upcoming performances.",
    author: {
      name: "Music Director",
      department: "Arts Faculty",
      avatar: "https://picsum.photos/seed/sing/100/100"
    },
    deadline: "November 5, 2024",
    postDate: "Oct 28, 2024",
    duration: "Semester",
    stipend: "N/A",
    requirements: {
      technical: ["Vocal ability"],
      eligibility: ["All students"]
    }
  },
  {
    id: "29417",
    title: "App Development Challenge",
    tags: ["COMPETITION"],
    description: "Develop an app that solves a campus problem and win amazing prizes.",
    abstract: "A weekend hackathon style competition for student developers.",
    author: {
      name: "Tech Hub",
      department: "Innovation Center",
      avatar: "https://picsum.photos/seed/app/100/100"
    },
    deadline: "January 20, 2025",
    postDate: "Nov 1, 2024",
    duration: "48 Hours",
    stipend: "Prizes: MacBooks, iPads",
    requirements: {
      technical: ["Mobile development", "UI/UX design"],
      eligibility: ["Student teams"]
    }
  },
  {
    id: "29418",
    title: "Psychology Research: Sleep Patterns",
    tags: ["RESEARCH"],
    description: "Participate in a study about sleep patterns and academic performance.",
    abstract: "Help us understand how sleep affects your grades and overall well-being.",
    author: {
      name: "Dr. Sleep",
      department: "Psychology Dept",
      avatar: "https://picsum.photos/seed/sleep/100/100"
    },
    deadline: "Ongoing",
    postDate: "Nov 3, 2024",
    duration: "2 Weeks",
    stipend: "$50 Amazon Voucher",
    requirements: {
      technical: ["Willingness to track sleep"],
      eligibility: ["All students"]
    }
  },
  {
    id: "29419",
    title: "International Food Festival",
    tags: ["EVENT"],
    description: "Celebrate diversity through food! Sign up to host a stall representing your culture.",
    abstract: "A day of cultural exchange and delicious food from around the world.",
    author: {
      name: "Student Union",
      department: "Student Life",
      avatar: "https://picsum.photos/seed/food/100/100"
    },
    deadline: "February 10, 2025",
    postDate: "Nov 5, 2024",
    duration: "1 Day",
    stipend: "Ingredient budget provided",
    requirements: {
      technical: ["Cooking skills"],
      eligibility: ["International students"]
    }
  },
  {
    id: "29420",
    title: "Machine Learning for Healthcare",
    tags: ["RESEARCH", "FUNDING"],
    description: "Develop ML models to predict patient outcomes in local hospitals.",
    abstract: "Bridging the gap between AI and medicine for better healthcare delivery.",
    author: {
      name: "Prof. Health",
      department: "Medical Informatics",
      avatar: "https://picsum.photos/seed/health/100/100"
    },
    deadline: "December 15, 2024",
    postDate: "Nov 8, 2024",
    duration: "6 Months",
    stipend: "$3,000 / Project",
    requirements: {
      technical: ["TensorFlow", "Scikit-learn"],
      eligibility: ["CS or Med students"]
    }
  },
  {
    id: "29421",
    title: "Campus Garden Volunteer",
    tags: ["VOLUNTEER"],
    description: "Help maintain our organic campus garden and learn about urban farming.",
    abstract: "Get your hands dirty and contribute to a greener campus.",
    author: {
      name: "Garden Club",
      department: "Sustainability",
      avatar: "https://picsum.photos/seed/garden/100/100"
    },
    deadline: "Ongoing",
    postDate: "Nov 10, 2024",
    duration: "Flexible",
    stipend: "Free vegetables!",
    requirements: {
      technical: ["Interest in gardening"],
      eligibility: ["All students"]
    }
  },
  {
    id: "29422",
    title: "UX/UI Design Internship",
    tags: ["INTERNSHIP"],
    description: "Work with our product team to design intuitive user interfaces for campus apps.",
    abstract: "Gain real-world design experience in a fast-paced environment.",
    author: {
      name: "Design Studio",
      department: "Innovation",
      avatar: "https://picsum.photos/seed/design/100/100"
    },
    deadline: "December 20, 2024",
    postDate: "Nov 12, 2024",
    duration: "3 Months",
    stipend: "$1,800 / Month",
    requirements: {
      technical: ["Figma", "Adobe XD"],
      eligibility: ["Design students"]
    }
  },
  {
    id: "29423",
    title: "Physics Lab Assistant",
    tags: ["RESEARCH", "URGENT"],
    description: "Help set up experiments and maintain equipment in the advanced physics lab.",
    abstract: "Support high-level research while gaining valuable lab experience.",
    author: {
      name: "Lab Manager",
      department: "Physics Faculty",
      avatar: "https://picsum.photos/seed/phys/100/100"
    },
    deadline: "November 25, 2024",
    postDate: "Nov 15, 2024",
    duration: "Semester",
    stipend: "$18/hour",
    requirements: {
      technical: ["Physics background"],
      eligibility: ["Physics majors"]
    }
  },
  {
    id: "29424",
    title: "Entrepreneurship Boot Camp",
    tags: ["WORKSHOP"],
    description: "Turn your idea into a business in this intensive 5-day boot camp.",
    abstract: "Learn the fundamentals of startups, from ideation to pitching.",
    author: {
      name: "Startup Hub",
      department: "Business Dept",
      avatar: "https://picsum.photos/seed/start/100/100"
    },
    deadline: "January 5, 2025",
    postDate: "Nov 18, 2024",
    duration: "5 Days",
    stipend: "N/A",
    requirements: {
      technical: ["Business idea"],
      eligibility: ["All students"]
    }
  },
  {
    id: "29425",
    title: "Virtual Reality for Education",
    tags: ["RESEARCH", "GRANT"],
    description: "Develop VR simulations to enhance learning in complex subjects.",
    abstract: "Exploring the potential of immersive technology in the classroom.",
    author: {
      name: "EdTech Lab",
      department: "Education Faculty",
      avatar: "https://picsum.photos/seed/vr/100/100"
    },
    deadline: "February 1, 2025",
    postDate: "Nov 20, 2024",
    duration: "9 Months",
    stipend: "Grant funded",
    requirements: {
      technical: ["Unity", "C#", "VR development"],
      eligibility: ["Graduate students"]
    }
  },
  {
    id: "29426",
    title: "Campus Radio Host",
    tags: ["VOLUNTEER"],
    description: "Host your own radio show and share your favorite music and campus news.",
    abstract: "A platform for student voices and creative broadcasting.",
    author: {
      name: "Radio Station",
      department: "Media Dept",
      avatar: "https://picsum.photos/seed/radio/100/100"
    },
    deadline: "Ongoing",
    postDate: "Nov 22, 2024",
    duration: "Weekly show",
    stipend: "N/A",
    requirements: {
      technical: ["Good speaking voice"],
      eligibility: ["All students"]
    }
  },
  {
    id: "29427",
    title: "Environmental Law Internship",
    tags: ["INTERNSHIP"],
    description: "Work with a local NGO on environmental policy and legal advocacy.",
    abstract: "Gain experience in the intersection of law and environmental protection.",
    author: {
      name: "Eco Law",
      department: "Law Faculty",
      avatar: "https://picsum.photos/seed/law/100/100"
    },
    deadline: "January 10, 2025",
    postDate: "Nov 25, 2024",
    duration: "4 Months",
    stipend: "$1,500 / Month",
    requirements: {
      technical: ["Legal research"],
      eligibility: ["Law students"]
    }
  },
  {
    id: "29428",
    title: "3D Printing Workshop",
    tags: ["WORKSHOP"],
    description: "Learn how to design and print your own 3D models in our makerspace.",
    abstract: "Hands-on introduction to additive manufacturing technology.",
    author: {
      name: "Makerspace",
      department: "Engineering",
      avatar: "https://picsum.photos/seed/3d/100/100"
    },
    deadline: "Ongoing",
    postDate: "Nov 28, 2024",
    duration: "3 Hours",
    stipend: "N/A",
    requirements: {
      technical: ["Basic CAD knowledge"],
      eligibility: ["All students"]
    }
  },
  {
    id: "29429",
    title: "Sociology Study: Urban Living",
    tags: ["RESEARCH"],
    description: "Participate in interviews about your experience living in urban environments.",
    abstract: "Helping researchers understand the social dynamics of city life.",
    author: {
      name: "Dr. Urban",
      department: "Sociology Dept",
      avatar: "https://picsum.photos/seed/city/100/100"
    },
    deadline: "Ongoing",
    postDate: "Dec 1, 2024",
    duration: "1 Hour",
    stipend: "$20 Cash",
    requirements: {
      technical: ["Communication skills"],
      eligibility: ["Students living in cities"]
    }
  },
  {
    id: "29430",
    title: "Game Design Competition",
    tags: ["COMPETITION"],
    description: "Create a game in 48 hours and compete for prizes and industry recognition.",
    abstract: "The ultimate challenge for student game developers and designers.",
    author: {
      name: "Game Lab",
      department: "Computer Science",
      avatar: "https://picsum.photos/seed/game/100/100"
    },
    deadline: "March 15, 2025",
    postDate: "Dec 3, 2024",
    duration: "48 Hours",
    stipend: "Prizes: Consoles, Software",
    requirements: {
      technical: ["Game engine knowledge"],
      eligibility: ["Student teams"]
    }
  },
  {
    id: "29431",
    title: "Campus Photography Exhibition",
    tags: ["EVENT", "ARTS"],
    description: "Submit your best photos of campus life for our annual exhibition.",
    abstract: "Showcasing the talent and creativity of student photographers.",
    author: {
      name: "Photo Club",
      department: "Arts",
      avatar: "https://picsum.photos/seed/photo/100/100"
    },
    deadline: "April 1, 2025",
    postDate: "Dec 5, 2024",
    duration: "Exhibition week",
    stipend: "N/A",
    requirements: {
      technical: ["Photography skills"],
      eligibility: ["All students"]
    }
  },
  {
    id: "29432",
    title: "AI for Climate Change",
    tags: ["RESEARCH", "FUNDING"],
    description: "Develop AI models to predict and mitigate the effects of climate change.",
    abstract: "Using cutting-edge technology to address the global climate crisis.",
    author: {
      name: "Climate AI",
      department: "Environmental Science",
      avatar: "https://picsum.photos/seed/climate/100/100"
    },
    deadline: "January 30, 2025",
    postDate: "Dec 8, 2024",
    duration: "1 Year",
    stipend: "$4,000 / Semester",
    requirements: {
      technical: ["Machine Learning", "Climate modeling"],
      eligibility: ["Graduate students"]
    }
  },
  {
    id: "29433",
    title: "Yoga and Mindfulness Classes",
    tags: ["SPORTS"],
    description: "Join our weekly yoga and mindfulness sessions to reduce stress and improve focus.",
    abstract: "Promoting student well-being through physical and mental practice.",
    author: {
      name: "Wellness Center",
      department: "Student Services",
      avatar: "https://picsum.photos/seed/yoga/100/100"
    },
    deadline: "Ongoing",
    postDate: "Dec 10, 2024",
    duration: "Weekly",
    stipend: "N/A",
    requirements: {
      technical: ["Comfortable clothing"],
      eligibility: ["All students"]
    }
  },
  {
    id: "29434",
    title: "Mobile App Security Audit",
    tags: ["INTERNSHIP", "URGENT"],
    description: "Help us audit the security of our official campus mobile applications.",
    abstract: "Gain experience in penetration testing and secure coding practices.",
    author: {
      name: "Security Team",
      department: "IT Services",
      avatar: "https://picsum.photos/seed/sec/100/100"
    },
    deadline: "December 30, 2024",
    postDate: "Dec 12, 2024",
    duration: "2 Months",
    stipend: "$2,000 / Month",
    requirements: {
      technical: ["Penetration testing", "Mobile security"],
      eligibility: ["CS or Cybersecurity students"]
    }
  },
  {
    id: "29435",
    title: "Historical Archive Digitization",
    tags: ["RESEARCH", "VOLUNTEER"],
    description: "Help digitize our university's historical archives for future generations.",
    abstract: "Preserving our history through digital technology.",
    author: {
      name: "Archive Dept",
      department: "Library",
      avatar: "https://picsum.photos/seed/arch/100/100"
    },
    deadline: "Ongoing",
    postDate: "Dec 15, 2024",
    duration: "Flexible",
    stipend: "N/A",
    requirements: {
      technical: ["Attention to detail"],
      eligibility: ["All students"]
    }
  },
  {
    id: "29436",
    title: "Public Speaking Workshop",
    tags: ["WORKSHOP"],
    description: "Master the art of public speaking and presentation in this interactive workshop.",
    abstract: "Build confidence and communication skills for academic and professional success.",
    author: {
      name: "Speech Lab",
      department: "Communications",
      avatar: "https://picsum.photos/seed/speech/100/100"
    },
    deadline: "Ongoing",
    postDate: "Dec 18, 2024",
    duration: "4 Weeks",
    stipend: "N/A",
    requirements: {
      technical: ["Willingness to practice"],
      eligibility: ["All students"]
    }
  }
];
