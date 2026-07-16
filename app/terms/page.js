export const metadata = {
  title: "Terms & Conditions | Zaanway",
  description:
    "Read the Terms & Conditions governing the use of Zaanway's website and services.",
};

export default function TermsPage() {
  return (
    <main className="bg-gray-50">

      {/* Hero Section */}
      <section className="bg-blue-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold">
            Terms & Conditions
          </h1>

          <p className="mt-5 text-blue-100 text-lg">
            Please read these terms carefully before using our website and services.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto bg-white shadow rounded-xl p-10 space-y-10">

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Acceptance of Terms
            </h2>

            <p className="text-gray-600 leading-8">
              By accessing or using the Zaanway website, you agree to
              comply with these Terms & Conditions and all applicable
              laws and regulations.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Services
            </h2>

            <p className="text-gray-600 leading-8">
              Zaanway provides digital services including website
              development, AI-powered solutions, business automation,
              software development, cloud solutions, and WhatsApp
              Business API integration.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              User Responsibilities
            </h2>

            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Provide accurate information.</li>
              <li>Do not misuse our services.</li>
              <li>Do not attempt unauthorized access.</li>
              <li>Follow applicable laws while using our services.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Intellectual Property
            </h2>

            <p className="text-gray-600 leading-8">
              All website content, logos, graphics, software, text,
              and branding are the property of Zaanway unless
              otherwise stated. Unauthorized reproduction or
              distribution is prohibited.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Limitation of Liability
            </h2>

            <p className="text-gray-600 leading-8">
              Zaanway is not liable for indirect, incidental, or
              consequential damages arising from the use of our
              website or services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Changes to These Terms
            </h2>

            <p className="text-gray-600 leading-8">
              We may update these Terms & Conditions from time to
              time. Updated versions will be published on this page.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Governing Law
            </h2>

            <p className="text-gray-600 leading-8">
              These Terms & Conditions shall be governed by the laws
              of India.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">
              Contact Information
            </h2>

            <p className="text-gray-600">
              <strong>Company:</strong> Zaanway
            </p>

            <p className="text-gray-600">
              <strong>Email:</strong> zaanway.tech@gmail.com
            </p>

            <p className="text-gray-600">
              <strong>WhatsApp:</strong> +91 91881 111585
            </p>
          </div>

          <div className="border-t pt-6 text-sm text-gray-500">
            Last Updated: July 2026
          </div>

        </div>
      </section>

    </main>
  );
}