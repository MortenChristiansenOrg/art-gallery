import { useState, useRef, useCallback, useOptimistic, useTransition } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/auth";
import { ArtworkForm, SeriesForm } from "../components/admin";
import type { Id } from "../../convex/_generated/dataModel";

type Tab = "artworks" | "series" | "messages" | "content";

export function Admin() {
  const { isAuthenticated, token, login, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("artworks");
  const [showArtworkForm, setShowArtworkForm] = useState(false);
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Id<"artworks"> | null>(null);
  const [editingSeries, setEditingSeries] = useState<Id<"series"> | null>(null);
  const [seriesFilter, setSeriesFilter] = useState<Id<"series"> | "">("");
  const [draggedId, setDraggedId] = useState<Id<"artworks"> | null>(null);
  const [dropTargetId, setDropTargetId] = useState<Id<"artworks"> | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(null);

  const artworks = useQuery(api.artworks.list, {
    publishedOnly: false,
    seriesId: seriesFilter || undefined,
  });
  const series = useQuery(api.series.list);
  const messages = useQuery(api.messages.list);
  const unreadCount = useQuery(api.messages.unreadCount);
  const aboutContent = useQuery(api.siteContent.get, { key: "about" });

  const deleteArtwork = useMutation(api.artworks.remove);
  const deleteSeries = useMutation(api.series.remove);
  const deleteMessage = useMutation(api.messages.remove);
  const markMessageRead = useMutation(api.messages.markRead);
  const setContent = useMutation(api.siteContent.set);
  const reorderArtworks = useMutation(api.artworks.reorder);

  const [aboutText, setAboutText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleDragStart = useCallback((e: React.DragEvent, id: Id<"artworks">) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: Id<"artworks">) => {
    e.preventDefault();
    if (!draggedId || draggedId === id) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const position = e.clientY < midpoint ? "before" : "after";

    setDropTargetId(id);
    setDropPosition(position);
  }, [draggedId]);

  const handleDragLeave = useCallback(() => {
    setDropTargetId(null);
    setDropPosition(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedId || !dropTargetId || !artworks || !token) return;

    const dragIndex = artworks.findIndex(a => a._id === draggedId);
    let targetIndex = artworks.findIndex(a => a._id === dropTargetId);

    if (dropPosition === "after") targetIndex++;
    if (dragIndex < targetIndex) targetIndex--;

    if (dragIndex === targetIndex) {
      setDraggedId(null);
      setDropTargetId(null);
      setDropPosition(null);
      return;
    }

    // Reorder array
    const newOrder = [...artworks];
    const [moved] = newOrder.splice(dragIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    // Extract IDs for mutation
    const ids = newOrder.map(a => a._id);

    startTransition(async () => {
      try {
        await reorderArtworks({ token, ids });
      } catch (err) {
        console.error("Reorder failed:", err);
      }
    });

    setDraggedId(null);
    setDropTargetId(null);
    setDropPosition(null);
  }, [draggedId, dropTargetId, dropPosition, artworks, token, reorderArtworks]);

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
    setDropTargetId(null);
    setDropPosition(null);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="max-w-sm mx-auto px-6 py-20">
        <h1 className="font-[var(--font-serif)] text-2xl mb-6 text-center">Admin</h1>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setLoginError("");
            setLoginLoading(true);
            try {
              const success = await login(password);
              if (!success) {
                setLoginError("Invalid password");
              }
            } catch (err) {
              setLoginError(err instanceof Error ? err.message : "Login failed");
            } finally {
              setLoginLoading(false);
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
          {loginError && (
            <p className="text-red-600 text-sm">{loginError}</p>
          )}
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full px-4 py-3 bg-[var(--color-gallery-text)] text-[var(--color-gallery-bg)] disabled:opacity-50"
          >
            {loginLoading ? "Logging in..." : "Login"}
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
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setShowArtworkForm(true)}
              className="px-4 py-2 bg-[var(--color-gallery-text)] text-[var(--color-gallery-bg)] text-sm"
              data-testid="add-artwork-button"
            >
              Add Artwork
            </button>
            <select
              value={seriesFilter}
              onChange={(e) => setSeriesFilter(e.target.value as Id<"series"> | "")}
              className="px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm"
              data-testid="series-filter"
            >
              <option value="">All Artworks</option>
              {series?.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
            {isPending && (
              <span className="text-sm text-[var(--color-gallery-muted)]">Saving...</span>
            )}
          </div>

          <div className="space-y-1">
            {artworks?.map((artwork) => {
              const isDragging = draggedId === artwork._id;
              const isDropTarget = dropTargetId === artwork._id;

              return (
                <div
                  key={artwork._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, artwork._id)}
                  onDragOver={(e) => handleDragOver(e, artwork._id)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-4 p-4 border border-[var(--color-gallery-border)] cursor-grab active:cursor-grabbing transition-all ${
                    isDragging ? "opacity-50" : ""
                  } ${isDropTarget && dropPosition === "before" ? "border-t-2 border-t-blue-500" : ""} ${
                    isDropTarget && dropPosition === "after" ? "border-b-2 border-b-blue-500" : ""
                  }`}
                  data-testid={`artwork-row-${artwork._id}`}
                >
                  <div
                    className="flex items-center justify-center w-6 h-6 text-[var(--color-gallery-muted)] hover:text-[var(--color-gallery-text)]"
                    title="Drag to reorder"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <path d="M2 4h12v1H2zm0 3.5h12v1H2zm0 3.5h12v1H2z" />
                    </svg>
                  </div>
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
                        if (confirm("Delete this artwork?") && token) {
                          deleteArtwork({ token, id: artwork._id });
                        }
                      }}
                      className="text-sm text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
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
                      if (confirm("Delete this series?") && token) {
                        deleteSeries({ token, id: s._id });
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
                  {!msg.read && token && (
                    <button
                      onClick={() => markMessageRead({ token, id: msg._id })}
                      className="text-sm underline"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm("Delete this message?") && token) {
                        deleteMessage({ token, id: msg._id });
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
              if (token) {
                setContent({ token, key: "about", value: aboutText });
              }
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
