import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';

/* ──────────────────────── Nigerian States ──────────────────────── */
const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

/* ──────────────────────── Job Families ──────────────────────── */
const JOB_FAMILIES = [
  'Technology & Software',
  'Business & Finance',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil & Structural Eng.',
  'Health Sciences',
  'Media & Communications',
  'Legal & Compliance',
  'Architecture & Design',
  'Education & Research',
  'Environmental Science',
  'Supply Chain & Logistics',
];

/* ──────────────────────── Reusable FileUploadField ──────────────────────── */
interface FileUploadFieldProps {
  label: string;
  description: string;
  required?: boolean;
  dashed?: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

function FileUploadField({ label, description, required, dashed, file, onFileChange }: FileUploadFieldProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    onFileChange(selected);
  };

  return (
    <div
      className={`rounded-xl p-4 transition-colors ${
        dashed
          ? 'border-2 border-dashed border-gray-300 bg-gray-50/50'
          : 'border border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-0.5 flex-shrink-0 w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center text-green-700">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{description}</p>

          {file ? (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-md px-3 py-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => onFileChange(null)}
                className="ml-auto text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <label className="mt-2 inline-flex items-center gap-1.5 cursor-pointer text-sm font-medium text-green-700 hover:text-green-800 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload
              <input type="file" className="hidden" onChange={handleChange} accept=".pdf,.jpg,.jpeg,.png" />
            </label>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── Form Data Interface ──────────────────────── */
interface CompanyFormData {
  // Step 1
  registeredName: string;
  tradingName: string;
  cacNumber: string;
  businessType: string;
  yearOfIncorporation: string;
  tin: string;
  // Step 2
  industrySector: string;
  companySize: string;
  headquartersState: string;
  businessAddress: string;
  website: string;
  description: string;
  linkedinUrl: string;
  socialHandle: string;
  // Step 3
  firstName: string;
  lastName: string;
  jobTitle: string;
  workEmail: string;
  workPhone: string;
  repLinkedin: string;
  // Step 4
  internsPerCycle: string;
  jobFamilies: string[];
  internshipDuration: string;
  workArrangement: string;
  stipendPolicy: string;
  hasDedicatedSupervisor: string;
  // Step 5
  incorporationCert: File | null;
  govId: File | null;
  proofOfAddress: File | null;
  letterOfAuthority: File | null;
  tinCert: File | null;
  // Step 6
  username: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  agreeAuthorised: boolean;
  agreeConsent: boolean;
}

const initialFormData: CompanyFormData = {
  registeredName: '',
  tradingName: '',
  cacNumber: '',
  businessType: '',
  yearOfIncorporation: '',
  tin: '',
  industrySector: '',
  companySize: '',
  headquartersState: '',
  businessAddress: '',
  website: '',
  description: '',
  linkedinUrl: '',
  socialHandle: '',
  firstName: '',
  lastName: '',
  jobTitle: '',
  workEmail: '',
  workPhone: '',
  repLinkedin: '',
  internsPerCycle: '',
  jobFamilies: [],
  internshipDuration: '',
  workArrangement: '',
  stipendPolicy: '',
  hasDedicatedSupervisor: '',
  incorporationCert: null,
  govId: null,
  proofOfAddress: null,
  letterOfAuthority: null,
  tinCert: null,
  username: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false,
  agreeAuthorised: false,
  agreeConsent: false,
};

/* ──────────────────────── Step Titles ──────────────────────── */
const STEP_TITLES = [
  'Organisation identity',
  'Organisation profile',
  'Representative details',
  'Internship capacity',
  'Documents & verification',
  'Agreement & credentials',
];

/* ──────────────────────── Shared Sub-Components ──────────────────────── */

/** Consistent text input field */
function TextField({
  label,
  required,
  placeholder,
  helper,
  value,
  onChange,
  type = 'text',
  prefix,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  helper?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  prefix?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium select-none">
            {prefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow ${
            prefix ? 'pl-10' : ''
          }`}
        />
      </div>
      {helper && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{helper}</p>}
    </div>
  );
}

/** Consistent select field */
function SelectField({
  label,
  required,
  placeholder,
  options,
  value,
  onChange,
}: {
  label: string;
  required?: boolean;
  placeholder?: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow bg-white appearance-none"
      >
        <option value="">{placeholder || 'Select...'}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ════════════════════════ MAIN COMPONENT ════════════════════════ */

export default function CompanyOnboardingWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState<CompanyFormData>(initialFormData);

  const totalSteps = 6;
  const progressPercent = (currentStep / totalSteps) * 100;

  /* Helpers */
  const update = <K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    try {
      // POST to onboarding endpoint
      await api.post(
        `/companies/onboarding`,
        { 
          registration_no: formData.cacNumber,
          industry: formData.industrySector,
          company_address: formData.businessAddress,
          company_website: formData.website,
          company_size: formData.companySize
        }
      );
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to submit onboarding:', error);
      alert('Failed to submit onboarding data. Please try again.');
    }
  };

  const toggleJobFamily = (jf: string) => {
    setFormData((prev) => ({
      ...prev,
      jobFamilies: prev.jobFamilies.includes(jf)
        ? prev.jobFamilies.filter((f) => f !== jf)
        : [...prev.jobFamilies, jf],
    }));
  };

  /* ───── Success Screen ───── */
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          {/* Green checkmark */}
          <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <div className="w-12 h-12 rounded-full bg-green-700 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-green-700 mb-2">Congratulations!</h1>
          <p className="text-lg font-semibold text-gray-900 mb-1">Registration Complete</p>
          <p className="text-sm text-gray-500 mb-8">You're ready to begin your journey.</p>

          <button
            onClick={() => {
              // Update local storage or trigger a refresh if needed
              navigate('/company/dashboard');
              window.location.reload(); // Force refresh to update navigation state
            }}
            className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  /* ───── Wizard Shell ───── */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Header ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={currentStep > 1 ? handleBack : () => navigate(-1)}
            className="p-1 -ml-1 text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-900">{STEP_TITLES[currentStep - 1]}</span>
          <span className="text-xs text-gray-500">Step {currentStep} of {totalSteps}</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-1 bg-green-700 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-32 md:py-10 md:pb-10">
        {/* Badge */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
            🏢 Company Registration
          </span>
        </div>

        {/* Step content */}
        {currentStep === 1 && (
          <StepOrganisationIdentity formData={formData} update={update} onNext={handleNext} />
        )}
        {currentStep === 2 && (
          <StepOrganisationProfile formData={formData} update={update} onNext={handleNext} />
        )}
        {currentStep === 3 && (
          <StepRepresentativeDetails formData={formData} update={update} onNext={handleNext} />
        )}
        {currentStep === 4 && (
          <StepInternshipCapacity formData={formData} update={update} onNext={handleNext} toggleJobFamily={toggleJobFamily} />
        )}
        {currentStep === 5 && (
          <StepDocuments formData={formData} update={update} onNext={handleNext} />
        )}
        {currentStep === 6 && (
          <StepAgreement formData={formData} update={update} onSubmit={handleSubmit} />
        )}
      </main>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   STEP 1 — Organisation Identity
   ════════════════════════════════════════════════════════════════════ */

function StepOrganisationIdentity({
  formData,
  update,
  onNext,
}: {
  formData: CompanyFormData;
  update: <K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) => void;
  onNext: () => void;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Tell us about your organisation.</h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Start with the basics — your legal name and registration details. These are used to verify your company with CAC records.
        </p>
      </div>

      <div className="space-y-5">
        <TextField
          label="Registered company / organisation name"
          required
          placeholder="e.g. Flutterwave Technology Solutions Ltd"
          helper="Enter the exact legal name as registered with CAC. Avoid abbreviations."
          value={formData.registeredName}
          onChange={(v) => update('registeredName', v)}
        />

        <TextField
          label="Trading name (if different)"
          placeholder="e.g. Flutterwave"
          value={formData.tradingName}
          onChange={(v) => update('tradingName', v)}
        />

        <TextField
          label="CAC registration number (RC Number)"
          required
          placeholder="e.g. RC-1234567"
          helper="Your RC number is on your Certificate of Incorporation. It usually starts with RC or BN followed by digits."
          value={formData.cacNumber}
          onChange={(v) => update('cacNumber', v)}
        />

        <SelectField
          label="Business type"
          required
          placeholder="Select business type"
          options={[
            'Private Limited Company',
            'Public Limited Company',
            'Business Name',
            'Incorporated Trustee',
            'Limited by Guarantee',
            'Partnership',
          ]}
          value={formData.businessType}
          onChange={(v) => update('businessType', v)}
        />

        <TextField
          label="Year of incorporation"
          required
          placeholder="e.g. 2018"
          value={formData.yearOfIncorporation}
          onChange={(v) => update('yearOfIncorporation', v)}
        />

        <TextField
          label="Tax Identification Number (TIN) (optional)"
          placeholder="e.g. 12345678-0001"
          helper="Issued by FIRS. Providing your TIN speeds up the verification process."
          value={formData.tin}
          onChange={(v) => update('tin', v)}
        />
      </div>

      {/* Info card */}
      <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
        <div className="flex gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-800 leading-relaxed">
            The details provided here will be cross-checked against the Corporate Affairs Commission (CAC) database to ensure legitimacy. Please ensure the information matches your official registration documents exactly.
          </p>
        </div>
      </div>

      {/* Continue button */}
      <button
        type="button"
        onClick={onNext}
        className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors text-sm"
      >
        Continue →
      </button>

      {/* Sign-in link */}
      <p className="text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="text-green-700 font-medium hover:text-green-800 transition-colors">
          Sign in instead
        </Link>
      </p>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   STEP 2 — Organisation Profile
   ════════════════════════════════════════════════════════════════════ */

function StepOrganisationProfile({
  formData,
  update,
  onNext,
}: {
  formData: CompanyFormData;
  update: <K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) => void;
  onNext: () => void;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Shape your company profile.</h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Students will read this when deciding whether to apply. Make it compelling.
        </p>
      </div>

      <div className="space-y-5">
        <SelectField
          label="Industry sector"
          required
          placeholder="Select your industry"
          options={[
            'Technology',
            'Finance & Banking',
            'Manufacturing',
            'Healthcare',
            'Education',
            'Media & Communications',
            'Legal',
            'Engineering',
            'Agriculture',
            'Energy',
            'Other',
          ]}
          value={formData.industrySector}
          onChange={(v) => update('industrySector', v)}
        />

        {/* Side-by-side on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Company size"
            required
            placeholder="Select range"
            options={['1-10', '11-50', '51-200', '201-500', '500+']}
            value={formData.companySize}
            onChange={(v) => update('companySize', v)}
          />
          <SelectField
            label="Headquarters state"
            required
            placeholder="Select state"
            options={NIGERIAN_STATES}
            value={formData.headquartersState}
            onChange={(v) => update('headquartersState', v)}
          />
        </div>

        <TextField
          label="Full registered business address"
          required
          placeholder="Street address, LGA, State"
          value={formData.businessAddress}
          onChange={(v) => update('businessAddress', v)}
        />

        <TextField
          label="Official company website"
          required
          placeholder="https://yourcompany.com"
          helper="Must be a live, functional website. Free hosting or placeholder pages may delay verification."
          value={formData.website}
          onChange={(v) => update('website', v)}
        />

        {/* Company description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => update('description', e.target.value)}
            rows={4}
            placeholder="Briefly describe what your company does, your mission, and the kind of work interns would be involved in..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent resize-none transition-shadow"
          />
          <p className="text-xs text-gray-500 mt-1">
            This appears directly on your company page. Students read this when deciding where to apply.
          </p>
        </div>

        {/* Social media */}
        <div className="pt-2">
          <p className="text-sm font-medium text-gray-700 mb-3">Social media presence <span className="text-xs font-normal text-gray-400">(Optional)</span></p>
          <div className="space-y-4">
            <TextField
              label="LinkedIn Profile URL"
              placeholder="https://linkedin.com/company/yourcompany"
              prefix={
                <span className="font-bold text-xs text-blue-700">in</span>
              }
              value={formData.linkedinUrl}
              onChange={(v) => update('linkedinUrl', v)}
            />
            <TextField
              label="Instagram / Twitter Handle"
              placeholder="@yourcompany"
              helper="Helps students verify your identity and learn more about your culture."
              prefix="@"
              value={formData.socialHandle}
              onChange={(v) => update('socialHandle', v)}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors text-sm"
      >
        Continue →
      </button>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   STEP 3 — Representative Details
   ════════════════════════════════════════════════════════════════════ */

function StepRepresentativeDetails({
  formData,
  update,
  onNext,
}: {
  formData: CompanyFormData;
  update: <K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) => void;
  onNext: () => void;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">About you — the company rep.</h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          You are the primary contact and account owner. LASU will reach you through the details here.
        </p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="First name"
            required
            placeholder="e.g. Chidi"
            value={formData.firstName}
            onChange={(v) => update('firstName', v)}
          />
          <TextField
            label="Last name"
            required
            placeholder="e.g. Nwosu"
            value={formData.lastName}
            onChange={(v) => update('lastName', v)}
          />
        </div>

        <TextField
          label="Your job title / role"
          required
          placeholder="e.g. HR Manager, Head of Talent..."
          helper="You should be in a position of authority to manage and supervise interns."
          value={formData.jobTitle}
          onChange={(v) => update('jobTitle', v)}
        />

        <TextField
          label="Work email address"
          required
          type="email"
          placeholder="chidi@yourcompany.com"
          helper="Must match your company's registered domain. Generic domains (Gmail, Yahoo) will require extra verification."
          value={formData.workEmail}
          onChange={(v) => update('workEmail', v)}
        />

        <TextField
          label="Work phone number"
          required
          type="tel"
          placeholder="+234 800 000 0000"
          value={formData.workPhone}
          onChange={(v) => update('workPhone', v)}
        />

        <TextField
          label="LinkedIn profile URL (strongly recommended)"
          placeholder="https://linkedin.com/in/yourprofile"
          helper="LASU's verification team uses your LinkedIn to confirm your role and association with the company."
          value={formData.repLinkedin}
          onChange={(v) => update('repLinkedin', v)}
        />
      </div>

      {/* Warning card */}
      <div className="border-l-4 border-amber-400 bg-amber-50 rounded-r-lg p-4">
        <div className="flex gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-xs text-amber-800 leading-relaxed">
            If your work email uses a generic domain (Gmail, Yahoo, Outlook), you will be asked to upload a letter of authority on company letterhead in the Documents step.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors text-sm"
      >
        Continue →
      </button>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   STEP 4 — Internship Capacity
   ════════════════════════════════════════════════════════════════════ */

function StepInternshipCapacity({
  formData,
  update,
  onNext,
  toggleJobFamily,
}: {
  formData: CompanyFormData;
  update: <K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) => void;
  onNext: () => void;
  toggleJobFamily: (jf: string) => void;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Your internship offering.</h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          This information feeds directly into the LIMDP matching algorithm and helps us connect you with the right students.
        </p>
      </div>

      <div className="space-y-5">
        <SelectField
          label="How many interns per SIWES cycle?"
          required
          placeholder="Select range"
          options={['1-5', '6-10', '11-20', '21-50', '50+']}
          value={formData.internsPerCycle}
          onChange={(v) => update('internsPerCycle', v)}
        />

        {/* Job families multi-select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job families you recruit for <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {JOB_FAMILIES.map((jf) => {
              const checked = formData.jobFamilies.includes(jf);
              return (
                <label
                  key={jf}
                  className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                    checked
                      ? 'border-green-600 bg-green-50 text-green-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleJobFamily(jf)}
                    className="accent-green-700 w-4 h-4 rounded"
                  />
                  <span className="leading-tight">{jf}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Duration + Work arrangement */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField
            label="Preferred internship duration"
            required
            placeholder="Select duration"
            options={['3 months', '4 months', '6 months', '12 months']}
            value={formData.internshipDuration}
            onChange={(v) => update('internshipDuration', v)}
          />
          <SelectField
            label="Work arrangement"
            required
            placeholder="Select arrangement"
            options={['On-site', 'Remote', 'Hybrid']}
            value={formData.workArrangement}
            onChange={(v) => update('workArrangement', v)}
          />
        </div>

        {/* Stipend policy — radio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stipend policy <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {[
              'Paid internship (stipend provided)',
              'Transport allowance only',
              'Unpaid — no financial support',
              'Varies by role / negotiable',
            ].map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                  formData.stipendPolicy === opt
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="stipendPolicy"
                  checked={formData.stipendPolicy === opt}
                  onChange={() => update('stipendPolicy', opt)}
                  className="accent-green-700 w-4 h-4"
                />
                {opt}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            This is displayed on your internship listings. Be transparent — students appreciate clarity.
          </p>
        </div>

        {/* Dedicated supervisor — radio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dedicated internship / HR supervisor? <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {[
              'Yes — a specific person manages interns',
              'No — line managers handle supervision directly',
            ].map((opt) => (
              <label
                key={opt}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors text-sm ${
                  formData.hasDedicatedSupervisor === opt
                    ? 'border-green-600 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="hasDedicatedSupervisor"
                  checked={formData.hasDedicatedSupervisor === opt}
                  onChange={() => update('hasDedicatedSupervisor', opt)}
                  className="accent-green-700 w-4 h-4"
                />
                {opt}
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            After your account is approved, you will be able to create individual supervisor accounts for your team.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors text-sm"
      >
        Continue →
      </button>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   STEP 5 — Documents & Verification
   ════════════════════════════════════════════════════════════════════ */

function StepDocuments({
  formData,
  update,
  onNext,
}: {
  formData: CompanyFormData;
  update: <K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) => void;
  onNext: () => void;
}) {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Upload your verification documents.</h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          LASU verifies every company before granting platform access. Upload clear, legible copies.
        </p>
      </div>

      <div className="space-y-4">
        <FileUploadField
          label="Certificate of Incorporation"
          description="CAC-issued certificate. PDF or clear image. Max 5 MB."
          required
          file={formData.incorporationCert}
          onFileChange={(f) => update('incorporationCert', f)}
        />

        <FileUploadField
          label="Government-issued ID of representative"
          description="National ID, Voter's Card, Driver's License, or International Passport. PDF or image. Max 5 MB."
          required
          file={formData.govId}
          onFileChange={(f) => update('govId', f)}
        />

        <FileUploadField
          label="Proof of business address"
          description="Utility bill, tenancy agreement, or bank statement showing the company's address. Max 5 MB."
          required
          file={formData.proofOfAddress}
          onFileChange={(f) => update('proofOfAddress', f)}
        />

        <FileUploadField
          label="Letter of authority on company letterhead"
          description="Required if you registered with a generic email domain (Gmail, Yahoo, Outlook). Must be signed by a director."
          dashed
          file={formData.letterOfAuthority}
          onFileChange={(f) => update('letterOfAuthority', f)}
        />

        <FileUploadField
          label="Tax Identification Number (TIN) certificate"
          description="Optional. Speeds up verification if available."
          dashed
          file={formData.tinCert}
          onFileChange={(f) => update('tinCert', f)}
        />
      </div>

      {/* Info card */}
      <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-4">
        <div className="flex gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-blue-800 leading-relaxed">
            LASU's verification team will cross-check your RC number against the CAC public database, confirm your website domain matches your registered email, and review all uploaded documents. This process typically takes <strong>24–48 hours</strong> on working days.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full py-3 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg transition-colors text-sm"
      >
        Continue →
      </button>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   STEP 6 — Agreement & Credentials
   ════════════════════════════════════════════════════════════════════ */

function StepAgreement({
  formData,
  update,
  onSubmit,
}: {
  formData: CompanyFormData;
  update: <K extends keyof CompanyFormData>(key: K, value: CompanyFormData[K]) => void;
  onSubmit: () => void;
}) {

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Almost there — confirm agreements.</h1>
        <p className="text-sm text-gray-500 mt-1 leading-relaxed">
          Please agree to the LASU SIWES partner terms to complete your onboarding.
        </p>
      </div>

      {/* Divider */}
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gray-50 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Agreements
          </span>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreeTerms}
            onChange={(e) => update('agreeTerms', e.target.checked)}
            className="accent-green-700 w-4 h-4 mt-0.5 rounded"
          />
          <span className="text-xs text-gray-700 leading-relaxed">
            I agree to the{' '}
            <span className="text-green-700 font-medium">LASU SIWES Partner Terms of Service</span>{' '}
            and confirm that all information and documents submitted are accurate and authentic. I understand that misrepresentation may result in account suspension.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreeAuthorised}
            onChange={(e) => update('agreeAuthorised', e.target.checked)}
            className="accent-green-700 w-4 h-4 mt-0.5 rounded"
          />
          <span className="text-xs text-gray-700 leading-relaxed">
            I confirm that my organisation is legally authorised to employ interns in Nigeria and will comply with all applicable labour laws and SIWES guidelines.
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.agreeConsent}
            onChange={(e) => update('agreeConsent', e.target.checked)}
            className="accent-green-700 w-4 h-4 mt-0.5 rounded"
          />
          <span className="text-xs text-gray-700 leading-relaxed">
            I consent to LASU using the information provided here for verification, matching, and platform administration purposes in accordance with the Nigeria Data Protection Regulation (NDPR).
          </span>
        </label>
      </div>

      {/* What happens next — info card */}
      <div className="border-l-4 border-green-600 bg-green-50 rounded-r-lg p-4">
        <p className="text-sm font-semibold text-green-800 mb-2">What happens after you submit</p>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-green-800 leading-relaxed">
          <li>You'll receive an <strong>email confirmation</strong> with your registration reference number.</li>
          <li>LASU's verification team will review your CAC number, website domain, and uploaded documents. This typically takes <strong>24–48 hours</strong> on working days.</li>
          <li>Once verified, you'll receive an <strong>activation email</strong> with a link to access your dashboard.</li>
          <li>You can then <strong>post internship listings</strong>, manage applicants, and register industry supervisors.</li>
        </ol>
      </div>

      {/* Submit button */}
      <button
        type="button"
        disabled={!formData.agreeTerms || !formData.agreeAuthorised || !formData.agreeConsent}
        onClick={onSubmit}
        className="w-full py-3 bg-green-700 hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm"
      >
        Complete company profile →
      </button>
    </section>
  );
}
