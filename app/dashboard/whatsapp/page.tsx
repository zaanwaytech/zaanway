"use client";

import React, { useState, useEffect, useCallback } from "react";
import { FaWhatsapp, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import ConnectWhatsAppButton from "@/components/whatsapp/ConnectWhatsAppButton";
import FacebookSDK from "@/components/FacebookSDK";

export default function WhatsAppConnectionPage() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<{
    connected: boolean;
    displayPhoneNumber?: string;
    verifiedName?: string;
    wabaId?: string;
    phoneNumberId?: string;
    error?: { message?: string; [key: string]: unknown } | null;
  } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const fetchStatus = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      if (meData.success && meData.activeWorkspace) {
        const res = await fetch(`/api/whatsapp/status?userId=${meData.user.id}`);
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error("Failed to load connection status:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDisconnect = async () => {
    if (!confirm("Are you sure you want to disconnect and delete this WhatsApp number?")) return;
    try {
      setDisconnecting(true);
      const res = await fetch("/api/whatsapp/disconnect", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStatus(null);
        fetchStatus(true);
      } else {
        alert(data.message || "Failed to disconnect");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while disconnecting.");
    } finally {
      setDisconnecting(false);
    }
  };

  useEffect(() => {
    fetchStatus(false);
  }, [fetchStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <FacebookSDK />
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">WhatsApp Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your WhatsApp Business connection and API configuration.
        </p>
      </div>

      {/* Connection Panel */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition duration-200">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <FaWhatsapp className="w-8 h-8 text-emerald-500" />
          <div>
            <h2 className="text-xl font-bold text-slate-800 font-sans">WhatsApp Business Profile</h2>
            <p className="text-xs text-slate-400">Meta API Channel Integration</p>
          </div>
        </div>

        {/* Connection Status Detail */}
        <div className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-3">
              {status?.connected ? (
                <FaCheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
              ) : (
                <FaExclamationCircle className="w-6 h-6 text-slate-300 flex-shrink-0" />
              )}
              <div>
                <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Status</div>
                <div className="font-bold text-slate-800 text-sm">
                  {status?.connected ? "Connected" : "Not Connected"}
                </div>
              </div>
            </div>

            {!status?.connected && !status?.error && (
              <ConnectWhatsAppButton
                onConnectSuccess={() => fetchStatus(true)}
              />
            )}

            {status?.connected && (
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 font-semibold text-sm rounded-xl transition duration-200 disabled:opacity-50"
              >
                {disconnecting ? "Disconnecting..." : "Disconnect Number"}
              </button>
            )}
          </div>

          {status?.error && (
            <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-2xl p-4 mt-4">
              <strong>Meta API Error:</strong> {status.error.message || JSON.stringify(status.error)}
              <br/>
              <span className="text-slate-600 mt-2 block">
                This usually means your Meta WhatsApp account is restricted, unverified, or the access token lacks permissions. You may need to verify your business in Meta Business Suite or try reconnecting.
              </span>
              <div className="mt-4">
                <ConnectWhatsAppButton onConnectSuccess={() => fetchStatus(true)} />
              </div>
            </div>
          )}

          {/* Connection Profile Details */}
          {status?.connected && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Business Name</div>
                <div className="font-bold text-slate-700 text-sm mt-1">{status.verifiedName || "My Business"}</div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Number</div>
                <div className="font-bold text-slate-700 text-sm mt-1">{status.displayPhoneNumber}</div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">WhatsApp Business Account ID (WABA)</div>
                <div className="font-mono text-slate-700 text-xs mt-1">{status.wabaId}</div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Number ID</div>
                <div className="font-mono text-slate-700 text-xs mt-1">{status.phoneNumberId}</div>
              </div>
            </div>
          )}

          {!status?.connected && (
            <div className="text-xs text-slate-400 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
              <strong>Info:</strong> When you click the <em>Connect WhatsApp</em> button, Meta Embedded Signup loads to link your WhatsApp Business profile and automatically configures incoming webhooks.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
