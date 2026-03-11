"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Pencil, Globe, Loader2, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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

// ---------------------------------------------------------------------------
// Add / Edit entry dialog
// ---------------------------------------------------------------------------

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
            <p className="text-xs text-muted-foreground">Keep answers concise — they'll be read aloud on a phone call.</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// URL ingestion dialog
// ---------------------------------------------------------------------------

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
        <Button variant="outline"><Globe className="h-4 w-4 mr-2" />Import from website</Button>
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
            <Button onClick={extract} disabled={loading || !url}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Extracting…</> : "Extract Q&As"}
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {pairs.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{pairs.filter((p) => p.selected).length} of {pairs.length} selected</p>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setPairs((p) => p.map((e) => ({ ...e, selected: true })))}>Select all</Button>
                  <Button variant="ghost" size="sm" onClick={() => setPairs((p) => p.map((e) => ({ ...e, selected: false })))}>Deselect all</Button>
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2 rounded-md border p-2">
                {pairs.map((pair, i) => (
                  <label key={i} className={`flex gap-3 p-3 rounded-md cursor-pointer transition-colors ${pair.selected ? "bg-primary/5 border border-primary/20" : "hover:bg-muted opacity-60"}`}>
                    <input type="checkbox" checked={pair.selected} onChange={() => togglePair(i)} className="mt-1 shrink-0" />
                    <div className="space-y-1 min-w-0">
                      <p className="text-sm font-medium">{pair.question}</p>
                      <p className="text-xs text-muted-foreground">{pair.answer}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={saveSelected} disabled={saving || pairs.filter((p) => p.selected).length === 0}>
            {saving ? "Saving…" : `Save ${pairs.filter((p) => p.selected).length} entries`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

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

  const sourceVariant = (source: KBEntry["source"]) =>
    source === "WEBSITE" ? "secondary" : source === "DOCUMENT" ? "outline" : "default";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Q&A pairs your agent uses to answer customer questions. {entries.length} entries.
          </p>
        </div>
        <div className="flex gap-2">
          <IngestUrlDialog onSave={loadEntries} />
          <EntryDialog onSave={loadEntries} trigger={<Button><Plus className="h-4 w-4 mr-2" />Add entry</Button>} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            All Entries
          </CardTitle>
          <CardDescription>
            The agent searches these entries using semantic similarity when answering calls.
            Keep answers to 1–3 sentences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No knowledge base entries yet</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Add entries manually or import from your website
              </p>
              <div className="flex gap-2">
                <IngestUrlDialog onSave={loadEntries} />
                <EntryDialog onSave={loadEntries} trigger={<Button size="sm"><Plus className="h-4 w-4 mr-1" />Add manually</Button>} />
              </div>
            </div>
          ) : (
            <>
              <Separator className="mb-4" />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Answer</TableHead>
                    <TableHead className="w-24">Source</TableHead>
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium max-w-xs">
                        <p className="truncate">{entry.question}</p>
                      </TableCell>
                      <TableCell className="max-w-sm">
                        <p className="text-sm text-muted-foreground line-clamp-2">{entry.answer}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sourceVariant(entry.source)} className="capitalize text-xs">
                          {entry.source.toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <EntryDialog
                            entry={entry}
                            onSave={loadEntries}
                            trigger={
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
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
        </CardContent>
      </Card>
    </div>
  );
}
