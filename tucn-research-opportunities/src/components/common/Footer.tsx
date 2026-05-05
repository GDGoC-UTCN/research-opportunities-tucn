export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white w-full py-8 mt-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} Technical University of Cluj-Napoca. All rights reserved.</p>
        <div className="flex justify-center gap-4 mt-4">
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}
