import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  Plus, 
  Trash2, 
  Download,
  Copy, 
  Check, 
  FileCheck, 
  ExternalLink, 
  Clock, 
  Unlock, 
  Lock, 
  Upload, 
  User, 
  Briefcase, 
  Eye, 
  QrCode, 
  Sparkles, 
  RefreshCw, 
  FolderOpen, 
  ArrowRight, 
  LogOut,
  Globe,
  Github,
  Twitter,
  Save,
  FileText,
  Building,
  Users,
  Receipt,
  Printer,
  Calculator,
  Tag,
  ChevronDown,
  Calendar,
  UserPlus,
  Package,
  ShoppingBag
} from 'lucide-react';
import { Project, Milestone, FreelancerProfile, ClientRecord, Invoice } from '../types';
import ProductsTab from './ProductsTab';

interface FreelancerDashboardProps {
  projects: Project[];
  clients: ClientRecord[];
  invoices: Invoice[];
  onCreateProject: (project: Omit<Project, 'id' | 'created_at'>) => void;
  onDeleteProject: (id: string) => void;
  onToggleMilestone: (projectId: string, milestoneId: string) => void;
  onTogglePaid: (projectId: string) => void;
  onSelectProject: (id: string) => void;
  onAddClient: (client: Omit<ClientRecord, 'id' | 'created_at'>) => void;
  onDeleteClient: (id: string) => void;
  onUpdateClient: (client: ClientRecord) => void;
  onAddInvoice: (invoice: Omit<Invoice, 'id'>) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  onUpdateInvoice: (invoice: Invoice) => void;
  appUrl: string;
  user: any;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
  isSyncing: boolean;
  profile: FreelancerProfile;
  onUpdateProfile: (p: FreelancerProfile) => void;
}

export function compressImageBase64(base64: string, maxWidth = 320, maxHeight = 320, quality = 0.7): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(base64);
      }
    };
    img.onerror = () => {
      resolve(base64);
    };
  });
}

export default function FreelancerDashboard({
  projects,
  clients,
  invoices,
  onCreateProject,
  onDeleteProject,
  onToggleMilestone,
  onTogglePaid,
  onSelectProject,
  onAddClient,
  onDeleteClient,
  onUpdateClient,
  onAddInvoice,
  onDeleteInvoice,
  onUpdateInvoiceStatus,
  onUpdateInvoice,
  appUrl,
  user,
  onSignInWithGoogle,
  onSignOut,
  isSyncing,
  profile,
  onUpdateProfile
}: FreelancerDashboardProps) {
  // Navigation tabs Inside Workspace Dashboard
  const [activeTab, setActiveTab] = useState<'channels' | 'clients' | 'invoices' | 'studio'>('channels');

  // Form elements state for project deployment
  const [clientName, setClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [amountDue, setAmountDue] = useState('');
  
  // Custom manual UPI QR upload state (Base64 representation)
  const [qrCodeData, setQrCodeData] = useState<string>('');
  const [qrCodeName, setQrCodeName] = useState<string>('');
  
  // File delivery package upload state
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>({
    name: 'deliverables_v1_package.zip',
    size: '14.8 MB'
  });

  // Milestones builder state
  const [milestones, setMilestones] = useState<Omit<Milestone, 'id'>[]>([
    { task_title: 'Approved High-Fidelity Design Package', is_completed: true },
    { task_title: 'Fully Responsive React Front-End Bundle', is_completed: false }
  ]);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');

  // Profile setup workspace local states
  const [agencyName, setAgencyName] = useState(profile.agency_name);
  const [freelancerName, setFreelancerName] = useState(profile.freelancer_name);
  const [roleTitle, setRoleTitle] = useState(profile.role_title);
  const [bioText, setBioText] = useState(profile.bio);
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url);
  const [gitUrl, setGitUrl] = useState(profile.github_url || '');
  const [twUrl, setTwUrl] = useState(profile.twitter_url || '');
  const [upiVal, setUpiVal] = useState(profile.upi_id || '');
  const [logoBase64, setLogoBase64] = useState(profile.logo_data || '');
  const [businessType, setBusinessType] = useState<'services' | 'ecommerce'>(profile.business_type === 'ecommerce' ? 'ecommerce' : 'services');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState(false);

  // Customer Records Form & Edit State variables
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientCompany, setNewClientCompany] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

  // Invoicing Creator Form states
  const [newInvNumber, setNewInvNumber] = useState(`INV-2026-00${invoices.length + 1}`);
  useEffect(() => {
    setNewInvNumber(`INV-2026-${String(invoices.length + 1).padStart(3, '0')}`);
  }, [invoices.length]);

  const [newInvClient, setNewInvClient] = useState('');
  const [newInvProject, setNewInvProject] = useState('');
  const [newInvIssueDate, setNewInvIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newInvDueDate, setNewInvDueDate] = useState(new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [newInvTaxRate, setNewInvTaxRate] = useState('18');
  const [newInvNotes, setNewInvNotes] = useState('Payment settlements can be securely executed with the UPI scan code directly inside the channel.');

  // Invoice line lists builder state
  const [invoiceItemsList, setInvoiceItemsList] = useState<{ id: string; description: string; quantity: number; rate: number }[]>([
    { id: "item-init", description: "Design Deliverable Milestone", quantity: 1, rate: 12000 }
  ]);
  const [customItemDesc, setCustomItemDesc] = useState('');
  const [customItemQty, setCustomItemQty] = useState('1');
  const [customItemRate, setCustomItemRate] = useState('');

  // Overlay preview selection state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Synchronize dynamic updates back with global profile instance on source change
  useEffect(() => {
    setAgencyName(profile.agency_name);
    setFreelancerName(profile.freelancer_name);
    setRoleTitle(profile.role_title);
    setBioText(profile.bio);
    setWebsiteUrl(profile.website_url);
    setGitUrl(profile.github_url || '');
    setTwUrl(profile.twitter_url || '');
    setUpiVal(profile.upi_id || '');
    setLogoBase64(profile.logo_data || '');
    setBusinessType(profile.business_type === 'ecommerce' ? 'ecommerce' : 'services');
  }, [profile]);

  // Dropzone drag states
  const [dragArtifact, setDragArtifact] = useState(false);
  const [dragQR, setDragQR] = useState(false);
  const [dragLogo, setDragLogo] = useState(false);
  
  const [uploadingArtifact, setUploadingArtifact] = useState(false);
  const [uploadingQR, setUploadingQR] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Business calculations
  const totalProjects = projects.length;
  const paidProjects = projects.filter(p => p.is_paid);
  const unpaidProjects = projects.filter(p => !p.is_paid);
  
  const totalRevenue = paidProjects.reduce((acc, p) => acc + p.amount_due, 0);
  const pendingRevenue = unpaidProjects.reduce((acc, p) => acc + p.amount_due, 0);
  const successRate = totalProjects > 0 ? Math.round((paidProjects.length / totalProjects) * 100) : 0;

  // Add / Remove milestones locally inside form
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;
    setMilestones([...milestones, { task_title: newMilestoneTitle.trim(), is_completed: false }]);
    setNewMilestoneTitle('');
  };

  const handleRemoveMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const handleToggleFormMilestone = (index: number) => {
    setMilestones(milestones.map((m, i) => i === index ? { ...m, is_completed: !m.is_completed } : m));
  };

  // Deliverables file selection simulator
  const handleArtifactFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingArtifact(true);
      setTimeout(() => {
        setUploadedFile({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        });
        setUploadingArtifact(false);
      }, 500);
    }
  };

  // UPI QR Code Manual Upload handler (Reads image and converts to Base64 with compression)
  const handleQRFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingQR(true);
      
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImageBase64(reader.result as string);
        setQrCodeData(compressed);
        setQrCodeName(file.name);
        setUploadingQR(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Drag events for QR code image with compression
  const handleQRDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragQR(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        setUploadingQR(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressed = await compressImageBase64(reader.result as string);
          setQrCodeData(compressed);
          setQrCodeName(file.name);
          setUploadingQR(false);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Profile Agency logo upload with compression
  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingLogo(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImageBase64(reader.result as string);
        setLogoBase64(compressed);
        setUploadingLogo(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit profile edit handler
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    
    setTimeout(() => {
      onUpdateProfile({
        agency_name: agencyName.trim() || "Independent Workspace",
        freelancer_name: freelancerName.trim() || "Freelancer",
        role_title: roleTitle.trim() || "Fullstack Architect",
        bio: bioText.trim(),
        website_url: websiteUrl.trim(),
        github_url: gitUrl.trim() || undefined,
        twitter_url: twUrl.trim() || undefined,
        upi_id: upiVal.trim() || undefined,
        logo_data: logoBase64 || undefined,
        business_type: businessType,
        digital_store_installed: profile.digital_store_installed
      });
      setSavingProfile(false);
      setProfileSuccessMessage(true);
      setTimeout(() => setProfileSuccessMessage(false), 2500);
    }, 400);
  };

  // Submit Project Handler
  const handleSubmitProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !clientName.trim() || !amountDue) return;

    onCreateProject({
      client_name: clientName.trim(),
      project_name: projectName.trim(),
      amount_due: parseInt(amountDue) || 0,
      is_paid: false,
      file_name: uploadedFile?.name || 'deliverables_v1_package.zip',
      file_size: uploadedFile?.size || '14.8 MB',
      qr_code_data: qrCodeData || undefined, // custom base64 UPI image
      qr_code_name: qrCodeName || undefined,
      client_id: selectedClientId || undefined,
      milestones: milestones.map((m, i) => ({
        id: `m-${idx()}-${Date.now()}`,
        task_title: m.task_title,
        is_completed: m.is_completed
      }))
    });

    // Reset layout fields cleanly
    setClientName('');
    setSelectedClientId('');
    setProjectName('');
    setAmountDue('');
    setQrCodeData('');
    setQrCodeName('');
    setMilestones([
      { task_title: 'Approved High-Fidelity Design Package', is_completed: true },
      { task_title: 'Fully Responsive React Front-End Bundle', is_completed: false }
    ]);

    // Scroll slightly or notify
    setActiveTab('channels');
  };

  // Submit Client Handler
  const handleSubmitClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    if (editingClient) {
      onUpdateClient({
        ...editingClient,
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        company_name: newClientCompany.trim(),
        phone: newClientPhone.trim(),
        notes: newClientNotes.trim()
      });
      setEditingClient(null);
    } else {
      onAddClient({
        name: newClientName.trim(),
        email: newClientEmail.trim(),
        company_name: newClientCompany.trim(),
        phone: newClientPhone.trim(),
        notes: newClientNotes.trim()
      });
    }

    // Reset fields
    setNewClientName('');
    setNewClientEmail('');
    setNewClientCompany('');
    setNewClientPhone('');
    setNewClientNotes('');
  };

  const handleStartEditClient = (c: ClientRecord) => {
    setEditingClient(c);
    setNewClientName(c.name);
    setNewClientEmail(c.email || '');
    setNewClientCompany(c.company_name || '');
    setNewClientPhone(c.phone || '');
    setNewClientNotes(c.notes || '');
  };

  const handleCancelEditClient = () => {
    setEditingClient(null);
    setNewClientName('');
    setNewClientEmail('');
    setNewClientCompany('');
    setNewClientPhone('');
    setNewClientNotes('');
  };

  // Submit Invoice Handler
  const handleAddInvoiceItem = () => {
    if (!customItemDesc.trim() || !customItemRate) return;
    const item = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      description: customItemDesc.trim(),
      quantity: parseInt(customItemQty) || 1,
      rate: parseInt(customItemRate) || 0
    };
    setInvoiceItemsList([...invoiceItemsList, item]);
    setCustomItemDesc('');
    setCustomItemQty('1');
    setCustomItemRate('');
  };

  const handleRemoveInvoiceItem = (id: string) => {
    setInvoiceItemsList(invoiceItemsList.filter(item => item.id !== id));
  };

  const handleSubmitInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceItemsList.length === 0) {
      return;
    }

    // Find linked client details
    const selectedClientObj = clients.find(c => c.id === newInvClient);
    const resolvedClientName = selectedClientObj ? selectedClientObj.name : "Direct Custom Client";

    onAddInvoice({
      invoice_number: newInvNumber.trim(),
      client_id: newInvClient || undefined,
      client_name: resolvedClientName,
      project_id: newInvProject || undefined,
      issue_date: newInvIssueDate,
      due_date: newInvDueDate,
      items: invoiceItemsList,
      tax_rate: parseInt(newInvTaxRate) || 0,
      status: 'sent',
      notes: newInvNotes.trim()
    });

    // Reset invoice form
    setInvoiceItemsList([
      { id: "item-init", description: "Design Deliverable Milestone", quantity: 1, rate: 12000 }
    ]);
    setNewInvClient('');
    setNewInvProject('');
    setNewInvNotes('Payment settlements can be securely executed with the UPI scan code directly inside the channel.');
    
    // Increment Invoice Number automatically
    const nextIdx = invoices.length + 2; 
    setNewInvNumber(`INV-2026-${String(nextIdx).padStart(3, '0')}`);
  };

  const handleDownloadPDF = (inv: Invoice) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [28, 27, 24]; // charcoal #1c1b18
    const secondaryColor = [139, 114, 53]; // goldish-yellow #8b7235
    const lightGray = [245, 245, 240]; // warm background #f5f5f0
    const textDark = [40, 40, 40];
    const textGray = [120, 120, 120];

    const setFont = (style: 'normal' | 'bold' | 'italic', size: number) => {
      doc.setFont('helvetica', style || 'normal');
      doc.setFontSize(size);
    };

    const margin = 20;
    let currY = 20;

    // Header Title Area
    setFont('bold', 20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(profile.agency_name || "Independent Workspace Studio", margin, currY);
    currY += 6;

    setFont('normal', 10);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text(`${profile.freelancer_name || "Freelancer Workspace"} - ${profile.role_title || "Creative Professional"}`, margin, currY);
    currY += 5;

    if (profile.website_url) {
      setFont('normal', 9);
      doc.text(profile.website_url, margin, currY);
      currY += 5;
    }

    // Invoice badge / details (Right side of the top)
    setFont('bold', 12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(inv.invoice_number, 190, 20, { align: 'right' });

    setFont('normal', 9);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text(`Issue Date: ${inv.issue_date}`, 190, 26, { align: 'right' });
    doc.text(`Due Date: ${inv.due_date}`, 190, 31, { align: 'right' });
    
    // Status block
    setFont('bold', 9);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`STATUS: ${inv.status.toUpperCase()}`, 190, 37, { align: 'right' });

    currY = Math.max(currY, 45);

    // Divider line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, currY, 190, currY);
    currY += 10;

    // Billing split layout (Two columns)
    const rightColX = 110;

    // Col 1: Billed To
    setFont('bold', 9);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("BILLED TO CUSTOMER", margin, currY);
    currY += 5;

    setFont('bold', 11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(inv.client_name, margin, currY);
    currY += 5;

    const foundCli = clients.find(c => c.id === inv.client_id);
    setFont('normal', 9.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    if (foundCli) {
      if (foundCli.company_name) {
        doc.text(foundCli.company_name, margin, currY);
        currY += 4.5;
      }
      if (foundCli.email) {
        doc.text(`Email: ${foundCli.email}`, margin, currY);
        currY += 4.5;
      }
      if (foundCli.phone) {
        doc.text(`Phone: ${foundCli.phone}`, margin, currY);
        currY += 4.5;
      }
    } else {
      doc.text("Direct Custom Client Ledger", margin, currY);
      currY += 4.5;
    }

    // Reset Y for Column 2
    let rightY = currY - (foundCli ? (foundCli.company_name ? 14 : 9.5) : 5);
    setFont('bold', 9);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("SECURE SETTLEMENT", rightColX, rightY);
    rightY += 5;

    setFont('normal', 9.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text("Processed directly via standard UPI system.", rightColX, rightY);
    rightY += 4.5;

    if (profile.upi_id) {
      setFont('bold', 10);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(`VPA/UPI: ${profile.upi_id}`, rightColX, rightY);
    }

    currY = Math.max(currY, rightY) + 12;

    // Items table header
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.rect(margin, currY, 170, 8, 'F');
    
    setFont('bold', 8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text("DELIVERABLE DESCRIPTION", margin + 3, currY + 5.5);
    doc.text("QTY", 120, currY + 5.5, { align: 'center' });
    doc.text("UNIT RATE", 150, currY + 5.5, { align: 'right' });
    doc.text("TOTAL AMOUNT", 185, currY + 5.5, { align: 'right' });

    currY += 8;

    // Items table body
    setFont('normal', 9);
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.2);

    inv.items.forEach((item) => {
      // Draw bottom border
      doc.line(margin, currY + 8, 190, currY + 8);
      
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(item.description, margin + 3, currY + 5.5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(String(item.quantity), 120, currY + 5.5, { align: 'center' });
      doc.text(`INR ${item.rate.toLocaleString('en-IN')}`, 150, currY + 5.5, { align: 'right' });
      doc.text(`INR ${(item.quantity * item.rate).toLocaleString('en-IN')}`, 185, currY + 5.5, { align: 'right' });

      currY += 8;
    });

    currY += 5;

    // Totals Computation
    const itemsSum = inv.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
    const taxMultiplier = inv.tax_rate / 100;
    const taxAmount = itemsSum * taxMultiplier;
    const grandTotal = itemsSum + taxAmount;

    const totalXLabel = 145;
    const totalXVal = 185;

    setFont('normal', 9);
    doc.setTextColor(textGray[0], textGray[1], textGray[2]);
    doc.text("Subtotal Cost:", totalXLabel, currY, { align: 'right' });
    doc.text(`INR ${itemsSum.toLocaleString('en-IN')}`, totalXVal, currY, { align: 'right' });
    currY += 5;

    if (inv.tax_rate > 0) {
      doc.text(`Service GST (${inv.tax_rate}%):`, totalXLabel, currY, { align: 'right' });
      doc.text(`INR ${Math.round(taxAmount).toLocaleString('en-IN')}`, totalXVal, currY, { align: 'right' });
      currY += 5;
    }

    // Total line separation
    doc.setDrawColor(200, 200, 200);
    doc.line(125, currY, 190, currY);
    currY += 5;

    setFont('bold', 10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Total Settled Value:", totalXLabel, currY, { align: 'right' });
    doc.text(`INR ${Math.round(grandTotal).toLocaleString('en-IN')}`, totalXVal, currY, { align: 'right' });

    currY += 12;

    // Memo Notes
    if (inv.notes) {
      setFont('italic', 8);
      doc.setTextColor(textGray[0], textGray[1], textGray[2]);
      doc.text(`Memo Notes: ${inv.notes}`, margin, currY, { maxWidth: 170 });
    }

    // Footnotes: "Made and Generated by STACK"
    doc.setDrawColor(230, 230, 220);
    doc.line(margin, 275, 190, 275);
    
    setFont('bold', 9.5);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Made and Generated by STACK", 105, 283, { align: 'center' });

    // Save/Download triggers
    const filename_cleaned = inv.invoice_number.toLowerCase().replace(/[^a-z0-9]/g, '_');
    doc.save(`invoice_${filename_cleaned}.pdf`);
  };

  const idx = () => Math.floor(Math.random() * 9000);

  const handleCopyLink = (projectId: string) => {
    const secureUrl = `${appUrl}?portal=${projectId}`;
    navigator.clipboard.writeText(secureUrl).then(() => {
      setCopiedId(projectId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 text-neutral-800 font-sans pb-24 selection:bg-neutral-100 selection:text-neutral-900">
      
      {/* Upper Brand Header */}
      <header className="border-b border-stone-200/80 bg-white sticky top-0 z-30 px-6 py-4 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 flex items-center justify-center text-white shrink-0">
              <span className="font-display font-medium text-lg tracking-tight text-white">S</span>
            </div>
            <div>
              <h1 className="text-base font-bold font-display tracking-tight text-neutral-900 flex items-center gap-2">
                Stack <span className="text-[9px] bg-neutral-100 font-mono py-0.5 px-2 rounded-full font-bold text-neutral-500 border border-neutral-200/50">PRO REGISTRY</span>
              </h1>
              <p className="text-xs text-neutral-500">
                {profile.agency_name ? `${profile.agency_name} Workspace` : "Professional Freelance Agency Settlement Link Creator"}
              </p>
            </div>
          </div>

          {/* Setup Profile Status & Connection Mode */}
          <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end">
            
            {/* Real-time Tweak Mode Toggles */}
            <div className="flex bg-[#fdfaf2] p-0.5 rounded-xl border border-[#ebdcb9]/40 overflow-x-auto">
              <button
                onClick={() => setActiveTab('channels')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'channels' 
                    ? 'bg-[#1c1b18] text-[#faf9f6]' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Delivery Channels</span>
              </button>
              
              <button
                onClick={() => setActiveTab('clients')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'clients' 
                    ? 'bg-[#1c1b18] text-[#faf9f6]' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Customer Records</span>
              </button>

              <button
                onClick={() => setActiveTab('invoices')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'invoices' 
                    ? 'bg-[#1c1b18] text-[#faf9f6]' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Invoicing</span>
              </button>

              <button
                onClick={() => setActiveTab('studio')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  activeTab === 'studio' 
                    ? 'bg-[#1c1b18] text-[#faf9f6]' 
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Agency Studio Profile</span>
              </button>

              {profile.business_type === 'ecommerce' && (
                <button
                  onClick={() => setActiveTab('products' as any)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeTab === ('products' as any)
                      ? 'bg-[#1c1b18] text-[#faf9f6]' 
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>Digital Goods Store</span>
                  {!profile.digital_store_installed && (
                    <span className="text-[9px] bg-orange-100 text-orange-700 border border-orange-200/50 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold ml-1 animate-pulse">
                      Install
                    </span>
                  )}
                </button>
              )}
            </div>

            <div className="h-6 w-[1px] bg-stone-200 hidden sm:block" />

            {/* Sync Alert Badge */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-neutral-100 border border-neutral-200/80 px-3 py-1.5 rounded-full select-none">
                {isSyncing ? (
                  <RefreshCw className="w-3 h-3 text-neutral-600 animate-spin" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
                <span className="text-[10px] font-mono font-bold text-neutral-600 uppercase tracking-wide">
                  {isSyncing ? "Syncing" : "Cloud Active"}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-stone-100 border border-stone-200/65 px-3 py-1.5 rounded-full select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                <span className="text-[10px] font-mono font-bold text-neutral-500 uppercase tracking-wide">
                  Local Sandbox
                </span>
              </div>
            )}

            {/* Google Authentication Container */}
            {user ? (
              <div className="flex items-center gap-2 bg-stone-105 border border-stone-200 rounded-full pl-1.5 pr-2 py-1">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "Freelancer"} 
                    className="w-5.5 h-5.5 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-5.5 h-5.5 rounded-full bg-neutral-950 flex items-center justify-center text-white text-[10px] font-bold">
                    {user.displayName?.[0] || <User className="w-2.5 h-2.5" />}
                  </div>
                )}
                <span className="text-xs font-bold text-neutral-800 max-w-24 truncate hidden sm:inline">
                  {user.displayName}
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="p-1 text-stone-400 hover:text-stone-900 transition-colors"
                  title="Disconnect Workspace"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onSignInWithGoogle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-950 hover:bg-neutral-850 text-white font-semibold rounded-lg text-xs transition-transform hover:scale-102 cursor-pointer active:scale-98"
              >
                {/* Standard Google logo icon vector */}
                <svg className="w-3.5 h-3.5 text-white fill-current" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-semibold text-xs text-white">Google Dev Sign-In</span>
              </button>
            )}

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Business summary metrics cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Settled Income</span>
            <p className="text-2xl font-black text-neutral-900 mt-1 font-mono tracking-tight">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-emerald-600 font-medium block mt-1">✓ Instantly verified</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Awaiting Release</span>
            <p className="text-2xl font-black text-neutral-800 mt-1 font-mono tracking-tight">
              ₹{pendingRevenue.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-amber-600 font-medium block mt-1 font-sans">⌛ Locked behind files</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Active Deliveries</span>
            <p className="text-2xl font-black text-neutral-800 mt-1 font-mono tracking-tight">
              {unpaidProjects.length} <span className="text-xs text-neutral-400 font-normal">Pending</span>
            </p>
            <p className="text-[10px] text-neutral-400 block mt-1 font-sans">Real-time deep links ready</p>
          </div>

          <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-xs">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block">Agency Brand Verified</span>
            <p className="text-xl font-bold text-neutral-850 mt-1.5 truncate leading-none">
              {profile.agency_name || "Unset Studio"}
            </p>
            <span className="text-[10px] text-neutral-400 block mt-1.5 text-ellipsis overflow-hidden">
              {profile.website_url ? profile.website_url.replace(/(^\w+:|^)\/\//, '') : "Config profile in tab"}
            </span>
          </div>
        </section>

        {/* Dynamic Navigation Toggles rendering */}
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Channels listing and Creation Forms */}
          {activeTab === 'channels' && (
            <motion.div
              key="delivery-channels-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              
              {/* Deployment Panel - Left Column (5 out of 12) */}
              <section className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-2">
                    <Plus className="w-4 h-4 text-neutral-500" /> New Delivery Tunnel
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Constructs a secure payment-locked gateway mapped dynamically to your agency profile.
                  </p>
                </div>

                <form onSubmit={handleSubmitProject} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                          Client Selection
                        </label>
                        <span className="text-[9px] text-[#8b7235] font-mono">Linked to Customer Records</span>
                      </div>
                      
                      <div className="space-y-2">
                        <select
                          value={selectedClientId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setSelectedClientId(id);
                            if (id) {
                              const found = clients.find(c => c.id === id);
                              if (found) {
                                setClientName(found.name);
                              }
                            } else {
                              setClientName('');
                            }
                          }}
                          className="w-full bg-stone-50 border border-stone-200 text-neutral-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:outline-none transition-all"
                        >
                          <option value="">-- Custom/New Client --</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.company_name ? `(${c.company_name})` : ''}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          required
                          placeholder="Or type custom direct client name..."
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 text-neutral-800 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:border-neutral-500 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Deliverable Target Scope
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Website Overhaul Figma v2"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 text-neutral-800 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:border-neutral-500 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Amount and Price (₹ INR)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">₹</span>
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Amount in Rupee, e.g. 24000"
                          value={amountDue}
                          onChange={(e) => setAmountDue(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 text-neutral-900 placeholder-stone-400 rounded-lg pl-7 pr-3 py-2 text-xs font-mono focus:ring-1 focus:ring-neutral-700 focus:border-neutral-500 focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Manual UPI QR Code Selection */}
                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1 flex items-center justify-between">
                      <span>Step 1: Your UPI QR Code</span>
                      <span className="text-[9px] text-neutral-400 font-normal">Direct payment scan asset</span>
                    </label>

                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragQR(true); }}
                      onDragLeave={() => setDragQR(false)}
                      onDrop={handleQRDrop}
                      onClick={() => qrInputRef.current?.click()}
                      className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                        dragQR 
                          ? 'border-neutral-950 bg-stone-100' 
                          : qrCodeData 
                            ? 'border-emerald-500/30 bg-emerald-50/10' 
                            : 'border-stone-200 bg-stone-50 hover:bg-stone-100/40'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={qrInputRef}
                        accept="image/*"
                        onChange={handleQRFileChange}
                        className="hidden" 
                      />

                      {uploadingQR ? (
                        <div className="py-2">
                          <RefreshCw className="w-4 h-4 text-neutral-500 animate-spin mx-auto mb-1" />
                          <p className="text-[10px] text-neutral-500">Processing file...</p>
                        </div>
                      ) : qrCodeData ? (
                        <div className="flex items-center justify-center gap-3 py-1">
                          <img 
                            src={qrCodeData} 
                            alt="Uploaded QR Code Preview" 
                            className="w-9 h-9 object-contain rounded border border-neutral-200 bg-white" 
                          />
                          <div className="text-left min-w-0">
                            <p className="text-[11px] font-bold text-neutral-800 truncate block max-w-44">
                              {qrCodeName || "uploaded_qr_logo.png"}
                            </p>
                            <span className="text-[9px] text-emerald-600 font-semibold block">✓ Code stored directly</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-1">
                          <QrCode className="w-5 h-5 text-neutral-405 mx-auto mb-1" />
                          <p className="text-[11px] font-medium text-neutral-600">Upload GPay / PhonePe / paytm QR image</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Deliverables file package upload */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                      Step 2: Restricted File Delivery Package (Released on Checkout)
                    </label>

                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragArtifact(true); }}
                      onDragLeave={() => setDragArtifact(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragArtifact(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          setUploadingArtifact(true);
                          setTimeout(() => {
                            setUploadedFile({ name: file.name, size: `${(file.size / (1024 * 1024)).toFixed(1)} MB` });
                            setUploadingArtifact(false);
                          }, 500);
                        }
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                        dragArtifact 
                          ? 'border-neutral-950 bg-stone-100' 
                          : uploadedFile 
                            ? 'border-stone-200 bg-stone-50 hover:bg-stone-100/40' 
                            : 'border-stone-200 bg-stone-50'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleArtifactFileChange}
                        className="hidden" 
                      />

                      {uploadingArtifact ? (
                        <div className="py-2">
                          <RefreshCw className="w-4 h-4 text-neutral-500 animate-spin mx-auto mb-1" />
                        </div>
                      ) : uploadedFile ? (
                        <div className="flex items-center justify-center gap-2">
                          <FileCheck className="w-4 h-4 text-neutral-700 shrink-0" />
                          <div className="text-left min-w-0">
                            <span className="text-[11px] font-bold text-neutral-700 truncate block max-w-44">{uploadedFile.name}</span>
                            <span className="text-[9px] font-mono text-neutral-400 block mt-0.5">Size: {uploadedFile.size} • Click to replace</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <Upload className="w-5 h-5 text-neutral-400 mx-auto mb-1" />
                          <p className="text-[11px] font-medium text-neutral-600">Select source files (.zip, .pdf, .tar)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Milestones Checklist setup */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                      Step 3: Milestone Checklist
                    </label>

                    <div className="border border-stone-200 rounded-lg p-2.5 bg-stone-50/50">
                      <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                        {milestones.map((milestone, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-2 p-1.5 bg-white border border-stone-200/60 rounded-md">
                            <div className="flex items-center gap-2 min-w-0 font-sans">
                              <button
                                type="button"
                                onClick={() => handleToggleFormMilestone(idx)}
                                className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                  milestone.is_completed 
                                    ? 'bg-neutral-850 border-neutral-850 text-white' 
                                    : 'border-stone-300'
                                }`}
                              >
                                {milestone.is_completed && <Check className="w-2.5 h-2.5 stroke-[3.5] text-white" />}
                              </button>
                              <span className={`text-[10.5px] truncate ${
                                milestone.is_completed ? 'text-stone-400 line-through' : 'text-stone-700 font-medium'
                              }`}>
                                {milestone.task_title}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMilestone(idx)}
                              className="text-stone-400 hover:text-stone-700 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-stone-200/60">
                        <input
                          type="text"
                          placeholder="Add milestone requirement..."
                          value={newMilestoneTitle}
                          onChange={(e) => setNewMilestoneTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddMilestone(e);
                            }
                          }}
                          className="flex-1 bg-white border border-stone-200 rounded-md px-2 py-1 text-[10px] text-neutral-800 placeholder-stone-400 focus:outline-none focus:border-neutral-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddMilestone}
                          className="bg-neutral-900 text-white p-1 rounded-md text-xs hover:bg-neutral-800"
                        >
                          <Plus className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Create tunnel trigger */}
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-transform hover:scale-[1.01] hover:bg-neutral-800 active:scale-98 shadow-sm cursor-pointer mt-4"
                  >
                    Deploy Payment Lock Tunnel
                  </button>
                </form>
              </section>

              {/* Project channels listing - Right Column (7 out of 12) */}
              <section className="lg:col-span-7 space-y-6">
                
                {/* Embedded dynamic list */}
                <div className="bg-white border border-stone-200/80 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-neutral-500" />
                      <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-widest">Active Channels</h3>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400 bg-stone-50 px-2 py-0.5 rounded border border-stone-200/65">
                      {projects.length} Total Ports
                    </span>
                  </div>

                  <div className="space-y-4">
                    {projects.length === 0 ? (
                      <div className="text-center py-16 border border-dashed border-stone-205 rounded-xl bg-stone-50/20">
                        <FolderOpen className="w-6 h-6 text-stone-300 mx-auto mb-2" />
                        <span className="text-xs font-semibold text-neutral-500 block">No active links ready</span>
                        <p className="text-[10px] text-neutral-400 max-w-sm mx-auto mt-1 px-4 leading-relaxed">
                          Your creative assets will be encrypted and locked safely. Generate a new portal channel and copy the link for your client.
                        </p>
                      </div>
                    ) : (
                      projects.map((proj) => {
                        const completedCount = proj.milestones.filter(m => m.is_completed).length;
                        const totalCount = proj.milestones.length;

                        // Identify linked profile settings
                        const activeBrandName = proj.agency_profile?.agency_name || profile.agency_name || "Vertex Design Studio";

                        return (
                          <div 
                            key={proj.id}
                            className={`border rounded-xl p-4 transition-all duration-300 bg-white relative ${
                              proj.is_paid 
                                ? 'border-emerald-250 hover:bg-emerald-50/5' 
                                : 'border-stone-200/95 hover:border-stone-300'
                            }`}
                          >
                            {/* Accent indicator */}
                            <div className={`absolute top-0 bottom-0 left-0 w-[4.5px] rounded-l-md ${
                              proj.is_paid ? 'bg-emerald-500' : 'bg-neutral-300'
                            }`} />

                            <div className="pl-2">
                              
                              {/* Port top level header */}
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  <span 
                                    onClick={() => onSelectProject(proj.id)}
                                    className="text-xs font-extrabold text-neutral-900 hover:underline cursor-pointer font-mono"
                                  >
                                    SL-{proj.id.substring(0, 5).toUpperCase()}
                                  </span>
                                  <span className="text-stone-300 font-mono text-[9px]">•</span>
                                  <span className="text-[10.5px] font-medium text-stone-500 truncate max-w-44">
                                    client: {proj.client_name}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="text-[8.5px] font-mono text-stone-400 mr-1.5">
                                    Branded: {activeBrandName}
                                  </div>
                                  
                                  <button
                                    type="button"
                                    onClick={() => onTogglePaid(proj.id)}
                                    className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded transition-all border ${
                                      proj.is_paid 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                        : 'bg-stone-50 border-stone-200 text-stone-500 hover:bg-stone-100'
                                    }`}
                                  >
                                    {proj.is_paid ? "🔓 Unlocked" : "🔒 Manual-Lock"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => onDeleteProject(proj.id)}
                                    className="text-stone-400 hover:text-stone-900 p-0.5 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Port specific values summary */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-y border-stone-100 py-3 my-3">
                                <div>
                                  <h4 className="text-[11.5px] font-bold text-stone-850 uppercase tracking-tight font-display">{proj.project_name}</h4>
                                  <p className="text-[10px] text-stone-450 mt-0.5 font-mono">
                                    Files: {proj.file_name} ({proj.file_size})
                                  </p>
                                </div>

                                <div className="flex items-center gap-4">
                                  <div>
                                    <span className="text-[9px] text-stone-400 block uppercase tracking-wider font-bold leading-none mb-0.5">Price Due</span>
                                    <span className="text-sm font-black text-neutral-900 font-mono">
                                      ₹{proj.amount_due.toLocaleString('en-IN')}
                                    </span>
                                  </div>

                                  <div className="h-6 w-[1.5px] bg-stone-100 hidden sm:block" />

                                  <div>
                                    <span className="text-[9px] text-stone-400 block uppercase tracking-wider font-bold leading-none mb-0.5">Milestone status</span>
                                    <span className="text-xs text-neutral-700 font-bold font-mono">
                                      {completedCount} / {totalCount} Completed
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Interactive checkout action handles */}
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50/50 p-1.5 rounded-lg border border-stone-100 mt-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(proj.id)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-[10px] font-bold text-neutral-700 rounded-md transition-all shrink-0 cursor-pointer"
                                >
                                  {copiedId === proj.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                                      <span className="text-emerald-700 font-bold">Client Link Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy Client Portal Link</span>
                                    </>
                                  )}
                                </button>

                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => onSelectProject(proj.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg text-[10px] transition-transform cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5 text-white" /> View Portal Inline
                                  </button>

                                  <a
                                    href={`${appUrl}?portal=${proj.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 border border-stone-200 bg-white hover:bg-stone-100 rounded-md text-stone-500 hover:text-stone-900 shrink-0"
                                    title="Open new sandbox client tab"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>

                              {/* Milestones dynamic quick toggle checkboxes on active channels */}
                              {proj.milestones.length > 0 && (
                                <div className="mt-3.5 pt-3 border-t border-stone-100">
                                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest block mb-1.5">Freelancer Control: Checkoff Milestones to Update Client Portal</span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {proj.milestones.map((m) => (
                                      <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => onToggleMilestone(proj.id, m.id)}
                                        className={`flex items-center gap-2 p-1.5 rounded-lg border text-left transition-all ${
                                          m.is_completed 
                                            ? 'bg-emerald-50/15 border-emerald-100 text-neutral-600' 
                                            : 'bg-white border-stone-200 text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                                        }`}
                                      >
                                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                                          m.is_completed 
                                            ? 'bg-neutral-850 border-neutral-850 text-white' 
                                            : 'border-stone-300'
                                        }`}>
                                          {m.is_completed && <Check className="w-2.5 h-2.5 stroke-[3.5] text-white" />}
                                        </div>
                                        <span className="text-[10px] truncate">{m.task_title}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Secure instructions guide */}
                <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs space-y-3.5">
                  <h4 className="text-[11.5px] font-bold text-neutral-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Dynamic Workspace Instructions
                  </h4>
                  <ul className="text-xs text-stone-500 space-y-2 list-disc pl-4 leading-relaxed font-sans">
                    <li>
                      <strong className="text-neutral-800">Dynamic Branded Metadata:</strong> Deliverables take on whichever configuration is currently saved inside your <span className="underline font-bold text-neutral-700">Agency Studio Profile</span> tab.
                    </li>
                    <li>
                      <strong className="text-neutral-800">Manual Direct QR scan:</strong> Set custom Base64 GPay or GPay images. It disables unrequested complex checkout APIs and gives clients a clear, zero-commision way to pay you.
                    </li>
                  </ul>
                </div>
              </section>

            </motion.div>
          )}

          {/* TAB: Customer Records (clients) */}
          {activeTab === 'clients' && (
            <motion.div
              key="customer-records-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Client Form (Left 5 column) */}
              <section className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs animate-fade-in">
                <div className="mb-6 flex justify-between items-center">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      {editingClient ? 'Modify Client Record' : 'Record New Customer'}
                    </h2>
                    <p className="text-xs text-neutral-450 mt-1">
                      {editingClient ? 'Updating database representation inline.' : 'Add new customer references to your secure business ledger.'}
                    </p>
                  </div>
                  {editingClient && (
                    <button
                      onClick={handleCancelEditClient}
                      className="px-2.5 py-1 text-[10px] font-bold text-red-600 border border-red-200 hover:bg-red-50 rounded-md cursor-pointer"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmitClient} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                      Client / Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Corporation Pvt Ltd"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 text-neutral-800 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:border-neutral-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Primary Email
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. accounts@acme.com"
                        value={newClientEmail}
                        onChange={(e) => setNewClientEmail(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 text-neutral-800 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:border-neutral-500 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Phone Contact
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +91 98765 43210"
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 text-neutral-800 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:border-neutral-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                      Business Niche/Company Segment
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Venture FinTech Incubator"
                      value={newClientCompany}
                      onChange={(e) => setNewClientCompany(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 text-neutral-800 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:border-neutral-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                      Internal Notes / Deal Context
                    </label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Sourced via Twitter DMs. Processed upfront payment. Deliverables locked in secure gateway."
                      value={newClientNotes}
                      onChange={(e) => setNewClientNotes(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 text-neutral-850 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:border-neutral-500 focus:outline-none transition-all font-sans resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-xs font-display"
                  >
                    {editingClient ? 'Apply Changes to Record' : 'Save Client to Ledger'}
                  </button>
                </form>
              </section>

              {/* Client List Ledger (Right 7 column) */}
              <section className="lg:col-span-7 space-y-4">
                <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-neutral-950 uppercase tracking-wider font-display">Active Customer Directory ({clients.length})</h3>
                    <span className="text-[10px] text-stone-400 font-mono">Verified Records Ledger</span>
                  </div>

                  {clients.length === 0 ? (
                    <div className="py-12 text-center text-stone-450 border border-dashed border-stone-200 rounded-xl">
                      <Users className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      <p className="text-xs font-semibold">No registered client records found.</p>
                      <p className="text-[10px] mt-1 text-slate-400 font-mono">Create custom client references to populate connection dropdowns.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clients.map((c) => {
                        const relatedProjects = projects.filter(p => p.client_id === c.id);
                        const relatedInvoices = invoices.filter(i => i.client_id === c.id);

                        return (
                          <div key={c.id} className="p-4 rounded-xl border border-stone-200 bg-stone-50/40 hover:bg-stone-50/80 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-1 select-text">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-xs text-neutral-900 font-display">{c.name}</h4>
                                {c.company_name && (
                                  <span className="text-[9px] bg-blue-50 border border-blue-100 text-blue-700 font-mono font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight">
                                    {c.company_name}
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-[11px] text-stone-500 space-y-0.5">
                                {c.email && <p>Email: <span className="text-neutral-700 underline">{c.email}</span></p>}
                                {c.phone && <p>Phone: <span className="text-neutral-700 font-mono">{c.phone}</span></p>}
                                <p className="text-[9px] text-stone-400 font-mono">
                                  Registry Date: {new Date(c.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              </div>

                              {c.notes && (
                                <div className="mt-2 text-[10px] text-[#8b7235] bg-[#fdfaf2] border border-[#fdfaf2]/90 p-2.5 rounded-lg italic">
                                  "{c.notes}"
                                </div>
                              )}

                              <div className="flex flex-wrap gap-1.5 pt-2">
                                <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-100/60 font-mono px-2 py-0.5 rounded-md font-medium">
                                  {relatedProjects.length} Active Gates
                                </span>
                                <span className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-100/60 font-mono px-2 py-0.5 rounded-md font-medium">
                                  {relatedInvoices.length} Invoices Built
                                </span>
                              </div>
                            </div>

                            <div className="flex sm:flex-col justify-end gap-2 shrink-0">
                              <button
                                onClick={() => handleStartEditClient(c)}
                                className="px-2.5 py-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-all border border-indigo-100 cursor-pointer text-center"
                              >
                                Edit Record
                              </button>
                              <button
                                onClick={() => onDeleteClient(c.id)}
                                className="px-2.5 py-1 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-all border border-red-100 cursor-pointer text-center"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            </motion.div>
          )}

          {/* TAB: Invoicing (invoices) */}
          {activeTab === 'invoices' && (
            <motion.div
              key="invoicing-records-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-fade-in">
                {(() => {
                  const paidInvoices = invoices.filter(i => i.status === 'paid');
                  const pendingInvoices = invoices.filter(i => i.status === 'sent');
                  const draftInvoices = invoices.filter(i => i.status === 'draft');

                  const calcTotal = (invList: typeof invoices) => 
                    invList.reduce((acc, current) => {
                      const itemsSum = current.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
                      const taxMultiplier = 1 + (current.tax_rate / 100);
                      return acc + (itemsSum * taxMultiplier);
                    }, 0);

                  const earned = calcTotal(paidInvoices);
                  const pending = calcTotal(pendingInvoices);
                  const draft = calcTotal(draftInvoices);
                  const totalBilled = earned + pending;

                  return (
                    <>
                      <div className="bg-white border border-stone-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-[9px] font-mono text-stone-400 block uppercase tracking-wider font-bold">Total Settled</span>
                          <span className="text-base font-black text-emerald-700 font-mono">₹{Math.round(earned).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">✓</div>
                      </div>

                      <div className="bg-white border border-stone-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-[9px] font-mono text-stone-400 block uppercase tracking-wider font-bold">Awaiting Verification</span>
                          <span className="text-base font-black text-amber-700 font-mono">₹{Math.round(pending).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">⏰</div>
                      </div>

                      <div className="bg-white border border-stone-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-[9px] font-mono text-stone-400 block uppercase tracking-wider font-bold">Draft Proposals</span>
                          <span className="text-base font-black text-stone-600 font-mono">₹{Math.round(draft).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center font-bold text-xs">✎</div>
                      </div>

                      <div className="bg-indigo-950/5 border border-indigo-100 p-4 rounded-xl flex items-center justify-between shadow-xs">
                        <div>
                          <span className="text-[9px] font-mono text-indigo-800/65 block uppercase tracking-wider font-bold">Combined Ledger</span>
                          <span className="text-base font-black text-indigo-950 font-mono">₹{Math.round(totalBilled).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">₹</div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Create Invoice Form (Left 5 column) */}
                <section className="lg:col-span-5 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs animate-fade-in">
                  <div className="mb-6">
                    <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-2 font-display">
                      <Receipt className="w-4 h-4 text-emerald-600 shrink-0" />
                      Invoice Editor
                    </h2>
                    <p className="text-xs text-neutral-450 mt-1">
                      Draft a professional, itemized bill and attach it directly to payment checkouts.
                    </p>
                  </div>

                  <form onSubmit={handleSubmitInvoice} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Invoice Number
                        </label>
                        <input
                          type="text"
                          required
                          value={newInvNumber}
                          onChange={(e) => setNewInvNumber(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 text-neutral-805 font-mono rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Tax Rate (GST %)
                        </label>
                        <select
                          value={newInvTaxRate}
                          onChange={(e) => setNewInvTaxRate(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 text-neutral-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:outline-none transition-all"
                        >
                          <option value="0">0% Excluded</option>
                          <option value="5">5% SGST + CGST</option>
                          <option value="12">12% Service GST</option>
                          <option value="18">18% Standard GST</option>
                          <option value="28">28% Premium GST</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Select Client
                        </label>
                        <select
                          required
                          value={newInvClient}
                          onChange={(e) => setNewInvClient(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 text-neutral-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:outline-none transition-all"
                        >
                          <option value="">-- Choose Customer --</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Secure Link Gate
                        </label>
                        <select
                          value={newInvProject}
                          onChange={(e) => setNewInvProject(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 text-neutral-850 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:outline-none transition-all"
                        >
                          <option value="">-- Direct Pro (No Lock) --</option>
                          {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.project_name} (₹{p.amount_due.toLocaleString()})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Issue Date
                        </label>
                        <input
                          type="date"
                          required
                          value={newInvIssueDate}
                          onChange={(e) => setNewInvIssueDate(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 text-neutral-850 font-mono rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:outline-none transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Due Date
                        </label>
                        <input
                          type="date"
                          required
                          value={newInvDueDate}
                          onChange={(e) => setNewInvDueDate(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 text-neutral-850 font-mono rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Invoice Itemized Core Builder block */}
                    <div className="border border-stone-200 rounded-xl p-3 bg-stone-50/50 space-y-3">
                      <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-wider block">Line Item Submodules</span>
                      
                      <div className="space-y-2">
                        {invoiceItemsList.map((item) => (
                          <div key={item.id} className="flex justify-between items-center gap-2 text-xs bg-white p-2.5 rounded-lg border border-stone-200">
                            <div className="flex-1 truncate">
                              <p className="font-bold text-[11px] text-neutral-850 truncate">{item.description}</p>
                              <p className="text-[10px] text-stone-400 font-mono">
                                Qty: {item.quantity} × ₹{item.rate.toLocaleString('en-IN')}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[11px] text-slate-800">
                                ₹{(item.quantity * item.rate).toLocaleString('en-IN')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveInvoiceItem(item.id)}
                                className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer font-bold shrink-0"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add new Item inline widgets */}
                      <div className="space-y-2 pt-2 border-t border-dashed border-stone-250">
                        <input
                          type="text"
                          placeholder="Milestone description..."
                          value={customItemDesc}
                          onChange={(e) => setCustomItemDesc(e.target.value)}
                          className="w-full bg-white border border-stone-200 text-neutral-800 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:outline-none transition-all"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="Quantity"
                            value={customItemQty}
                            onChange={(e) => setCustomItemQty(e.target.value)}
                            className="bg-white border border-stone-200 text-neutral-800 rounded-lg px-4 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:outline-none transition-all font-sans"
                          />
                          <input
                            type="number"
                            placeholder="Rate (₹)"
                            value={customItemRate}
                            onChange={(e) => setCustomItemRate(e.target.value)}
                            className="bg-white border border-stone-200 text-neutral-850 font-mono rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:outline-none transition-all"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddInvoiceItem}
                          className="w-full py-1.5 bg-blue-50 border border-blue-100 hover:bg-blue-100/60 text-blue-700 font-bold text-[10px] uppercase tracking-wider rounded-lg transition-all cursor-pointer font-display"
                        >
                          + Add Line Item
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Memo Note terms
                      </label>
                      <input
                        type="text"
                        value={newInvNotes}
                        onChange={(e) => setNewInvNotes(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 text-neutral-800 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-neutral-700 focus:outline-none transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={invoiceItemsList.length === 0}
                      className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-850 disabled:bg-stone-300 disabled:cursor-not-allowed text-white font-bold text-[11px] uppercase tracking-wider rounded-lg transition-all active:scale-98 cursor-pointer shadow-xs font-display"
                    >
                      Issue Cryptographic Invoice
                    </button>
                  </form>
                </section>

                {/* Invoices List / Ledger (Right 7 column) */}
                <section className="lg:col-span-7 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs animate-fade-in">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold text-neutral-950 uppercase tracking-wider font-display">Invoices Ledger Registry ({invoices.length})</h3>
                    <span className="text-[10px] text-stone-400 font-mono">Billed Transactions Logs</span>
                  </div>

                  {invoices.length === 0 ? (
                    <div className="py-12 text-center text-stone-450 border border-dashed border-stone-200 rounded-xl">
                      <Receipt className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                      <p className="text-xs font-semibold">No registered invoices available.</p>
                      <p className="text-[10px] mt-1 text-slate-400">Generate your first ledger item using the form panel.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-neutral-805">
                        <thead>
                          <tr className="border-b border-stone-150 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-stone-50/40">
                            <th className="py-3 px-2">Invoice Id</th>
                            <th className="py-3">Client Destination</th>
                            <th className="py-3 text-right">Sum Billed</th>
                            <th className="py-3 text-center">Status</th>
                            <th className="py-3 text-right pr-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-105 font-sans whitespace-nowrap">
                          {invoices.map((inv) => {
                            const subtotal = inv.items.reduce((sum, x) => sum + (x.quantity * x.rate), 0);
                            const finalBilledTotal = subtotal * (1 + (inv.tax_rate / 100));

                            return (
                              <tr key={inv.id} className="hover:bg-stone-50/50 transition-colors">
                                <td className="py-3.5 px-2 font-mono font-bold text-indigo-700">
                                  {inv.invoice_number}
                                </td>
                                <td className="py-3.5">
                                  <p className="font-bold text-xs text-neutral-900 truncate max-w-[130px] font-display">{inv.client_name}</p>
                                  <p className="text-[9px] text-stone-400 font-mono">Due Link: {inv.due_date}</p>
                                </td>
                                <td className="py-3.5 text-right font-mono font-bold text-neutral-850">
                                  ₹{Math.round(finalBilledTotal).toLocaleString('en-IN')}
                                </td>
                                <td className="py-3.5 text-center">
                                  <select
                                    value={inv.status}
                                    onChange={(e) => onUpdateInvoiceStatus(inv.id, e.target.value as Invoice['status'])}
                                    className={`text-[9.5px] font-bold py-1 px-2.5 rounded-full border cursor-pointer inline-block focus:outline-none transition-all leading-none ${
                                      inv.status === 'paid' 
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                        : inv.status === 'sent' 
                                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                        : 'bg-stone-100 text-stone-600 border-stone-200'
                                    }`}
                                  >
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="paid">Paid</option>
                                  </select>
                                </td>
                                <td className="py-3.5 text-right pr-2 space-x-1">
                                  <button
                                    onClick={() => setSelectedInvoice(inv)}
                                    className="p-1 px-2 text-[10px] font-bold text-neutral-700 bg-stone-100 hover:bg-stone-200 rounded-md transition-all inline-flex items-center gap-1 cursor-pointer font-display"
                                  >
                                    <Printer className="w-3 h-3 text-stone-500" /> Receipt
                                  </button>
                                  <button
                                    onClick={() => onDeleteInvoice(inv.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-all cursor-pointer inline-block"
                                    title="Delete invoice"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === ('products' as any) && (
            <motion.div
              key="products-setup-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              {!profile.digital_store_installed ? (
                <DigitalStoreInstaller profile={profile} onUpdateProfile={onUpdateProfile} />
              ) : (
                <ProductsTab clients={clients} onCreateProject={onCreateProject} />
              )}
            </motion.div>
          )}

          {/* TAB 2: Agency Studio Profile setup with beautiful live Mockup */}
          {activeTab === 'studio' && (
            <motion.div
              key="agency-studio-setup-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              
              {/* Profile Config Form (Left 6 column structure) */}
              <section className="lg:col-span-6 bg-white border border-stone-200 rounded-2xl p-6 shadow-xs">
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-2">
                    <Building className="w-4 h-4 text-neutral-600" /> Agency & Freelancer Profile Setup
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    Represent your brand cleanly. Changes here are populated on any newly generated client portals in real-time.
                  </p>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  
                  {/* Agency and Name details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Freelance Agency / Studio Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Vertex Design Studio"
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 text-neutral-850 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-200 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Lead Freelancer / Owner Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Dishant"
                        value={freelancerName}
                        onChange={(e) => setFreelancerName(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 text-neutral-850 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-200 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Business Model / Channel niche selection */}
                  <div className="bg-amber-50/25 border border-amber-100 p-3 rounded-lg">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                      Workspace Niche & Delivery Model
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value as any)}
                      className="w-full bg-white border border-stone-200 text-neutral-850 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 transition-all font-medium cursor-pointer"
                    >
                      <option value="services">🛠️ Online Services & Consulting</option>
                      <option value="ecommerce">📦 E-Commerce Merchant Store (Digital Goods)</option>
                    </select>
                    <p className="text-[9.5px] text-[#8b7235] mt-1 leading-normal font-medium">
                      Select 'E-Commerce' to activate the option to install and run your direct-checkout Digital Goods Catalog.
                    </p>
                  </div>

                  {/* Role and credentials */}
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Role Position / Expertise
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Senior Frontend Architect & Motion Specialist"
                        value={roleTitle}
                        onChange={(e) => setRoleTitle(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 text-neutral-850 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-200 transition-all font-medium"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Agency Bio / Core Mission
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Explain your services, work speed, and direct payment clearance rules clearly to clients viewing the portal."
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 text-neutral-855 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-200 transition-all font-medium leading-relaxed resize-none"
                      />
                    </div>
                  </div>

                  {/* Portfolio Website and Social urls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                        Portfolio / Website URL
                      </label>
                      <div className="relative">
                        <Globe className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="url"
                          required
                          placeholder="https://vertexdesign.io"
                          value={websiteUrl}
                          onChange={(e) => setWebsiteUrl(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 text-neutral-850 placeholder-slate-400 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-stone-200 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1 flex items-center justify-between">
                        <span>Direct VPA UPI ID <span className="text-stone-400 font-normal">(Optional)</span></span>
                        <span className="text-[8.5px] bg-amber-50 text-amber-600 font-bold px-1.5 rounded">Used for auto links</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. username@upi"
                        value={upiVal}
                        onChange={(e) => setUpiVal(e.target.value)}
                        className="w-full bg-stone-50 border border-stone-200 text-neutral-850 placeholder-stone-450 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-200 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* Social media connections */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-wider block mb-1">
                        GitHub Profile Link
                      </label>
                      <div className="relative">
                        <Github className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="url"
                          placeholder="https://github.com/leadgithub"
                          value={gitUrl}
                          onChange={(e) => setGitUrl(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 text-neutral-850 placeholder-slate-350 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-stone-200 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-neutral-550 uppercase tracking-wider block mb-1">
                        Twitter / X Handle Link
                      </label>
                      <div className="relative">
                        <Twitter className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="url"
                          placeholder="https://twitter.com/leadtweet"
                          value={twUrl}
                          onChange={(e) => setTwUrl(e.target.value)}
                          className="w-full bg-stone-50 border border-stone-200 text-neutral-850 placeholder-slate-350 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-stone-200 transition-all font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Agency mini logo image upload option */}
                  <div className="pt-2">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                      Agency Studio Logo Image
                    </label>
                    
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragLogo(true); }}
                      onDragLeave={() => setDragLogo(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragLogo(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          const file = e.dataTransfer.files[0];
                          if (file.type.startsWith('image/')) {
                            setUploadingLogo(true);
                            const reader = new FileReader();
                            reader.onloadend = async () => {
                              const compressed = await compressImageBase64(reader.result as string);
                              setLogoBase64(compressed);
                              setUploadingLogo(false);
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                      onClick={() => logoInputRef.current?.click()}
                      className={`border border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
                        dragLogo 
                          ? 'border-neutral-900 bg-stone-100' 
                          : logoBase64 
                            ? 'border-emerald-500/30 bg-emerald-50/5' 
                            : 'border-stone-205 bg-stone-50'
                      }`}
                    >
                      <input 
                        type="file" 
                        ref={logoInputRef}
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="hidden" 
                      />

                      {uploadingLogo ? (
                        <RefreshCw className="w-4 h-4 text-neutral-500 animate-spin mx-auto" />
                      ) : logoBase64 ? (
                        <div className="flex items-center justify-center gap-3 py-1">
                          <img 
                            src={logoBase64} 
                            alt="Agency Brand Logo" 
                            className="w-8 h-8 object-cover rounded-md border border-neutral-200 bg-white" 
                          />
                          <div className="text-left">
                            <span className="text-xs font-bold text-neutral-805 block">Branding Identity Verified</span>
                            <span className="text-[10px] text-neutral-450 block font-mono">Click to upload alternative logo</span>
                          </div>
                          {logoBase64 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLogoBase64('');
                              }}
                              className="text-stone-400 hover:text-stone-705 text-[10px] font-bold px-2 py-0.5 rounded border border-stone-205 bg-white hover:bg-stone-50 ml-auto"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="py-1">
                          <p className="text-xs font-medium text-neutral-600">Select agency icon / personal avatar image</p>
                          <p className="text-[9.5px] text-neutral-400 mt-0.5">Visually rendered top-center inside client portals</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save trigger button */}
                  <div className="flex items-center gap-3 pt-4 border-t border-stone-100">
                    <button
                      type="submit"
                      disabled={savingProfile}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:bg-neutral-400 text-white font-bold rounded-lg text-xs tracking-wider uppercase transition-transform hover:scale-102 cursor-pointer shadow-sm active:scale-98"
                    >
                      {savingProfile ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Studio Profile</span>
                    </button>

                    <AnimatePresence>
                      {profileSuccessMessage && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-xs text-emerald-600 font-bold font-sans"
                        >
                          ✓ Studio Profile updated successfully!
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>

                </form>
              </section>

              {/* LIVE VIEWER PREVIEW - Right Column (6 out of 12) */}
              <section className="lg:col-span-6 space-y-6">
                
                {/* Visual Label Banner */}
                <div>
                  <span className="text-[9.5px] font-bold text-neutral-450 uppercase tracking-widest block mb-1">
                    LIVE CLIENT VIEW SIMULATOR
                  </span>
                  <h3 className="text-xs text-neutral-500">
                    This is an interactive mockup of how clients view your agency card block inside their delivery portal.
                  </h3>
                </div>

                {/* Simulated Portal Display */}
                <div className="bg-stone-100/70 border border-stone-200/90 rounded-2xl p-6 shadow-inner relative flex flex-col justify-center">
                  
                  {/* Mockup Frame indicator lines */}
                  <div className="absolute top-2.5 right-3 flex items-center gap-1.5 opacity-40 select-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>

                  {/* Beautiful, styled dynamic client facing freelance agency summary card mockup */}
                  <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm relative overflow-hidden mt-2">
                    
                    {/* Centered Profile Logo and Info */}
                    <div className="flex items-start gap-4 pb-4.5 border-b border-stone-100">
                      
                      {logoBase64 ? (
                        <img 
                          src={logoBase64} 
                          alt="Agency Logo preview" 
                          className="w-12 h-12 object-cover rounded-xl border border-stone-200 shadow-xs" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-neutral-900 flex items-center justify-center text-white text-base font-bold font-display tracking-wide uppercase">
                          {(agencyName || "V")[0]}
                        </div>
                      )}

                      <div className="min-w-0">
                        <span className="text-[8px] bg-neutral-100 text-neutral-600 font-bold px-2 py-0.5 rounded-full border border-neutral-250 font-mono tracking-widest uppercase block w-fit mb-1">
                          EXCLUSIVE CONTRACTOR
                        </span>
                        <h4 className="text-sm font-extrabold text-neutral-900 uppercase tracking-tight">
                          {agencyName || "Vertex Studio Labs"}
                        </h4>
                        <p className="text-xs text-stone-500 font-medium">
                          Lead: {freelancerName || "Dishant"} • <span className="text-[10px] text-stone-400 font-normal">{roleTitle || "Senior UI Engineer & Architect"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Agency Bio */}
                    <div className="py-4">
                      <span className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest block mb-1">CONTRACTOR Statement</span>
                      <p className="text-xs text-stone-650 leading-relaxed italic">
                        "{bioText || "Add your statement to guide customers on milestones checkoff and zero-trust manual QR payments checkout requirements."}"
                      </p>
                    </div>

                    {/* Links row */}
                    <div className="pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
                      
                      {/* Interactive Website URL indicator */}
                      <a 
                        href={websiteUrl || "#"} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-900 hover:underline"
                        onClick={(e) => e.preventDefault()}
                      >
                        <Globe className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{websiteUrl ? websiteUrl.replace(/(^\w+:|^)\/\//, '') : "vertexlabs.io"}</span>
                        <ExternalLink className="w-2.5 h-2.5 text-neutral-400 ml-0.5" />
                      </a>

                      {/* Interactive Social elements block */}
                      <div className="flex items-center gap-2.5">
                        
                        {gitUrl && (
                          <div className="p-1 px-2 border border-stone-200 rounded bg-stone-50 hover:bg-stone-100 transition-colors flex items-center justify-center gap-1 text-[9.5px] font-semibold text-neutral-700">
                            <Github className="w-3 h-3 text-neutral-600" /> GitHub
                          </div>
                        )}

                        {twUrl && (
                          <div className="p-1 px-2 border border-stone-200 rounded bg-stone-50 hover:bg-stone-100 transition-colors flex items-center justify-center gap-1 text-[9.5px] font-semibold text-neutral-700">
                            <Twitter className="w-3 h-3 text-sky-500" /> Twitter
                          </div>
                        )}

                        {upiVal && (
                          <div className="p-1 px-2 border border-emerald-100 rounded bg-emerald-50/20 text-emerald-800 text-[9.5px] font-mono font-bold select-none leading-none">
                            VPA: {upiVal}
                          </div>
                        )}

                      </div>

                    </div>

                  </div>

                  <p className="text-center text-[10px] text-neutral-400 mt-4 leading-relaxed px-6">
                    Clients will see this premium branding block docked directly inside their secure file download portal, boosting trust and professionalism.
                  </p>
                </div>

                {/* Elegant statistics card layout preview */}
                <div className="bg-white border border-stone-200 p-5 rounded-2xl shadow-xs">
                  <h4 className="text-[11.5px] font-bold text-neutral-800 uppercase tracking-widest flex items-center gap-1 mb-2">
                    <FileText className="w-3.5 h-3.5 text-neutral-500" /> Setup Checklist
                  </h4>
                  <ul className="text-xs text-neutral-500 space-y-2 list-none py-1">
                    <li className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${websiteUrl ? 'bg-emerald-505 bg-emerald-600' : 'bg-stone-300'}`}>✓</span>
                      <span>Website Portfolio link configured</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${bioText ? 'bg-emerald-505 bg-emerald-600' : 'bg-stone-300'}`}>✓</span>
                      <span>Contract statement and bio configured</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${upiVal ? 'bg-emerald-505 bg-emerald-600' : 'bg-stone-300'}`}>✓</span>
                      <span>Direct UPI VPA ID registered</span>
                    </li>
                  </ul>
                </div>

              </section>

            </motion.div>
          )}

        </AnimatePresence>

        {/* Dynamic Receipt/Invoice Detailed Modal Overlay */}
        <AnimatePresence>
          {selectedInvoice && (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.96, opacity: 0 }}
                className="bg-white max-w-2xl w-full rounded-2xl border border-stone-200 shadow-xl overflow-hidden text-neutral-800"
              >
                {/* Receipt Header Actions */}
                <div className="bg-stone-50 px-6 py-4 border-b border-stone-200 flex justify-between items-center select-none">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-emerald-600" />
                    <span className="font-display font-medium text-xs tracking-wider uppercase font-bold text-stone-500">Invoice Ledger Receipt</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadPDF(selectedInvoice)}
                      className="p-1.5 px-3 bg-stone-900 border border-stone-900 hover:bg-black text-[#faf9f6]/95 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer font-display shadow-xs animate-pulse"
                    >
                      <Download className="w-3.5 h-3.5 text-orange-450" /> Download PDF
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="p-1.5 px-3 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer font-display text-neutral-600"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="p-1 px-2.5 hover:bg-stone-200 bg-stone-100 rounded-lg text-xs font-bold transition-all cursor-pointer font-display"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {/* High-Fidelity Printable Area */}
                <div className="p-8 space-y-6 select-text overflow-y-auto max-h-[75vh]">
                  
                  {/* Meta details header split block */}
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      {profile.logo_data ? (
                        <img
                          src={profile.logo_data}
                          alt="Agency Logo"
                          className="h-10 w-auto rounded-lg mb-3 object-contain"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-bold tracking-tighter text-sm mb-3">
                          S
                        </div>
                      )}
                      <h2 className="text-xl font-bold font-display tracking-tight text-neutral-900">
                        {profile.agency_name || "Independent Workspace Studio"}
                      </h2>
                      <p className="text-xs text-stone-500">{profile.freelancer_name} — {profile.role_title}</p>
                      {profile.website_url && (
                        <p className="text-[10px] text-stone-400 font-mono mt-0.5">{profile.website_url}</p>
                      )}
                    </div>

                    <div className="text-left sm:text-right space-y-1">
                      <span className="inline-block text-[10px] font-bold text-neutral-700 bg-neutral-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono">
                        {selectedInvoice.invoice_number}
                      </span>
                      <p className="text-xs text-stone-500 font-sans">Issue Date: <span className="font-mono text-neutral-800">{selectedInvoice.issue_date}</span></p>
                      <p className="text-xs text-stone-500 font-sans">Due Date: <span className="font-mono text-neutral-800">{selectedInvoice.due_date}</span></p>
                      <p className="text-xs text-stone-500">
                        Payment Status: 
                        <span className={`inline-block font-mono font-bold uppercase ml-1.5 text-[9px] px-2 py-0.5 rounded-full ${
                          selectedInvoice.status === 'paid' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : selectedInvoice.status === 'sent' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-stone-100 text-stone-700'
                        }`}>
                          {selectedInvoice.status}
                        </span>
                      </p>
                    </div>
                  </div>

                  <hr className="border-stone-100" />

                  {/* Billing details block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block mb-1 font-mono">Billed To Customer</span>
                      <h3 className="font-bold text-sm text-neutral-900 font-display">{selectedInvoice.client_name}</h3>
                      {(() => {
                        const foundCli = clients.find(c => c.id === selectedInvoice.client_id);
                        if (foundCli) {
                          return (
                            <div className="text-xs text-stone-500 space-y-0.5 mt-1">
                              {foundCli.company_name && <p className="font-medium text-neutral-700">Company: {foundCli.company_name}</p>}
                              {foundCli.email && <p>Email: {foundCli.email}</p>}
                              {foundCli.phone && <p>Phone: {foundCli.phone}</p>}
                            </div>
                          );
                        }
                        return <p className="text-xs text-stone-400 italic mt-1 font-sans">Direct Custom Client Ledger</p>;
                      })()}
                    </div>
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400 block mb-1 font-mono">Secure settlement details</span>
                      <p className="text-xs text-stone-500 leading-relaxed font-sans">
                        Transactions processed via standard Unified Payments Interface (UPI) system directly to the freelancer.
                      </p>
                      {profile.upi_id && (
                        <p className="text-xs font-mono font-bold text-[#8b7235] bg-[#fdfaf2] p-2 rounded-lg border border-[#fdfaf2]/90 mt-2 block w-max">
                          VPA/UPI: {profile.upi_id}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Subtotal table list represent */}
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left text-xs text-neutral-800">
                      <thead>
                        <tr className="border-b border-stone-200 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                          <th className="py-2">Deliverable Description</th>
                          <th className="py-2 text-center">Qty</th>
                          <th className="py-2 text-right">Unit Rate</th>
                          <th className="py-2 text-right">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {selectedInvoice.items.map((item) => (
                          <tr key={item.id}>
                            <td className="py-2.5 font-sans">
                              <p className="font-bold text-neutral-900">{item.description}</p>
                            </td>
                            <td className="py-2.5 text-center font-mono text-stone-500">
                              {item.quantity}
                            </td>
                            <td className="py-2.5 text-right font-mono text-stone-500">
                              ₹{item.rate.toLocaleString('en-IN')}
                            </td>
                            <td className="py-2.5 text-right font-mono font-bold text-neutral-800">
                              ₹{(item.quantity * item.rate).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals computation */}
                  <div className="flex justify-end pt-4 border-t border-stone-100">
                    <div className="w-64 space-y-1.5 text-xs">
                      {(() => {
                        const itemsSum = selectedInvoice.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
                        const taxMultiplier = selectedInvoice.tax_rate / 100;
                        const taxAmount = itemsSum * taxMultiplier;
                        const grandTotal = itemsSum + taxAmount;

                        return (
                          <>
                            <div className="flex justify-between text-stone-500">
                              <span className="font-sans">Subtotal Cost:</span>
                              <span className="font-mono">₹{itemsSum.toLocaleString('en-IN')}</span>
                            </div>
                            {selectedInvoice.tax_rate > 0 && (
                              <div className="flex justify-between text-stone-500">
                                <span className="font-sans">Service GST ({selectedInvoice.tax_rate}%):</span>
                                <span className="font-mono">₹{Math.round(taxAmount).toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-stone-200 pt-1.5 text-neutral-900 font-bold">
                              <span className="font-display uppercase tracking-tight text-[11px]">Total Settled Value:</span>
                              <span className="font-mono text-sm font-black text-indigo-805 text-indigo-800">
                                ₹{Math.round(grandTotal).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {selectedInvoice.notes && (
                    <div className="text-[10px] text-stone-400 pt-3 border-t border-stone-100 select-all font-sans leading-relaxed">
                      <strong>Memo notes:</strong> {selectedInvoice.notes}
                    </div>
                  )}

                  <div className="text-[10.5px] text-[#8b7235] font-bold text-center mt-6 pt-4 border-t border-stone-100 uppercase tracking-widest font-mono select-none">
                    Made and Generated by STACK
                  </div>

                </div>

                {/* Modal controls */}
                <div className="bg-stone-50 border-t border-stone-200 px-6 py-4 flex justify-end gap-2 text-xs select-none">
                  <span className="text-[10px] text-stone-400 font-mono flex items-center shrink-0 mr-auto">
                    Secured & cryptographically issued.
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-805 text-white rounded-lg font-bold transition-all cursor-pointer shadow-xs uppercase tracking-wider text-[10px]"
                  >
                    Confirm and Terminate Preview
                  </button>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>

    </div>
  );
}

function DigitalStoreInstaller({ profile, onUpdateProfile }: { profile: FreelancerProfile, onUpdateProfile: (p: FreelancerProfile) => void }) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleInstall = () => {
    setIsInstalling(true);
    setTimeout(() => {
      setIsInstalling(false);
      setInstallSuccess(true);
      setTimeout(() => {
        onUpdateProfile({
          ...profile,
          digital_store_installed: true
        });
      }, 800);
    }, 1500);
  };

  return (
    <div className="max-w-xl mx-auto bg-white border border-stone-200 rounded-2xl p-8 shadow-sm text-center">
      <div className="relative inline-block mb-6">
        <div className="w-16 h-16 rounded-full bg-orange-50 border border-orange-100/60 flex items-center justify-center text-orange-600 mx-auto">
          <Package className="w-8 h-8 animate-pulse text-orange-600" />
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
          <Plus className="w-4 h-4 text-white" />
        </div>
      </div>

      <span className="text-[9.5px] uppercase font-bold text-orange-600 tracking-widest block mb-2 bg-orange-50 border border-orange-100/60 px-2 py-0.5 rounded-full w-max mx-auto">
        Bespoke Module Extension
      </span>
      
      <h3 className="text-lg font-black text-neutral-900 tracking-tight leading-tight mb-2">
        Install Digital Goods Storefront
      </h3>
      
      <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto mb-6">
        Add an inline inventory management catalog and payment release gate to your workspace. Pack templates, design libraries, and software files so customers can buy them and unlock them instantly upon UPI-QR clearance.
      </p>

      {/* Feature matrix */}
      <div className="text-left bg-stone-50 border border-stone-150 p-4 rounded-xl space-y-2.5 max-w-md mx-auto mb-6 text-xs font-sans">
        <div className="flex items-start gap-2.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-neutral-900 font-semibold block">Inventory Manager:</strong>
            <span className="text-stone-400 text-[11px]">Deploy downloadable assets, custom pricing, and files.</span>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-neutral-900 font-semibold block">Pay-to-Unlock Delivery:</strong>
            <span className="text-stone-400 text-[11px]">Generate unique pay-to-unlock portal links. Verification of UPI QR clearance instantly is supported.</span>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-neutral-900 font-semibold block">Commission Free:</strong>
            <span className="text-stone-400 text-[11px]">Direct bank-to-bank settlements with zero platform charge or middleman take-rates.</span>
          </div>
        </div>
      </div>

      {/* Action button */}
      <button
        onClick={handleInstall}
        disabled={isInstalling || installSuccess}
        className="w-full max-w-md py-3 bg-[#1c1b18] hover:bg-black text-[#faf9f6]/95 text-xs tracking-wider uppercase font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mx-auto"
      >
        {isInstalling ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-orange-500" />
            <span>Configuring Storefront Core...</span>
          </>
        ) : installSuccess ? (
          <>
            <Check className="w-4 h-4 text-emerald-405" />
            <span>Installation Completed!</span>
          </>
        ) : (
          <>
            <span>Install & Activate Extension</span>
          </>
        )}
      </button>
      
      {!isInstalling && !installSuccess && (
        <span className="text-[10px] text-stone-405 block mt-3 font-mono">
          Size: ~24.5 KB • Zero Configuration Required
        </span>
      )}
    </div>
  );
}
