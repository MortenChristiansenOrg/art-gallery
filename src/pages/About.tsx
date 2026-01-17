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
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="font-[var(--font-serif)] text-4xl mb-8">About</h1>

      {aboutText ? (
        <div className="prose prose-neutral max-w-none mb-16">
          {aboutText.split("\n").map((p, i) => (
            <p key={i} className="text-[var(--color-gallery-muted)] leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      ) : (
        <p className="text-[var(--color-gallery-muted)] mb-16">
          Welcome to my gallery.
        </p>
      )}

      <div className="border-t border-[var(--color-gallery-border)] pt-12">
        <h2 className="font-[var(--font-serif)] text-2xl mb-6">Contact</h2>

        {status === "sent" ? (
          <p className="text-[var(--color-gallery-muted)]">
            Thank you for your message. I'll be in touch soon.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm mb-2">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="w-full px-4 py-3 border border-[var(--color-gallery-border)] bg-transparent focus:outline-none focus:border-[var(--color-gallery-text)]"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full px-4 py-3 border border-[var(--color-gallery-border)] bg-transparent focus:outline-none focus:border-[var(--color-gallery-text)]"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Message</label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
                rows={5}
                className="w-full px-4 py-3 border border-[var(--color-gallery-border)] bg-transparent focus:outline-none focus:border-[var(--color-gallery-text)] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="px-8 py-3 bg-[var(--color-gallery-text)] text-[var(--color-gallery-bg)] text-sm uppercase tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {status === "sending" ? "Sending..." : "Send"}
            </button>

            {status === "error" && (
              <p className="text-red-600 text-sm">
                Something went wrong. Please try again.
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
