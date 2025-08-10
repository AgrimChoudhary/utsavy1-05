
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface CountdownProps {
  className?: string;
  weddingDate: string;
  weddingTime: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const parseWeddingDateTime = (dateStr: string, timeStr: string) => {
  const timeStart = timeStr.split(' - ')[0];
  const dateTimeString = `${dateStr} ${timeStart}`;
  const date = new Date(dateTimeString);
  if (isNaN(date.getTime())) {
    return new Date();
  }
  return date;
};

const calculateTimeLeft = (targetDate: Date): TimeLeft => {
  const difference = targetDate.getTime() - new Date().getTime();
  if (difference <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
};

const Countdown: React.FC<CountdownProps> = ({ className, weddingDate, weddingTime }) => {
  const targetDate = parseWeddingDateTime(weddingDate, weddingTime);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(targetDate));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const timeUnits = [
    { value: timeLeft.days, label: 'Days' },
    { value: timeLeft.hours, label: 'Hours' },
    { value: timeLeft.minutes, label: 'Minutes' },
    { value: timeLeft.seconds, label: 'Seconds' },
  ];

  return (
    <div className={cn('text-center', className)}>
      <h3 className="font-cormorant text-xl md:text-2xl mb-6 italic text-yellow-200 flex items-center justify-center">
        <Clock className="mr-2 text-yellow-300" size={20} />
        Days until forever begins...
      </h3>
      <div className="flex justify-center space-x-4 md:space-x-8">
        {timeUnits.map((unit) => (
          <div key={unit.label} className="flex flex-col items-center">
            <div className="bg-black/30 py-3 px-4 md:px-6 rounded-lg border border-yellow-400/30">
              <span className="font-cormorant font-bold text-2xl md:text-4xl text-yellow-300">
                {unit.value.toString().padStart(2, '0')}
              </span>
            </div>
            <span className="text-yellow-200/80 text-xs md:text-sm uppercase tracking-wider mt-2">
              {unit.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Countdown;
