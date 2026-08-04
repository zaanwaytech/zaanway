import "./globals.css";


export const metadata = {
  title: "Zaanway",
  description:
    "Zaanway provides web development, AI solutions, WhatsApp Business API integration, automation, and digital transformation services.",
  keywords: [
    "Zaanway",
    "Web Development",
    "AI Solutions",
    "WhatsApp Business API",
    "Automation",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}