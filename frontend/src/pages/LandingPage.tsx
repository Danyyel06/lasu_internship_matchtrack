import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/axios';

interface JobFamilyWeight {
  id: number;
  name: string;
  default_weights: { cgpa?: number; skills?: number; project?: number; coursework?: number } | null;
}

export default function LandingPage() {
  const [jobFamilies, setJobFamilies] = useState<JobFamilyWeight[]>([]);
  const [weightsLoading, setWeightsLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    api
      .get('/job-families/')
      .then((res) => {
        setJobFamilies(res.data.filter((jf: JobFamilyWeight) => jf.default_weights));
      })
      .catch(() => {})
      .finally(() => setWeightsLoading(false));
  }, []);

  const faqItems = [
    {
      question: 'What is a Fit Score and how is it calculated?',
      answer:
        'Your Fit Score is a percentage that represents how well you match a specific internship posting. It is calculated using a Weighted Sum Model that considers four criteria — your CGPA, Verified Skills, Project Experience, and Coursework Relevance — each multiplied by a weight that varies depending on the Job Family (industry). The weights always add up to 100%.',
    },
    {
      question: 'Why does my Fit Score differ from my friend\'s, even though we have the same CGPA?',
      answer:
        'Because the Fit Score is not just about CGPA. It also includes your verified skills, project experience, and coursework relevance. Furthermore, if you and your friend selected different Job Families (e.g., Software & Technology vs. Legal & Compliance), the weights applied to each criterion are different, so even identical profiles can produce different scores in different industries.',
    },
    {
      question: 'Can I improve my Fit Score after onboarding?',
      answer:
        'Yes! You can add new skills to your profile and pass the AI-powered Skill Verification diagnostic to increase your verified skill score. You can also update your project experience. Your Fit Score is recalculated automatically whenever your profile changes meaningfully.',
    },
    {
      question: 'What is the difference between the Competitive Track and the Equity Track?',
      answer:
        'The Competitive Track is for Tier 1 students — those with high Fit Scores who meet 70–90% or more of a role\'s requirements. They do not need to be a perfect match, but they must demonstrate strong alignment with the role. The Equity & Developmental Track is for Tier 2 and Tier 3 students — those with little to no experience who are still building their skills. The system enforces a mandatory 20% Equity quota: for every 5 internship slots a company posts, at least 1 must go to an Equity Track student. This means even high-demand companies must give developmental students a real opportunity, not just a token gesture.',
    },
    {
      question: 'How does the system prevent bias in the matching algorithm?',
      answer:
        'Multiple safeguards are built in: (1) Weights are transparent and configurable by the university, not hidden in code. (2) Skills are verified through an AI diagnostic, preventing score inflation from self-reporting. (3) The mandatory 20% Equity Track quota ensures companies cannot offer 100% of slots only to top-tier students — developmental students always get a guaranteed share. (4) Companies see a full gap analysis per candidate, not just a number, so human judgment is preserved. (5) Job Family weights are industry-specific, so a Law student is not unfairly penalised for lacking software projects.',
    },
    {
      question: 'Can the matching weights change over time?',
      answer:
        'Yes. The university\'s Super Admin can adjust the weight distributions for any Job Family at any time to reflect evolving industry needs. Any changes are immediately reflected across the platform, including on this page. The weights shown below are always live and up-to-date.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans">
      {/* ===== STICKY NAV BAR ===== */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/lasu-logo.png" alt="LASU Logo" className="w-10 h-10 object-contain" />
            <span className="font-semibold text-base sm:text-lg text-neutral-900 hidden sm:block">
              LASU Internship MatchTrack
            </span>
          </div>

          {/* Center Nav Links — hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#problem" className="text-neutral-600 hover:text-neutral-900 text-sm font-medium transition-colors">
              The Problem
            </a>
            <a href="#how-it-works" className="text-neutral-600 hover:text-neutral-900 text-sm font-medium transition-colors">
              How it works
            </a>
            <a href="#matching" className="text-neutral-600 hover:text-neutral-900 text-sm font-medium transition-colors">
              Matching
            </a>
            <a href="#stakeholders" className="text-neutral-600 hover:text-neutral-900 text-sm font-medium transition-colors">
              Stakeholders
            </a>
            <a href="#faq" className="text-neutral-600 hover:text-neutral-900 text-sm font-medium transition-colors">
              FAQ
            </a>
          </div>

          {/* Right Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-neutral-700 hover:text-neutral-900 text-sm font-medium transition-colors hidden sm:block"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="py-16 sm:py-20 lg:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        <h1 className="font-extrabold text-neutral-900 text-[clamp(2.2rem,8vw,6rem)] leading-[1.0] tracking-[clamp(-1px,-0.05em,-3px)]">
          Smarter internships{' '}
          <span className="relative inline-block">
            start
            {/* Hand-drawn circle SVG */}
            <svg
              className="absolute -inset-2 sm:-inset-3 w-[calc(100%+16px)] h-[calc(100%+16px)] sm:w-[calc(100%+24px)] sm:h-[calc(100%+24px)]"
              viewBox="0 0 200 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <ellipse
                cx="100"
                cy="40"
                rx="90"
                ry="32"
                stroke="#EAB308"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.7"
                transform="rotate(-2, 100, 40)"
              />
            </svg>
          </span>{' '}
          here.
        </h1>
        <p className="mt-6 text-base sm:text-lg text-neutral-500 max-w-2xl mx-auto leading-relaxed">
          LIM replaces manual SIWES processes with a powerful platform that intelligently connects
          students to internships, tracks performance, and delivers real-time visibility for all.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/signup"
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-3.5 rounded-full text-base transition-colors"
          >
            Sign Up
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto border-2 border-neutral-200 hover:border-neutral-300 text-neutral-700 font-semibold px-8 py-3.5 rounded-full text-base transition-colors text-center"
          >
            Log In
          </Link>
        </div>
      </section>

      {/* ===== DASHBOARD PREVIEW SECTION ===== */}
      <section className="py-12 lg:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Live Matching Dashboard */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-5">Live Matching Dashboard</p>
            <div className="space-y-4">
              {[
                { company: 'TechBank NG', role: 'Software Dev', score: '92%', color: 'text-violet-600' },
                { company: 'DataPrime Ltd', role: 'Database Intern', score: '87%', color: 'text-violet-600' },
                { company: 'StartupHub', role: 'UI/UX Design', score: '81%', color: 'text-violet-600' },
              ].map((item) => (
                <div key={item.company} className="flex items-center justify-between">
                  <span className="text-sm text-neutral-800">
                    <span className="font-semibold">{item.company}</span>
                    <span className="text-neutral-400"> · {item.role}</span>
                  </span>
                  <span className={`font-bold text-sm ${item.color}`}>{item.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Growth — Purple Card */}
          <div className="bg-violet-600 rounded-2xl p-6 text-white">
            <p className="text-xs font-semibold text-violet-200 uppercase tracking-wider mb-3">Skill Growth</p>
            <p className="text-5xl font-bold mb-3">+14%</p>
            <p className="text-sm text-violet-100 leading-relaxed">
              Growth verified by industry mentors this week.
            </p>
          </div>

          {/* Supervision */}
          <div className="bg-white border border-neutral-200 rounded-2xl p-6">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-5">Supervision</p>
            <div className="space-y-3">
              {['Active Monitoring', 'Early Warning System', 'Competency Logbook', 'Unified Framework'].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-neutral-800">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== THE PROBLEM SECTION ===== */}
      <section id="problem" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Column */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
              SIWES is broken.{' '}
              <br className="hidden sm:block" />
              Everyone knows it.
            </h2>
            <p className="mt-5 text-neutral-500 text-base leading-relaxed max-w-lg">
              Every year, thousands of students navigate Nigeria&rsquo;s mandatory internship
              system on paper — with no guidance, no matching, and no way to prove growth.
            </p>
            <div className="mt-8 bg-white border border-neutral-200 rounded-2xl p-6 max-w-md">
              <div className="space-y-4">
                {[
                  { emoji: '📄', text: 'Paper logbooks nobody reads' },
                  { emoji: '🎲', text: 'Random placement, zero matching' },
                  { emoji: '🚨', text: 'Supervisors with zero visibility' },
                ].map((item) => (
                  <div key={item.text}>
                    <div className="flex items-center gap-3">
                      <span className="text-base">{item.emoji}</span>
                      <span className="text-sm font-medium text-neutral-800">{item.text}</span>
                    </div>
                    <div className="mt-3 border-b border-neutral-100 last:border-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column — Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: '12', description: 'Global systems reviewed to build LASU MatchTrack.', color: 'text-violet-600' },
              { value: '60%', description: 'Reduction in administrative paperwork.', color: 'text-violet-600' },
              { value: '0%', description: 'existing platforms combine intelligent matching + competency tracking for Nigeria.', color: 'text-violet-600' },
              { value: '3', description: 'critical gaps in every system built before LASU MatchTrack.', color: 'text-violet-600' },
            ].map((stat) => (
              <div key={stat.value} className="bg-white border border-neutral-200 rounded-2xl p-5">
                <p className={`text-3xl lg:text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="mt-2 text-xs sm:text-sm text-neutral-500 leading-relaxed">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS — FEATURES SECTION ===== */}
      <section id="how-it-works" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
          Not just another platform.{' '}
          <br className="hidden sm:block" />
          A smarter system.
        </h2>
        <p className="mt-4 text-neutral-500 text-base max-w-xl mx-auto">
          Three core innovations built for the Nigerian context.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '💬',
              label: 'FEATURE 01',
              title: 'Intelligent Matching',
              description:
                'A Weighted Sum Model algorithm calculates a Fit Score for every student-internship pair — based on verified skills, CGPA, coursework, and preferences. Each student gets 5 ranked recommendations. Not guesswork. Data.',
            },
            {
              icon: '📊',
              label: 'FEATURE 02',
              title: 'Bi-weekly Log',
              description:
                'Instead of a paper logbook, students submit bi-weekly updates on their progress. Supervisors review these submissions, endorsing evidence and providing coaching tips to ensure continuous growth.',
            },
            {
              icon: '🔔',
              label: 'FEATURE 03',
              title: 'Unified Supervision',
              description:
                'One dashboard. All supervisors — university and industry — see the same real-time data. An early warning system flags at-risk students before problems escalate. No more discovering issues at semester end.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white border border-neutral-200 rounded-2xl p-6 lg:p-8 text-left"
            >
              <div className="w-12 h-12 bg-neutral-100 rounded-2xl flex items-center justify-center text-2xl mb-5">
                {feature.icon}
              </div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                {feature.label}
              </p>
              <h3 className="text-lg font-bold text-neutral-900 mb-3">{feature.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== STAKEHOLDERS SECTION ===== */}
      <section id="stakeholders" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
          Built for everyone in the{' '}
          <br className="hidden sm:block" />
          internship chain.
        </h2>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🎓',
              iconBg: 'bg-violet-50',
              label: 'FOR',
              title: 'Students',
              points: [
                'Get matched to internships that actually fit your verified skills',
                'Track real competency growth week by week with a structured logbook',
                'Graduate with a verified portfolio that proves what you can do',
                'Access bootcamp pathways if your technical skills need strengthening',
              ],
            },
            {
              icon: '🏢',
              iconBg: 'bg-blue-50',
              label: 'FOR',
              title: 'Companies',
              points: [
                'Receive pre-verified, skill-matched candidates — not random applicants',
                'Post detailed internship requirements through our structured onboarding form',
                'Monitor intern progress through shared dashboards with real-time updates',
                'Co-create assessment frameworks that serve your business goals',
              ],
            },
            {
              icon: '🏛️',
              iconBg: 'bg-amber-50',
              label: 'FOR',
              title: 'Universities',
              points: [
                'Replace manual SIWES processes with a single intelligent platform',
                'Monitor all students remotely with automated alerts and early warnings',
                'Generate real analytics on placement rates, skill outcomes, and company partnerships',
                'Ensure SIWES compliance through standardised digital records',
              ],
            },
          ].map((stakeholder) => (
            <div
              key={stakeholder.title}
              className="bg-white border border-neutral-200 rounded-2xl p-6 lg:p-8 text-left"
            >
              <div className={`w-12 h-12 ${stakeholder.iconBg} rounded-2xl flex items-center justify-center text-2xl mb-5`}>
                {stakeholder.icon}
              </div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                {stakeholder.label}
              </p>
              <h3 className="text-xl font-bold text-neutral-900 mb-5">{stakeholder.title}</h3>
              <div className="space-y-3.5">
                {stakeholder.points.map((point) => (
                  <div key={point} className="flex items-start gap-3">
                    <div className="w-4 h-4 mt-0.5 rounded-full border-2 border-violet-300 flex-shrink-0" />
                    <p className="text-sm text-neutral-600 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== HOW MATCHING WORKS — ALGORITHMIC TRANSPARENCY ===== */}
      <section id="matching" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            How your Fit Score{' '}
            <br className="hidden sm:block" />
            is calculated.
          </h2>
          <p className="mt-4 text-neutral-500 text-base max-w-2xl mx-auto">
            Full transparency. Your Fit Score is calculated using a Weighted Sum Model across four criteria.
            The weights differ by industry because different fields value different strengths.
            These values are live — they reflect the university&rsquo;s current configuration.
          </p>
        </div>

        {/* Four Criteria Explainer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          {[
            {
              icon: '📚',
              title: 'CGPA',
              description: 'Your cumulative grade point average from LASU, reflecting overall academic performance.',
              color: 'bg-blue-50 text-blue-600',
            },
            {
              icon: '⚡',
              title: 'Verified Skills',
              description: 'Technical and soft skills tested through our AI-powered diagnostic — not self-reported.',
              color: 'bg-violet-50 text-violet-600',
            },
            {
              icon: '🛠️',
              title: 'Project Experience',
              description: 'Hands-on projects, hackathons, and practical work that demonstrate applied competence.',
              color: 'bg-emerald-50 text-emerald-600',
            },
            {
              icon: '📝',
              title: 'Coursework Relevance',
              description: 'How closely your academic modules align with the internship domain you\'re applying to.',
              color: 'bg-amber-50 text-amber-600',
            },
          ].map((criterion) => (
            <div
              key={criterion.title}
              className="bg-white border border-neutral-200 rounded-2xl p-6 text-left"
            >
              <div className={`w-12 h-12 ${criterion.color} rounded-2xl flex items-center justify-center text-2xl mb-4`}>
                {criterion.icon}
              </div>
              <h3 className="font-bold text-neutral-900 mb-2">{criterion.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{criterion.description}</p>
            </div>
          ))}
        </div>

        {/* The Formula */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 lg:p-8 mb-12 text-center">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">The Formula</p>
          <p className="text-base sm:text-lg font-mono text-neutral-800 leading-relaxed">
            Fit Score = (<span className="text-blue-600 font-bold">W₁</span> × CGPA) + (<span className="text-violet-600 font-bold">W₂</span> × Skills) + (<span className="text-emerald-600 font-bold">W₃</span> × Projects) + (<span className="text-amber-600 font-bold">W₄</span> × Coursework)
          </p>
          <p className="text-sm text-neutral-400 mt-3">
            Where W₁ + W₂ + W₃ + W₄ = 100% — always. Weights vary by Job Family (industry).
          </p>
        </div>

        {/* Live Weight Table */}
        <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-neutral-900">Live Weight Distribution by Job Family</h3>
              <p className="text-sm text-neutral-500 mt-1">
                These values are pulled directly from the platform&rsquo;s configuration and update automatically when the university makes changes.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Data
            </div>
          </div>

          {weightsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : jobFamilies.length === 0 ? (
            <div className="text-center py-12 text-neutral-400 text-sm">
              Weight data is currently being configured. Check back soon.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-neutral-50 text-left">
                    <th className="px-6 py-3.5 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Job Family</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-blue-500 uppercase tracking-wider text-center">CGPA</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-violet-500 uppercase tracking-wider text-center">Skills</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-emerald-500 uppercase tracking-wider text-center">Projects</th>
                    <th className="px-6 py-3.5 text-xs font-semibold text-amber-500 uppercase tracking-wider text-center">Coursework</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {jobFamilies.map((jf) => {
                    const w = jf.default_weights || {};
                    return (
                      <tr key={jf.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-neutral-900">{jf.name}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-12 py-1 rounded-full bg-blue-50 text-blue-700 font-bold text-xs">
                            {w.cgpa ?? '—'}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-12 py-1 rounded-full bg-violet-50 text-violet-700 font-bold text-xs">
                            {w.skills ?? '—'}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-12 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs">
                            {w.project ?? '—'}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-12 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs">
                            {w.coursework ?? '—'}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-neutral-400 mt-4">
          These weights are reviewed periodically by the university to reflect current industry needs.
          Changes made by the Super Admin are reflected here in real-time.
        </p>
      </section>

      {/* ===== FAQ SECTION ===== */}
      <section id="faq" className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            Frequently Asked{' '}
            <br className="hidden sm:block" />
            Questions
          </h2>
          <p className="mt-4 text-neutral-500 text-base max-w-xl mx-auto">
            Everything you need to know about how matching, scoring, and placement works.
          </p>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className={`bg-white border rounded-2xl transition-all duration-200 ${
                  isOpen ? 'border-violet-200 shadow-sm' : 'border-neutral-200'
                }`}
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="text-sm font-semibold text-neutral-900 pr-4">{item.question}</span>
                  <span
                    className={`text-neutral-400 text-xl transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? 'rotate-45' : ''
                    }`}
                  >
                    +
                  </span>
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 -mt-1">
                    <p className="text-sm text-neutral-600 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-4 sm:mx-6 lg:mx-8 mb-16">
        <div className="max-w-7xl mx-auto bg-gradient-to-br from-violet-600 to-violet-900 rounded-3xl py-12 lg:py-16 px-8 lg:px-16 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl shadow-violet-900/20">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Ready for the launch?</h2>
            <p className="mt-2 text-neutral-400 text-sm sm:text-base">
              Be part of the launch before everyone else.
            </p>
          </div>
          <Link
            to="/signup"
            className="w-full lg:w-auto bg-white hover:bg-neutral-100 text-slate-900 font-semibold px-8 py-3.5 rounded-full text-base transition-colors text-center"
          >
            Sign Up Now
          </Link>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="bg-white border-t border-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo + Description */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src="/lasu-logo.png" alt="LASU Logo" className="w-10 h-10 object-contain" />
              <span className="font-semibold text-base text-neutral-900">
                LASU Internship MatchTrack
              </span>
            </div>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-sm">
              Replacing Nigeria&rsquo;s broken, paper-based SIWES system with an intelligent platform
              that matches students to the right placement, tracks real skill growth, and
              keeps everyone informed in real time.
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Platform
            </h4>
            <div className="space-y-2.5">
              <a href="#problem" className="block text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                The Problem
              </a>
              <a href="#how-it-works" className="block text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                How it works
              </a>
              <a href="#matching" className="block text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                Matching & Scoring
              </a>
              <a href="#stakeholders" className="block text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                Stakeholders
              </a>
              <a href="#faq" className="block text-sm text-neutral-600 hover:text-neutral-900 transition-colors">
                FAQ
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Contact Us
            </h4>
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <span>📞</span>
              <span>08167261128</span>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-neutral-100">
          <p className="text-xs text-neutral-400 text-center">
            © {new Date().getFullYear()} LASU Internship MatchTrack. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
