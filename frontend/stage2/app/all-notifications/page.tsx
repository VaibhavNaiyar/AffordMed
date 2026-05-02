"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box, Typography, ToggleButtonGroup, ToggleButton, Stack,
  Pagination, Alert, Skeleton, Chip, Divider, Select,
  MenuItem, FormControl, InputLabel, SelectChangeEvent,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import RefreshIcon from "@mui/icons-material/Refresh";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { fetchNotifications } from "@/lib/api";
import { logger } from "@/lib/logger";
import { Notification, NotificationType } from "@/lib/types";
import NotificationCard from "@/components/NotificationCard";

const CTX = "all-notifications";
const PAGE_SIZE_OPTIONS = [5, 10, 20];

type TypeFilter = NotificationType | "";

export default function AllNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [typeFilter, setTypeFilter]       = useState<TypeFilter>("");
  const [page, setPage]                   = useState(1);
  const [pageSize, setPageSize]           = useState(10);
  const [viewedIds, setViewedIds]         = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    logger.info(CTX, "Loading notifications", { page, pageSize, typeFilter });
    try {
      const data = await fetchNotifications({
        page,
        limit: pageSize,
        notification_type: typeFilter || undefined,
      });
      setNotifications(data);
      logger.info(CTX, "Notifications loaded", { count: data.length });
    } catch (err) {
      const msg = (err as Error).message;
      logger.error(CTX, "Failed to load notifications", { message: msg });
      setError("Could not load notifications. Showing cached data.");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, typeFilter]);

  // Auto-reload every 30 seconds for live-ish updates
  useEffect(() => {
    load();
    const interval = setInterval(() => {
      logger.debug(CTX, "Auto-refresh triggered");
      load();
    }, 30_000);
    return () => clearInterval(interval);
  }, [load]);

  // Reset to page 1 on filter change
  const handleTypeFilter = (_: React.MouseEvent<HTMLElement>, val: TypeFilter | null) => {
    const next = val ?? "";
    logger.info(CTX, "Type filter changed", { filter: next });
    setTypeFilter(next);
    setPage(1);
  };

  const handlePageSize = (e: SelectChangeEvent<number>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };

  const toggleViewed = (id: string) => {
    setViewedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        logger.debug(CTX, "Marked as unread", { id });
      } else {
        next.add(id);
        logger.debug(CTX, "Marked as read", { id });
      }
      return next;
    });
  };

  const unreadCount = notifications.filter((n) => !viewedIds.has(n.ID)).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
        <NotificationsIcon color="primary" sx={{ fontSize: 30 }} />
        <Typography variant="h5">All Notifications</Typography>
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

      {/* Filters + page size */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 3,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
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

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Per page</InputLabel>
          <Select value={pageSize} label="Per page" onChange={handlePageSize}>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <MenuItem key={n} value={n}>{n}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Error banner */}
      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* List */}
      <Stack spacing={1.5}>
        {loading
          ? Array.from({ length: pageSize }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={90} />
            ))
          : notifications.length === 0
          ? (
              <Alert severity="info">No notifications found for the selected filter.</Alert>
            )
          : notifications.map((n) => (
              <NotificationCard
                key={n.ID}
                notification={n}
                isViewed={viewedIds.has(n.ID)}
                onToggleViewed={toggleViewed}
              />
            ))
        }
      </Stack>

      {/* Pagination */}
      {!loading && notifications.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            page={page}
            count={page + (notifications.length === pageSize ? 1 : 0)}
            onChange={(_, val) => {
              logger.info(CTX, "Page changed", { page: val });
              setPage(val);
            }}
            color="primary"
            shape="rounded"
          />
        </Box>
      )}
    </Box>
  );
}
