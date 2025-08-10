import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, isToday, isBefore, set } from 'date-fns';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  className?: string;
  selectedDate?: string;
}

export function TimePicker({ value, onChange, className, selectedDate }: TimePickerProps) {
  const [hours, setHours] = useState<number>(12);
  const [minutes, setMinutes] = useState<number>(0);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [isOpen, setIsOpen] = useState(false);

  // Parse the input value when it changes
  useEffect(() => {
    if (value) {
      const timeRegex = /^(\d{1,2}):(\d{2})\s?(AM|PM)?$/i;
      const match = value.match(timeRegex);
      
      if (match) {
        let parsedHours = parseInt(match[1], 10);
        const parsedMinutes = parseInt(match[2], 10);
        let parsedPeriod: 'AM' | 'PM' = 'AM';
        
        // Handle period if provided
        if (match[3]) {
          parsedPeriod = match[3].toUpperCase() as 'AM' | 'PM';
        } else if (parsedHours >= 12) {
          parsedPeriod = 'PM';
          if (parsedHours > 12) parsedHours -= 12;
        }
        
        // Convert 24-hour format to 12-hour if no period was specified
        if (!match[3] && parsedHours > 12) {
          parsedHours = parsedHours % 12 || 12;
        }
        
        setHours(parsedHours);
        setMinutes(parsedMinutes);
        setPeriod(parsedPeriod);
      }
    }
  }, [value]);

  // Update the time when hours, minutes, or period changes
  const updateTime = () => {
    let formattedHours = hours;
    
    // Convert to 24-hour format for internal consistency
    if (period === 'PM' && hours < 12) {
      formattedHours += 12;
    } else if (period === 'AM' && hours === 12) {
      formattedHours = 0;
    }
    
    const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    onChange(formattedTime);
  };

  // Check if a time option should be disabled
  const isTimeDisabled = (timeOption: { hours: number, minutes: number, period: 'AM' | 'PM' }): boolean => {
    if (!selectedDate) return false;
    
    try {
      const selectedDateObj = new Date(selectedDate);
      
      // Only apply restrictions if the selected date is today
      if (!isToday(selectedDateObj)) return false;
      
      const now = new Date();
      
      // Convert the time option to a Date object for comparison
      let optionHours = timeOption.hours;
      if (timeOption.period === 'PM' && optionHours !== 12) {
        optionHours += 12;
      } else if (timeOption.period === 'AM' && optionHours === 12) {
        optionHours = 0;
      }
      
      const timeOptionDate = set(selectedDateObj, {
        hours: optionHours,
        minutes: timeOption.minutes,
        seconds: 0,
        milliseconds: 0
      });
      
      // Check if the time option is in the past
      return isBefore(timeOptionDate, now);
    } catch (error) {
      console.error('Error checking if time is disabled:', error);
      return false;
    }
  };

  // Apply changes and close popover
  const handleApply = () => {
    updateTime();
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value || "Select time"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            {/* Hours input */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Hour</label>
              <Input
                className="w-16 text-center"
                value={hours}
                onChange={(e) => {
                  const newHours = parseInt(e.target.value, 10);
                  if (!isNaN(newHours) && newHours >= 1 && newHours <= 12) {
                    setHours(newHours);
                  }
                }}
                type="number"
                min={1}
                max={12}
              />
            </div>
            <span className="text-xl mt-5">:</span>
            {/* Minutes input */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Minute</label>
              <Input
                className="w-16 text-center"
                value={minutes}
                onChange={(e) => {
                  const newMinutes = parseInt(e.target.value, 10);
                  if (!isNaN(newMinutes) && newMinutes >= 0 && newMinutes <= 59) {
                    setMinutes(newMinutes);
                  }
                }}
                type="number"
                min={0}
                max={59}
                step={5}
              />
            </div>
            {/* AM/PM selector */}
            <div className="mt-5">
              <div className="flex rounded-md overflow-hidden">
                <Button
                  type="button"
                  variant={period === 'AM' ? 'default' : 'outline'}
                  className="rounded-r-none px-3"
                  onClick={() => setPeriod('AM')}
                >
                  AM
                </Button>
                <Button
                  type="button"
                  variant={period === 'PM' ? 'default' : 'outline'}
                  className="rounded-l-none px-3"
                  onClick={() => setPeriod('PM')}
                >
                  PM
                </Button>
              </div>
            </div>
          </div>

          {/* Hour selection grid */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Quick Hour Selection</label>
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => {
                const isDisabledAM = isTimeDisabled({ hours: hour, minutes, period: 'AM' });
                const isDisabledPM = isTimeDisabled({ hours: hour, minutes, period: 'PM' });
                
                return (
                  <Button
                    key={hour}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "text-xs h-8",
                      hours === hour && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setHours(hour)}
                    disabled={period === 'AM' ? isDisabledAM : isDisabledPM}
                  >
                    {hour}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Minute selection grid */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Quick Minute Selection</label>
            <div className="grid grid-cols-4 gap-2">
              {[0, 15, 30, 45].map((minute) => {
                const isDisabled = isTimeDisabled({ hours, minutes: minute, period });
                
                return (
                  <Button
                    key={minute}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "text-xs h-8",
                      minutes === minute && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => setMinutes(minute)}
                    disabled={isDisabled}
                  >
                    {String(minute).padStart(2, '0')}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleApply}>Apply</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}