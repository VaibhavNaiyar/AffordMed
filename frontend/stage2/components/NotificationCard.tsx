"use client";
import { Card, CardContent, Box, Typography, Chip, Tooltip, IconButton } from "@mui/material";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import WorkIcon from "@mui/icons-material/Work";
import SchoolIcon from "@mui/icons-material/School";
import EventIcon from "@mui/icons-material/Event";
import { Notification } from "@/lib/types";

const TYPE_COLOR: Record<string, "success" | "warning" | "info"> = {
  Placement: "success",
  Result:    "warning",
  Event:     "info",
};

// Must be ReactElement (not ReactNode) — Chip clones the icon and passes className
const TYPE_ICON: Record<string, React.ReactElement> = {
  Placement: <WorkIcon  sx={{ fontSize: 14 }} />,
  Result:    <SchoolIcon sx={{ fontSize: 14 }} />,
  Event:     <EventIcon  sx={{ fontSize: 14 }} />,
};

interface Props {
  notification: Notification;
  isViewed: boolean;
  onToggleViewed: (id: string) => void;
  rank?: number;
  score?: number;
}

export default function NotificationCard({ notification, isViewed, onToggleViewed, rank, score }: Props) {
  const { ID, Type, Message, Timestamp } = notification;

  // Use a locale-agnostic format to avoid SSR/client hydration mismatch
  const d = new Date(Timestamp);
  const formattedTime = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

  return (
    <Card
      variant="outlined"
      sx={{
        borderLeft: 4,
        borderLeftColor: isViewed ? "grey.300" : `${TYPE_COLOR[Type]}.main`,
        opacity: isViewed ? 0.72 : 1,
        transition: "all 0.2s ease",
        "&:hover": { boxShadow: 4, transform: "translateY(-1px)" },
      }}
    >
      <CardContent sx={{ pb: "12px !important" }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
          {rank && (
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: "text.secondary",
                minWidth: 28,
                pt: "2px",
              }}
            >
              #{rank}
            </Typography>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
              <Chip
                label={Type}
                color={TYPE_COLOR[Type]}
                size="small"
                icon={TYPE_ICON[Type]}
              />
              {!isViewed && (
                <Chip label="NEW" size="small" color="error" sx={{ fontSize: "0.65rem", height: 18 }} />
              )}
              {score !== undefined && (
                <Chip
                  label={`score: ${score.toLocaleString()}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: "0.65rem", color: "text.secondary" }}
                />
              )}
            </Box>

            <Typography
              variant="body1"
              sx={{
                fontWeight: isViewed ? 400 : 600,
                color: isViewed ? "text.secondary" : "text.primary",
                mb: 0.5,
                wordBreak: "break-word",
              }}
            >
              {Message}
            </Typography>

            <Typography variant="caption" color="text.disabled">
              {formattedTime} &nbsp;·&nbsp; ID: {ID.substring(0, 8)}…
            </Typography>
          </Box>

          <Tooltip title={isViewed ? "Mark as unread" : "Mark as read"}>
            <IconButton size="small" onClick={() => onToggleViewed(ID)} sx={{ mt: "-4px" }}>
              {isViewed
                ? <MarkEmailUnreadIcon fontSize="small" color="action" />
                : <MarkEmailReadIcon  fontSize="small" color="primary" />
              }
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}
