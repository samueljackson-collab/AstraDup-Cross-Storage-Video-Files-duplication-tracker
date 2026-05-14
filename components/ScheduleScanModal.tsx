import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addDays, addWeeks, addMonths } from 'date-fns';
import Button from './Button';

interface ScheduleScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchedule: (schedule: any) => void;
}

const ScheduleScanModal: React.FC<ScheduleScanModalProps> = ({ isOpen, onClose, onSchedule }) => {
  const [scheduleType, setScheduleType] = useState('once');
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [repeatInterval, setRepeatInterval] = useState('day');

  if (!isOpen) return null;

  const handleSchedule = () => {
    const schedule = {
      type: scheduleType,
      startDate,
      repeatInterval: scheduleType === 'recurring' ? repeatInterval : null,
    };
    onSchedule(schedule);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-black border border-green-700 rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-2xl leading-6 font-bold text-green-400">Schedule Scan</h3>
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-base font-semibold text-green-500">Schedule Type</label>
            <select 
              value={scheduleType} 
              onChange={(e) => setScheduleType(e.target.value)}
              className="w-full mt-1 p-2 rounded bg-black border border-green-700 text-green-300 focus:ring-green-500 focus:border-green-500"
            >
              <option value="once">Run Once</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>
          <div>
            <label className="text-base font-semibold text-green-500">Start Date & Time</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              showTimeSelect
              dateFormat="Pp"
              className="w-full mt-1 p-2 rounded bg-black border border-green-700 text-green-300 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          {scheduleType === 'recurring' && (
            <div>
              <label className="text-base font-semibold text-green-500">Repeat Every</label>
              <select 
                value={repeatInterval} 
                onChange={(e) => setRepeatInterval(e.target.value)}
                className="w-full mt-1 p-2 rounded bg-black border border-green-700 text-green-300 focus:ring-green-500 focus:border-green-500"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          )}
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button onClick={onClose} variant="secondary">Cancel</Button>
          <Button onClick={handleSchedule}>Set Schedule</Button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleScanModal;
