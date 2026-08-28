"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    fbAsyncInit: () => void;
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

export default function FacebookSDK() {
  useEffect(() => {
    if (document.getElementById("facebook-jssdk")) return;

    window.fbAsyncInit = function () {
      window.FB.init({
        appId: "1020860290572585",
        cookie: true,
        xfbml: false,
        version: "v23.0",
      });

      console.log("✅ Facebook SDK Ready");
    };

    const script = document.createElement("script");

    script.id = "facebook-jssdk";

    script.async = true;

    script.defer = true;

    script.crossOrigin = "anonymous";

    script.src = "https://connect.facebook.net/en_US/sdk.js";

    document.body.appendChild(script);
  }, []);

  return null;
}