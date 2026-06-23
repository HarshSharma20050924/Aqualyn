import React from 'react';
import { Github, Code, GitPullRequest, Terminal, FileText, Bug } from 'lucide-react';

export default function ContributionScreen() {
  return (
    <div className="pt-32 pb-24 px-6 md:px-12 max-w-6xl mx-auto min-h-[80vh]">
      <div className="text-center max-w-3xl mx-auto space-y-6 mb-20">
        <span className="text-xs text-primary font-black uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/15">Open Source</span>
        <h1 className="text-4xl md:text-6xl font-black font-headline text-on-surface tracking-tight leading-tight">Contribution & Library</h1>
        <p className="text-on-surface-variant font-medium text-lg md:text-xl leading-relaxed">
          Aqualyn is proudly open-source and thrives on community transparency. Discover our source code, read our strict security guidelines, and help us build the future of private local-first communication.
        </p>
        <div className="flex items-center justify-center gap-4 mt-6">
          <a 
            href="https://github.com/HarshSharma20050924/Aqualyn" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-2 bg-on-surface text-surface px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform no-underline"
          >
            <Github className="w-5 h-5" /> Star on GitHub
          </a>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-3 gap-8 mb-20">
        <a href="https://github.com/HarshSharma20050924/Aqualyn" target="_blank" rel="noreferrer" className="block no-underline">
          <div className="bg-surface-container p-10 rounded-3xl border border-outline-variant/10 text-center hover:-translate-y-2 transition-transform shadow-lg h-full">
            <Github className="w-14 h-14 text-on-surface mx-auto mb-6" />
            <h3 className="text-2xl font-black text-on-surface mb-3">GitHub Repository</h3>
            <p className="text-base text-on-surface-variant font-medium leading-relaxed">Explore the monorepo architecture containing our React web app, React Native mobile app, and backend APIs.</p>
          </div>
        </a>

        <a href="https://github.com/HarshSharma20050924/Aqualyn/blob/main/CONTRIBUTING.md" target="_blank" rel="noreferrer" className="block no-underline">
          <div className="bg-surface-container p-10 rounded-3xl border border-outline-variant/10 text-center hover:-translate-y-2 transition-transform shadow-lg h-full">
            <FileText className="w-14 h-14 text-primary mx-auto mb-6" />
            <h3 className="text-2xl font-black text-on-surface mb-3">Developer Docs</h3>
            <p className="text-base text-on-surface-variant font-medium leading-relaxed">Read our comprehensive CONTRIBUTING.md file to understand our local database standards and Git workflows.</p>
          </div>
        </a>

        <a href="https://github.com/HarshSharma20050924/Aqualyn/issues" target="_blank" rel="noreferrer" className="block no-underline">
          <div className="bg-surface-container p-10 rounded-3xl border border-outline-variant/10 text-center hover:-translate-y-2 transition-transform shadow-lg h-full">
            <Bug className="w-14 h-14 text-secondary mx-auto mb-6" />
            <h3 className="text-2xl font-black text-on-surface mb-3">Report Issues</h3>
            <p className="text-base text-on-surface-variant font-medium leading-relaxed">Found a bug or have a feature request? Open an issue on our tracker to start a discussion with the core team.</p>
          </div>
        </a>
      </div>

      {/* Detailed Guide */}
      <div className="bg-surface-container-lowest p-8 md:p-14 rounded-[2.5rem] border border-outline-variant/15 max-w-4xl mx-auto shadow-xl">
        <div className="flex items-center gap-4 mb-8">
          <Terminal className="w-8 h-8 text-primary" />
          <h2 className="text-3xl font-black text-on-surface m-0">How to Contribute</h2>
        </div>
        
        <div className="prose prose-lg prose-invert max-w-none text-on-surface-variant font-medium">
          <p className="mb-8 leading-relaxed">
            We welcome pull requests from the community! Whether you're optimizing React rendering performance, improving our Supabase authentication flows, or enhancing the native Expo mobile modules, your contributions matter.
          </p>

          <h3 className="text-2xl font-bold text-on-surface mt-10 mb-4">1. Local Setup</h3>
          <p className="mb-4">To get the entire stack running locally, clone the repository and install dependencies for the specific workspace you want to edit.</p>
          <div className="bg-surface-container p-6 rounded-2xl font-mono text-base text-primary mb-8 border border-outline-variant/10 shadow-inner overflow-x-auto">
            <span className="text-secondary opacity-60"># Clone the repository</span><br/>
            git clone https://github.com/HarshSharma20050924/Aqualyn.git<br/>
            cd Aqualyn<br/><br/>
            
            <span className="text-secondary opacity-60"># To run the frontend React Web App</span><br/>
            cd frontend && npm install && npm run dev<br/><br/>

            <span className="text-secondary opacity-60"># To run the backend WebSocket/Express API</span><br/>
            cd backend && npm install && npm run dev<br/><br/>

            <span className="text-secondary opacity-60"># To run the React Native Mobile App</span><br/>
            cd aqualyn-mobile && npm install && npx expo start
          </div>

          <h3 className="text-2xl font-bold text-on-surface mt-10 mb-4">2. Architectural Guidelines</h3>
          <ul className="list-disc pl-6 space-y-3 mb-8">
            <li><strong className="text-on-surface">No Cloud Storage for Messages:</strong> Aqualyn is strictly a local-first application. Any pull request that attempts to backup chat arrays to an external database will be immediately rejected.</li>
            <li><strong className="text-on-surface">Tailwind CSS:</strong> We use utility-first styling. Please ensure UI components match the existing glassmorphic, dark-mode design system.</li>
            <li><strong className="text-on-surface">State Management:</strong> Context API and local state (`useState`) are preferred. Do not introduce heavy state-management libraries like Redux without prior architectural discussion.</li>
          </ul>

          <h3 className="text-2xl font-bold text-on-surface mt-10 mb-4">3. Submitting a Pull Request</h3>
          <p className="mb-6">
            When you are ready to submit your code, please ensure your commit messages are descriptive. Follow standard conventional commits (e.g., <code>feat: add new biometric lock toggle</code>, <code>fix: resolve infinite loop in chat list</code>). Link your PR to any relevant open issues.
          </p>

          <div className="flex items-center gap-4 mt-12 bg-primary/10 p-6 rounded-2xl border border-primary/20">
            <GitPullRequest className="w-8 h-8 text-primary shrink-0" />
            <div>
              <h4 className="text-on-surface font-bold text-lg m-0">Ready to build?</h4>
              <p className="m-0 text-sm opacity-90">Head over to the <a href="https://github.com/HarshSharma20050924/Aqualyn" target="_blank" rel="noreferrer" className="text-primary underline">repository</a> and fork the project to begin your first contribution!</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
