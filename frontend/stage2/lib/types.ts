export type NotificationType = "Placement" | "Result" | "Event";

export interface Notification {
  ID: string;
  Type: NotificationType;
  Message: string;
  Timestamp: string;
}

export interface ApiResponse {
  notifications: Notification[];
}

export interface FetchParams {
  limit?: number;
  page?: number;
  notification_type?: NotificationType | "";
}

export interface ScoredNotification {
  notification: Notification;
  score: number;
}
