import Link from "next/link";
import {
  FaRobot,
  FaCode,
  FaWhatsapp,
  FaCloud,
  FaShieldAlt,
  FaBolt,
} from "react-icons/fa";

export default function Home() {
  const services = [
    {
      icon: <FaCode className="text-4xl text-blue-600" />,
      title: "Web Development",
      desc: "Modern websites and web applications built with the latest technologies.",
    },
    {
      icon: <FaRobot className="text-4xl text-blue-600" />,
      title: "AI Solutions",
      desc: "AI-powered automation and intelligent business tools.",
    },
    {
      icon: <FaWhatsapp className="text-4xl text-blue-600" />,
      title: "WhatsApp API",
      desc: "Business messaging and chatbot integrations using the WhatsApp Business Platform.",
    },
    {
      icon: <FaCloud className="text-4xl text-blue-600" />,
      title: "Cloud Solutions",
      desc: "Scalable cloud deployments for reliable and secure applications.",
    },
  ];

  const features = [
    {
      icon: <FaShieldAlt className="text-3xl text-green-600" />,
      title: "Secure",
      desc: "Built with security best practices.",
    },
    {
      icon: <FaBolt className="text-3xl text-yellow-500" />,
      title: "Fast",
      desc: "High-performance modern web applications.",
    },
    {
      icon: <FaRobot className="text-3xl text-blue-600" />,
      title: "Smart",
      desc: "AI-driven automation for better productivity.",
    },
  ];

  return (
    <main>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-28">

          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Empowering Businesses Through
            <br />
            Digital Innovation
          </h1>

          <p className="mt-6 text-lg text-blue-100 max-w-3xl">
            Zaanway delivers modern websites, AI-powered solutions,
            business automation, and WhatsApp Business API integrations
            to help organizations grow efficiently.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/contact"
              className="bg-white text-blue-700 px-7 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Contact Us
            </Link>

            <Link
              href="/about"
              className="border border-white px-7 py-3 rounded-lg hover:bg-white hover:text-blue-700 transition"
            >
              Learn More
            </Link>
          </div>

        </div>
      </section>

      {/* Services */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-4xl font-bold text-center">
            Our Services
          </h2>

          <p className="text-gray-600 text-center mt-4">
            Innovative digital solutions tailored for modern businesses.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-14">

            {services.map((service, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-8 shadow hover:shadow-xl transition"
              >
                {service.icon}

                <h3 className="text-xl font-bold mt-6">
                  {service.title}
                </h3>

                <p className="text-gray-600 mt-3">
                  {service.desc}
                </p>
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gray-100 py-24">

        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-4xl font-bold text-center">
            Why Choose Zaanway?
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mt-16">

            {features.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-8 shadow"
              >
                {item.icon}

                <h3 className="text-2xl font-semibold mt-5">
                  {item.title}
                </h3>

                <p className="text-gray-600 mt-3">
                  {item.desc}
                </p>
              </div>
            ))}

          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="py-24 bg-blue-700 text-white">

        <div className="max-w-5xl mx-auto text-center px-6">

          <h2 className="text-4xl font-bold">
            Ready to Transform Your Business?
          </h2>

          <p className="mt-5 text-blue-100 text-lg">
            Let's build innovative digital solutions together.
          </p>

          <Link
            href="/contact"
            className="inline-block mt-8 bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Get in Touch
          </Link>

        </div>

      </section>

    </main>
  );
}