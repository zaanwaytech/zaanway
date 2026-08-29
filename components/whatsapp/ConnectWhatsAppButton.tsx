"use client";

import { useEffect, useState, useRef } from "react";
import { FaWhatsapp } from "react-icons/fa";

declare global {
  interface Window {
    FB: {
      init: (options: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: { authResponse?: { code: string } }) => void,
        options: Record<string, unknown>
      ) => void;
    };
  }
}

const CONFIG_ID = process.env.NEXT_PUBLIC_META_CONFIG_ID || "1995892224390931";

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

  const waCodeRef = useRef<string | null>(null);
  const waDataRef = useRef<any | null>(null);

  const processConnection = async () => {
    const code = waCodeRef.current || sessionStorage.getItem("wa_code");
    const data = waDataRef.current;

    if (!code || !data) {
      return; // Wait until both are available
    }

    setLoading(true);

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
      console.log(result);
      setLoading(false);

      if (result.success) {
        setConnected(true);
        sessionStorage.removeItem("wa_code");
        waCodeRef.current = null;
        waDataRef.current = null;
        alert("🎉 WhatsApp Connected Successfully!");
        if (onConnectSuccess) {
          onConnectSuccess(result.account);
        }
      } else {
        alert(result.message || "Connection failed");
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }

      try {
        let data = event.data;
        if (typeof event.data === "string") {
          // ignore non-JSON messages like "cb=f00aa34..." safely
          try {
            data = JSON.parse(event.data);
          } catch (e) {
            return;
          }
        }

        if (data?.type === "WA_EMBEDDED_SIGNUP" && data?.event === "FINISH") {
          console.log("Meta Embedded Signup FINISH event received:", data);
          waDataRef.current = data.data;
          processConnection();
        }
      } catch (err) {
        console.error(err);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onConnectSuccess]);

  const connectWhatsApp = () => {
    if (!window.FB) {
      alert("Facebook SDK not loaded.");
      return;
    }

    setLoading(true);
    waCodeRef.current = null;
    waDataRef.current = null;

    window.FB.login(
      (response: { authResponse?: { code: string } }) => {
        console.log("Facebook Response:", response);
        
        if (!response.authResponse?.code) {
          setLoading(false);
          alert("User cancelled login");
          return;
        }

        const code = response.authResponse.code;
        console.log("Authorization Code received.");
        
        waCodeRef.current = code;
        sessionStorage.setItem("wa_code", code);
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
    <div className="space-y-5">
      <button
        onClick={connectWhatsApp}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 transition-all text-white px-8 py-4 rounded-xl flex items-center gap-3 disabled:opacity-50"
      >
        <FaWhatsapp size={22} />
        {loading ? "Opening Meta..." : "Connect WhatsApp"}
      </button>

      {connected && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4">
          <p className="font-semibold text-green-700">
            ✅ WhatsApp Connected Successfully
          </p>
        </div>
      )}
    </div>
  );
}