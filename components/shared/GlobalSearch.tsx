/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault. All Rights Reserved.
 */

"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ContactRound,
  CalendarDays,
  CheckSquare,
  GitFork,
  FileText,
  Search,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { getMessage } from "@/lib/i18n";
import { useLanguage } from "@/hooks/use-language";
import type { MessageDictionary } from "@/types/i18n";
import type { SearchResult, SearchResultType } from "@/lib/search/search.logic";

type Props = {
  messages: MessageDictionary;
};

const TYPE_ICON: Record<SearchResultType, React.ElementType> = {
  contact: ContactRound,
  meeting: CalendarDays,
  task: CheckSquare,
  decision: GitFork,
  knowledge: FileText,
};

const TYPE_ORDER: SearchResultType[] = [
  "contact",
  "meeting",
  "task",
  "decision",
  "knowledge",
];

function groupResults(results: SearchResult[]) {
  const map = new Map<SearchResultType, SearchResult[]>();
  for (const r of results) {
    const bucket = map.get(r.type) ?? [];
    bucket.push(r);
    map.set(r.type, bucket);
  }
  return map;
}

export function GlobalSearch({ messages }: Props) {
  const router = useRouter();
  const { language } = useLanguage();
  void language; // consumed to trigger re-render on locale change

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const placeholder = getMessage(
    messages,
    "shell.search.placeholder",
    "Search contacts, meetings, tasks…",
  );
  const noResults = getMessage(
    messages,
    "shell.search.noResults",
    "No results found.",
  );
  const groupLabels: Record<SearchResultType, string> = {
    contact: getMessage(messages, "shell.search.contacts", "Contacts"),
    meeting: getMessage(messages, "shell.search.meetings", "Meetings"),
    task: getMessage(messages, "shell.search.tasks", "Tasks"),
    decision: getMessage(messages, "shell.search.decisions", "Decisions"),
    knowledge: getMessage(messages, "shell.search.knowledge", "Knowledge"),
  };

  // ⌘K / Ctrl+K
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "k") {
      e.preventDefault();
      setOpen((prev) => !prev);
    }
  }, []);

  // Custom trigger event (e.g. from Navbar button)
  const handleOpenEvent = useCallback(() => setOpen(true), []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("global-search:open", handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("global-search:open", handleOpenEvent);
    };
  }, [handleKeyDown, handleOpenEvent]);

  // Debounced fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = (await res.json()) as { results: SearchResult[] };
          setResults(data.results);
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    router.push(result.href);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setQuery("");
      setResults([]);
    }
  };

  const grouped = groupResults(results);

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={getMessage(messages, "shell.search.title", "Search workspace")}
      description={placeholder}
    >
      <CommandInput
        placeholder={placeholder}
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {!loading && query.length >= 2 && results.length === 0 && (
          <CommandEmpty>{noResults}</CommandEmpty>
        )}
        {TYPE_ORDER.filter((t) => (grouped.get(t)?.length ?? 0) > 0).map(
          (type, idx, arr) => {
            const items = grouped.get(type)!;
            const Icon = TYPE_ICON[type];
            return (
              <span key={type}>
                <CommandGroup heading={groupLabels[type]}>
                  {items.map((result) => (
                    <CommandItem
                      key={result.id}
                      value={`${result.type}-${result.id}-${result.title}`}
                      onSelect={() => handleSelect(result)}
                      className="cursor-pointer"
                      aria-label={result.title}
                    >
                      <Icon className="shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{result.title}</span>
                      {result.subtitle && (
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {result.subtitle}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
                {idx < arr.length - 1 && <CommandSeparator />}
              </span>
            );
          },
        )}
      </CommandList>
      {query.length < 2 && (
        <div className="flex items-center gap-1.5 border-t border-border/50 px-3 py-2 text-xs text-muted-foreground">
          <Search className="size-3 shrink-0" />
          <span>
            {getMessage(
              messages,
              "shell.search.hint",
              "Type at least 2 characters to search",
            )}
          </span>
        </div>
      )}
    </CommandDialog>
  );
}
