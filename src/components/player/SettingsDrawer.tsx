'use client';

/**
 * SettingsDrawer — manage user-supplied custom mirror sources
 *
 * User can add their own mirror URLs (HLS, MP4, or embed URL templates)
 * which get saved to the Provider table as non-preset entries.
 *
 * Templates support placeholders: {animeId} {anilistId} {malId} {ep} {audio} {quality}
 *
 * Example URL templates the user might add:
 *   https://my-mirror.com/anime/{anilistId}/ep/{ep}/sub.m3u8
 *   https://my-server.com/{anilistId}/{ep}/{audio}.mp4
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, Server, Save, ExternalLink } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Provider } from '@/lib/streaming/types';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  onProvidersChanged?: () => void;
}

export function SettingsDrawer({ open, onClose, onProvidersChanged }: SettingsDrawerProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [label, setLabel] = useState('');
  const [urlTemplate, setUrlTemplate] = useState('');
  const [resolverType, setResolverType] = useState<'hls' | 'mp4' | 'embed'>('hls');
  const [supports, setSupports] = useState<'sub' | 'dub' | 'both'>('both');
  const [notes, setNotes] = useState('');

  const refreshProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/providers', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setProviders(data.providers);
    } catch {
      // ignore
    }
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Load providers (preset + custom) when drawer opens
  useEffect(() => {
    if (!open) return;
    // refreshProviders is async + setState happens after await — safe.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshProviders();
  }, [open, refreshProviders]);

  const handleAdd = async () => {
    if (!label.trim() || !urlTemplate.trim()) {
      toast.error('Label and URL template are required');
      return;
    }
    try {
      const body = {
        label: label.trim(),
        urlTemplate: urlTemplate.trim(),
        resolverType,
        supports:
          supports === 'both' ? ['sub', 'dub'] : [supports],
        notes: notes.trim() || undefined,
      };
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to add mirror');
        return;
      }
      toast.success(`Added "${label}"`);
      setLabel('');
      setUrlTemplate('');
      setNotes('');
      await refreshProviders();
      onProvidersChanged?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Network error');
    }
  };

  const handleDelete = async (id: string, codename: string) => {
    try {
      const res = await fetch(`/api/providers/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Failed to delete');
        return;
      }
      toast.success(`Removed ${codename}`);
      await refreshProviders();
      onProvidersChanged?.();
    } catch {
      toast.error('Network error');
    }
  };

  const presets = providers.filter((p) => p.isPreset);
  const customs = providers.filter((p) => !p.isPreset);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full sm:max-w-lg bg-card sm:rounded-2xl rounded-t-2xl border-t border-border sm:border shadow-2xl max-h-[92vh] overflow-y-auto scrollbar-thin"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur border-b border-border px-5 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">
                  Mirror Sources
                </h2>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-6">
              {/* ── Add new mirror form ─────────────────────────── */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Add Your Own Mirror
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground">Label</label>
                    <input
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. My Server"
                      className="mt-1 w-full rounded-lg bg-muted/50 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">
                      URL Template{' '}
                      <span className="text-muted-foreground/60">
                        (supports placeholders)
                      </span>
                    </label>
                    <input
                      value={urlTemplate}
                      onChange={(e) => setUrlTemplate(e.target.value)}
                      placeholder="https://my-server.com/{anilistId}/{ep}/{audio}.m3u8"
                      className="mt-1 w-full rounded-lg bg-muted/50 border border-border px-3 py-2 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <div className="mt-1.5 text-[10px] text-muted-foreground">
                      Placeholders: <code className="text-primary">{`{anilistId}`}</code>{' '}
                      <code className="text-primary">{`{malId}`}</code>{' '}
                      <code className="text-primary">{`{ep}`}</code>{' '}
                      <code className="text-primary">{`{audio}`}</code>{' '}
                      <code className="text-primary">{`{quality}`}</code>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Type</label>
                      <select
                        value={resolverType}
                        onChange={(e) => setResolverType(e.target.value as 'hls' | 'mp4' | 'embed')}
                        className="mt-1 w-full rounded-lg bg-muted/50 border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="hls">HLS (.m3u8)</option>
                        <option value="mp4">MP4 (direct)</option>
                        <option value="embed">Embed (iframe)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Audio</label>
                      <select
                        value={supports}
                        onChange={(e) => setSupports(e.target.value as 'sub' | 'dub' | 'both')}
                        className="mt-1 w-full rounded-lg bg-muted/50 border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="both">Sub + Dub</option>
                        <option value="sub">Sub only</option>
                        <option value="dub">Dub only</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground">Notes (optional)</label>
                    <input
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Soft sub, 1080p max"
                      className="mt-1 w-full rounded-lg bg-muted/50 border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <button
                    onClick={handleAdd}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    Add Mirror
                  </button>
                </div>
              </section>

              {/* ── Custom mirrors list ─────────────────────────── */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Your Custom Mirrors ({customs.length})
                </h3>
                {customs.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    <Plus className="h-6 w-6 mx-auto mb-2 opacity-40" />
                    No custom mirrors yet.
                    <br />
                    Add your first one above.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customs.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">
                            {p.displayName}
                          </div>
                          <div className="text-[11px] text-muted-foreground truncate font-mono">
                            {p.resolverEndpoint}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 flex gap-2">
                            <span className="uppercase text-primary">{p.resolverType}</span>
                            <span>·</span>
                            <span>{p.supports.join(' + ')}</span>
                            <span>·</span>
                            <span className={p.health === 'ok' ? 'text-green-500' : 'text-amber-500'}>
                              {p.health}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(p.id, p.codename)}
                          aria-label="Delete mirror"
                          className="rounded-lg p-2 text-muted-foreground hover:bg-red-500/15 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* ── Preset providers list (read-only) ──────────── */}
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Preset Providers ({presets.length})
                </h3>
                <div className="space-y-1.5">
                  {presets.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/30"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-foreground">
                          {p.displayName}
                          <span className="ml-2 text-[10px] text-muted-foreground uppercase">
                            {p.resolverType}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {p.description} · {p.supports.join(' + ')}
                        </div>
                      </div>
                      <div className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        p.health === 'ok' ? 'text-green-500 bg-green-500/10' :
                        p.health === 'degraded' ? 'text-amber-500 bg-amber-500/10' :
                        'text-red-500 bg-red-500/10'
                      }`}>
                        {p.health}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Help footer */}
              <div className="rounded-lg bg-muted/30 border border-border/50 p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-foreground">How mirror sources work:</strong>{' '}
                    Mirror sources are tried in priority order. When you play an episode,
                    the resolver substitutes placeholders in your URL template with actual
                    values (e.g. <code>{'{anilistId}'}</code> → 101510). If a source fails,
                    the next available one is tried automatically.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
