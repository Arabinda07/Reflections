import React from 'react';
import ReactCalendar from 'react-calendar';
import './react-calendar.css';

import './Calendar.css';

interface MyNotesCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  tileContent: (args: { date: Date; view: string }) => React.ReactNode;
}

export const MyNotesCalendar: React.FC<MyNotesCalendarProps> = ({
  selectedDate,
  onSelectDate,
  tileContent,
}) => {
  return (
    <ReactCalendar
      onChange={(value) => onSelectDate(value as Date)}
      value={selectedDate}
      tileContent={tileContent}
      className="w-full border-none font-sans"
    />
  );
};
