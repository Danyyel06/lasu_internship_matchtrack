import { Link } from 'react-router-dom';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-white font-sans flex flex-col relative">
      {/* Back link */}
      <div className="absolute top-6 left-4 sm:left-8 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to home
        </Link>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-10 sm:py-12 lg:py-16">
        
        {/* Intro Text Section */}
        <div className="max-w-4xl w-full text-center mb-8 sm:mb-12 animate-fadeIn">
          <h1 className="text-4xl sm:text-5xl lg:text-[clamp(2.5rem,5vw,4rem)] font-black text-neutral-900 leading-[1.1] tracking-[clamp(-1px,-0.05em,-3px)] mb-3 sm:mb-4">
            One platform. Two distinct paths.<br className="hidden sm:block" />
            <span className="text-violet-600">Choose how you'll join.</span>
          </h1>
          <p className="text-neutral-500 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Whether you're a student building a verified portfolio of skills, or an organization looking to recruit top pre-verified talent, your journey to smarter internships starts here.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl mb-8">
          
          {/* Student Card */}
          <Link
            to="/register/student"
            className="group relative bg-white border border-neutral-200 hover:border-violet-300 hover:shadow-2xl hover:shadow-violet-900/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
          >
            {/* Hover Background Accent */}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-300 relative z-10">
              <span className="text-3xl">🎓</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 group-hover:text-violet-700 transition-colors mb-2 relative z-10">
              Student
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6 relative z-10">
              LASU undergraduate looking for an internship. Complete your profile, take the diagnostic test, and get matched.
            </p>
            
            <div className="mt-auto w-full py-3 bg-neutral-50 group-hover:bg-violet-600 text-neutral-600 group-hover:text-white font-semibold rounded-xl text-sm transition-colors relative z-10 flex items-center justify-center gap-2">
              Register as Student
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>

          {/* Company Representative Card */}
          <Link
            to="/register/company"
            className="group relative bg-white border border-neutral-200 hover:border-green-300 hover:shadow-2xl hover:shadow-green-900/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col items-center text-center overflow-hidden"
          >
            {/* Hover Background Accent */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4 sm:mb-5 group-hover:scale-110 transition-transform duration-300 relative z-10">
              <span className="text-3xl">🏢</span>
            </div>
            
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 group-hover:text-green-700 transition-colors mb-2 relative z-10">
              Company Representative
            </h2>
            <p className="text-sm text-neutral-500 leading-relaxed mb-6 relative z-10">
              Register your organization to post internship opportunities, define requirements, and recruit verified talent.
            </p>
            
            <div className="mt-auto w-full py-3 bg-neutral-50 group-hover:bg-green-600 text-neutral-600 group-hover:text-white font-semibold rounded-xl text-sm transition-colors relative z-10 flex items-center justify-center gap-2">
              Register as Company
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>

        </div>

        {/* Footer Area */}
        <div className="text-center space-y-4">
          <p className="text-sm text-neutral-500">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-600 font-bold hover:text-violet-800 transition-colors">
              Sign in →
            </Link>
          </p>

          {/* Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {[
              { icon: '🔒', label: 'LASU-verified' },
              { icon: '🛡️', label: 'All sessions encrypted' },
              { icon: '✓', label: 'SIWES compliant' },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-1.5">
                <span className="text-xs">{badge.icon}</span>
                <span className="text-xs text-neutral-400 font-medium tracking-wide">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
