export type NotificationType = "Placement" | "Result" | "Event";

export interface Notification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string; // "2026-04-22T17:51:30"
}

export interface ApiResponse {
  notifications: Notification[];
}

export interface ScoredNotification {
  notification: Notification;
  score: number; // composite priority score — higher = more important
}
