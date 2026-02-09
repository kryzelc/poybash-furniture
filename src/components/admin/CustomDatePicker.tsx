'use client';

import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CustomDatePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  onApply: () => void;
  onCancel: () => void;
  minDate?: Date; // Optional minimum date
}

export function CustomDatePicker({
  value,
  onChange,
  onApply,
  onCancel,
  minDate,
}: CustomDatePickerProps) {
  const [viewDate, setViewDate] = useState(value || new Date());
  const [selectingYear, setSelectingYear] = useState(false);
  const [selectingMonth, setSelectingMonth] = useState(false);
  const [yearPageStart, setYearPageStart] = useState(() => {
    // Start from a decade that includes current year
    const currentYear = (value || new Date()).getFullYear();
    return Math.floor(currentYear / 12) * 12;
  });

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();
  
  // Get current date in Philippines timezone (GMT +8)
  const getPhilippinesDate = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const philippinesTime = new Date(utc + (3600000 * 8));
    return philippinesTime;
  };
  
  const today = getPhilippinesDate();
  today.setHours(0, 0, 0, 0); // Set to start of day for comparison

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const fullMonths = [
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

  // Generate years for current page (12 years per page)
  const years = useMemo(() => {
    const yearsList = [];
    for (let i = 0; i < 12; i++) {
      yearsList.push(yearPageStart + i);
    }
    return yearsList;
  }, [yearPageStart]);

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days: (number | null)[] = [];

    // Add empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  }, [currentYear, currentMonth]);

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentYear, currentMonth, day);
    clickedDate.setHours(0, 0, 0, 0);
    
    // Check against minDate if provided, otherwise check against today
    const checkDate = minDate || today;
    if (clickedDate < checkDate) {
      return;
    }

    onChange(clickedDate);
  };

  const isSelectedDate = (day: number) => {
    if (!value) return false;
    const date = new Date(currentYear, currentMonth, day);
    date.setHours(0, 0, 0, 0);
    const compareValue = new Date(value);
    compareValue.setHours(0, 0, 0, 0);
    return date.getTime() === compareValue.getTime();
  };

  const handlePreviousMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleMonthSelect = (monthIndex: number) => {
    setViewDate(new Date(currentYear, monthIndex, 1));
    setSelectingMonth(false);
  };

  const handleYearSelect = (year: number) => {
    setViewDate(new Date(year, currentMonth, 1));
    setSelectingYear(false);
  };

  if (selectingYear) {
    return (
      <div className="w-[340px] bg-background rounded-lg border border-border shadow-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setYearPageStart(yearPageStart - 12)}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <h3 className="text-center">
            {yearPageStart} - {yearPageStart + 11}
          </h3>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setYearPageStart(yearPageStart + 12)}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {years.map((year) => {
            return (
              <Button
                key={year}
                variant={year === currentYear ? "default" : "outline"}
                onClick={() => handleYearSelect(year)}
                className={
                  year === currentYear
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : ""
                }
              >
                {year}
              </Button>
            );
          })}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setSelectingYear(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => setSelectingYear(false)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Apply
          </Button>
        </div>
      </div>
    );
  }

  if (selectingMonth) {
    return (
      <div className="w-[340px] bg-background rounded-lg border border-border shadow-lg p-4">
        <div className="mb-4">
          <h3 className="text-center">Select month</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {fullMonths.map((month, index) => {
            return (
              <Button
                key={month}
                variant={index === currentMonth ? "default" : "outline"}
                onClick={() => handleMonthSelect(index)}
                className={
                  index === currentMonth
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : ""
                }
              >
                {months[index]}
              </Button>
            );
          })}
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setSelectingMonth(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => setSelectingMonth(false)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Apply
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[340px] bg-background rounded-lg border border-border shadow-lg p-4">
      {/* Month/Year Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePreviousMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => setSelectingMonth(true)}
            className="hover:bg-secondary"
          >
            {fullMonths[currentMonth]}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setSelectingYear(true)}
            className="hover:bg-secondary"
          >
            {currentYear}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          className="h-8 w-8 p-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="text-center text-xs text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dayDate = new Date(currentYear, currentMonth, day);
          dayDate.setHours(0, 0, 0, 0);
          
          // Check against minDate if provided, otherwise check against today
          const checkDate = minDate || today;
          const isPastDate = dayDate < checkDate;
          
          const isSelected = isSelectedDate(day);
          const isTodayDate =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              disabled={isPastDate}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-md
                transition-colors
                ${isPastDate ? "opacity-30 cursor-not-allowed text-muted-foreground" : ""}
                ${!isPastDate && isSelected ? "bg-primary text-primary-foreground font-semibold" : !isPastDate ? "hover:bg-secondary" : ""}
                ${isTodayDate && !isSelected ? "border border-primary" : ""}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onApply}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
          disabled={!value}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
