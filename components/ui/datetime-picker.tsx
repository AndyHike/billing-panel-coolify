'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Clock } from 'lucide-react'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  label?: string
  disabled?: boolean
  min?: string
}

/**
 * DateTime Picker компонент з можливістю вибору дати, годин та хвилин
 * Повертає ISO string (YYYY-MM-DDTHH:mm:ss)
 */
export function DateTimePicker({
  value,
  onChange,
  label,
  disabled = false,
  min,
}: DateTimePickerProps) {
  const [dateInput, setDateInput] = useState(
    value ? value.split('T')[0] : ''
  )
  const [hoursInput, setHoursInput] = useState(
    value ? value.split('T')[1]?.split(':')[0] || '00' : '00'
  )
  const [minutesInput, setMinutesInput] = useState(
    value ? value.split('T')[1]?.split(':')[1] || '00' : '00'
  )

  const handleDateChange = (newDate: string) => {
    setDateInput(newDate)
    updateValue(newDate, hoursInput, minutesInput)
  }

  const handleHoursChange = (newHours: string) => {
    const hours = Math.min(Math.max(parseInt(newHours) || 0, 0), 23).toString().padStart(2, '0')
    setHoursInput(hours)
    updateValue(dateInput, hours, minutesInput)
  }

  const handleMinutesChange = (newMinutes: string) => {
    const minutes = Math.min(Math.max(parseInt(newMinutes) || 0, 0), 59).toString().padStart(2, '0')
    setMinutesInput(minutes)
    updateValue(dateInput, hoursInput, minutes)
  }

  const updateValue = (date: string, hours: string, minutes: string) => {
    if (date) {
      const isoString = `${date}T${hours}:${minutes}:00`
      onChange(isoString)
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <div className="space-y-2">
        {/* Вибір дати */}
        <Input
          type="date"
          value={dateInput}
          onChange={(e) => handleDateChange(e.target.value)}
          disabled={disabled}
          min={min}
        />

        {/* Вибір часу */}
        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <Clock className="h-4 w-4" />
              </InputGroupAddon>
              <InputGroupInput
                type="number"
                placeholder="00"
                value={hoursInput}
                onChange={(e) => handleHoursChange(e.target.value)}
                disabled={disabled}
                min="0"
                max="23"
                className="text-center w-12"
              />
            </InputGroup>
          </div>

          <div className="text-muted-foreground text-lg font-medium">:</div>

          <div className="flex-1">
            <InputGroup>
              <InputGroupInput
                type="number"
                placeholder="00"
                value={minutesInput}
                onChange={(e) => handleMinutesChange(e.target.value)}
                disabled={disabled}
                min="0"
                max="59"
                className="text-center w-12"
              />
            </InputGroup>
          </div>
        </div>
      </div>

      {/* Попередній перегляд */}
      {dateInput && (
        <p className="text-xs text-muted-foreground">
          {new Date(`${dateInput}T${hoursInput}:${minutesInput}`).toLocaleString('uk-UA')}
        </p>
      )}
    </div>
  )
}
