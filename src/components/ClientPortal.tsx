import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Lock, 
  Unlock, 
  CheckCircle, 
  Clock, 
  Download, 
  QrCode, 
  ShieldCheck, 
  ArrowLeft, 
  Check,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  FileDown,
  RefreshCw
} from 'lucide-react';
import { Project } from '../types';

interface ClientPortalProps {
  projectId: string;
  projects: Project[];
  onUpdatePayment: (id: string, isPaid: boolean) => void;
  onBackToDashboard?: () => void;
}

export default function ClientPortal({ 
  projectId, 
  projects, 
  onUpdatePayment,
  onBackToDashboard 
}: ClientPortalProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [txnRef, setTxnRef] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Hydrate single project context in real-time
  useEffect(() => {
    const found = projects.find(p => p.id === projectId);
    if (found) {
      setProject(found);
    }
  }, [projectId, projects]);

  if (!project) {
    return (
      <div className="min-h-screen bg-stone-50 select-none flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 text-center shadow-xs">
          <AlertCircle className="mx-auto h-10 w-10 text-neutral-400 mb-4" />
          <h2 className="text-lg font-bold tracking-tight text-neutral-900 mb-2">Delivery link not found</h2>
          <p className="text-stone-500 text-xs mb-6 leading-relaxed">
            The secure checkout channel you requested does not exist or has been archived by the freelancer.
          </p>
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 justify-center px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold select-none cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Return to workspace
            </button>
          )}
        </div>
      </div>
    );
  }

  // Handle simulate manual payment check callback
  const handleVerifyManualTransfer = () => {
    setIsProcessing(true);
    setErrorText('');

    setTimeout(() => {
      onUpdatePayment(project.id, true);
      setIsProcessing(false);
    }, 1100);
  };

  // Triggers final decrypted virtual container release file
  const handleDownloadFile = () => {
    const fileContent = `===========================================================\n` +
      `          PROJECT A  -  SECURE DELIVERY ARCHIVE RELEASE   \n` +
      `===========================================================\n` +
      `Project Reference:  SL-${project.id.substring(0,8).toUpperCase()}\n` +
      `Contract Project:   ${project.project_name}\n` +
      `Deliverable Target: ${project.file_name || 'release_package_final.zip'}\n` +
      `Client Premium:     ${project.client_name}\n` +
      `Date Certified:     ${new Date().toLocaleDateString('en-IN')}\n` +
      `Amount Paid:        ₹${project.amount_due.toLocaleString('en-IN')} INR\n\n` +
      `STATUS: DECRYPTED & FULLY SETTLED\n\n` +
      `Payment receipt verified and settled via Standard UPI Manual Settlement Ledger. \n` +
      `This flat file proves the secure deliverance of the encrypted project assets.\n\n` +
      `Thank you for your business.\n` +
      `-- certified by Stack cryptographic release engine. --`;

    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Replace extension to txt for easy local simulation viewing in browser
    link.download = project.file_name ? project.file_name.replace(/\.[^/.]+$/, "") + "_unlocked.txt" : `${project.project_name.toLowerCase().replace(/\s+/g, '_')}_final_verified.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalMilestones = project.milestones.length;
  const completedMilestones = project.milestones.filter(m => m.is_completed).length;

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1c1b18] flex flex-col font-sans selection:bg-[#f0ede4]">
      
      {/* Top Banner layout */}
      <header className="border-b border-[#ebdcb9]/20 bg-white/70 backdrop-blur-md sticky top-0 z-20 px-6 py-3.5">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1c1b18] flex items-center justify-center text-[#faf9f6]">
              <span className="font-bold text-xs">S</span>
            </div>
            <div>
              <span className="text-neutral-400 text-[9px] font-bold tracking-widest uppercase block leading-none">SECURE BRIDGE</span>
              <span className="text-[#1c1b18] text-xs font-bold uppercase tracking-tight font-display">Stack Portal</span>
            </div>
          </div>
          
          {onBackToDashboard && (
            <button 
              onClick={onBackToDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1c1b18] hover:bg-[#2e2d29] text-xs text-[#faf9f6] rounded-lg cursor-pointer transition-all"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Workspace
            </button>
          )}
        </div>
      </header>

      {/* Main Column */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 flex flex-col gap-6 py-8">
        
        {/* Freelance Agency Profile Card */}
        {(() => {
          const profile = project.agency_profile || {
            agency_name: "Vertex Design Studio",
            freelancer_name: "Dishant",
            role_title: "Creative Director & UI Engineer",
            bio: "Crafting beautiful, functional digital interactions. We build custom React frontends, robust Node APIs, and pristine micro-motion interfaces.",
            website_url: "https://vertexlabs.io"
          };

          return (
            <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-start gap-3.5 pb-3 border-b border-stone-100">
                {profile.logo_data ? (
                  <img 
                    src={profile.logo_data} 
                    alt="Agency Logo" 
                    className="w-11 h-11 object-cover rounded-xl border border-stone-200 bg-white"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-neutral-900 flex items-center justify-center text-white text-sm font-bold tracking-tight uppercase shrink-0">
                    {profile.agency_name[0]}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-[8.5px] bg-neutral-100 text-neutral-600 font-bold px-2 py-0.5 rounded-full border border-neutral-250 font-mono tracking-widest uppercase block w-fit mb-1">
                    VERIFIED AGENCY CONTRACTOR
                  </span>
                  <h3 className="text-sm font-extrabold text-neutral-900 uppercase tracking-tight">
                    {profile.agency_name}
                  </h3>
                  <p className="text-[11px] text-stone-550">
                    Lead: {profile.freelancer_name} • <span className="text-stone-400">{profile.role_title}</span>
                  </p>
                </div>
              </div>

              {profile.bio && (
                <div className="py-3">
                  <p className="text-xs text-stone-600 leading-relaxed italic">
                    "{profile.bio}"
                  </p>
                </div>
              )}

              <div className="pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                <a 
                  href={profile.website_url.startsWith('http') ? profile.website_url : `https://${profile.website_url}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-900 hover:underline"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Website: {profile.website_url.replace(/(^\w+:|^)\/\//, '')}</span>
                </a>

                {/* Optional Social Handles */}
                <div className="flex items-center gap-2.5">
                  {profile.github_url && (
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-stone-400 hover:text-stone-900 transition-colors"
                      title="GitHub"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.022A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.29 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                    </a>
                  )}
                  {profile.twitter_url && (
                    <a
                      href={profile.twitter_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-stone-400 hover:text-sky-500 transition-colors"
                      title="Twitter"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Project Context & Locked status */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-50 border border-stone-200/60 font-mono text-[10px] text-neutral-500">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>
                {new Date(project.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>

            <div className={`flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
              project.is_paid 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-stone-50 border-stone-200 text-stone-500'
            }`}>
              {project.is_paid ? (
                <>
                  <Unlock className="w-3 h-3 text-emerald-600 shrink-0" /> Decrypted & Released
                </>
              ) : (
                <>
                  <Lock className="w-3 h-3 text-stone-400 shrink-0" /> Encrypted Lock
                </>
              )}
            </div>
          </div>

          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">CONTRACT METADATA</span>
          <h1 className="text-lg font-bold font-display text-neutral-900 tracking-tight leading-snug">
            {project.project_name}
          </h1>
          <p className="text-xs text-stone-500 mt-1.5">
            Prepared by freelance partner and waiting for release to client <span className="font-bold text-neutral-800">{project.client_name}</span>.
          </p>

          <div className="mt-5 pt-4 border-t border-stone-100 flex items-center justify-between">
            <div>
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">Balance Settled In Full</span>
              <p className="text-2xl font-black text-neutral-900 mt-0.5 font-mono">
                ₹{project.amount_due.toLocaleString('en-IN')}
                <span className="text-[10px] text-stone-400 font-medium ml-1">INR</span>
              </p>
            </div>
            {project.is_paid ? (
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-xs px-2.5 py-1 rounded-md font-bold">
                Payment Settled
              </span>
            ) : (
              <span className="text-stone-500 bg-stone-50 border border-stone-200 text-xs px-2.5 py-1 rounded-md font-bold">
                Release Pending
              </span>
            )}
          </div>
        </div>

        {/* Milestones status */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-widest">Completed Deliverables</h3>
            <span className="text-[10px] font-mono text-neutral-500 bg-stone-50 px-2 py-0.5 rounded border border-stone-150">
              {completedMilestones} / {totalMilestones} Completed
            </span>
          </div>

          <div className="space-y-2">
            {project.milestones.length === 0 ? (
              <p className="text-xs text-neutral-400 italic text-center py-2">No milestone details specified for this project.</p>
            ) : (
              project.milestones.map((m) => (
                <div 
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    m.is_completed 
                      ? 'bg-emerald-50/10 border-emerald-100/50' 
                      : 'bg-stone-50/20 border-stone-200/60'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {m.is_completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Clock className="w-4 h-4 text-neutral-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium ${
                      m.is_completed ? 'text-neutral-500 line-through decoration-neutral-200' : 'text-neutral-700'
                    }`}>
                      {m.task_title}
                    </p>
                    <span className="text-[9px] font-mono block mt-0.5 text-stone-400">
                      {m.is_completed ? "Verified by contractor" : "Work in progress / pending review"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Interactive Payment Switch layout */}
        <AnimatePresence mode="wait">
          {!project.is_paid ? (
            <motion.div
              key="payment-gateway"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm space-y-5"
            >
              
              {/* Manual QR Header */}
              <div className="border-b border-stone-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-neutral-700" /> Direct UPI Scan & Pay
                  </h3>
                  <p className="text-[10px] text-neutral-400 mt-0.5">Scan to transfer ₹{project.amount_due.toLocaleString('en-IN')} directly to freelancer</p>
                </div>
                <div className="text-[8px] bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded font-bold font-mono uppercase tracking-wide border border-neutral-200/50">
                  Zero Commission
                </div>
              </div>

              {/* UPI QR Display area */}
              <div className="flex flex-col items-center justify-center py-2 space-y-4">
                
                {project.qr_code_data ? (
                  // Display real uploaded custom QR code image
                  <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-xs flex flex-col items-center justify-center max-w-[200px]">
                    <img 
                      src={project.qr_code_data} 
                      alt="Freelancer Custom UPI QR Code" 
                      className="w-40 h-40 object-contain rounded-md"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[8.5px] font-mono text-neutral-400 mt-2 truncate max-w-[170px]">
                      {project.qr_code_name || "Custom QR loaded ✓"}
                    </span>
                  </div>
                ) : (
                  // Fallback elegant standard clean UPI style QR code
                  <div className="bg-white border border-stone-200 rounded-xl p-3 shadow-xs flex flex-col items-center justify-center max-w-[200px]">
                    <div className="w-40 h-40 bg-neutral-50 rounded-lg p-2 flex flex-col items-center justify-center border border-stone-100 relative group">
                      {/* Modern minimalist styled QR simulator representation */}
                      <div className="text-center">
                        <QrCode className="w-10 h-10 text-neutral-800 mx-auto mb-1.5 opacity-90" />
                        <span className="text-[10px] font-bold text-neutral-900">Standard Fallback QR</span>
                        <p className="text-[8px] text-neutral-400 max-w-28 mx-auto mt-0.5">Freelancer did not upload custom image</p>
                      </div>
                      <div className="absolute inset-0 m-auto w-8 h-8 bg-neutral-900 rounded-md flex items-center justify-center text-white border-2 border-white scale-90">
                        <span className="font-display font-medium text-xs">₹</span>
                      </div>
                    </div>
                    <span className="text-[8.5px] font-mono text-neutral-400 mt-2">
                      upi://pay?pa=freelance@pay&am={project.amount_due}
                    </span>
                  </div>
                )}

                <div className="text-center max-w-sm">
                  <p className="text-xs text-stone-600 leading-relaxed px-4">
                    Scan using <strong className="text-neutral-900 font-semibold">GPay, PhonePe, Paytm, BHIM,</strong> or your banking application. Transfer the exact amount to complete settlement.
                  </p>
                </div>
              </div>

              {/* Verified transaction code input to add high fidelity */}
              <div className="bg-stone-50 p-4.5 rounded-xl border border-stone-200/70 space-y-4">
                <div>
                  <label className="text-[9.5px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    UPI UTR / Transaction Refer No. <span className="text-stone-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    placeholder="e.g. 12-digit number (e.g. 523819028475)"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full bg-white border border-stone-200 text-neutral-800 placeholder-stone-450 rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:border-neutral-505 focus:ring-1 focus:ring-neutral-200"
                  />
                  <p className="text-[9px] text-stone-400 mt-1">
                    Simulate manual client verification checkout.
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-200/60 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyManualTransfer}
                    disabled={isProcessing}
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Auditing Transfer Ledger...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 stroke-[2]" />
                        Confirm Manual Payment Success
                      </>
                    )}
                  </button>
                  <p className="text-center text-[9px] text-[#8b7235] font-mono">
                    Confirms direct peer transfer and securely unlocks the source deliverables.
                  </p>
                </div>
              </div>

            </motion.div>
          ) : (
            <motion.div
              key="decrypted-deliverable"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="bg-emerald-50/20 border-2 border-emerald-500/25 rounded-2xl p-6 text-center relative overflow-hidden"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-emerald-600 stroke-[2.5]" />
              </div>

              <h2 className="text-base font-bold text-neutral-950 uppercase tracking-tight font-display mb-1">
                Transaction Completed Successful!
              </h2>
              <p className="text-xs text-stone-500 max-w-sm mx-auto mb-6 leading-relaxed">
                Your direct manual QR settlement has been registered. The contractor's source assets are now decrypted and unlocked for secure transfer.
              </p>

              {/* Released Container Item details */}
              <div className="bg-white border border-stone-200 rounded-xl p-4 text-left mb-6">
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest block font-mono">
                      SECURE ASSET ID: SL-{project.id.substring(0,8).toUpperCase()}
                    </span>
                    <p className="text-xs font-bold text-neutral-900 truncate font-mono mt-0.5">
                      {project.file_name || "deliverables_export_release.zip"}
                    </p>
                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                      Format: Decrypted Verified Archive • Size: {project.file_size || "14.8 MB"}
                    </p>
                  </div>

                  <button 
                    onClick={handleDownloadFile}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-250 text-emerald-700 rounded-lg transition-transform hover:scale-105 active:scale-95 shrink-0"
                    title="Unlock and download container"
                  >
                    <Download className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadFile}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-transform hover:scale-[1.01] active:scale-98 shadow-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4 stroke-[2]" />
                Download Decrypted Deliverable File
              </button>

              <div className="text-[9.5px] font-mono text-neutral-400 border-t border-stone-200/50 mt-5 pt-3">
                Certified & Verified Secure UPI Release.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Visual simple footer */}
      <footer className="py-10 px-4 text-center border-t border-stone-200/60 bg-white">
        <p className="text-neutral-450 text-[11px]">
          Processed instantly by direct peer UPI ledger.
        </p>
        <p className="text-neutral-400 text-[9px] mt-1 font-mono">
          Ref ID: SL-{projectId.substring(0, 8).toUpperCase()}-MQR
        </p>
      </footer>
    </div>
  );
}
