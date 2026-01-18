'use client';

import { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface CustomDateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  onApply: () => void;
  onCancel: () => void;
}

export function CustomDateRangePicker({
  value,
  onChange,
  onApply,
  onCancel,
}: CustomDateRangePickerProps) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectingYear, setSelectingYear] = useState(false);
  const [selectingMonth, setSelectingMonth] = useState(false);
  const [yearPageStart, setYearPageStart] = useState(() => {
    // Start from a decade that includes current year
    const currentYear = new Date().getFullYear();
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
    
    // Don't allow selecting future dates
    if (clickedDate > today) {
      return;
    }

    if (!value.from || (value.from && value.to)) {
      // Start new selection
      onChange({ from: clickedDate, to: undefined });
    } else {
      // Complete the range
      if (clickedDate < value.from) {
        onChange({ from: clickedDate, to: value.from });
      } else {
        onChange({ from: value.from, to: clickedDate });
      }
    }
  };

  const isDateInRange = (day: number) => {
    if (!value.from) return false;
    const date = new Date(currentYear, currentMonth, day);
    
    if (value.to) {
      return date >= value.from && date <= value.to;
    }
    
    return date.getTime() === value.from.getTime();
  };

  const isDateStart = (day: number) => {
    if (!value.from) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.getTime() === value.from.getTime();
  };

  const isDateEnd = (day: number) => {
    if (!value.to) return false;
    const date = new Date(currentYear, currentMonth, day);
    return date.getTime() === value.to.getTime();
  };

  const handlePreviousMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    // Don't allow navigating to future months
    if (nextMonth.getFullYear() > today.getFullYear() || 
        (nextMonth.getFullYear() === today.getFullYear() && nextMonth.getMonth() > today.getMonth())) {
      return;
    }
    setViewDate(nextMonth);
  };

  const handleMonthSelect = (monthIndex: number) => {
    const selectedMonth = new Date(currentYear, monthIndex, 1);
    // Don't allow selecting future months
    if (selectedMonth.getFullYear() > today.getFullYear() || 
        (selectedMonth.getFullYear() === today.getFullYear() && selectedMonth.getMonth() > today.getMonth())) {
      return;
    }
    setViewDate(selectedMonth);
    setSelectingMonth(false);
  };

  const handleYearSelect = (year: number) => {
    // Don't allow selecting future years
    if (year > today.getFullYear()) return;
    
    setViewDate(new Date(year, currentMonth, 1));
    setSelectingYear(false);
  };

  if (selectingYear) {
    const currentYearNow = today.getFullYear();
    const maxYearToShow = Math.min(yearPageStart + 11, currentYearNow);
    const canGoForward = yearPageStart + 12 <= currentYearNow;
    
    return (
      <div className="w-[340px] bg-white rounded-lg border border-[#D4C5B9] shadow-lg p-4">
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
            {yearPageStart} - {maxYearToShow}
          </h3>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setYearPageStart(yearPageStart + 12)}
            disabled={!canGoForward}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {years.map((year) => {
            const isFutureYear = year > currentYearNow;
            return (
              <Button
                key={year}
                variant={year === currentYear ? "default" : "outline"}
                onClick={() => handleYearSelect(year)}
                disabled={isFutureYear}
                className={
                  year === currentYear
                    ? "bg-[#8B4513] hover:bg-[#A0522D] text-white"
                    : isFutureYear
                    ? "opacity-30 cursor-not-allowed"
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
            className="bg-[#8B4513] hover:bg-[#A0522D] text-white"
          >
            Apply
          </Button>
        </div>
      </div>
    );
  }

  if (selectingMonth) {
    return (
      <div className="w-[340px] bg-white rounded-lg border border-[#D4C5B9] shadow-lg p-4">
        <div className="mb-4">
          <h3 className="text-center">Select month</h3>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {fullMonths.map((month, index) => {
            const isFutureMonth = currentYear > today.getFullYear() || 
                                   (currentYear === today.getFullYear() && index > today.getMonth());
            return (
              <Button
                key={month}
                variant={index === currentMonth ? "default" : "outline"}
                onClick={() => handleMonthSelect(index)}
                disabled={isFutureMonth}
                className={
                  index === currentMonth
                    ? "bg-[#8B4513] hover:bg-[#A0522D] text-white"
                    : isFutureMonth
                    ? "opacity-30 cursor-not-allowed"
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
            className="bg-[#8B4513] hover:bg-[#A0522D] text-white"
          >
            Apply
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[340px] bg-white rounded-lg border border-[#D4C5B9] shadow-lg p-4">
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
            className="hover:bg-[#F5E6D3]"
          >
            {fullMonths[currentMonth]}
          </Button>
          <Button
            variant="ghost"
            onClick={() => setSelectingYear(true)}
            className="hover:bg-[#F5E6D3]"
          >
            {currentYear}
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleNextMonth}
          disabled={currentYear >= today.getFullYear() && currentMonth >= today.getMonth()}
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
            className="text-center text-xs text-[#8B7355] py-1"
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
          const isFutureDate = dayDate > today;
          
          const inRange = isDateInRange(day);
          const isStart = isDateStart(day);
          const isEnd = isDateEnd(day);
          const isTodayDate =
            day === today.getDate() &&
            currentMonth === today.getMonth() &&
            currentYear === today.getFullYear();

          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              disabled={isFutureDate}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-md
                transition-colors
                ${isFutureDate ? "opacity-30 cursor-not-allowed text-gray-400" : ""}
                ${!isFutureDate && inRange ? "bg-[#8B4513] text-white" : !isFutureDate ? "hover:bg-[#F5E6D3]" : ""}
                ${isStart || isEnd ? "bg-[#8B4513] text-white font-semibold" : ""}
                ${isTodayDate && !inRange ? "border border-[#8B4513]" : ""}
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
          className="bg-[#8B4513] hover:bg-[#A0522D] text-white"
          disabled={!value.from || !value.to}
        >
          Apply
        </Button>
      </div>
    </div>
  );
}
