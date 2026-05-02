"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box, Typography, Stack, Alert, Skeleton, Chip, Divider,
  ToggleButtonGroup, ToggleButton, Select, MenuItem,
  FormControl, InputLabel, SelectChangeEvent, Paper,
} from "@mui/material";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import RefreshIcon from "@mui/icons-material/Refresh";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { fetchNotifications } from "@/lib/api";
import { getTopK, scoreNotification } from "@/lib/priorityQueue";
import { logger } from "@/lib/logger";
import { Notification, NotificationType, ScoredNotification } from "@/lib/types";
import NotificationCard from "@/components/NotificationCard";

const CTX = "priority-inbox";
const TOP_N_OPTIONS = [10, 15, 20];

type TypeFilter = NotificationType | "";

export default function PriorityInboxPage() {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [topK, setTopK]                         = useState<ScoredNotification[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [error, setError]                       = useState<string | null>(null);
  const [topN, setTopN]                         = useState(10);
  const [typeFilter, setTypeFilter]             = useState<TypeFilter>("");
  const [viewedIds, setViewedIds]               = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    logger.info(CTX, "Loading all notifications for priority ranking", { topN });
    try {
      // Fetch full dataset (no pagination) — heap will pick top-N
      const data = await fetchNotifications({ limit: 200 });
      setAllNotifications(data);
      logger.info(CTX, "Raw notifications loaded", { count: data.length });
    } catch (err) {
      const msg = (err as Error).message;
      logger.error(CTX, "Failed to load notifications", { message: msg });
      setError("Could not load notifications. Showing cached data.");
    } finally {
      setLoading(false);
    }
  }, [topN]);

  // Recompute top-K whenever source data, N, or type filter changes
  useEffect(() => {
    const source = typeFilter
      ? allNotifications.filter((n) => n.Type === typeFilter)
      : allNotifications;

    const ranked = getTopK(source, topN);
    logger.info(CTX, "Priority heap computed", {
      sourceSize: source.length,
      topN,
      typeFilter: typeFilter || "all",
      resultCount: ranked.length,
    });
    setTopK(ranked);
  }, [allNotifications, topN, typeFilter]);

  useEffect(() => {
    load();
    const interval = setInterval(() => {
      logger.debug(CTX, "Auto-refresh triggered");
      load();
    }, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  const handleTopN = (e: SelectChangeEvent<number>) => {
    const val = Number(e.target.value);
    logger.info(CTX, "Top-N changed", { topN: val });
    setTopN(val);
  };

  const handleTypeFilter = (_: React.MouseEvent<HTMLElement>, val: TypeFilter | null) => {
    const next = val ?? "";
    logger.info(CTX, "Type filter changed", { filter: next });
    setTypeFilter(next);
  };

  const toggleViewed = (id: string) => {
    setViewedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); logger.debug(CTX, "Marked unread", { id }); }
      else               { next.add(id);    logger.debug(CTX, "Marked read",   { id }); }
      return next;
    });
  };

  const unreadCount = topK.filter((s) => !viewedIds.has(s.notification.ID)).length;

  // Score stats for the summary bar
  const highestScore = topK[0]?.score;
  const lowestScore  = topK[topK.length - 1]?.score;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <InboxIcon color="primary" sx={{ fontSize: 30 }} />
        <Typography variant="h5">Priority Inbox</Typography>
        {unreadCount > 0 && (
          <Chip label={`${unreadCount} unread`} color="error" size="small" />
        )}
        <Box sx={{ flex: 1 }} />
        <Tooltip title="Refresh">
          <IconButton onClick={load} size="small" color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Controls */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel>Show top</InputLabel>
          <Select value={topN} label="Show top" onChange={handleTopN}>
            {TOP_N_OPTIONS.map((n) => (
              <MenuItem key={n} value={n}>Top {n}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <ToggleButtonGroup
          value={typeFilter}
          exclusive
          onChange={handleTypeFilter}
          size="small"
        >
          <ToggleButton value="">All</ToggleButton>
          <ToggleButton value="Placement">Placement</ToggleButton>
          <ToggleButton value="Result">Result</ToggleButton>
          <ToggleButton value="Event">Event</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Stats summary */}
      {!loading && topK.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ px: 2, py: 1, mb: 2, display: "flex", gap: 3, flexWrap: "wrap", bgcolor: "background.default" }}
        >
          <Typography variant="caption" color="text.secondary">
            Showing <strong>{topK.length}</strong> of <strong>{allNotifications.length}</strong> total
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Score range: <strong>{lowestScore?.toLocaleString()}</strong> – <strong>{highestScore?.toLocaleString()}</strong>
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Algorithm: MinHeap O(N log K)
          </Typography>
        </Paper>
      )}

      {/* Error banner */}
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Ranked list */}
      <Stack spacing={1.5}>
        {loading
          ? Array.from({ length: topN }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={90} />
            ))
          : topK.length === 0
          ? <Alert severity="info">No notifications match the selected filter.</Alert>
          : topK.map((scored, i) => (
              <NotificationCard
                key={scored.notification.ID}
                notification={scored.notification}
                isViewed={viewedIds.has(scored.notification.ID)}
                onToggleViewed={toggleViewed}
                rank={i + 1}
                score={scoreNotification(scored.notification).score}
              />
            ))
        }
      </Stack>
    </Box>
  );
}
