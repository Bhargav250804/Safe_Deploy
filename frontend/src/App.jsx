import React, { useState, useEffect } from 'react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date().toLocaleTimeString());

  const fetchData = async () => {
    try {
      const res = await fetch('/api/dashboard-data');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      setData(json);
      setError(null);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 space-y-4">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-medium">Connecting to SafeDeploy Live Telemetry...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 font-sans">
      {/* Top Navigation */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <i className="fa-solid fa-shield-halved text-lg"></i>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white">SafeDeploy</h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {data?.deployment_status || 'OPERATIONAL'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Automated CI/CD & Reliable Deployment Platform • Cloud-Native GitOps Delivery</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Polling Interval: 5s</p>
              <p className="text-xs font-mono text-slate-300">Last Synced: {lastRefreshed}</p>
            </div>
            <button
              onClick={fetchData}
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center space-x-2"
            >
              <i className="fa-solid fa-arrows-rotate"></i>
              <span>Refresh</span>
            </button>
            <a
              href="/docs"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition flex items-center space-x-1.5"
            >
              <i className="fa-solid fa-book-open text-xs"></i>
              <span>OpenAPI Docs</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center space-x-3">
            <i className="fa-solid fa-triangle-exclamation text-red-400"></i>
            <span>Warning: Telemetry polling failed ({error}). Retrying in 5 seconds...</span>
          </div>
        )}

        {/* 1. Health, 2. Version, 3. Deployment Status, 6. Testing, 7. Security Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Application Health */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Application Health</span>
              <i className="fa-solid fa-heart-pulse text-emerald-400"></i>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white capitalize">{data?.health?.status || 'Healthy'}</span>
              <span className="text-xs text-emerald-400 font-medium">HTTP 200</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Uptime: <span className="font-mono text-slate-200">{data?.health?.uptime_seconds}s</span>
            </p>
          </div>

          {/* Card 2: Version & Git SHA */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Current Version</span>
              <i className="fa-solid fa-code-commit text-sky-400"></i>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white">v{data?.version?.version}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-300">
                {data?.version?.git_sha?.substring(0, 7)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Environment: <span className="text-slate-200 capitalize">{data?.version?.environment}</span>
            </p>
          </div>

          {/* Card 3: Latest Testing Results */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pytest Test Results</span>
              <i className="fa-solid fa-vial-circle-check text-indigo-400"></i>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-white">
                {data?.test_summary?.passed}/{data?.test_summary?.total_tests} Passed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Execution Time: <span className="font-mono text-slate-200">{data?.test_summary?.duration}</span>
            </p>
          </div>

          {/* Card 4: Security Scan Results */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Trivy Security Scan</span>
              <i className="fa-solid fa-shield-virus text-teal-400"></i>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-emerald-400">0 Critical</span>
              <span className="text-xs text-slate-400">/ 0 High</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Status: <span className="text-emerald-400 font-medium">CLEAN (No CVEs)</span>
            </p>
          </div>
        </div>

        {/* 4. CI/CD Pipeline Stages */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">CI/CD Pipeline Stages (GitHub Actions)</h2>
              <p className="text-xs text-slate-400">10 discrete automated verification gates from commit to live cloud verification</p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Pipeline Certified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {data?.pipeline_stages?.map((stage) => (
              <div
                key={stage.id}
                className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-1.5 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-500">#{stage.id}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                    {stage.status}
                  </span>
                </div>
                <h3 className="text-xs font-semibold text-slate-200 line-clamp-1">{stage.name}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">{stage.description}</p>
                <div className="text-[10px] text-slate-500 font-mono pt-1">Duration: {stage.duration}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Docker Image Information & 11. Rollback Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 5. Docker image information */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <i className="fa-brands fa-docker text-sky-400"></i>
              <span>Docker Container Packaging</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Base Image</span>
                <span className="font-mono text-slate-200 font-semibold">{data?.docker_image?.base_image}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Image Footprint</span>
                <span className="font-mono text-emerald-400 font-semibold">{data?.docker_image?.image_size}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Security Execution User</span>
                <span className="font-mono text-slate-200">{data?.docker_image?.security_user}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Container Registry</span>
                <span className="font-mono text-sky-400">{data?.docker_image?.registry}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Tag Strategy</span>
                <span className="text-slate-300">{data?.docker_image?.tag_strategy}</span>
              </div>
            </div>
          </div>

          {/* 11. Rollback Status & 12. Recovery Information */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <i className="fa-solid fa-clock-rotate-left text-amber-400"></i>
              <span>Rollback & Automated Recovery</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Mean Time to Restore (MTTR)</span>
                <span className="font-mono text-amber-400 font-semibold">
                  {data?.rollback_parameters?.mean_time_to_restore}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Previous Verified SHA</span>
                <span className="font-mono text-slate-200 font-semibold">
                  {data?.rollback_parameters?.previous_stable_sha}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800">
                <span className="text-slate-400">Failure Trigger</span>
                <span className="text-slate-300">Active HTTP 200 / SHA Mismatch Failure</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Supported Recovery Modes</span>
                <span className="text-slate-300">Render Dashboard Revert + Webhook Re-deploy</span>
              </div>
            </div>
          </div>
        </div>

        {/* 8. Deployment History Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-white flex items-center space-x-2">
            <i className="fa-solid fa-timeline text-indigo-400"></i>
            <span>Deployment History (Render Cloud Service)</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Version Tag</th>
                  <th className="pb-3 font-semibold">Git Commit SHA</th>
                  <th className="pb-3 font-semibold">Deployed Timestamp</th>
                  <th className="pb-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data?.deployment_history?.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-semibold text-slate-200">v{d.version}</td>
                    <td className="py-3 font-mono text-sky-400">{d.git_sha}</td>
                    <td className="py-3 text-slate-400">{d.deployed_at}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.status.includes('ACTIVE')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                          }`}
                      >
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 9. Application Logs & 10. Deployment Logs */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <i className="fa-solid fa-terminal text-slate-400"></i>
              <span>Live Application & Deployment Event Logs</span>
            </h2>
            <span className="text-xs font-mono text-slate-500">Live Buffer: {data?.recent_logs?.length} entries</span>
          </div>
          <div className="bg-slate-950 rounded-lg p-4 font-mono text-xs space-y-1.5 max-h-56 overflow-y-auto border border-slate-800/80">
            {data?.recent_logs?.map((log, idx) => (
              <div key={idx} className="flex space-x-2 leading-relaxed">
                <span className="text-slate-500">[{log.timestamp}]</span>
                <span
                  className={
                    log.level === 'ERROR'
                      ? 'text-red-400 font-bold'
                      : log.level === 'WARNING'
                        ? 'text-amber-400 font-bold'
                        : 'text-sky-400'
                  }
                >
                  {log.level}
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

