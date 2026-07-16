export const metadata = {
  title: "Privacy Policy | Zaanway",
  description:
    "Read the Privacy Policy of Zaanway and learn how we collect, use, and protect your information.",
};

export default function PrivacyPage() {
  return (
    <main className="bg-gray-50">

      {/* Hero */}
      <section className="bg-blue-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">

          <h1 className="text-5xl font-bold">
            Privacy Policy
          </h1>

          <p className="mt-5 text-blue-100 text-lg">
            Your privacy is important to us.
          </p>

        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 bg-white shadow rounded-xl p-10 space-y-10">

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Introduction
            </h2>

            <p className="text-gray-600 leading-8">
              Zaanway is committed to protecting the privacy of our
              customers, website visitors, and business partners.
              This Privacy Policy explains how we collect, use,
              disclose, and protect your information when you visit
              our website or use our services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Information We Collect
            </h2>

            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Name and contact information you provide.</li>
              <li>Email address and phone number.</li>
              <li>Business information shared with us.</li>
              <li>Messages submitted through our contact form.</li>
              <li>Technical information such as browser type and device information.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              How We Use Your Information
            </h2>

            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Provide and improve our services.</li>
              <li>Respond to customer inquiries.</li>
              <li>Communicate regarding projects and support.</li>
              <li>Maintain website security.</li>
              <li>Comply with applicable legal requirements.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Data Protection
            </h2>

            <p className="text-gray-600 leading-8">
              We implement appropriate technical and organizational
              security measures to protect your information against
              unauthorized access, disclosure, alteration, or destruction.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Third-Party Services
            </h2>

            <p className="text-gray-600 leading-8">
              Our website may integrate trusted third-party services
              such as hosting providers, analytics tools, cloud
              platforms, and communication services to support our
              business operations.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Your Rights
            </h2>

            <p className="text-gray-600 leading-8">
              You may request access to, correction of, or deletion of
              your personal information by contacting us using the
              details provided on our Contact page, subject to
              applicable laws.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Contact Us
            </h2>

            <p className="text-gray-600 leading-8">
              If you have any questions regarding this Privacy Policy,
              please contact us at:
            </p>

            <div className="mt-4 space-y-2">
              <p>
                <strong>Email:</strong> zaanway.tech@gmail.com
              </p>

              <p>
                <strong>WhatsApp:</strong> +91 91881 111585
              </p>

              <p>
                <strong>Company:</strong> Zaanway
              </p>
            </div>
          </div>

          <div className="border-t pt-6 text-sm text-gray-500">
            Last Updated: July 2026
          </div>

        </div>
      </section>

    </main>
  );
}