"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FaUsers,
  FaPlus,
  FaSearch,
  FaTimes,
  FaUserTag,
} from "react-icons/fa";

interface ContactItem {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, string>;
  createdAt: string;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [customFieldKey, setCustomFieldKey] = useState("");
  const [customFieldValue, setCustomFieldValue] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/contacts?search=${encodeURIComponent(search)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleAddCustomField = () => {
    if (!customFieldKey.trim()) return;
    const cleanKey = customFieldKey.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    setCustomFields((prev) => ({
      ...prev,
      [cleanKey]: customFieldValue.trim(),
    }));
    setCustomFieldKey("");
    setCustomFieldValue("");
  };

  const handleRemoveCustomField = (key: string) => {
    setCustomFields((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setSaving(true);
    try {
      const tagsArray = tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || phone.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          tags: tagsArray,
          customFields,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setName("");
        setPhone("");
        setEmail("");
        setTagInput("");
        setCustomFields({});
        fetchContacts();
      } else {
        alert(data.message || "Failed to save contact");
      }
    } catch (err) {
      console.error("Error creating contact:", err);
      alert("Network error creating contact");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Contacts Directory</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your customer database and generic business custom fields.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition cursor-pointer text-sm shadow-md"
        >
          <FaPlus size={13} />
          <span>New Contact</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3.5 top-3.5 text-slate-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts by name, phone number or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700"
          />
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading contacts...</div>
        ) : contacts.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <FaUsers className="w-12 h-12 mx-auto text-slate-200" />
            <p className="font-semibold text-sm text-slate-600">No contacts found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Contacts are automatically recorded when incoming WhatsApp messages arrive, or you can add them manually.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Contact</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Tags</th>
                  <th className="p-4">Custom Fields (Variables)</th>
                  <th className="p-4 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {contacts.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{c.name}</div>
                      {c.email && <div className="text-[11px] text-slate-400">{c.email}</div>}
                    </td>
                    <td className="p-4 font-mono font-semibold text-slate-700">{c.phone}</td>
                    <td className="p-4">
                      {c.tags && c.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {c.customFields && Object.keys(c.customFields).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {Object.entries(c.customFields).map(([k, v]) => (
                            <span
                              key={k}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-100 font-mono"
                            >
                              <strong>{k}:</strong> {String(v)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-300 italic text-[11px]">No custom fields</span>
                      )}
                    </td>
                    <td className="p-4 text-right text-slate-400 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FaUserTag className="text-emerald-600" /> New Contact Profile
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  WhatsApp Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 919876543210 (with country code, no +)"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="customer@example.com"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="VIP, Lead, TurfBooking"
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Dynamic Custom Fields */}
              <div className="pt-2 border-t border-slate-100">
                <label className="block font-bold text-slate-700 mb-2">
                  Custom Contact Fields (Used in Automations)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customFieldKey}
                    onChange={(e) => setCustomFieldKey(e.target.value)}
                    placeholder="Field name (e.g. booking_date, service)"
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                  />
                  <input
                    type="text"
                    value={customFieldValue}
                    onChange={(e) => setCustomFieldValue(e.target.value)}
                    placeholder="Value (e.g. Tomorrow 7PM, Premium)"
                    className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl text-slate-700"
                  >
                    Add
                  </button>
                </div>

                {Object.keys(customFields).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(customFields).map(([k, v]) => (
                      <span
                        key={k}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px]"
                      >
                        <strong>{k}:</strong> {v}
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(k)}
                          className="text-red-500 hover:text-red-700 font-bold ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Contact"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
