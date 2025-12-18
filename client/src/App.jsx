import { useState, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import { LogOut, GraduationCap, Briefcase, Code, Heart, Target, Sparkles, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useAuth();
  if (loading) return null;
  return token ? children : <Navigate to="/login" />;
};

function Dashboard() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();

  // State
  const [formData, setFormData] = useState({
    education: '', major: '', skills: '', interests: '', goals: ''
  });
  const [results, setResults] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [activeFeature, setActiveFeature] = useState(null);
  const [featureContent, setFeatureContent] = useState('');
  const [featureLoading, setFeatureLoading] = useState(false);

  // Refs for PDF export
  const resultsRef = useRef(null);
  const featureRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResults('');
    setActiveFeature(null);
    setFeatureContent('');

    try {
      const response = await fetch('/api/analyze-career', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Analysis failed.');
      const data = await response.json();
      setResults(data.result);

      const match = data.result.match(/<h3[^>]*>(.*?)<\/h3>/);
      setJobTitle(match && match[1] ? match[1] : 'Career Opportunity');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFeature = async (endpoint, featureName) => {
    setActiveFeature(featureName);
    setFeatureLoading(true);
    setFeatureContent('');

    try {
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...formData, jobTitle })
      });

      if (!response.ok) throw new Error(`Failed to generate ${featureName}`);
      const data = await response.json();
      setFeatureContent(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setFeatureLoading(false);
    }
  };

  const exportToPDF = async (elementRef, filename) => {
    if (!elementRef.current) return;
    try {
      const canvas = await html2canvas(elementRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${filename}.pdf`);
    } catch (err) {
      console.error("PDF Export failed", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Glassmorphism Header */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2 rounded-lg text-white">
                <Sparkles size={20} />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                MentorAI
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-gray-600 hidden sm:block">Hello, <span className="font-semibold text-gray-900">{user?.username}</span></span>
              <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 transition-colors" title="Logout">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Discover Your <span className="text-indigo-600">Perfect Career</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            AI-powered guidance tailored to your skills, interests, and dreams.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="text-indigo-500" size={20} /> Your Profile
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Education</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 text-gray-400" size={18} />
                    <select name="education" value={formData.education} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all">
                      <option value="">Select Level</option>
                      <option value="High School">High School</option>
                      <option value="Associate's Degree">Associate's Degree</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="Doctorate">Doctorate</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Major</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 text-gray-400" size={18} />
                    <input type="text" name="major" value={formData.major} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Computer Science" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Skills</label>
                  <div className="relative">
                    <Code className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea name="skills" rows="2" value={formData.skills} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Python, Leadership..." />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Interests</label>
                  <div className="relative">
                    <Heart className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea name="interests" rows="2" value={formData.interests} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Gaming, Art..." />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase">Career Goals</label>
                  <div className="relative">
                    <Target className="absolute left-3 top-3 text-gray-400" size={18} />
                    <textarea name="goals" rows="2" value={formData.goals} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Make an impact..." />
                  </div>
                </div>

                <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-indigo-500/30 hover:scale-[1.02] transition-all transform disabled:opacity-70 disabled:cursor-not-allowed">
                  {loading ? 'Analyzing Profile...' : 'Reveal Opportunities'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Results */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            )}

            {!results && !loading && !error && (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 p-12 border-2 border-dashed border-gray-200 rounded-3xl">
                <Sparkles size={48} className="mb-4 text-gray-300" />
                <p>Fill out your profile to get started</p>
              </div>
            )}

            {results && (
              <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 relative group" ref={resultsRef}>
                  <button onClick={() => exportToPDF(resultsRef, 'career-opportunities')} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100" title="Export to PDF">
                    <Download size={20} />
                  </button>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-4 border-b">Career Opportunities</h2>
                  <div className="prose prose-indigo max-w-none" dangerouslySetInnerHTML={{ __html: results }} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { id: 'generate-cover-letter', label: 'Cover Letter', color: 'bg-green-500' },
                    { id: 'generate-interview', label: 'Interview Prep', color: 'bg-purple-500' },
                    { id: 'generate-roadmap', label: 'Career Roadmap', color: 'bg-sky-500' }
                  ].map(feature => (
                    <button
                      key={feature.id}
                      onClick={() => handleFeature(feature.id, feature.label)}
                      className={`${feature.color} text-white p-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold flex items-center justify-center gap-2`}
                    >
                      <Sparkles size={18} /> {feature.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeFeature && (
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 animate-[slideIn_0.3s_ease-out] relative group" ref={featureRef}>
                <button onClick={() => exportToPDF(featureRef, activeFeature.toLowerCase().replace(' ', '-'))} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-indigo-100 hover:text-indigo-600 transition-colors opacity-0 group-hover:opacity-100" title="Export to PDF">
                  <Download size={20} />
                </button>
                <h3 className="text-xl font-bold text-gray-800 mb-4">{activeFeature}</h3>
                {featureLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                ) : (
                  <div className="prose prose-indigo max-w-none" dangerouslySetInnerHTML={{ __html: featureContent }} />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
