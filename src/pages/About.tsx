import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function About() {
  const aboutText = useQuery(api.siteContent.get, { key: "about" });
  const sendMessage = useMutation(api.messages.send);

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;

    setStatus("sending");
    try {
      await sendMessage(form);
      setStatus("sent");
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <article className="max-w-3xl mx-auto px-8 lg:px-12 py-16 opacity-0 animate-fade-in">
      {/* Page header */}
      <header className="mb-12">
        <h1
          className="
            font-[var(--font-serif)] text-[2.5rem] lg:text-[3rem]
            font-light tracking-[0.01em] leading-tight
          "
        >
          About
        </h1>
        <div className="mt-6 h-[1px] w-16 bg-[var(--color-gallery-border)]" />
      </header>

      {/* About content */}
      <section className="mb-20">
        {aboutText ? (
          <div className="space-y-6">
            {aboutText.split("\n").filter(p => p.trim()).map((p, i) => (
              <p
                key={i}
                className="
                  text-[1rem] leading-[1.8] font-light
                  text-[var(--color-gallery-muted)]
                "
              >
                {p}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-[1rem] leading-[1.8] font-light text-[var(--color-gallery-muted)]">
            Welcome to my gallery.
          </p>
        )}
      </section>

      {/* Contact section */}
      <section
        className="
          pt-16
          border-t border-[var(--color-gallery-border-light)]
        "
      >
        <header className="mb-10">
          <h2
            className="
              font-[var(--font-serif)] text-[1.75rem]
              font-light tracking-[0.01em]
            "
          >
            Get in Touch
          </h2>
          <p
            className="
              mt-3 text-[0.9rem] font-light
              text-[var(--color-gallery-muted)]
            "
          >
            I'd love to hear from you
          </p>
        </header>

        {status === "sent" ? (
          <div
            className="
              py-12 px-8
              bg-[var(--color-gallery-surface)]
              border border-[var(--color-gallery-border-light)]
              text-center
              opacity-0 animate-fade-in
            "
          >
            <p
              className="
                text-[1rem] font-light
                text-[var(--color-gallery-text)]
              "
            >
              Thank you for your message
            </p>
            <p
              className="
                mt-2 text-[0.85rem] font-light
                text-[var(--color-gallery-muted)]
              "
            >
              I'll be in touch soon
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8 max-w-lg">
            {/* Name field */}
            <div>
              <label
                className="
                  block text-[0.7rem] tracking-[0.15em] uppercase
                  text-[var(--color-gallery-subtle)]
                  font-light mb-3
                "
              >
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="
                  w-full px-0 py-3
                  bg-transparent
                  border-0 border-b border-[var(--color-gallery-border)]
                  text-[0.95rem] font-light
                  placeholder:text-[var(--color-gallery-subtle)]
                  focus:outline-none focus:border-[var(--color-gallery-text)]
                  input-elegant
                "
                placeholder="Your name"
              />
            </div>

            {/* Email field */}
            <div>
              <label
                className="
                  block text-[0.7rem] tracking-[0.15em] uppercase
                  text-[var(--color-gallery-subtle)]
                  font-light mb-3
                "
              >
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="
                  w-full px-0 py-3
                  bg-transparent
                  border-0 border-b border-[var(--color-gallery-border)]
                  text-[0.95rem] font-light
                  placeholder:text-[var(--color-gallery-subtle)]
                  focus:outline-none focus:border-[var(--color-gallery-text)]
                  input-elegant
                "
                placeholder="your@email.com"
              />
            </div>

            {/* Message field */}
            <div>
              <label
                className="
                  block text-[0.7rem] tracking-[0.15em] uppercase
                  text-[var(--color-gallery-subtle)]
                  font-light mb-3
                "
              >
                Message
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                rows={5}
                className="
                  w-full px-0 py-3
                  bg-transparent
                  border-0 border-b border-[var(--color-gallery-border)]
                  text-[0.95rem] font-light leading-relaxed
                  placeholder:text-[var(--color-gallery-subtle)]
                  focus:outline-none focus:border-[var(--color-gallery-text)]
                  input-elegant resize-none
                "
                placeholder="Your message..."
              />
            </div>

            {/* Submit button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={status === "sending"}
                className="
                  group relative inline-flex items-center
                  px-8 py-3.5
                  bg-[var(--color-gallery-text)]
                  text-[var(--color-gallery-surface)]
                  text-[0.75rem] tracking-[0.15em] uppercase font-light
                  disabled:opacity-40
                  transition-all duration-300
                  hover:bg-[var(--color-gallery-accent)]
                  focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-gallery-text)]
                "
              >
                <span className="relative z-10">
                  {status === "sending" ? "Sending..." : "Send Message"}
                </span>
                {status !== "sending" && (
                  <span
                    className="
                      ml-3 inline-block w-4 h-[1px] bg-current
                      transition-transform duration-300
                      group-hover:translate-x-1
                    "
                  />
                )}
              </button>
            </div>

            {/* Error message */}
            {status === "error" && (
              <p
                className="
                  text-[0.85rem] font-light
                  text-red-600
                  opacity-0 animate-fade-in
                "
              >
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        )}
      </section>
    </article>
  );
}
