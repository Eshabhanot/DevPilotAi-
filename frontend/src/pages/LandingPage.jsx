import React from 'react';
import { Link } from 'react-router-dom';
import { DevPilotLogo } from '../components/DevPilotLogo';
import {
  Sparkles,
  BookOpen,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Code2,
  Terminal,
  FileCheck,
  Search,
  Check,
  Layers,
  Workflow,
  ExternalLink,
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-indigo-500/10 selection:text-indigo-600 flex flex-col">
      {/* 1. Header Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <DevPilotLogo size="lg" linkTo="/" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How it Works
            </a>
            <a href="#documentation" className="hover:text-indigo-600 transition-colors">
              Documentation
            </a>
            <a href="#about" className="hover:text-indigo-600 transition-colors">
              About
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md shadow-indigo-500/25 transition-all"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 border-b border-slate-200/60 bg-gradient-to-b from-white via-slate-50 to-[#f8fafc]">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Headlines & CTA */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
                Your AI Software <br className="hidden sm:inline" />
                Engineering <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600">Assistant</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 max-w-2xl leading-relaxed">
                Build, test, and document real-world applications using multi-agent AI, your knowledge base and secure MCP tools.
              </p>

              {/* 4 Feature Pills in a row */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  RAG Knowledge
                </span>
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm">
                  <Workflow className="w-3.5 h-3.5 text-indigo-600" />
                  Multi-Agent Workflow
                </span>
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Secure MCP Tools
                </span>
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  Production Ready
                </span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link
                  to="/register"
                  className="px-6 py-3.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-xl shadow-lg shadow-slate-900/10 flex items-center gap-2 transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#how-it-works"
                  className="px-6 py-3.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl shadow-sm transition-all"
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Right Column: IDE Mockup with 4 Floating Agent Cards */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Code Window */}
                <div className="rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-5 text-slate-300 font-mono text-xs overflow-hidden">
                  {/* Window Bar */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[11px] text-slate-400 font-sans font-medium">
                      ExpenseController.java
                    </span>
                    <div className="w-12" />
                  </div>

                  {/* Code Mockup */}
                  <div className="space-y-1.5 text-[11px] leading-relaxed opacity-90 select-none">
                    <p className="text-purple-400">@RestController</p>
                    <p className="text-purple-400">@RequestMapping(<span className="text-emerald-300">"/api/expenses"</span>)</p>
                    <p className="text-slate-100 font-semibold">public class <span className="text-yellow-300">ExpenseController</span> &#123;</p>
                    <p className="pl-4 text-slate-400">// Multi-agent verified implementation</p>
                    <p className="pl-4 text-indigo-300">private final <span className="text-sky-300">ExpenseService</span> service;</p>
                    <p className="pl-4 text-purple-400">@GetMapping</p>
                    <p className="pl-4 text-slate-200">public ResponseEntity&lt;List&lt;Expense&gt;&gt; getAll() &#123;</p>
                    <p className="pl-8 text-sky-400">return <span className="text-slate-200">ResponseEntity.ok(service.findAll());</span></p>
                    <p className="pl-4 text-slate-200">&#125;</p>
                    <p className="text-slate-100">&#125;</p>
                  </div>
                </div>

                {/* 4 Floating Glass Agent Cards */}
                <div className="space-y-3 mt-4 sm:mt-0 sm:absolute sm:-right-4 sm:top-6 sm:w-64">
                  {/* Research Agent */}
                  <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-lg flex items-center gap-3 transform hover:-translate-y-0.5 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center shrink-0">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">Research Agent</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">Gathers context</p>
                    </div>
                  </div>

                  {/* Coding Agent */}
                  <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-lg flex items-center gap-3 transform hover:-translate-y-0.5 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">Coding Agent</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">Generates code</p>
                    </div>
                  </div>

                  {/* Testing Agent */}
                  <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-lg flex items-center gap-3 transform hover:-translate-y-0.5 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                      <Terminal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">Testing Agent</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">Runs & fixes tests</p>
                    </div>
                  </div>

                  {/* Documentation Agent */}
                  <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-3 rounded-2xl shadow-lg flex items-center gap-3 transform hover:-translate-y-0.5 transition-all">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">Documentation Agent</h4>
                      <p className="text-[11px] text-slate-500 leading-tight">Creates docs</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Features Section */}
      <section id="features" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full">
              Engineered for Enterprise
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mt-3">
              Full-Lifecycle Autonomous Software Engineering
            </h2>
            <p className="text-slate-600 mt-2 text-sm sm:text-base">
              From requirement extraction to sandbox test execution and documentation, every step is coordinated by specialized AI agents.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">RAG Knowledge Engine</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Ingest PDF architecture guides and coding standards into pgvector to ground code generation in verified context.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Workflow className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Multi-Agent Workflow</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                4-stage sequential state machine orchestrating Research, Code Writing, Test Execution, and Markdown Documentation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Secure MCP Tools</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Developer Model Context Protocol server enforcing path confinement, secret scrubbing, and automated backups.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Terminal className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Approved Test Execution</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Safe test execution sandbox with automatic compile error recovery and detailed console log inspection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section */}
      <section id="how-it-works" className="py-20 bg-[#f8fafc]">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-wider text-indigo-600 uppercase bg-indigo-50 px-3 py-1 rounded-full">
              Workflow
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mt-3">
              How DevPilot AI Delivers Production Code
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <span className="text-xs font-bold text-indigo-600">01</span>
              <h4 className="text-sm font-bold text-slate-900 mt-2">1. Research</h4>
              <p className="text-xs text-slate-500 mt-1">Queries RAG database for conventions and examines existing workspace code.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <span className="text-xs font-bold text-indigo-600">02</span>
              <h4 className="text-sm font-bold text-slate-900 mt-2">2. Coding</h4>
              <p className="text-xs text-slate-500 mt-1">Writes idiomatic entities, controllers, repositories, and services with clean architecture.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <span className="text-xs font-bold text-indigo-600">03</span>
              <h4 className="text-sm font-bold text-slate-900 mt-2">3. Testing</h4>
              <p className="text-xs text-slate-500 mt-1">Executes bounded unit tests through the MCP server, repairing regressions autonomously.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
              <span className="text-xs font-bold text-indigo-600">04</span>
              <h4 className="text-sm font-bold text-slate-900 mt-2">4. Documentation</h4>
              <p className="text-xs text-slate-500 mt-1">Generates comprehensive technical documentation, curl commands, and architecture summaries.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer id="about" className="mt-auto bg-white border-t border-slate-200 py-10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <DevPilotLogo size="sm" linkTo="/" />
          <p className="text-xs text-slate-500">
            &copy; 2026 DevPilot AI. All rights reserved. Multi-agent software engineering platform.
          </p>
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <Link to="/login" className="hover:text-indigo-600">Login</Link>
            <Link to="/register" className="hover:text-indigo-600">Register</Link>
            <a href="#features" className="hover:text-indigo-600">Features</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
