import {
  FaBullseye,
  FaEye,
  FaHandshake,
  FaCheckCircle,
} from "react-icons/fa";

export const metadata = {
  title: "About | Zaanway",
  description:
    "Learn about Zaanway, our mission, vision, and commitment to delivering innovative digital solutions.",
};

export default function AboutPage() {
  const values = [
    {
      icon: <FaCheckCircle className="text-3xl text-blue-600" />,
      title: "Innovation",
      description:
        "We create modern digital solutions using the latest technologies.",
    },
    {
      icon: <FaHandshake className="text-3xl text-blue-600" />,
      title: "Trust",
      description:
        "Building long-term relationships through transparency and reliability.",
    },
    {
      icon: <FaCheckCircle className="text-3xl text-blue-600" />,
      title: "Quality",
      description:
        "Delivering high-quality products that meet business needs.",
    },
  ];

  return (
    <main className="bg-gray-50">

      {/* Hero */}
      <section className="bg-blue-700 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">

          <h1 className="text-5xl font-bold">
            About Zaanway
          </h1>

          <p className="mt-6 text-lg text-blue-100 max-w-3xl mx-auto">
            We help businesses embrace digital transformation through
            web development, AI-powered solutions, automation, and
            business messaging technologies.
          </p>

        </div>
      </section>

      {/* Company */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">

          <div className="grid md:grid-cols-2 gap-12">

            <div>
              <h2 className="text-3xl font-bold mb-6">
                Who We Are
              </h2>

              <p className="text-gray-600 leading-8">
                Zaanway is a technology company focused on creating
                innovative digital solutions for businesses of all sizes.
                We specialize in web development, AI-powered automation,
                WhatsApp Business integrations, and software solutions
                that improve efficiency and customer engagement.
              </p>

              <p className="text-gray-600 leading-8 mt-6">
                Our goal is to help organizations adopt modern
                technologies that simplify operations and support
                long-term growth.
              </p>
            </div>

            <div className="space-y-8">

              <div className="bg-white rounded-xl shadow p-8">
                <FaBullseye className="text-4xl text-blue-600 mb-4" />

                <h3 className="text-2xl font-semibold">
                  Our Mission
                </h3>

                <p className="text-gray-600 mt-3">
                  To empower businesses through innovative,
                  secure, and scalable digital solutions.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow p-8">
                <FaEye className="text-4xl text-blue-600 mb-4" />

                <h3 className="text-2xl font-semibold">
                  Our Vision
                </h3>

                <p className="text-gray-600 mt-3">
                  To become a trusted technology partner for businesses
                  seeking digital transformation and sustainable growth.
                </p>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Core Values */}
      <section className="bg-white py-20">

        <div className="max-w-6xl mx-auto px-6">

          <h2 className="text-4xl font-bold text-center">
            Our Core Values
          </h2>

          <p className="text-gray-600 text-center mt-4">
            These values guide everything we do.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-14">

            {values.map((value, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-8 shadow hover:shadow-lg transition"
              >
                {value.icon}

                <h3 className="text-2xl font-semibold mt-5">
                  {value.title}
                </h3>

                <p className="text-gray-600 mt-4">
                  {value.description}
                </p>
              </div>
            ))}

          </div>

        </div>

      </section>

      {/* Closing */}
      <section className="bg-blue-700 text-white py-20">

        <div className="max-w-4xl mx-auto text-center px-6">

          <h2 className="text-4xl font-bold">
            Building the Future Together
          </h2>

          <p className="mt-6 text-blue-100 text-lg">
            At Zaanway, we believe technology should simplify business,
            improve customer experiences, and create opportunities for growth.
          </p>

        </div>

      </section>

    </main>
  );
}