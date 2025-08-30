import { useState, useEffect } from "react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie_consent", "true");
    setVisible(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("cookie_consent", "false");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-100 border border-gray-200 shadow-xl rounded-2xl p-5 w-[90%] max-w-md z-50">
      <div className="flex flex-col gap-3 text-center">
        <p className="text-sm text-gray-800">
          Tento web používá cookies pro zlepšení uživatelského zážitku a
          analýzu provozu.{" "}
          <a href="/gdpr" className="underline text-teal-800">
            Více informací
          </a>
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={rejectCookies}
            className="px-4 py-2 rounded-2xl bg-teal-800 text-white hover:bg-teal-600 transition"
          >
            Odmítnout
          </button>
          <button
            onClick={acceptCookies}
            className="px-4 py-2 rounded-2xl bg-teal-800 text-white hover:bg-teal-600 transition"
          >
            Souhlasím
          </button>
        </div>
      </div>
    </div>
  );
}