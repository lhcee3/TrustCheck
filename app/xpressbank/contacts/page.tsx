"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Search, Plus, Send, Trash2, Loader2, X,
  Zap, Bell, Receipt, Users, LogOut,
} from "lucide-react";
import { api, type Contact } from "@/lib/api";
import SendMoneyModal from "@/components/xpressbank/SendMoneyModal";

export default function ContactsPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filtered, setFiltered] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUpi, setNewUpi] = useState("");
  const [newBank, setNewBank] = useState("");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [sendTo, setSendTo] = useState<Contact | null>(null);

  function showToast(msg: string) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  async function load() {
    setLoading(true);
    try { const data = await api.getContacts(); setContacts(data); setFiltered(data); }
    catch { /* keep stale */ }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("xb_loggedIn") !== "true") {
      router.replace("/xpressbank/login"); return;
    }
    load();
  }, [router]);

  function handleSearch(val: string) {
    setSearch(val);
    const q = val.toLowerCase();
    setFiltered(contacts.filter((c) => c.name.toLowerCase().includes(q) || c.upiId.toLowerCase().includes(q)));
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      await api.createContact({ name: newName, upiId: newUpi, bank: newBank });
      setNewName(""); setNewUpi(""); setNewBank(""); setShowAdd(false);
      await load();
      showToast("Contact added");
    } catch { showToast("Failed to add contact"); }
    finally { setAdding(false); }
  }

  async function deleteContact(id: string) {
    try { await api.deleteContact(id); setContacts((c) => c.filter((x) => x.id !== id)); setFiltered((c) => c.filter((x) => x.id !== id)); showToast("Contact removed"); }
    catch { showToast("Failed to remove"); }
  }

  function logout() { localStorage.clear(); router.push("/xpressbank/login"); }

  const contactCard = (c: Contact, desktop?: boolean) => (
    <div key={c.id} className={`bg-white rounded-2xl border border-stone-100 shadow-sm ${desktop ? "p-5" : "p-4"} flex items-center gap-3`}>
      <div className={`${desktop ? "w-12 h-12 text-base" : "w-11 h-11 text-sm"} rounded-full bg-[#2D6A4F]/10 flex items-center justify-center text-[#2D6A4F] font-bold shrink-0`}>{c.avatarInitials}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{c.name}</p>
        <p className="text-xs text-slate-400 font-mono truncate">{c.upiId}</p>
        {c.bank && <p className="text-xs text-slate-400">{c.bank}</p>}
        {c.lastPaid && <p className="text-xs text-slate-400 mt-0.5">Last paid: {c.lastPaid}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={() => setSendTo(c)} className="w-9 h-9 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white hover:bg-[#245a42] transition-colors">
          <Send className="w-4 h-4" />
        </button>
        <button onClick={() => deleteContact(c.id)} className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const addForm = (
    <form onSubmit={addContact} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex flex-col gap-3">
      <h2 className="text-sm font-bold text-slate-800">Add New Contact</h2>
      {[
        { label: "Name", value: newName, setter: setNewName, placeholder: "Priya Sharma", required: true },
        { label: "UPI ID", value: newUpi, setter: setNewUpi, placeholder: "priya@okicici", required: true },
        { label: "Bank (optional)", value: newBank, setter: setNewBank, placeholder: "ICICI", required: false },
      ].map((f) => (
        <div key={f.label} className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500">{f.label}</label>
          <input value={f.value} onChange={(e) => f.setter(e.target.value)} placeholder={f.placeholder} required={f.required}
            className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2D6A4F] transition-colors"
          />
        </div>
      ))}
      <button type="submit" disabled={adding} className="rounded-xl bg-[#2D6A4F] hover:bg-[#245a42] disabled:opacity-60 py-2.5 text-sm font-semibold text-white flex items-center justify-center gap-2">
        {adding ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : "Add Contact"}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-[#F7F6F2] flex flex-col">
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-2xl shadow-lg whitespace-nowrap">{toast}</div>}

      {sendTo && (
        <SendMoneyModal
          prefillUpi={sendTo.upiId}
          prefillName={sendTo.name}
          onClose={() => setSendTo(null)}
          onSuccess={(newBalance) => {
            setSendTo(null);
            api.updateContact(sendTo.id, { lastPaid: new Date().toISOString().split("T")[0] }).catch(() => {});
            showToast("✅ Transaction initiated");
            if (newBalance !== undefined) {
              const stored = localStorage.getItem("xb_user");
              if (stored) localStorage.setItem("xb_user", JSON.stringify({ ...JSON.parse(stored), balance: newBalance }));
            }
          }}
          onFraudPrevented={() => { setSendTo(null); showToast("🛡️ Fraud prevented — money safe!"); }}
        />
      )}

      {/* ── Desktop layout ── */}
      <div className="hidden sm:flex flex-col flex-1">
        <header className="bg-white border-b border-stone-100 px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2D6A4F] flex items-center justify-center"><Zap className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-slate-800">XpressBank</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/xpressbank/contacts" className="text-[#2D6A4F] font-semibold text-sm flex items-center gap-1"><Users className="w-4 h-4" /> Contacts</Link>
            <Link href="/xpressbank/transactions" className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1"><Receipt className="w-4 h-4" /> Transactions</Link>
            <Link href="/xpressbank/notifications" className="text-slate-400 hover:text-slate-600"><Bell className="w-5 h-5" /></Link>
            <Link href="/xpressbank/profile" className="w-8 h-8 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white text-xs font-bold">RK</Link>
            <button onClick={logout} className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1"><LogOut className="w-3.5 h-3.5" /> Logout</button>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Contacts</h1>
              <p className="text-slate-500 text-sm mt-0.5">{contacts.length} saved contacts</p>
            </div>
            <button onClick={() => setShowAdd((v) => !v)} className="flex items-center gap-2 rounded-xl bg-[#2D6A4F] hover:bg-[#245a42] transition-colors px-4 py-2.5 text-sm font-semibold text-white">
              {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAdd ? "Cancel" : "Add Contact"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 flex flex-col gap-4">
              <div className="flex items-center gap-2 rounded-2xl bg-white border border-stone-200 px-4 py-3">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input placeholder="Search contacts..." value={search} onChange={(e) => handleSearch(e.target.value)}
                  className="bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none w-full" />
              </div>
              {loading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2D6A4F]" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-16">No contacts found</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {filtered.map((c) => contactCard(c, true))}
                </div>
              )}
            </div>
            <div>
              {showAdd && addForm}
            </div>
          </div>
        </main>
      </div>

      {/* ── Mobile layout (unchanged) ── */}
      <div className="sm:hidden flex flex-col flex-1">
        <div className="bg-white border-b border-stone-100 px-4 pt-4 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/xpressbank/dashboard" className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-slate-600"><ArrowLeft className="w-4 h-4" /></Link>
            <h1 className="text-base font-bold text-slate-800">Contacts</h1>
          </div>
          <button onClick={() => setShowAdd((v) => !v)} className="w-9 h-9 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white">
            {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex-1 px-4 py-4 pb-8 flex flex-col gap-3">
          {showAdd && addForm}
          <div className="flex items-center gap-2 rounded-2xl bg-white border border-stone-200 px-4 py-3">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input placeholder="Search contacts..." value={search} onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent text-sm text-slate-700 placeholder-slate-400 focus:outline-none w-full" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2D6A4F]" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-16">No contacts found</p>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((c) => contactCard(c))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
