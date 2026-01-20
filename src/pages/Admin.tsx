import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/auth";
import { ArtworkForm, SeriesForm } from "../components/admin";
import type { Id } from "../../convex/_generated/dataModel";

type Tab = "artworks" | "series" | "messages" | "content";

export function Admin() {
  const { isAuthenticated, login, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("artworks");
  const [showArtworkForm, setShowArtworkForm] = useState(false);
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Id<"artworks"> | null>(null);
  const [editingSeries, setEditingSeries] = useState<Id<"series"> | null>(null);

  const artworks = useQuery(api.artworks.list, { publishedOnly: false });
  const series = useQuery(api.series.list);
  const messages = useQuery(api.messages.list);
  const unreadCount = useQuery(api.messages.unreadCount);
  const aboutContent = useQuery(api.siteContent.get, { key: "about" });

  const deleteArtwork = useMutation(api.artworks.remove);
  const deleteSeries = useMutation(api.series.remove);
  const deleteMessage = useMutation(api.messages.remove);
  const markMessageRead = useMutation(api.messages.markRead);
  const setContent = useMutation(api.siteContent.set);

  const [aboutText, setAboutText] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto px-6 py-20">
        <h1 className="font-[var(--font-serif)] text-2xl mb-6 text-center">Admin</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!login(password)) {
              alert("Invalid password");
            }
          }}
          className="space-y-4"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 border border-[var(--color-gallery-border)] bg-transparent"
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-[var(--color-gallery-text)] text-[var(--color-gallery-bg)]"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  const editArtwork = artworks?.find((a) => a._id === editingArtwork);
  const editSeriesItem = series?.find((s) => s._id === editingSeries);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[var(--font-serif)] text-2xl">Admin</h1>
        <button onClick={logout} className="text-sm text-[var(--color-gallery-muted)]">
          Logout
        </button>
      </div>

      <div className="flex gap-4 border-b border-[var(--color-gallery-border)] mb-8">
        {(["artworks", "series", "messages", "content"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm capitalize border-b-2 -mb-px transition-colors ${
              tab === t
                ? "border-[var(--color-gallery-text)]"
                : "border-transparent text-[var(--color-gallery-muted)]"
            }`}
          >
            {t}
            {t === "messages" && unreadCount ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {tab === "artworks" && (
        <div>
          <button
            onClick={() => setShowArtworkForm(true)}
            className="mb-6 px-4 py-2 bg-[var(--color-gallery-text)] text-[var(--color-gallery-bg)] text-sm"
          >
            Add Artwork
          </button>

          <div className="space-y-4">
            {artworks?.map((artwork) => (
              <div
                key={artwork._id}
                className="flex items-center gap-4 p-4 border border-[var(--color-gallery-border)]"
              >
                {artwork.imageUrl && (
                  <img
                    src={artwork.imageUrl}
                    alt={artwork.title}
                    className="w-16 h-16 object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium">{artwork.title}</p>
                  <div className="flex gap-2 text-sm">
                    <span className="text-[var(--color-gallery-muted)]">
                      {artwork.published ? "Published" : "Draft"}
                    </span>
                    {(!artwork.thumbnailId || artwork.dziStatus !== "complete") && (
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          artwork.dziStatus === "failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {artwork.dziStatus === "failed"
                          ? "Processing failed"
                          : artwork.dziStatus === "generating"
                            ? "Generating tiles..."
                            : "Processing..."}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingArtwork(artwork._id)}
                    className="text-sm underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this artwork?")) {
                        deleteArtwork({ id: artwork._id });
                      }
                    }}
                    className="text-sm text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "series" && (
        <div>
          <button
            onClick={() => setShowSeriesForm(true)}
            className="mb-6 px-4 py-2 bg-[var(--color-gallery-text)] text-[var(--color-gallery-bg)] text-sm"
          >
            Add Series
          </button>

          <div className="space-y-4">
            {series?.map((s) => (
              <div
                key={s._id}
                className="flex items-center gap-4 p-4 border border-[var(--color-gallery-border)]"
              >
                <div className="flex-1">
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-[var(--color-gallery-muted)]">/{s.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingSeries(s._id)}
                    className="text-sm underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this series?")) {
                        deleteSeries({ id: s._id });
                      }
                    }}
                    className="text-sm text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "messages" && (
        <div className="space-y-4">
          {messages?.length === 0 && (
            <p className="text-[var(--color-gallery-muted)]">No messages yet</p>
          )}
          {messages?.map((msg) => (
            <div
              key={msg._id}
              className={`p-4 border border-[var(--color-gallery-border)] ${
                !msg.read ? "bg-blue-50" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{msg.name}</p>
                  <p className="text-sm text-[var(--color-gallery-muted)]">{msg.email}</p>
                </div>
                <div className="flex gap-2">
                  {!msg.read && (
                    <button
                      onClick={() => markMessageRead({ id: msg._id })}
                      className="text-sm underline"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Delete this message?")) {
                        deleteMessage({ id: msg._id });
                      }
                    }}
                    className="text-sm text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm">{msg.message}</p>
              <p className="mt-2 text-xs text-[var(--color-gallery-muted)]">
                {new Date(msg.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === "content" && (
        <div>
          <h2 className="font-medium mb-4">About Page</h2>
          <textarea
            value={aboutText || aboutContent || ""}
            onChange={(e) => setAboutText(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 border border-[var(--color-gallery-border)] bg-transparent resize-none"
            placeholder="Enter about page content..."
          />
          <button
            onClick={() => {
              setContent({ key: "about", value: aboutText });
            }}
            className="mt-4 px-4 py-2 bg-[var(--color-gallery-text)] text-[var(--color-gallery-bg)] text-sm"
          >
            Save
          </button>
        </div>
      )}

      {(showArtworkForm || editingArtwork) && (
        <ArtworkForm
          artwork={editArtwork}
          onClose={() => {
            setShowArtworkForm(false);
            setEditingArtwork(null);
          }}
        />
      )}

      {(showSeriesForm || editingSeries) && (
        <SeriesForm
          series={editSeriesItem}
          onClose={() => {
            setShowSeriesForm(false);
            setEditingSeries(null);
          }}
        />
      )}
    </div>
  );
}
