"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Globe, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

interface KBEntry {
  id: string;
  question: string;
  answer: string;
  source: "MANUAL" | "WEBSITE" | "DOCUMENT";
  createdAt: string;
}

interface ExtractedPair {
  question: string;
  answer: string;
  selected: boolean;
}

const SOURCE_CLASS: Record<KBEntry["source"], string> = {
  MANUAL: "bg-emerald-100 text-emerald-800 border-emerald-200",
  WEBSITE: "bg-sky-100 text-sky-800 border-sky-200",
  DOCUMENT: "bg-violet-100 text-violet-800 border-violet-200",
};

function SourceBadge({ source }: { source: KBEntry["source"] }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border capitalize ${SOURCE_CLASS[source]}`}>
      {source.toLowerCase()}
    </span>
  );
}

function EntryDialog({
  entry,
  onSave,
  trigger,
}: {
  entry?: KBEntry;
  onSave: () => void;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState(entry?.question ?? "");
  const [answer, setAnswer] = useState(entry?.answer ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!question.trim() || !answer.trim()) {
      setError("Both fields are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const url = entry ? `/api/knowledge/${entry.id}` : "/api/knowledge";
      const method = entry ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, answer }),
      });
      if (!res.ok) {
        const j = await res.json() as { error?: string };
        throw new Error(j.error ?? "Failed to save");
      }
      setOpen(false);
      onSave();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit Entry" : "Add Knowledge Base Entry"}</DialogTitle>
          <DialogDescription>
            Add a question your customers commonly ask, and the answer the agent should give.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Question</Label>
            <Input value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What time do you open?" />
          </div>
          <div className="space-y-2">
            <Label>Answer</Label>
            <Textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4}
              placeholder="We're open Monday–Saturday 8am to 6pm and Sunday 10am to 4pm." />
            <p className="text-xs text-stone-400">Keep answers concise — they'll be read aloud on a phone call.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-emerald-800 hover:bg-emerald-700 text-white">
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IngestUrlDialog({ onSave }: { onSave: () => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [pairs, setPairs] = useState<ExtractedPair[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function extract() {
    if (!url) return;
    setLoading(true);
    setError("");
    setPairs([]);
    try {
      const res = await fetch("/api/knowledge/ingest-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json() as { pairs?: { question: string; answer: string }[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Extraction failed");
      setPairs((json.pairs ?? []).map((p) => ({ ...p, selected: true })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract");
    } finally {
      setLoading(false);
    }
  }

  async function saveSelected() {
    const selected = pairs.filter((p) => p.selected);
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await Promise.all(
        selected.map((p) =>
          fetch("/api/knowledge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: p.question, answer: p.answer }),
          })
        )
      );
      setOpen(false);
      setPairs([]);
      setUrl("");
      onSave();
    } catch {
      setError("Failed to save some entries");
    } finally {
      setSaving(false);
    }
  }

  function togglePair(i: number) {
    setPairs((prev) => prev.map((p, idx) => idx === i ? { ...p, selected: !p.selected } : p));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-stone-200 text-stone-700">
          <Globe className="h-4 w-4 mr-2" />Import from website
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import from Website</DialogTitle>
          <DialogDescription>
            Paste your website URL and we&apos;ll use AI to extract common Q&A pairs from your content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yoursite.com/faq" className="flex-1" />
            <Button onClick={extract} disabled={loading || !url} className="bg-emerald-800 hover:bg-emerald-700 text-white">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Extracting…</> : "Extract Q&As"}
            </Button>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          {pairs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-stone-700">{pairs.filter((p) => p.selected).length} of {pairs.length} selected</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-stone-500" onClick={() => setPairs((p) => p.map((e) => ({ ...e, selected: true })))}>Select all</Button>
                  <Button variant="ghost" size="sm" className="text-stone-500" onClick={() => setPairs((p) => p.map((e) => ({ ...e, selected: false })))}>Deselect all</Button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2 rounded-xl border border-stone-200 p-2">
                {pairs.map((pair, i) => (
                  <label key={i} className={`flex gap-3 p-3 rounded-lg cursor-pointer transition-colors ${pair.selected ? "bg-emerald-50 border border-emerald-200" : "hover:bg-stone-50 opacity-60 border border-transparent"}`}>
                    <input type="checkbox" checked={pair.selected} onChange={() => togglePair(i)} className="mt-1 shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium text-stone-800">{pair.question}</p>
                      <p className="text-xs text-stone-500">{pair.answer}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={saveSelected} disabled={saving || pairs.filter((p) => p.selected).length === 0} className="bg-emerald-800 hover:bg-emerald-700 text-white">
            {saving ? "Saving…" : `Save ${pairs.filter((p) => p.selected).length} entries`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    try {
      const res = await fetch("/api/knowledge");
      const json = await res.json() as { entries?: KBEntry[] };
      setEntries(json.entries ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadEntries(); }, [loadEntries]);

  async function deleteEntry(id: string) {
    setDeletingId(id);
    try {
      await fetch(`/api/knowledge/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Knowledge Base</h1>
          <p className="text-stone-500 text-sm mt-0.5">
            Q&A pairs your agent uses to answer customer questions · {entries.length} entries
          </p>
        </div>
        <div className="flex gap-2">
          <IngestUrlDialog onSave={loadEntries} />
          <EntryDialog
            onSave={loadEntries}
            trigger={
              <Button className="bg-emerald-800 hover:bg-emerald-700 text-white">
                <Plus className="h-4 w-4 mr-2" />Add entry
              </Button>
            }
          />
        </div>
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-emerald-600" />
          <h2 className="text-sm font-semibold text-stone-700">All Entries</h2>
          <span className="text-xs text-stone-400 ml-1">· The agent searches these using semantic similarity</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-stone-300" />
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-14 w-14 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-7 w-7 text-stone-300" />
            </div>
            <p className="text-sm font-medium text-stone-500">No knowledge base entries yet</p>
            <p className="text-xs text-stone-400 mt-1 mb-6">
              Add entries manually or import from your website
            </p>
            <div className="flex gap-2">
              <IngestUrlDialog onSave={loadEntries} />
              <EntryDialog
                onSave={loadEntries}
                trigger={
                  <Button size="sm" className="bg-emerald-800 hover:bg-emerald-700 text-white">
                    <Plus className="h-4 w-4 mr-1" />Add manually
                  </Button>
                }
              />
            </div>
          </div>
        ) : (
          <>
            <Separator className="bg-stone-100" />
            <Table>
              <TableHeader>
                <TableRow className="bg-stone-50/50 hover:bg-stone-50/50">
                  <TableHead className="text-stone-500 font-medium">Question</TableHead>
                  <TableHead className="text-stone-500 font-medium">Answer</TableHead>
                  <TableHead className="w-24 text-stone-500 font-medium">Source</TableHead>
                  <TableHead className="w-20 text-right text-stone-500 font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id} className="border-stone-100 hover:bg-stone-50">
                    <TableCell className="font-medium max-w-xs text-stone-800">
                      <p className="truncate">{entry.question}</p>
                    </TableCell>
                    <TableCell className="max-w-sm">
                      <p className="text-sm text-stone-500 line-clamp-2">{entry.answer}</p>
                    </TableCell>
                    <TableCell>
                      <SourceBadge source={entry.source} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <EntryDialog
                          entry={entry}
                          onSave={loadEntries}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-stone-700">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-stone-400 hover:text-red-600"
                          onClick={() => deleteEntry(entry.id)}
                          disabled={deletingId === entry.id}
                        >
                          {deletingId === entry.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>
    </div>
  );
}
