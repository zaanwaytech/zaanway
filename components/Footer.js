import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-24">
      <div className="max-w-7xl mx-auto px-6 py-14">

        <div className="grid md:grid-cols-3 gap-10">

          {/* Company */}
          <div>
            <h2 className="text-2xl font-bold text-white">
              Zaanway
            </h2>

            <p className="mt-4 text-gray-400 leading-7">
              Empowering businesses with innovative web development,
              AI solutions, automation, and WhatsApp Business API
              integrations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              Quick Links
            </h3>

            <div className="space-y-3">

              <Link href="/">Home</Link>

              <br />

              <Link href="/about">About</Link>

              <br />

              <Link href="/contact">Contact</Link>

              <br />

              <Link href="/privacy">Privacy Policy</Link>

              <br />

              <Link href="/terms">Terms & Conditions</Link>

            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">
              Contact
            </h3>

            <p>Email</p>

            <p className="mb-3">
              zaanway.tech@gmail.com
            </p>

            <p>Business Hours</p>

            <p>Monday - Saturday</p>

            <p>9:00 AM - 6:00 PM</p>
          </div>

        </div>

        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Zaanway. All Rights Reserved.
        </div>

      </div>
    </footer>
  );
}