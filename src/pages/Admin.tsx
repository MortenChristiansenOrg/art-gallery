import { useState, useCallback, useTransition } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../lib/auth";
import { ArtworkForm, CollectionForm } from "../components/admin";
import type { Id } from "../../convex/_generated/dataModel";

type Tab = "artworks" | "collections" | "messages" | "content";

export function Admin() {
  const { isAuthenticated, token, login, logout } = useAuth();
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("artworks");
  const [showArtworkForm, setShowArtworkForm] = useState(false);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Id<"artworks"> | null>(null);
  const [editingCollection, setEditingCollection] = useState<Id<"collections"> | null>(null);
  const [collectionFilter, setCollectionFilter] = useState<Id<"collections"> | null>(null);
  const [draggedId, setDraggedId] = useState<Id<"artworks"> | null>(null);
  const [dropTargetId, setDropTargetId] = useState<Id<"artworks"> | null>(null);
  const [dropPosition, setDropPosition] = useState<"before" | "after" | null>(null);

  const collections = useQuery(api.collections.list);

  // Default to first collection if no filter set
  const activeFilter = collectionFilter ?? collections?.[0]?._id ?? null;

  const artworks = useQuery(
    api.artworks.list,
    activeFilter ? { publishedOnly: false, collectionId: activeFilter } : "skip"
  );
  const messages = useQuery(api.messages.list);
  const unreadCount = useQuery(api.messages.unreadCount);
  const aboutContent = useQuery(api.siteContent.get, { key: "about" });

  const deleteArtwork = useMutation(api.artworks.remove);
  const deleteCollection = useMutation(api.collections.remove);
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
          data-testid="login-form"
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
  const editCollectionItem = collections?.find((c) => c._id === editingCollection);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12" data-testid="admin-dashboard">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-[var(--font-serif)] text-2xl">Admin</h1>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm text-[var(--color-gallery-muted)] hover:text-[var(--color-gallery-text)] transition-colors duration-300">
            ← Gallery
          </Link>
          <button onClick={logout} className="text-sm text-[var(--color-gallery-muted)]" data-testid="logout-button">
            Logout
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-[var(--color-gallery-border)] mb-8" role="tablist">
        {(["artworks", "collections", "messages", "content"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            data-testid={`tab-${t}`}
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
              value={activeFilter ?? ""}
              onChange={(e) => setCollectionFilter(e.target.value as Id<"collections">)}
              className="px-3 py-2 border border-[var(--color-gallery-border)] bg-transparent text-sm"
              data-testid="collection-filter"
            >
              {collections?.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {isPending && (
              <span className="text-sm text-[var(--color-gallery-muted)]">Saving...</span>
            )}
          </div>

          <div className="space-y-1 min-h-[1px]" data-testid="artworks-list">
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
                  {artwork.thumbnailUrl ? (
                    <img
                      src={artwork.thumbnailUrl}
                      alt={artwork.title}
                      className="w-16 h-16 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-[var(--color-gallery-border)] flex items-center justify-center">
                      <svg className="w-6 h-6 text-[var(--color-gallery-muted)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
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

      {tab === "collections" && (
        <div>
          <button
            onClick={() => setShowCollectionForm(true)}
            className="mb-6 px-4 py-2 bg-[var(--color-gallery-text)] text-[var(--color-gallery-bg)] text-sm"
            data-testid="add-collection-button"
          >
            Add Collection
          </button>

          <div className="space-y-4 min-h-[1px]" data-testid="collections-list">
            {collections?.map((c) => (
              <div
                key={c._id}
                className="flex items-center gap-4 p-4 border border-[var(--color-gallery-border)]"
              >
                <div className="flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-[var(--color-gallery-muted)]">/{c.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCollection(c._id)}
                    className="text-sm underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this collection?") && token) {
                        deleteCollection({ token, id: c._id });
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
        <div className="space-y-4 min-h-[1px]" data-testid="messages-list">
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
          collectionId={activeFilter ?? undefined}
          onClose={() => {
            setShowArtworkForm(false);
            setEditingArtwork(null);
          }}
        />
      )}

      {(showCollectionForm || editingCollection) && (
        <CollectionForm
          collection={editCollectionItem}
          onClose={() => {
            setShowCollectionForm(false);
            setEditingCollection(null);
          }}
        />
      )}
    </div>
  );
}
