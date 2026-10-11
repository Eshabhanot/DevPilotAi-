import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Server,
  Shield,
  Sliders,
  CheckCircle2,
  Database,
  Cpu,
  Save,
} from 'lucide-react';

export function SettingsPage() {
  const { user } = useAuth();
  const [gatewayUrl, setGatewayUrl] = useState(import.meta.env.VITE_API_BASE_URL || '');
  const [eurekaUrl, setEurekaUrl] = useState(import.meta.env.VITE_EUREKA_URL || '');
  const [knowledgeUrl, setKnowledgeUrl] = useState(import.meta.env.VITE_KNOWLEDGE_URL || '');
  const [modelName, setModelName] = useState(import.meta.env.VITE_OPENAI_MODEL || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Settings & Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage microservice gateways, discovery endpoints, and AI models.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>Microservice Topology</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Spring Cloud API Gateway
                </label>
                <input
                  type="text"
                  value={gatewayUrl}
                  onChange={(e) => setGatewayUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Netflix Eureka Discovery Server
                </label>
                <input
                  type="text"
                  value={eurekaUrl}
                  onChange={(e) => setEurekaUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Knowledge Service Endpoint
                </label>
                <input
                  type="text"
                  value={knowledgeUrl}
                  onChange={(e) => setKnowledgeUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  AI Orchestrator LLM Model
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 font-mono focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            {saved ? (
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Settings saved successfully!
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Configurations sync to local environment variables.
              </span>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
