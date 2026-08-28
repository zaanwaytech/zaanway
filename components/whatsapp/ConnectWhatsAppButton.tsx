"use client";

import { useEffect, useState } from "react";
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

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (
        event.origin !== "https://www.facebook.com" &&
        event.origin !== "https://web.facebook.com"
      ) {
        return;
      }

      try {
        const data =
          typeof event.data === "string"
            ? JSON.parse(event.data)
            : event.data;

        console.log("Meta Embedded Signup:", data);

        if (
          data?.type === "WA_EMBEDDED_SIGNUP" &&
          data?.event === "FINISH"
        ) {
          const code = sessionStorage.getItem("wa_code");

          if (!code) {
            alert("Authorization code not found.");
            return;
          }

          setLoading(true);

          const res = await fetch("/api/whatsapp/connect", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code,
              businessId: data.data.business_id,
              wabaId: data.data.waba_id,
              phoneNumberId: data.data.phone_number_id,
            }),
          });

          const result = await res.json();

          console.log(result);

          setLoading(false);

          if (result.success) {
            setConnected(true);
            sessionStorage.removeItem("wa_code");
            alert("🎉 WhatsApp Connected Successfully!");
            if (onConnectSuccess) {
              onConnectSuccess(result.account);
            }
          } else {
            alert(result.message || "Connection failed");
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onConnectSuccess]);

  const connectWhatsApp = () => {
    if (!window.FB) {
      alert("Facebook SDK not loaded.");
      return;
    }

    setLoading(true);

    window.FB.login(
      (response: { authResponse?: { code: string } }) => {
        setLoading(false);

        console.log("Facebook Response:", response);

        if (!response.authResponse?.code) {
          alert("User cancelled login");
          return;
        }

        const code = response.authResponse.code;

        console.log("Authorization Code:", code);

        // Save temporarily until signup finishes
        sessionStorage.setItem("wa_code", code);

        console.log("Waiting for Embedded Signup FINISH event...");
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