/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  where,
  getDocFromServer
} from 'firebase/firestore';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';

import { Lock, ShieldAlert, KeyRound, Sparkles, FolderLock, Package, Layers, Briefcase, ArrowRight } from 'lucide-react';
import FreelancerDashboard from './components/FreelancerDashboard';
import ClientPortal from './components/ClientPortal';
import { Project, FreelancerProfile, ClientRecord, Invoice } from './types';
import { db, auth, handleFirestoreError, OperationType } from './firebase';

// Helper to recursively remove all keys with 'undefined' values (which Firestore setDoc rejects)
function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefined) as unknown as T;
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const key of Object.keys(obj)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        res[key] = cleanUndefined(val);
      }
    }
    return res as T;
  }
  return obj;
}

const DEFAULT_PROFILE: FreelancerProfile = {
  agency_name: "Your Agency",
  freelancer_name: "Your Name",
  role_title: "Your Role",
  bio: "Lorem ispum donor",
  website_url: "example.com",
  github_url: "example",
  twitter_url: "example",
  upi_id: "xyz@upi"
};

const DEFAULT_CLIENTS: ClientRecord[] = [
  {
    id: "client-1",
    name: "Web3 Craft Bangalore",
    email: "contact@web3craft.in",
    company_name: "Web3 Craft Pvt Ltd",
    phone: "+91 98765 43210",
    notes: "VIP Client. High fidelity prototypes and wireframes.",
    created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
    avatar_color: "bg-blue-500"
  },
];

// Pre-seeded high fidelity mock data for offline local mode
const DEFAULT_PROJECTS: Project[] = [
  {
    id: "proj-1",
    client_name: "Web3 Craft Bangalore",
    project_name: "Mobile App Wireframes & Figma Prototype",
    amount_due: 35000,
    is_paid: false,
    file_name: "bangalore_web3_figma_release_v1.zip",
    file_size: "34.5 MB",
    created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    milestones: [
      { id: "m1-1", task_title: "Information Architecture & User Flow Diagrams", is_completed: true },
      { id: "m1-2", task_title: "High-Fidelity Figma Component Library", is_completed: true },
      { id: "m1-3", task_title: "Interactive Clickable Prototype (Final Checkpoint)", is_completed: false }
    ],
    agency_profile: DEFAULT_PROFILE,
    client_id: "client-1"
  },
  {
    id: "proj-2",
    client_name: "Athera Studio Delhi",
    project_name: "Laravel Backend API & Admin panel",
    amount_due: 65000,
    is_paid: true,
    file_name: "athera_backend_final_sql_dump.zip",
    file_size: "128.0 MB",
    created_at: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    milestones: [
      { id: "m2-1", task_title: "PostgreSQL Database Schema & Seeding rules", is_completed: true },
      { id: "m2-2", task_title: "OAuth2 Middleware & Custom API Testing Suites", is_completed: true }
    ],
    agency_profile: DEFAULT_PROFILE,
    client_id: "client-2"
  },
  {
    id: "proj-3",
    client_name: "Creative Pulse Agency",
    project_name: "Premium Landing HTML/CSS Code package",
    amount_due: 18000,
    is_paid: false,
    file_name: "creativepulse_frontend_assets.tar.gz",
    file_size: "12.4 MB",
    created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    milestones: [
      { id: "m3-1", task_title: "Mobile Responsive Tailwind Framework layout", is_completed: true },
      { id: "m3-2", task_title: "Motion React transitions & micro-app state", is_completed: false }
    ],
    agency_profile: DEFAULT_PROFILE,
    client_id: "client-3"
  }
];

const DEFAULT_INVOICES: Invoice[] = [
  {
    id: "inv-1",
    invoice_number: "INV-2026-001",
    client_id: "client-1",
    client_name: "Web3 Craft Bangalore",
    project_id: "proj-1",
    issue_date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0],
    items: [
      { id: "item-1-1", description: "Information Architecture & User Flows", quantity: 1, rate: 15000 },
      { id: "item-1-2", description: "High-Fidelity Component Library", quantity: 1, rate: 20000 }
    ],
    tax_rate: 18,
    status: 'sent',
    notes: "UPI payment QR is added on checkout portal. Billed under GST guidelines."
  },
  {
    id: "inv-2",
    invoice_number: "INV-2026-002",
    client_id: "client-2",
    client_name: "Athera Studio Delhi",
    project_id: "proj-2",
    issue_date: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString().split('T')[0],
    items: [
      { id: "item-2-1", description: "PostgreSQL Database Schema setup", quantity: 1, rate: 30000 },
      { id: "item-2-2", description: "OAuth2 Custom API suites implementation", quantity: 1, rate: 35000 }
    ],
    tax_rate: 0,
    status: 'paid',
    notes: "Automatically registered as paid. Deliverables unlocked for direct access."
  },
  {
    id: "inv-3",
    invoice_number: "INV-2026-003",
    client_id: "client-3",
    client_name: "Creative Pulse Agency",
    project_id: "proj-3",
    issue_date: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString().split('T')[0],
    due_date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0],
    items: [
      { id: "item-3-1", description: "Responsive Tailwind Theme and Layout framework", quantity: 1, rate: 18000 }
    ],
    tax_rate: 18,
    status: 'draft',
    notes: "Initial draft billing."
  }
];

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [profile, setProfile] = useState<FreelancerProfile>(DEFAULT_PROFILE);
  const [currentView, setCurrentView] = useState<'dashboard' | 'portal'>('dashboard');
  const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);
  const [isSandboxUnlocked, setIsSandboxUnlocked] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthTroubleshooter, setShowAuthTroubleshooter] = useState(false);

  // Auth and sync status
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Unique persistent offline sandbox user ID stored inside localStorage to identify database records
  const [sandboxUserId] = useState<string>(() => {
    let id = localStorage.getItem('project_a_sandbox_uid');
    if (!id) {
      id = `sb-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      localStorage.setItem('project_a_sandbox_uid', id);
    }
    return id;
  });

  // Load profile static settings on boot
  useEffect(() => {
    const saved = localStorage.getItem('project_a_profile');
    if (saved) {
      try {
        setProfile(JSON.parse(saved));
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  // Monitor Authentication State change
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  // Validate Connection to Firestore on boot as mandated
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration or network.");
        }
      }
    }
    testConnection();
  }, []);

  // Monitor URL params for routing and native deep-linking
  useEffect(() => {
    const handleUrlRouting = () => {
      const params = new URLSearchParams(window.location.search);
      const portalId = params.get('portal');
      if (portalId) {
        setSelectedPortalId(portalId);
        setCurrentView('portal');
      } else {
        setSelectedPortalId(null);
        setCurrentView('dashboard');
      }
    };

    handleUrlRouting();
    window.addEventListener('popstate', handleUrlRouting);
    return () => {
      window.removeEventListener('popstate', handleUrlRouting);
    };
  }, []);

  // Auto-seed sandbox user's data on first-time open inside Firestore securely
  useEffect(() => {
    if (authLoading) return; // Wait until initial Auth state is fully resolved
    if (user) return; // Only for sandbox
    const seeded = localStorage.getItem('project_a_sandbox_seeded_v3');
    if (!seeded && sandboxUserId) {
      const seedData = async () => {
        try {
          setIsSyncing(true);
          // 1. Seed clients
          for (const client of DEFAULT_CLIENTS) {
            const clientWithAuth = { ...client, owner_id: sandboxUserId };
            await setDoc(doc(db, 'clients', client.id), cleanUndefined(clientWithAuth));
          }
          // 2. Seed projects
          for (const proj of DEFAULT_PROJECTS) {
            const projWithAuth = { ...proj, owner_id: sandboxUserId };
            await setDoc(doc(db, 'projects', proj.id), cleanUndefined(projWithAuth));
          }
          // 3. Seed invoices
          for (const inv of DEFAULT_INVOICES) {
            const invWithAuth = { ...inv, owner_id: sandboxUserId };
            await setDoc(doc(db, 'invoices', inv.id), cleanUndefined(invWithAuth));
          }
          localStorage.setItem('project_a_sandbox_seeded_v3', 'true');
        } catch (error) {
          console.error("Failed to seed sandbox data to Firestore: ", error);
        } finally {
          setIsSyncing(false);
        }
      };
      seedData();
    }
  }, [authLoading, user, sandboxUserId]);

  // Real-time Dashboard listener when Signed In or Sandbox active
  useEffect(() => {
    if (authLoading) return; // Prevent connecting query listeners until Auth finishes loading
    const activeOwnerId = user ? user.uid : sandboxUserId;
    if (!activeOwnerId) return;

    setIsSyncing(true);
    
    // Projects listener
    const qProjects = query(
      collection(db, 'projects'),
      where('owner_id', '==', activeOwnerId)
    );

    const unsubscribeProjects = onSnapshot(qProjects, (snapshot) => {
      const fetched: Project[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Project);
      });
      // Sort projects by created_at desc (since we want newly created projects on top)
      fetched.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setProjects(fetched);
      setIsSyncing(false);
    }, (error) => {
      setIsSyncing(false);
      handleFirestoreError(error, OperationType.LIST, 'projects');
    });

    // Clients listener
    const qClients = query(
      collection(db, 'clients'),
      where('owner_id', '==', activeOwnerId)
    );

    const unsubscribeClients = onSnapshot(qClients, (snapshot) => {
      const fetched: ClientRecord[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data()
        } as ClientRecord);
      });
      setClients(fetched);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'clients');
    });

    // Invoices listener
    const qInvoices = query(
      collection(db, 'invoices'),
      where('owner_id', '==', activeOwnerId)
    );

    const unsubscribeInvoices = onSnapshot(qInvoices, (snapshot) => {
      const fetched: Invoice[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Invoice);
      });
      setInvoices(fetched);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'invoices');
    });

    return () => {
      unsubscribeProjects();
      unsubscribeClients();
      unsubscribeInvoices();
    };
  }, [authLoading, user, sandboxUserId]);

  // Real-time Single Document client-portal listener
  // This allows unauthenticated users visiting a share link to get updates in real-time
  useEffect(() => {
    if (!selectedPortalId) return;

    const docRef = doc(db, 'projects', selectedPortalId);
    const unsubscribePortal = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const updatedProj = { id: docSnap.id, ...docSnap.data() } as Project;
        setProjects((prev) => {
          const exists = prev.some(p => p.id === selectedPortalId);
          if (exists) {
            return prev.map(p => p.id === selectedPortalId ? updatedProj : p);
          } else {
            return [updatedProj, ...prev];
          }
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `projects/${selectedPortalId}`);
    });

    return () => unsubscribePortal();
  }, [selectedPortalId]);

  // Create Project Action with Dual Support (Cloud vs Local Sandbox)
  const handleCreateProject = async (newProjectData: Omit<Project, 'id' | 'created_at' | 'owner_id'>) => {
    let finalClientId = newProjectData.client_id;
    const trimmedName = newProjectData.client_name.trim();
    const activeOwnerId = user ? user.uid : sandboxUserId;

    // Check if the client_id or client_name already matches an existing customer record
    let existingClient = clients.find(c => 
      (finalClientId && c.id === finalClientId) ||
      c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingClient) {
      finalClientId = existingClient.id;
    } else if (trimmedName) {
      // Auto-create a custom ClientRecord (customer) by default
      const newClientId = `client-${Date.now()}`;
      const colors = ["bg-blue-500", "bg-emerald-500", "bg-indigo-500", "bg-purple-500", "bg-pink-500", "bg-amber-500"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const autoCreatedClient: ClientRecord & { owner_id: string } = {
        id: newClientId,
        name: trimmedName,
        email: "",
        company_name: "",
        phone: "",
        notes: `Automatically generated from project creation: "${newProjectData.project_name}"`,
        created_at: new Date().toISOString(),
        avatar_color: randomColor,
        owner_id: activeOwnerId
      };

      try {
        await setDoc(doc(db, 'clients', newClientId), cleanUndefined(autoCreatedClient));
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `clients/${newClientId}`);
      }
      
      finalClientId = newClientId;
    }

    const projectId = `proj-${Date.now()}`;
    const newProject: Project & { owner_id: string } = {
      ...newProjectData,
      client_id: finalClientId,
      id: projectId,
      created_at: new Date().toISOString(),
      agency_profile: profile, // inject current profile state snapshot
      owner_id: activeOwnerId
    };

    setIsSyncing(true);
    const pathForWrite = `projects/${projectId}`;
    try {
      await setDoc(doc(db, 'projects', projectId), cleanUndefined(newProject));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, pathForWrite);
    } finally {
      setIsSyncing(false);
    }
  };

  // Delete Project Action with Dual Support
  const handleDeleteProject = async (id: string) => {
    setIsSyncing(true);
    const pathForDelete = `projects/${id}`;
    try {
      await deleteDoc(doc(db, 'projects', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, pathForDelete);
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle milestone completion state (For freelancer dashboard togglers)
  const handleToggleMilestone = async (projectId: string, milestoneId: string) => {
    const targetProj = projects.find(p => p.id === projectId);
    if (!targetProj) return;

    const updatedMilestones = targetProj.milestones.map(m => 
      m.id === milestoneId ? { ...m, is_completed: !m.is_completed } : m
    );

    setIsSyncing(true);
    const pathForUpdate = `projects/${projectId}`;
    try {
      await setDoc(doc(db, 'projects', projectId), {
        milestones: updatedMilestones
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, pathForUpdate);
    } finally {
      setIsSyncing(false);
    }
  };

  // Simulating Razorpay / UPI checkout completed by client or direct force payout toggle
  const handleUpdatePayment = async (id: string, isPaid: boolean) => {
    setIsSyncing(true);
    const pathForUpdate = `projects/${id}`;
    try {
      // Specifically updates is_paid only, matching high security ruleset constraints
      await setDoc(doc(db, 'projects', id), { is_paid: isPaid }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, pathForUpdate);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTogglePaidState = async (id: string) => {
    const targetProj = projects.find(p => p.id === id);
    if (!targetProj) return;
    await handleUpdatePayment(id, !targetProj.is_paid);
  };

  // Google OAuth Operations
  const handleSignInWithGoogle = async () => {
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google Auth failed pop-up execution: ", error);
      const code = error?.code || '';
      const message = error?.message || '';
      
      if (code === 'auth/unauthorized-domain' || message.includes('auth/unauthorized-domain') || message.includes('domain is not authorized')) {
        setAuthError('unauthorized-domain');
        setShowAuthTroubleshooter(true);
      } else if (code === 'auth/popup-closed-by-user' || message.includes('popup-closed-by-user')) {
        setAuthError('popup-closed');
      } else {
        setAuthError(message || 'An unexpected authentication error occurred.');
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setProjects(DEFAULT_PROJECTS); // Reset local list representation to seed data on signout
      setClients(DEFAULT_CLIENTS);
      setInvoices(DEFAULT_INVOICES);
    } catch (error) {
      console.error("Logout execution failed: ", error);
    }
  };

  // Client Management Handlers
  const handleAddClient = async (newClient: Omit<ClientRecord, 'id' | 'created_at'>) => {
    const activeOwnerId = user ? user.uid : sandboxUserId;
    const clientId = `client-${Date.now()}`;
    const clientWithAuth: ClientRecord & { owner_id: string } = {
      ...newClient,
      id: clientId,
      created_at: new Date().toISOString(),
      owner_id: activeOwnerId
    };
    try {
      await setDoc(doc(db, 'clients', clientId), cleanUndefined(clientWithAuth));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `clients/${clientId}`);
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clients', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `clients/${id}`);
    }
  };

  const handleUpdateClient = async (updatedClient: ClientRecord) => {
    const activeOwnerId = user ? user.uid : sandboxUserId;
    const clientWithAuth = {
      ...updatedClient,
      owner_id: activeOwnerId
    };
    try {
      await setDoc(doc(db, 'clients', updatedClient.id), cleanUndefined(clientWithAuth), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `clients/${updatedClient.id}`);
    }
  };

  // Invoice Management Handlers
  const handleAddInvoice = async (newInvoice: Omit<Invoice, 'id'>) => {
    const activeOwnerId = user ? user.uid : sandboxUserId;
    const invoiceId = `inv-${Date.now()}`;
    const invoiceWithAuth: Invoice & { owner_id: string } = {
      ...newInvoice,
      id: invoiceId,
      owner_id: activeOwnerId
    };
    try {
      await setDoc(doc(db, 'invoices', invoiceId), cleanUndefined(invoiceWithAuth));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `invoices/${invoiceId}`);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'invoices', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `invoices/${id}`);
    }
  };

  const handleUpdateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    try {
      await setDoc(doc(db, 'invoices', id), { status }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `invoices/${id}`);
    }
  };

  const handleUpdateInvoice = async (updatedInvoice: Invoice) => {
    const activeOwnerId = user ? user.uid : sandboxUserId;
    const invoiceWithAuth = {
      ...updatedInvoice,
      owner_id: activeOwnerId
    };
    try {
      await setDoc(doc(db, 'invoices', updatedInvoice.id), cleanUndefined(invoiceWithAuth), { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `invoices/${updatedInvoice.id}`);
    }
  };

  // View navigation helpers
  const handleSelectPortalInline = (id: string) => {
    window.history.pushState({}, '', `${window.location.origin}${window.location.pathname}?portal=${id}`);
    setSelectedPortalId(id);
    setCurrentView('portal');
  };

  const handleBackToDashboard = () => {
    window.history.pushState({}, '', `${window.location.origin}${window.location.pathname}`);
    setSelectedPortalId(null);
    setCurrentView('dashboard');
  };

  const appUrl = `${window.location.origin}${window.location.pathname}`;

  const handleUpdateProfile = (updated: FreelancerProfile) => {
    setProfile(updated);
    localStorage.setItem('project_a_profile', JSON.stringify(updated));
  };

  // Render elegant Authentication Gate & Landing
  if (currentView === 'dashboard' && !user && !isSandboxUnlocked) {
    return (
      <div className="min-h-screen bg-[#faf9f6] text-[#1c1b18] font-sans flex flex-col justify-between selection:bg-[#f0ede4]">
        {/* Subtle decorative grid/border lines */}
        <div className="border-b border-[#ebdcb9]/30 py-4.5 px-6 md:px-12 bg-white/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1c1b18] text-[#faf9f6] flex items-center justify-center font-bold tracking-tighter text-sm">
                S
              </div>
              <span className="font-bold tracking-tight text-sm font-display uppercase">STACK</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-400 font-mono tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span>SECURE SETTLEMENT BRIDGE v1.4</span>
            </div>
          </div>
        </div>

        {/* Hero Section Container */}
        <main className="max-w-3xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fdfaf2] border border-[#fdfaf2]/90 text-xs font-semibold text-[#8b7235]">
            <KeyRound className="w-3.5 h-3.5" />
            <span>Cryptographic Deliverables Locking Tunnel</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#1c1b18] leading-tight font-display mb-4">
            Release digital deliverables <span className="underline decoration-1 decoration-[#8b7235]/60 underline-offset-4">only upon</span> client checkout settlement
          </h1>

          <p className="text-sm text-stone-500 leading-relaxed max-w-xl mb-8 font-sans">
            Vertex secure-lock bridges. Generate an encrypted channel for design assets, documents, database schemas, and packages. Your client unlocks direct source downloads instantly upon verifying UPI checkout.
          </p>

          {/* Dynamic Authentication Feedback Banner */}
          {authError && (
            <div className="w-full max-w-md bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-6 font-sans">
              <div className="flex gap-2.5 items-start">
                <ShieldAlert className="w-4 h-4 text-[#8b7235] shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                    {authError === 'unauthorized-domain' 
                      ? 'Firebase Authorized Domain Blocked' 
                      : authError === 'popup-closed'
                      ? 'Authentication Pop-Up Closed'
                      : 'Firebase Connection Issue'}
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
                    {authError === 'unauthorized-domain'
                      ? `Your Firebase app's Authorized Domains list does not authorize this preview environment's URL hostname.`
                      : authError === 'popup-closed'
                      ? 'The Google sign-in window was closed before completing the handshake. Please try again.'
                      : `Auth failed. Details: ${authError}`}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setShowAuthTroubleshooter(true)}
                      className="px-2.5 py-1 bg-[#1c1b18] text-[#faf9f6] text-[10px] font-bold rounded-md hover:bg-black transition-all cursor-pointer"
                    >
                      Show Troubleshooter Guide
                    </button>
                    <button
                      onClick={() => setAuthError(null)}
                      className="px-2 py-1 text-stone-400 hover:text-stone-600 text-[10px] font-medium transition-all cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-md">
            {/* Google Authentication */}
            <button
              onClick={handleSignInWithGoogle}
              className="w-full sm:w-auto px-8 py-3 bg-[#1c1b18] hover:bg-[#2e2d29] text-[#faf9f6] font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-98 shadow-md flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <svg className="w-4 h-4 text-white fill-current animate-pulse" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="currentColor"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="currentColor" opacity="0.85"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="currentColor" opacity="0.8"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="currentColor" opacity="0.9"/>
              </svg>
              <span>Authorized Google Workspace Key</span>
            </button>

            {/* Sandbox Simulation button */}
            <button
              onClick={() => {
                setProjects(DEFAULT_PROJECTS);
                setClients(DEFAULT_CLIENTS);
                setInvoices(DEFAULT_INVOICES);
                setIsSandboxUnlocked(true);
              }}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-stone-50 border border-stone-250/90 text-[#1c1b18] font-bold text-xs uppercase tracking-widest rounded-xl transition-all active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Sandbox Simulator</span>
            </button>
          </div>

          <div className="mt-4 mb-2">
            <button
              onClick={() => setShowAuthTroubleshooter(!showAuthTroubleshooter)}
              className="text-[11px] text-[#8b7235] hover:text-stone-700 underline underline-offset-2 font-medium cursor-pointer"
            >
              {showAuthTroubleshooter ? "Hide Debugger & Authorized Domains Guide" : "Having domain authorization issues or no Firebase console access?"}
            </button>
          </div>

          {/* Interactive Debugger / Setup Guide Drawer */}
          <AnimatePresence>
            {showAuthTroubleshooter && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="w-full max-w-xl bg-white border border-stone-200 rounded-2xl p-6 text-left shadow-sm mt-4 font-sans"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Firebase Authorized Domains Manual Locksmith
                  </h3>
                </div>

                <p className="text-[11.5px] text-stone-500 leading-relaxed mb-4">
                  Because this safe staging workspace is hosted inside secure Google Cloud containers, Google sign-ins initialized via Firebase SDK will get blocked <strong>until</strong> this specific preview domain is authorized in your database console.
                </p>

                {/* Domain Copy Area */}
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2 mb-5">
                  <div className="flex items-center justify-between gap-2.5">
                    <div>
                      <span className="text-[9.5px] uppercase font-bold text-stone-400 block tracking-widest leading-none">CURRENT DOMAIN UNLOCK KEY</span>
                      <code className="text-[11px] font-mono font-bold text-[#8b7235] block mt-1 break-all">
                        {window.location.hostname}
                      </code>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.hostname);
                        alert("Domain hostname successfully copied to clipboard!");
                      }}
                      className="whitespace-nowrap px-3 py-1.5 bg-[#1c1b18] hover:bg-black text-[#faf9f6] text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer"
                    >
                      Copy Domain
                    </button>
                  </div>
                </div>

                {/* Step Matrix */}
                <div className="space-y-3 mb-6">
                  <h4 className="text-[10px] font-extrabold pb-1.5 text-stone-400 border-b border-stone-100 uppercase tracking-widest">
                    Quick Setup Steps (Firebase Console)
                  </h4>
                  <div className="text-xs space-y-2">
                    <p className="text-stone-605">
                      <strong className="text-neutral-800">1.</strong> Open your Firebase project console at{" "}
                      <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-[#8b7235] hover:underline">
                        console.firebase.google.com
                      </a>
                    </p>
                    <p className="text-stone-605">
                      <strong className="text-neutral-800">2.</strong> Select your project, navigate to <strong className="text-neutral-800">Authentication</strong>, and click the <strong className="text-neutral-800">Settings</strong> tab.
                    </p>
                    <p className="text-stone-605">
                      <strong className="text-neutral-800">3.</strong> Scroll to the <strong className="text-neutral-800">Authorized Domains</strong> segment and click <strong className="text-neutral-800">Add Domain</strong>.
                    </p>
                    <p className="text-stone-605">
                      <strong className="text-neutral-800">4.</strong> Paste the copied domain from above, click Save, and refresh this page to try sign-in again!
                    </p>
                  </div>
                </div>

                {/* Ultimate Bypasser */}
                <div className="border-t border-dashed border-stone-150 pt-5 text-center">
                  <span className="text-[10px] uppercase font-bold text-stone-400 block mb-3.5 tracking-widest">
                    No Console Access or Want a Zero-Auth Solution?
                  </span>
                  <button
                    onClick={() => {
                      setProjects(DEFAULT_PROJECTS);
                      setClients(DEFAULT_CLIENTS);
                      setInvoices(DEFAULT_INVOICES);
                      setIsSandboxUnlocked(true);
                    }}
                    className="w-full py-2.5 bg-amber-50 border border-amber-200/85 text-[#8b7235] hover:text-[#faf9f6] hover:bg-[#8b7235] hover:border-[#8b7235] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Launch Fully-Persistent Offline Sandbox</span>
                  </button>
                  <p className="text-[10px] text-stone-400 mt-2 leading-relaxed">
                    Locks down files, generates complete UPI billing, tracks client checkouts, and builds downloadable invoice PDFs. <strong>100% functional locally in your browser.</strong>
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-16 border-t border-dashed border-stone-200 w-full pt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-2xl">
            <div>
              <span className="font-mono text-xs font-bold text-[#8b7235] block mb-1">01 / ENCRYPTED LEDGER</span>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Source deliverables are packed in compressed payloads. The download is locked dynamically on client devices until proof of UPI transfer.
              </p>
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-[#8b7235] block mb-1">02 / PROFESSIONAL PRESENCE</span>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Configure your agency name, bio, site url, social links, and branding logo. Ensure clients view a trustworthy setup on checkout.
              </p>
            </div>
            <div>
              <span className="font-mono text-xs font-bold text-[#8b7235] block mb-1">03 / MEMORY PERMANENCE</span>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Connect Firebase for automated real-time device streaming data, or utilize instant offline state persistence.
              </p>
            </div>
          </div>
        </main>

        {/* Footer Area */}
        <footer className="border-t border-[#ebdcb9]/20 py-6 px-12 bg-white/20 select-none text-center">
          <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">
            Licensed as Cryptographically Verified Deliverable Gateway Bridge. Vertex Labs © 2026.
          </p>
        </footer>
      </div>
    );
  }

  // If the user is authenticated but has not completed their workspace profile niche onboarding
  const showOnboarding = (user || isSandboxUnlocked) && !profile.business_type;

  if (currentView === 'dashboard' && showOnboarding) {
    return (
      <div className="min-h-screen bg-[#faf9f6]/95 text-[#1c1b18] font-sans flex flex-col justify-between selection:bg-[#f0ede4]">
        {/* Onboarding Header */}
        <div className="border-b border-[#ebdcb9]/30 py-4 px-6 md:px-12 bg-white/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1c1b18] text-[#faf9f6] flex items-center justify-center font-bold tracking-tighter text-sm">
                S
              </div>
              <span className="font-bold tracking-tight text-sm font-display uppercase">STACK</span>
            </div>
            <div className="text-xs text-stone-400 font-mono tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
              <span>INITIAL SETUP PORTAL</span>
            </div>
          </div>
        </div>

        {/* Onboarding Main Body */}
        <main className="max-w-3xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
          <div className="text-center mb-10">
            <div className="mb-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-100/60 text-[10.5px] font-bold text-[#8b7235]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Configure Your Workspace Focus</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#1c1b18] leading-tight font-display mb-4">
              Select Your Creative Agency Niche
            </h1>
            <p className="text-xs md:text-sm text-stone-500 max-w-lg mx-auto leading-relaxed">
              We personalize your dashboard and unlock specialized features such as e-commerce digital catalogs or SaaS developer tunnels.
            </p>
          </div>

          {/* Two main business focus cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-2xl mx-auto">
            {/* Online Services Choice */}
            <button
              onClick={() => handleUpdateProfile({ ...profile, business_type: 'services' })}
              id="onboard-opt-services"
              className="text-left bg-white border border-stone-250/90 hover:border-amber-500/80 hover:shadow-md hover:bg-amber-50/5 p-5 rounded-2xl transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-amber-50/75 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-105 transition-transform">
                  <Briefcase className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider mb-2">
                  🛠️ Online Services & Consulting
                </h3>
                <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
                  For freelancers, agencies, & developers offering custom code, graphics, Figma mockups, copy, SEO, or bespoke dev packages.
                  <strong className="text-stone-600 block mt-1">Includes traditional scope-of-work project milestones, secure UPI invoice links, and locked delivery tunnels.</strong>
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-[10.5px] font-bold text-amber-600 uppercase tracking-wider font-mono">
                <span>Select & Activate Services</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            {/* E-Commerce Choice */}
            <button
              onClick={() => handleUpdateProfile({ ...profile, business_type: 'ecommerce', digital_store_installed: false })}
              id="onboard-opt-ecommerce"
              className="text-left bg-white border border-stone-250/90 hover:border-orange-500/80 hover:shadow-md hover:bg-orange-50/5 p-5 rounded-2xl transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="w-9 h-9 rounded-xl bg-orange-50/75 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-105 transition-transform">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-black text-neutral-900 uppercase tracking-wider mb-2">
                  📦 E-Commerce (Digital Goods Store)
                </h3>
                <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
                  For selling downloadable assets, plugins, presets, code repositories, or PDF kits. 
                  <strong className="text-stone-600 block mt-1">Unlocks the storefront installer. You can install and activate the Digital Goods Store custom catalog tab at any time.</strong>
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1.5 text-[10.5px] font-bold text-orange-600 uppercase tracking-wider font-mono">
                <span>Select & Activate E-Commerce</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          </div>

          {/* Inline alert */}
          <div className="bg-stone-100 border border-stone-200/50 p-3 rounded-xl text-[10px] text-stone-400 leading-normal font-sans text-center max-w-md mx-auto font-medium">
            Note: You can modify this workspace focus at any point inside your Agency Studio Profile settings at any time.
          </div>
        </main>

        {/* Footer Area */}
        <footer className="border-t border-[#ebdcb9]/20 py-6 px-12 bg-white/20 select-none text-center">
          <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">
            Flodech Gateway Lock System Initializer. Vertex Labs © 2026.
          </p>
        </footer>
      </div>
    );
  }

  return (
    <>
      {currentView === 'portal' && selectedPortalId ? (
        <ClientPortal
          projectId={selectedPortalId}
          projects={projects}
          onUpdatePayment={handleUpdatePayment}
          onBackToDashboard={user ? handleBackToDashboard : undefined}
        />
      ) : (
        <FreelancerDashboard
          projects={projects}
          clients={clients}
          invoices={invoices}
          onCreateProject={handleCreateProject}
          onDeleteProject={handleDeleteProject}
          onToggleMilestone={handleToggleMilestone}
          onTogglePaid={handleTogglePaidState}
          onSelectProject={handleSelectPortalInline}
          onAddClient={handleAddClient}
          onDeleteClient={handleDeleteClient}
          onUpdateClient={handleUpdateClient}
          onAddInvoice={handleAddInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
          onUpdateInvoice={handleUpdateInvoice}
          appUrl={appUrl}
          user={user}
          onSignInWithGoogle={handleSignInWithGoogle}
          onSignOut={handleSignOut}
          isSyncing={isSyncing}
          profile={profile}
          onUpdateProfile={handleUpdateProfile}
        />
      )}
    </>
  );
}
