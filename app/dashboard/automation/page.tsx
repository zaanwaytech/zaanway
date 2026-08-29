"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FaRobot, FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from "react-icons/fa";

interface AutomationRule {
  _id: string;
  name: string;
  trigger: {
    type: string;
    keyword?: string;
  };
  actions: {
    type: string;
    payload?: any;
  }[];
  isActive: boolean;
  createdAt: string;
}

export default function AutomationDashboardPage() {
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    triggerType: "keyword",
    keyword: "",
    actionType: "send_text",
    textPayload: "",
  });

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    try {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.success && meData.activeWorkspace) {
        const res = await fetch(`/api/automations?workspaceId=${meData.activeWorkspace.id}`);
        const data = await res.json();
        if (data.success) {
          setAutomations(data.automations);
        }
      }
    } catch (err) {
      console.error("Failed to load automations", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        trigger: {
          type: formData.triggerType,
          keyword: formData.triggerType === "keyword" ? formData.keyword : undefined,
        },
        actions: [
          {
            type: formData.actionType,
            payload: formData.actionType === "send_text" ? { text: formData.textPayload } : {},
          },
        ],
        isActive: true,
      };

      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setFormData({
          name: "",
          triggerType: "keyword",
          keyword: "",
          actionType: "send_text",
          textPayload: "",
        });
        fetchAutomations();
      } else {
        alert(data.message || "Failed to save automation");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred");
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/automations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchAutomations();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAutomation = async (id: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;
    try {
      await fetch(`/api/automations/${id}`, { method: "DELETE" });
      fetchAutomations();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Automation Rules</h1>
          <p className="text-slate-500 text-sm mt-1">
            Build custom logic to reply to incoming messages automatically.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all"
        >
          <FaPlus />
          <span>New Rule</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {automations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <FaRobot className="w-12 h-12 mx-auto text-slate-200 mb-4" />
            <p>No automation rules found.</p>
            <p className="text-sm">Click "New Rule" to create your first automation.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 font-semibold text-slate-600 text-sm">Rule Name</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Trigger</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Action</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm">Status</th>
                  <th className="p-4 font-semibold text-slate-600 text-sm text-right">Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {automations.map((auto) => (
                  <tr key={auto._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{auto.name}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        Created {new Date(auto.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {auto.trigger.type === "keyword"
                          ? `Keyword: "${auto.trigger.keyword}"`
                          : auto.trigger.type === "incoming_message"
                          ? "Any Message"
                          : auto.trigger.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {auto.actions[0]?.type === "send_text" ? (
                        <span className="line-clamp-2">Reply: {auto.actions[0].payload?.text}</span>
                      ) : (
                        <span>{auto.actions[0]?.type}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatus(auto._id, auto.isActive)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          auto.isActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {auto.isActive ? <FaCheck className="w-3 h-3" /> : <FaTimes className="w-3 h-3" />}
                        {auto.isActive ? "Active" : "Paused"}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => deleteAutomation(auto._id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Rule"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Create New Rule</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <FaTimes size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Rule Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder="e.g. Greeting, Out of Office..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Trigger Type</label>
                  <select
                    value={formData.triggerType}
                    onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="incoming_message">Any Message</option>
                    <option value="keyword">Specific Keyword</option>
                  </select>
                </div>
                {formData.triggerType === "keyword" && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Keyword</label>
                    <input
                      type="text"
                      required
                      value={formData.keyword}
                      onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      placeholder="e.g. price, help"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Action: Reply Message</label>
                <textarea
                  required
                  rows={4}
                  value={formData.textPayload}
                  onChange={(e) => setFormData({ ...formData, textPayload: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  placeholder="Type the automatic reply message here..."
                ></textarea>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all"
                >
                  Save Rule
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl transition-all"
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
