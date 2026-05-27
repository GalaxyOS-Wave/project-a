import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Check, 
  Sparkles, 
  FolderLock, 
  Tag, 
  ArrowRight, 
  Smartphone, 
  AlertCircle,
  FileKey,
  Users
} from 'lucide-react';
import { Product, ClientRecord, Project } from '../types';

interface ProductsTabProps {
  clients: ClientRecord[];
  onCreateProject: (project: Omit<Project, 'id' | 'created_at'>) => void;
}

export default function ProductsTab({ clients, onCreateProject }: ProductsTabProps) {
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('project_a_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return [
      {
        id: "prod-1",
        name: "Prism UI React Components System",
        description: "A gorgeous, comprehensive system comprising over 150+ bespoke Tailwind components, micro-interactions, robust forms, and highly polished responsive layouts.",
        price: 18000,
        category: "Design System",
        file_name: "prism_ui_design_v2.0.zip",
        file_size: "45.2 MB",
        created_at: new Date().toISOString(),
        is_active: true,
        image_color: "bg-indigo-600 text-indigo-100"
      },
      {
        id: "prod-2",
        name: "Vortex Motion Canvas Plugin",
        description: "High-performance React canvas slider package for background scrolling, bento grids, and dynamic timeline visualization.",
        price: 4500,
        category: "React Plugins",
        file_name: "vortex_sliders_source.tar.gz",
        file_size: "8.1 MB",
        created_at: new Date().toISOString(),
        is_active: true,
        image_color: "bg-amber-600 text-amber-100"
      },
      {
        id: "prod-3",
        name: "Node.js Express Secure Gateway Boilerplate",
        description: "Turnkey full-stack CJS/ESM compilation setup with clean route structures, standard JWT authentication, and lazy-loaded DB clients.",
        price: 12000,
        category: "Backend Kits",
        file_name: "node_express_secure_api_dump.zip",
        file_size: "14.5 MB",
        created_at: new Date().toISOString(),
        is_active: true,
        image_color: "bg-teal-600 text-teal-100"
      },
      {
        id: "prod-4",
        name: "OAuth2 Google Calendar Module",
        description: "Google Calendar API integration templates with offline access tokens and automatic JWT renewal flows.",
        price: 7500,
        category: "Custom Integrations",
        file_name: "google_calendar_oauth2_module.zip",
        file_size: "3.2 MB",
        created_at: new Date().toISOString(),
        is_active: true,
        image_color: "bg-rose-600 text-rose-100"
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('project_a_products', JSON.stringify(products));
  }, [products]);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Design System');
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Checkout modal states
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [customClientName, setCustomClientName] = useState('');
  const [tunnelGeneratedMessage, setTunnelGeneratedMessage] = useState<string | null>(null);

  const handleSubmitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category.trim() || !price) return;

    const newProduct: Product = {
      id: `prod-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      price: parseInt(price) || 0,
      category: category.trim(),
      file_name: fileName.trim() || "deliverable_asset.zip",
      file_size: fileSize.trim() || "12.5 MB",
      created_at: new Date().toISOString(),
      is_active: isActive,
      image_color: getRandomColor()
    };

    setProducts([newProduct, ...products]);
    
    // Reset form
    setName('');
    setDescription('');
    setPrice('');
    setCategory('Design System');
    setFileName('');
    setFileSize('');
    setIsActive(true);
    setShowAddForm(false);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const handleGenerateCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutProduct) return;

    let clientName = '';
    let clientId = '';

    if (selectedClientId === 'new') {
      if (!customClientName.trim()) return;
      clientName = customClientName.trim();
    } else {
      const clientObj = clients.find(c => c.id === selectedClientId);
      if (!clientObj) return;
      clientName = clientObj.name;
      clientId = clientObj.id;
    }

    // Trigger parent onCreateProject to build a dedicated secure tunnel
    onCreateProject({
      client_name: clientName,
      project_name: `Release: ${checkoutProduct.name}`,
      amount_due: checkoutProduct.price,
      is_paid: false,
      file_name: checkoutProduct.file_name,
      file_size: checkoutProduct.file_size,
      client_id: clientId || undefined,
      milestones: [
        { id: `m-${Date.now()}-1`, task_title: "Merchant Deliverable License Verification", is_completed: true },
        { id: `m-${Date.now()}-2`, task_title: "Integrated QR Invoice & Settlement Release", is_completed: false }
      ]
    });

    setTunnelGeneratedMessage(`Success! A secure settlement gateway and deliverable tunnel has been generated for ${clientName}. Visit the 'Delivery Channels' tab to view instructions and get the portal share link.`);
    setTimeout(() => {
      setCheckoutProduct(null);
      setSelectedClientId('');
      setCustomClientName('');
      setTunnelGeneratedMessage(null);
    }, 4500);
  };

  const getRandomColor = () => {
    const colors = [
      "bg-indigo-600 text-indigo-150", 
      "bg-amber-600 text-amber-150", 
      "bg-teal-600 text-teal-150", 
      "bg-rose-600 text-rose-150",
      "bg-emerald-600 text-emerald-150",
      "bg-sky-600 text-sky-150",
      "bg-fuchsia-600 text-fuchsia-150",
      "bg-purple-600 text-purple-150"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-stone-200/50 pb-5">
        <div>
          <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-widest flex items-center gap-2">
            <Package className="w-4 h-4 text-orange-600" /> Digital E-Commerce Storefront
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Build, edit, and keep inventory of your digital goods, frameworks, or design packages. Instantly generate locked-delivery checkout gates for clients.
          </p>
        </div>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          id="btn-toggle-add-product"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showAddForm ? "View Inventory" : "Register Product"}</span>
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showAddForm ? (
          <motion.div
            key="add-product-form"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm max-w-2xl"
          >
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider mb-4 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Register New Digital Product
            </h3>

            <form onSubmit={handleSubmitProduct} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Product Title / Asset Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Prism UI Design System"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 text-neutral-850 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Product Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 text-neutral-850 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 transition-all font-medium"
                  >
                    <option value="Design System">Design System</option>
                    <option value="React Plugins">React Plugins</option>
                    <option value="Backend Kits">Backend Kits</option>
                    <option value="Custom Integrations">Custom Integrations</option>
                    <option value="SaaS Starters">SaaS Starters</option>
                    <option value="Graphics Asset">Graphics Asset</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                  Description / Marketing Features
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detail the technical capabilities, contents, and source deliverables of this product."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 text-neutral-855 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 transition-all font-medium leading-relaxed resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Fixed Release Price (₹ INR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-stone-400 text-xs font-bold">₹</span>
                    <input
                      type="number"
                      required
                      placeholder="12000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-stone-50 border border-stone-200 text-neutral-850 pl-7 pr-3 py-2 text-xs focus:outline-none focus:border-neutral-500 transition-all font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    Downloadable Filename
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. prism_source_v1.zip"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 text-neutral-850 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                    File Package Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 18.5 MB"
                    value={fileSize}
                    onChange={(e) => setFileSize(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 text-neutral-850 placeholder-stone-400 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="product-active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded border-stone-300 text-neutral-900 focus:ring-neutral-500 h-3.5 w-3.5"
                />
                <label htmlFor="product-active" className="text-xs font-semibold text-neutral-700 select-none cursor-pointer">
                  Available for generation / instant checkout links
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#1c1b18] hover:bg-black text-[#faf9f6]/95 font-bold rounded-lg text-xs tracking-wider uppercase transition-all shadow-xs cursor-pointer"
                >
                  Save Store Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-neutral-600 font-bold rounded-lg text-xs tracking-wider uppercase cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="products-grid-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {products.length === 0 ? (
              <div className="border border-dashed border-stone-200 rounded-2xl p-12 text-center bg-white">
                <Package className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">No Digital Inventory Found</h4>
                <p className="text-[11px] text-stone-400 mt-1 max-w-sm mx-auto">
                  Click 'Register Product' above to build a standard suite of deliverables ready for merchant checkout lock-releasing.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((prod) => (
                  <div
                    key={prod.id}
                    id={`product-card-${prod.id}`}
                    className="bg-white border border-stone-200/80 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg ${prod.image_color || 'bg-stone-600'} flex items-center justify-center font-black font-mono text-sm`}>
                            {prod.name.charAt(0)}
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[#8b7235] tracking-wider block">
                              {prod.category}
                            </span>
                            <h4 className="text-xs font-black text-neutral-900 tracking-tight leading-tight">
                              {prod.name}
                            </h4>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            prod.is_active 
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                              : 'bg-stone-55 text-stone-400 border border-stone-150'
                          }`}>
                            {prod.is_active ? "Active" : "Archived"}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-500 leading-relaxed font-sans mb-4 min-h-[3.25rem]">
                        {prod.description}
                      </p>

                      <div className="grid grid-cols-2 gap-3 bg-stone-50 border border-stone-200/50 p-2.5 rounded-xl mb-4 font-mono text-[10px]">
                        <div>
                          <span className="text-neutral-400 block">Deliverable Package:</span>
                          <span className="text-neutral-700 font-semibold max-w-[150px] truncate block" title={prod.file_name}>
                            {prod.file_name}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block">Encrypted Size:</span>
                          <span className="text-neutral-700 font-semibold block">
                            {prod.file_size}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-stone-100 pt-3 mt-1">
                      <div>
                        <span className="text-[9px] text-[#8b7235] font-bold tracking-widest block uppercase">RETAIL PRICE</span>
                        <span className="text-sm font-black text-neutral-900 font-mono">
                          ₹{prod.price.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCheckoutProduct(prod)}
                          className="px-3.5 py-1.5 bg-[#1c1b18] hover:bg-neutral-850 text-white font-bold rounded-lg text-[10px] tracking-wider uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <FolderLock className="w-3.5 h-3.5" />
                          <span>Generate Link</span>
                        </button>
                        
                        <button
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50/70 rounded-lg transition-all"
                          title="Remove digital product inventory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate Checkout Portal Modal overlay */}
      <AnimatePresence>
        {checkoutProduct && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!tunnelGeneratedMessage) setCheckoutProduct(null);
              }}
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#faf9f6] border border-[#ebdcb9] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden relative z-10"
            >
              <div className="border-b border-[#ebdcb9]/40 bg-white/50 p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center text-white">
                    <FolderLock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 leading-none">
                      Generate Pay-to-Unlock Channel
                    </h3>
                    <p className="text-[10px] text-neutral-450 mt-1">
                      Product: {checkoutProduct.name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setCheckoutProduct(null)}
                  disabled={!!tunnelGeneratedMessage}
                  className="text-stone-400 hover:text-stone-605 font-display text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-5">
                {tunnelGeneratedMessage ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 border border-emerald-250 rounded-xl flex items-start gap-3"
                  >
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-xs font-medium text-emerald-800 leading-relaxed">
                      {tunnelGeneratedMessage}
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleGenerateCheckout} className="space-y-4">
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-stone-500">
                        <Tag className="w-3.5 h-3.5 text-amber-500" />
                        <span>Fixed Merchant Fee:</span>
                      </div>
                      <span className="font-bold text-neutral-900">
                        ₹{checkoutProduct.price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                          Select Registered Client
                        </label>
                        <select
                          required
                          value={selectedClientId}
                          onChange={(e) => setSelectedClientId(e.target.value)}
                          className="w-full bg-white border border-stone-200 text-neutral-850 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 font-medium cursor-pointer"
                        >
                          <option value="">-- Choose target contract customer --</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.company_name ? `(${c.company_name})` : ''} - {c.email || 'No email registered'}
                            </option>
                          ))}
                          <option value="new">+ Register a new custom customer record during checkout link creation</option>
                        </select>
                      </div>

                      {selectedClientId === 'new' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="pt-1.5"
                        >
                          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                            New Customer Name / Business Entity
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Web3 Labs Singapore"
                            value={customClientName}
                            onChange={(e) => setCustomClientName(e.target.value)}
                            className="w-full bg-white border border-stone-200 text-neutral-850 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-neutral-500 transition-all font-medium"
                          />
                        </motion.div>
                      )}
                    </div>

                    <div className="text-[10px] text-stone-400 bg-neutral-50 p-3 rounded-lg flex gap-2 border border-stone-150/60 leading-relaxed font-sans">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>This operation generates a <strong>secure locked delivery milestone project</strong> with fixed pricing. The client visits their auto-generated portal URL, scans/performs direct settlement UPI checkout, and the encrypted deliverable archive unlocks dynamically for them.</span>
                    </div>

                    <div className="flex items-center gap-3 pt-3 border-t border-stone-150/50">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-[#1c1b18] hover:bg-black text-[#faf9f6]/95 text-xs tracking-wider uppercase font-bold rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1"
                      >
                        <FileKey className="w-3.5 h-3.5" />
                        <span>Generate Checkout Bridge</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCheckoutProduct(null)}
                        className="px-4 py-2.5 bg-white border border-stone-200 hover:bg-stone-50 text-neutral-600 text-xs tracking-wider uppercase font-bold rounded-xl cursor-pointer"
                      >
                        Dismiss
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
