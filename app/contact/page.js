"use client";

import { useState } from "react";
import {
  FaEnvelope,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const message = `*📩 New Contact Form Submission*

👤 *Name:* ${form.name}

📧 *Email:* ${form.email}

📝 *Subject:* ${form.subject}

💬 *Message:*
${form.message}
`;

    const phone = "919633663256";

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");

    setForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    });
  };

  return (
    <main className="bg-gray-50">
      {/* Hero */}
      <section className="bg-blue-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold">Contact Us</h1>

          <p className="mt-5 text-blue-100 text-lg">
            We'd love to hear from you. Reach out using the information
            below.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-10">
            {/* Left */}
            <div className="space-y-6">
              <div className="bg-white shadow rounded-xl p-6 flex gap-5">
                <FaEnvelope className="text-3xl text-blue-600 mt-1" />

                <div>
                  <h3 className="font-bold text-xl">Email</h3>

                  <p className="text-gray-600 mt-2">
                    zaanway.tech@gmail.com
                  </p>
                </div>
              </div>

              <div className="bg-white shadow rounded-xl p-6 flex gap-5">
                <FaWhatsapp className="text-3xl text-green-600 mt-1" />

                <div>
                  <h3 className="font-bold text-xl">
                    WhatsApp
                  </h3>

                  <a
                    href="https://wa.me/919633663256"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 hover:underline mt-2 block"
                  >
                    +91 96336 63256
                  </a>
                </div>
              </div>

              <div className="bg-white shadow rounded-xl p-6 flex gap-5">
                <FaMapMarkerAlt className="text-3xl text-red-500 mt-1" />

                <div>
                  <h3 className="font-bold text-xl">
                    Office
                  </h3>

                  <p className="text-gray-600 mt-2">
                    Kerala, India
                  </p>
                </div>
              </div>

              <div className="bg-white shadow rounded-xl p-6 flex gap-5">
                <FaClock className="text-3xl text-blue-600 mt-1" />

                <div>
                  <h3 className="font-bold text-xl">
                    Business Hours
                  </h3>

                  <p className="text-gray-600 mt-2">
                    Monday - Saturday
                  </p>

                  <p className="text-gray-600">
                    9:00 AM - 6:00 PM
                  </p>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="bg-white shadow rounded-xl p-8">
              <h2 className="text-3xl font-bold mb-8">
                Send a Message
              </h2>

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your Name"
                  required
                  className="w-full border rounded-lg p-4 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Your Email"
                  required
                  className="w-full border rounded-lg p-4 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Subject"
                  required
                  className="w-full border rounded-lg p-4 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <textarea
                  rows={6}
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Your Message"
                  required
                  className="w-full border rounded-lg p-4 outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  type="submit"
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold transition"
                >
                  Send via WhatsApp
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

    
    </main>
  );
}