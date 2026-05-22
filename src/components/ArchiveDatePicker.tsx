"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface ArchiveDatePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchiveDatePicker: React.FC<ArchiveDatePickerProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get today's date for validation
  const today = new Date();
  const todayString = today.toISOString().split("T")[0];

  // Calculate the earliest available date (assuming game started 30 days ago for now)
  const ARCHIVE_DAYS_BACK = 90;
  const earliestDate = new Date();
  earliestDate.setDate(today.getDate() - ARCHIVE_DAYS_BACK);
  const earliestDateString = earliestDate.toISOString().split("T")[0];

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handlePlayArchive = () => {
    if (selectedDate) {
      router.push(`/play?date=${selectedDate}`);
      onClose();
    }
  };

  const isDateDisabled = (date: string) => {
    return date > todayString || date < earliestDateString;
  };

  const isDateToday = (date: string) => {
    return date === todayString;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // Get first day of the month and how many days in the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Create array of dates for the calendar
    const dates = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      dates.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(
        2,
        "0"
      )}-${String(day).padStart(2, "0")}`;
      dates.push(dateString);
    }

    return (
      <div className="grid grid-cols-7 gap-1 text-center">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="p-2 text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {/* Calendar dates */}
        {dates.map((date, index) => {
          if (!date) {
            return <div key={index} className="p-2" />;
          }

          const disabled = isDateDisabled(date);
          const isToday = isDateToday(date);
          const isSelected = date === selectedDate;

          return (
            <button
              key={date}
              onClick={() => !disabled && handleDateSelect(date)}
              disabled={disabled}
              className={`
                p-2 text-sm rounded-md transition-colors
                ${
                  disabled
                    ? "text-muted-foreground cursor-not-allowed opacity-50"
                    : "hover:bg-accent hover:text-accent-foreground cursor-pointer"
                }
                ${isSelected ? "bg-primary text-primary-foreground" : ""}
                ${
                  isToday && !isSelected
                    ? "bg-accent text-accent-foreground font-medium"
                    : ""
                }
              `}
            >
              {new Date(date).getDate()}
            </button>
          );
        })}
      </div>
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Play Archived Games
          </DialogTitle>
          <DialogDescription>
            Select a date to play a previous game. You can only access games
            from the last 90 days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <h3 className="text-lg font-medium">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar */}
          {renderCalendar()}

          {selectedDate && (
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">Selected date:</p>
              <p className="font-medium">
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handlePlayArchive}
            disabled={!selectedDate}
            variant="cta"
          >
            Play This Date
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

