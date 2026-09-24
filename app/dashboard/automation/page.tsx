"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FaRobot,
  FaPlus,
  FaTrash,
  FaCheck,
  FaTimes,
  FaBolt,
  FaCodeBranch,
} from "react-icons/fa";

interface AutomationAction {
  type: string;
  payload?: {
    text?: string;
    buttons?: string[];
    field?: string;
    value?: string;
    condition?: {
      field?: string;
      operator?: string;
      value?: string;
    };
    thenActions?: AutomationAction[];
    elseActions?: AutomationAction[];
  };
}

interface AutomationRule {
  _id: string;
  name: string;
  trigger: {
    type: string;
    matching?: string;
    keyword?: string;
    buttonId?: string;
    listRowId?: string;
  };
  actions: AutomationAction[];
  isActive: boolean;
  createdAt: string;
}

export default function AutomationDashboardPage() {
  const [automations, setAutomations] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("keyword");
  const [matching, setMatching] = useState("exact");
  const [keyword, setKeyword] = useState("");
  const [actionType, setActionType] = useState("send_text");
  const [textPayload, setTextPayload] = useState("");
  const [buttonOptions, setButtonOptions] = useState("Book a Turf, Pricing, Talk to Agent");
  const [updateFieldName, setUpdateFieldName] = useState("");
  const [updateFieldValue, setUpdateFieldValue] = useState("");
  const [conditionField, setConditionField] = useState("customer_type");
  const [conditionOperator, setConditionOperator] = useState("==");
  const [conditionValue, setConditionValue] = useState("premium");
  const [conditionReplyTrue, setConditionReplyTrue] = useState("Welcome back VIP customer! Here are your priority slots.");
  const [conditionReplyFalse, setConditionReplyFalse] = useState("Welcome! Here are our regular slots.");
  const [saving, setSaving] = useState(false);

  const fetchAutomations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/automations", { cache: "no-store" });
      const data = await res.json();
      if (data.success) {
        setAutomations(data.automations || []);
      }
    } catch (err) {
      console.error("Failed to load automations", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (mounted) {
      fetchAutomations();
    }
    return () => {
      mounted = false;
    };
  }, [fetchAutomations]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      const actions: AutomationAction[] = [];

      if (actionType === "send_text") {
        actions.push({
          type: "send_text",
          payload: { text: textPayload.trim() },
        });
      } else if (actionType === "send_interactive_buttons") {
        const buttons = buttonOptions
          .split(",")
          .map((b) => b.trim())
          .filter(Boolean)
          .slice(0, 3);
        actions.push({
          type: "send_interactive_buttons",
          payload: {
            text: textPayload.trim() || "Please choose an option:",
            buttons,
          },
        });
      } else if (actionType === "update_contact_field") {
        actions.push({
          type: "update_contact_field",
          payload: {
            field: updateFieldName.trim(),
            value: updateFieldValue.trim(),
          },
        });
      } else if (actionType === "condition") {
        actions.push({
          type: "condition",
          payload: {
            condition: {
              field: conditionField.trim(),
              operator: conditionOperator,
              value: conditionValue.trim(),
            },
            thenActions: [
              {
                type: "send_text",
                payload: { text: conditionReplyTrue.trim() },
              },
            ],
            elseActions: [
              {
                type: "send_text",
                payload: { text: conditionReplyFalse.trim() },
              },
            ],
          },
        });
      }

      const payload = {
        name: name.trim(),
        trigger: {
          type: triggerType,
          matching: triggerType === "keyword" ? matching : undefined,
          keyword: triggerType === "keyword" || triggerType === "button_reply" ? keyword.trim() : undefined,
        },
        actions,
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
        setName("");
        setKeyword("");
        setTextPayload("");
        fetchAutomations();
      } else {
        alert(data.message || "Failed to save automation rule.");
      }
    } catch (err) {
      console.error(err);
      alert("An unexpected error occurred while saving the automation.");
    } finally {
      setSaving(false);
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
    if (!confirm("Are you sure you want to delete this automation rule?")) return;
    try {
      await fetch(`/api/automations/${id}`, { method: "DELETE" });
      fetchAutomations();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Automation Engine</h1>
          <p className="text-slate-500 text-sm mt-1">
            Build data-driven chatbot flows, keyword responders, and conditional routing.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition cursor-pointer text-sm shadow-md"
        >
          <FaPlus size={13} />
          <span>Create Automation</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading automation flows...</div>
        ) : automations.length === 0 ? (
          <div className="p-16 text-center text-slate-400 space-y-3">
            <FaRobot className="w-12 h-12 mx-auto text-slate-200" />
            <p className="font-semibold text-sm text-slate-600">No automation rules configured yet</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Click &quot;Create Automation&quot; to build your first automatic WhatsApp bot flow.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="p-4">Rule Name</th>
                  <th className="p-4">Trigger Condition</th>
                  <th className="p-4">Configured Actions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {automations.map((auto) => (
                  <tr key={auto._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{auto.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Created {new Date(auto.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        <FaBolt size={10} />
                        {auto.trigger.type === "keyword"
                          ? `Keyword (${auto.trigger.matching || "exact"}): "${auto.trigger.keyword}"`
                          : auto.trigger.type === "button_reply"
                          ? `Button Clicked: "${auto.trigger.keyword || auto.trigger.buttonId}"`
                          : auto.trigger.type === "incoming_message"
                          ? "Any Incoming Message"
                          : auto.trigger.type}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600 max-w-xs">
                      {auto.actions.map((act, idx) => (
                        <div key={idx} className="truncate">
                          {act.type === "send_text" && (
                            <span>💬 Text Reply: &quot;{act.payload?.text}&quot;</span>
                          )}
                          {act.type === "send_interactive_buttons" && (
                            <span>🔘 Buttons: [{act.payload?.buttons?.join(", ")}]</span>
                          )}
                          {act.type === "condition" && (
                            <span className="text-amber-700 font-semibold flex items-center gap-1">
                              <FaCodeBranch size={10} /> Condition IF {act.payload?.condition?.field} {act.payload?.condition?.operator} {act.payload?.condition?.value}
                            </span>
                          )}
                          {act.type === "update_contact_field" && (
                            <span>📝 Set Field: {act.payload?.field} = {act.payload?.value}</span>
                          )}
                        </div>
                      ))}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatus(auto._id, auto.isActive)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                          auto.isActive
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {auto.isActive ? <FaCheck className="w-3 h-3" /> : <FaTimes className="w-3 h-3" />}
                        {auto.isActive ? "Active" : "Paused"}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteAutomation(auto._id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                        title="Delete Rule"
                      >
                        <FaTrash size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Automation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-100 my-8">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FaRobot className="text-emerald-600" /> Create Automation Flow
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Flow Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="e.g. Turf Booking, Customer Onboarding, Price Inquiry..."
                />
              </div>

              {/* Trigger */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <label className="block font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Trigger: When this happens
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Trigger Type</label>
                    <select
                      value={triggerType}
                      onChange={(e) => setTriggerType(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
                    >
                      <option value="keyword">Incoming Keyword</option>
                      <option value="incoming_message">Any Message (Welcome Bot)</option>
                      <option value="button_reply">Interactive Button Reply</option>
                      <option value="conversation_started">Conversation Started</option>
                    </select>
                  </div>

                  {triggerType === "keyword" && (
                    <div>
                      <label className="block text-slate-600 mb-1">Matching Mode</label>
                      <select
                        value={matching}
                        onChange={(e) => setMatching(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
                      >
                        <option value="exact">Exact Match</option>
                        <option value="contains">Contains Word</option>
                      </select>
                    </div>
                  )}
                </div>

                {(triggerType === "keyword" || triggerType === "button_reply") && (
                  <div>
                    <label className="block text-slate-600 mb-1">
                      {triggerType === "keyword" ? "Keyword to listen for" : "Button Title / Payload"}
                    </label>
                    <input
                      type="text"
                      required
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      placeholder="e.g. hi, book turf, price"
                    />
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
                <label className="block font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Action: Then do this
                </label>
                <div>
                  <label className="block text-slate-600 mb-1">Action Type</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 bg-white text-xs"
                  >
                    <option value="send_text">Send WhatsApp Text Message</option>
                    <option value="send_interactive_buttons">Send Interactive Reply Buttons (Up to 3)</option>
                    <option value="update_contact_field">Update Contact Field / Variable</option>
                    <option value="condition">Conditional IF / THEN Branch</option>
                  </select>
                </div>

                {actionType === "send_text" && (
                  <div>
                    <label className="block text-slate-600 mb-1">Message Content (Supports &#123;&#123;name&#125;&#125; variables)</label>
                    <textarea
                      required
                      rows={3}
                      value={textPayload}
                      onChange={(e) => setTextPayload(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                      placeholder="Welcome to our business! How can we assist you today?"
                    ></textarea>
                  </div>
                )}

                {actionType === "send_interactive_buttons" && (
                  <>
                    <div>
                      <label className="block text-slate-600 mb-1">Prompt Body Text</label>
                      <input
                        type="text"
                        value={textPayload}
                        onChange={(e) => setTextPayload(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                        placeholder="Please choose a slot:"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Buttons (Comma-separated, max 3)</label>
                      <input
                        type="text"
                        value={buttonOptions}
                        onChange={(e) => setButtonOptions(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                        placeholder="6:00 PM, 7:00 PM, 8:00 PM"
                      />
                    </div>
                  </>
                )}

                {actionType === "update_contact_field" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-600 mb-1">Field Name</label>
                      <input
                        type="text"
                        value={updateFieldName}
                        onChange={(e) => setUpdateFieldName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono"
                        placeholder="booking_date"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Value to Set</label>
                      <input
                        type="text"
                        value={updateFieldValue}
                        onChange={(e) => setUpdateFieldValue(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                        placeholder="Tomorrow 7:00 PM"
                      />
                    </div>
                  </div>
                )}

                {actionType === "condition" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">IF Field</label>
                        <input
                          type="text"
                          value={conditionField}
                          onChange={(e) => setConditionField(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">Operator</label>
                        <select
                          value={conditionOperator}
                          onChange={(e) => setConditionOperator(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-2 py-1.5 bg-white text-xs"
                        >
                          <option value="==">equals (==)</option>
                          <option value="!=">not equals (!=)</option>
                          <option value="contains">contains</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 font-bold uppercase">Value</label>
                        <input
                          type="text"
                          value={conditionValue}
                          onChange={(e) => setConditionValue(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-emerald-700">THEN: Send Message</label>
                      <input
                        type="text"
                        value={conditionReplyTrue}
                        onChange={(e) => setConditionReplyTrue(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600">ELSE: Send Message</label>
                      <input
                        type="text"
                        value={conditionReplyFalse}
                        onChange={(e) => setConditionReplyFalse(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving Flow..." : "Save Automation"}
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
