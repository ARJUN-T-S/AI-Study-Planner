import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setAuth } from "../Store/AuthStore";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword,updateProfile } from "firebase/auth";

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let userCredential;
      
      if (isLogin) {
        // Sign in with email and password
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Create new user with email and password
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Update profile with display name
        await updateProfile(userCredential.user, {
          displayName: name
        });
      }

      const idToken = await userCredential.user.getIdToken();
      console.log(idToken);
      // Call backend based on login/signup
      const backendEndpoint = isLogin
        ? 'http://localhost:5000/users/login'
        : 'http://localhost:5000/users/signup';

      const backendPayload = isLogin
        ? {} // send empty body for login
        : { email, name: name || email }; // send email and name for signup

      const backendRes = await fetch(backendEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(backendPayload),
      });

      const backendData = await backendRes.json();

      if (!backendRes.ok) {
        setError(backendData.message || "Backend verification failed");
        setLoading(false);
        return;
      }

      // Save in Redux
      dispatch(
        setAuth({
          idToken:idToken,
          email: userCredential.user.email,
          name: userCredential.user.displayName || email,
          
        })
      );

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed");
    }
    setLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();
      
      // Call backend for Google sign-in
      const backendEndpoint = `http://localhost:5000/users/login`;
      
      const backendRes = await fetch(backendEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      const backendData = await backendRes.json();

      if (!backendRes.ok) {
        setError(backendData.message || "Backend verification failed");
        setLoading(false);
        return;
      }

      // Save in Redux
      dispatch(
        setAuth({
          idToken:idToken,
          email: userCredential.user.email,
          name: userCredential.user.displayName,
          uid: userCredential.user.uid
        })
      );

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Google authentication failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-700 p-8 shadow-xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-brain text-white text-2xl"></i>
          </div>
          <h1 className="text-3xl font-bold">Welcome to LearnPath</h1>
          <p className="text-gray-400 mt-2">
            {isLogin ? "Sign in to continue your learning journey" : "Create your account to get started"}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <button 
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 hover:bg-gray-100 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-t-2 border-r-2 border-purple-600 rounded-full animate-spin"></div>
            ) : (
              <img 
                src="https://developers.google.com/identity/images/g-logo.png" 
                alt="Google" 
                className="w-5 h-5"
              />
            )}
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with email</span>
            </div>
          </div>
          
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Your Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <input 
                type="email" 
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            
            {isLogin && (
              <div className="flex justify-end">
                <a href="#" className="text-sm text-purple-400 hover:text-purple-300">
                  Forgot password?
                </a>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-3 rounded-lg font-medium mt-2 transition-colors ${
                loading ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-400">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button 
              onClick={() => setIsLogin(!isLogin)} 
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;