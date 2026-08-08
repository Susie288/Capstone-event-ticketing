import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { EventStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string) {
  if (!dateStr) return "";
  // Handle date-only strings (YYYY-MM-DD) in local timezone to avoid UTC midnight rollbacks
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(timeStr: string) {
  // Accepts "HH:mm" or a full ISO string
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    const [h, m] = timeStr.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  const d = new Date(timeStr);
  if (isNaN(d.getTime())) return timeStr;
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function generateRegistrationId() {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const year = new Date().getFullYear();
  return `EVT-${year}-${rand}`;
}

export function calculateEventStatus(availableSeats: number, totalSeats: number): EventStatus {
  if (availableSeats <= 0) {
    return "SOLD_OUT";
  }
  const threshold = Math.max(1, Math.floor(totalSeats / 10));
  if (availableSeats <= threshold) {
    return "LIMITED";
  }
  return "AVAILABLE";
}
