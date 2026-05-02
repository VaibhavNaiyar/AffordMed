"use client";
import {
  AppBar, Toolbar, Typography, Button, Box,
  IconButton, Drawer, List, ListItemButton, ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import InboxIcon from "@mui/icons-material/MoveToInbox";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV_LINKS = [
  { label: "All Notifications", href: "/all-notifications", icon: <NotificationsIcon fontSize="small" /> },
  { label: "Priority Inbox",    href: "/priority-inbox",    icon: <InboxIcon fontSize="small" /> },
];

export default function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppBar position="sticky" elevation={1}>
        <Toolbar sx={{ gap: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: 0.5 }}>
            AffordMed Notifications
          </Typography>

          {/* Desktop nav — hidden on xs */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 1 }}>
            {NAV_LINKS.map((l) => (
              <Button
                key={l.href}
                component={Link}
                href={l.href}
                color="inherit"
                startIcon={l.icon}
                variant={pathname === l.href ? "outlined" : "text"}
                sx={{
                  borderColor: "rgba(255,255,255,0.6)",
                  fontWeight: pathname === l.href ? 700 : 400,
                }}
              >
                {l.label}
              </Button>
            ))}
          </Box>

          {/* Mobile hamburger — hidden on sm+ */}
          <Box sx={{ display: { xs: "flex", sm: "none" } }}>
            <IconButton color="inherit" onClick={() => setOpen(true)}>
              <MenuIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <List sx={{ width: 220, pt: 2 }}>
          {NAV_LINKS.map((l) => (
            <ListItemButton
              key={l.href}
              component={Link}
              href={l.href}
              selected={pathname === l.href}
              onClick={() => setOpen(false)}
            >
              <ListItemText primary={l.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>
    </>
  );
}
