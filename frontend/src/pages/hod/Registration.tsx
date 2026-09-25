import { Link } from 'react-router-dom';

export default function HodRegistration() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-100/50 blur-3xl"></div>
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-violet-100/50 blur-3xl"></div>
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-neutral-100 p-8 relative z-10 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-sm border border-blue-100 mb-6 mx-auto">
          🏛️
        </div>
        
        <h1 className="text-2xl font-bold text-neutral-900 tracking-tight mb-2">
          HOD Accounts Are Provisioned
        </h1>
        
        <p className="text-neutral-600 leading-relaxed mb-8">
          Head of Department accounts cannot be registered publicly. They are provisioned directly by the University Super Admin. 
          If you are an HOD, please check your official university email for your login credentials.
        </p>
        
        <div className="space-y-4">
          <Link 
            to="/login"
            className="w-full flex items-center justify-center py-3 px-4 bg-black text-white text-sm font-semibold rounded-xl hover:bg-neutral-800 transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
          >
            Go to Login
          </Link>
          <p className="text-sm text-neutral-500 mt-6">
            Need help? Contact the <a href="#" className="text-blue-600 font-semibold hover:underline">system administrator</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
