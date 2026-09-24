"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { FaWhatsapp } from "react-icons/fa";

interface EmbeddedSignupData {
  business_id?: string;
  waba_id?: string;
  phone_number_id?: string;
}

const CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID || "1405070211688783";

export default function ConnectWhatsAppButton({
  onConnectSuccess,
}: {
  onConnectSuccess?: (account: {
    wabaId: string;
    phoneNumberId: string;
    displayPhoneNumber: string;
  }) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const waCodeRef = useRef<string | null>(null);
  const waDataRef = useRef<EmbeddedSignupData | null>(null);

  const processConnection = useCallback(async () => {
    const code = waCodeRef.current;
    const data = waDataRef.current;

    if (!code || !data) {
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/whatsapp/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          businessId: data.business_id,
          wabaId: data.waba_id,
          phoneNumberId: data.phone_number_id,
        }),
      });

      const result = await res.json();
      setLoading(false);

      if (result.success) {
        setConnected(true);
        waCodeRef.current = null;
        waDataRef.current = null;
        if (onConnectSuccess) {
          onConnectSuccess(result.account);
        }
      } else {
        setErrorMsg(result.message || "Connection failed. Please try again.");
      }
    } catch (err: unknown) {
      console.error("[META_CONNECT_ERROR]", err);
      setErrorMsg("A network error occurred while connecting. Please try again.");
      setLoading(false);
    }
  }, [onConnectSuccess]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }

      try {
        let data = event.data;
        if (typeof event.data === "string") {
          try {
            data = JSON.parse(event.data);
          } catch {
            return;
          }
        }

        if (data?.type === "WA_EMBEDDED_SIGNUP" && data?.event === "FINISH") {
          console.log("[META_EMBEDDED_SIGNUP] FINISH event received");
          waDataRef.current = data.data as EmbeddedSignupData;
          processConnection();
        }
      } catch (err) {
        console.error("[META_EVENT_PARSE_ERROR]", err);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [processConnection]);

  const connectWhatsApp = () => {
    if (!window.FB) {
      alert("Meta Facebook SDK is still loading. Please try again in a few seconds.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    waCodeRef.current = null;
    waDataRef.current = null;

    window.FB.login(
      (response: { authResponse?: { code: string } }) => {
        if (!response.authResponse?.code) {
          setLoading(false);
          setErrorMsg("Meta authorization was cancelled or not completed.");
          return;
        }

        const code = response.authResponse.code;
        waCodeRef.current = code;
        processConnection();
      },
      {
        config_id: CONFIG_ID,
        response_type: "code",
        override_default_response_type: true,
        auth_type: "rerequest",
        extras: {
          sessionInfoVersion: 3,
          version: 4,
          setup: {},
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <button
        onClick={connectWhatsApp}
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700 transition-all text-white font-bold px-7 py-3.5 rounded-2xl flex items-center gap-3 shadow-md hover:shadow-lg disabled:opacity-50 text-sm cursor-pointer"
      >
        <FaWhatsapp size={20} />
        {loading ? "Connecting to Meta..." : "Connect WhatsApp"}
      </button>

      {errorMsg && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 font-medium">
          {errorMsg}
        </div>
      )}

      {connected && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-bold">
          WhatsApp Connected Successfully!
        </div>
      )}
    </div>
  );
}