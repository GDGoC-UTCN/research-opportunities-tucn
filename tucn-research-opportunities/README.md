# TUCN Research Opportunities 🎓

A modern, responsive web application built to connect students and professors at the Technical University of Cluj-Napoca (UTCN). This platform serves as a centralized hub for academic research projects, making it easy for professors to post opportunities and for students to discover and apply to them.

## 🚀 Features

**🔵 For Students:**
- **Browse Opportunities:** View a list of available research topics across fields like Artificial Intelligence, Computer Graphics, Robotics, and Software Engineering.
- **Apply to Projects:** Send a quick application by writing a short letter of intent directly on the platform.
- **View Details:** Read full descriptions, requirements, and tech stack tags for each project.

**🎓 For Professors:**
- **Create Opportunities:** Post new research ideas specifying details, requirements, and relevant tags.
- **Manage Dashboard:** Access a personal dashboard (`My Dashboard`) to view only the projects they have created.
- **Review Applicants:** View a list of all students who have applied to their projects, including the student's name, email, and application message.

## 🛠 Tech Stack

- **Frontend Framework:** [React 19](https://react.dev/) powered by [Vite](https://vitejs.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** Custom UTCN-themed [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)

## ⚙️ Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation & Running

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/GDGoC-UTCN/research-opportunities-tucn.git
   cd research-opportunities-tucn
   cd tucn-research-opportunities
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit: `http://localhost:3000/`

## 🔐 Mock Authentication Flow

This project currently uses a simulated state-based authentication system:
- Click **"Login as Student"** to view the application through the eyes of an applicant.
- Click **"Login as Professor"** to unlock the "Create Opportunity" form and the Professor Dashboard.
- You can switch between accounts at any time by clicking **"Log Out"** in the top right corner.

*Note: All data including users, projects, and applications are currently stored in memory (mock data) and will reset upon a page refresh.*

## 🎨 UI/UX Design
The platform uses the official **UTCN Blue (`#0066b3`)** alongside modern soft shadows, rounded corners, and smooth Framer Motion transitions to ensure an accessible and premium experience.
