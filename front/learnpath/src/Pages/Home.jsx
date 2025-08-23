import { Link } from 'react-router-dom';

const LearnPathHome = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-brain text-white text-xl"></i>
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
            LearnPath
          </span>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link 
            to="/login"
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-all duration-300 transform hover:-translate-y-1"
          >
            Login / Signup
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 flex flex-col items-center text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          AI-Powered <span className="text-purple-400">Study Scheduling</span> 
          <br />That Adapts To You
        </h1>
        
        <p className="text-xl text-gray-300 max-w-3xl mb-12">
          Upload your subjects and model questions, and let our AI create the perfect study schedule based on your priorities and learning patterns.
        </p>
        
       
        
        {/* Animated Hero Visual */}
        <div className="relative w-full max-w-4xl h-80 mb-20">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50 rounded-2xl"></div>
          
          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-72 h-48 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 p-4 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm font-medium">AI Study Plan</div>
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <div className="h-2 bg-gray-700 rounded-full flex-1"></div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <div className="h-2 bg-gray-700 rounded-full flex-1"></div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <div className="h-2 bg-gray-700 rounded-full flex-1"></div>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <div className="h-2 bg-gray-700 rounded-full flex-1"></div>
              </div>
            </div>
          </div>
          
          <div className="absolute top-32 left-20 w-40 h-24 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 p-3 shadow-lg transform rotate-3">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-2">
                <i className="fas fa-book text-blue-400 text-sm"></i>
              </div>
              <div className="text-xs font-medium">Mathematics</div>
            </div>
            <div className="text-xs text-gray-400">12 chapters • 45 model questions</div>
          </div>
          
          <div className="absolute top-40 right-20 w-40 h-24 bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 p-3 shadow-lg transform -rotate-3">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-2">
                <i className="fas fa-flask text-purple-400 text-sm"></i>
              </div>
              <div className="text-xs font-medium">Physics</div>
            </div>
            <div className="text-xs text-gray-400">8 chapters • 32 model questions</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-16">How <span className="text-purple-400">LearnPath</span> Works</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-purple-500 transition-all duration-300">
            <div className="w-14 h-14 bg-purple-500/10 rounded-xl flex items-center justify-center mb-4">
              <i className="fas fa-upload text-purple-400 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3">Upload Materials</h3>
            <p className="text-gray-400">Upload your subjects, syllabus, and model questions in any format.</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-purple-500 transition-all duration-300">
            <div className="w-14 h-14 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4">
              <i className="fas fa-robot text-blue-400 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
            <p className="text-gray-400">Our AI analyzes content, difficulty, and patterns to prioritize topics.</p>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 hover:border-purple-500 transition-all duration-300">
            <div className="w-14 h-14 bg-green-500/10 rounded-xl flex items-center justify-center mb-4">
              <i className="fas fa-calendar-alt text-green-400 text-2xl"></i>
            </div>
            <h3 className="text-xl font-semibold mb-3">Get Your Schedule</h3>
            <p className="text-gray-400">Receive a personalized study plan optimized for your learning style and goals.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Study Routine?</h2>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10">
          Join thousands of students who are already using LearnPath to study smarter and achieve better results.
        </p>
        <Link 
          to="/login"
          className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl font-medium text-lg transition-all duration-300 transform hover:-translate-y-1"
        >
          Create Your Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-10">
        <div className="container mx-auto px-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} LearnPath. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LearnPathHome;