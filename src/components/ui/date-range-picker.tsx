"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface DateRange {
  from: Date | undefined
  to?: Date | undefined
}

interface DatePickerWithRangeProps {
  className?: string
  date?: DateRange
  onDateChange?: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  date,
  onDateChange,
}: DatePickerWithRangeProps) {
  const [selectedDate, setSelectedDate] = React.useState<DateRange | undefined>(date)

  const handleDateChange = (newDate: DateRange | undefined) => {
    setSelectedDate(newDate)
    onDateChange?.(newDate)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Button
        id="date"
        variant={"outline"}
        className={cn(
          "w-[300px] justify-start text-left font-normal",
          !selectedDate && "text-muted-foreground"
        )}
        onClick={() => {
          // Simple date picker implementation
          const today = new Date()
          const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          handleDateChange({ from: lastWeek, to: today })
        }}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        {selectedDate?.from ? (
          selectedDate.to ? (
            <>
              {selectedDate.from.toLocaleDateString()} -{" "}
              {selectedDate.to.toLocaleDateString()}
            </>
          ) : (
            selectedDate.from.toLocaleDateString()
          )
        ) : (
          <span>Pick a date range</span>
        )}
      </Button>
    </div>
  )
}