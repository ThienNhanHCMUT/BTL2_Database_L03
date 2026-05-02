import { useEffect, useRef } from 'react';
import { useBooking } from '../context/BookingContext';

export function useCountdown() {
  const { bookingTimer, timerActive, tickTimer, resetBooking } = useBooking();
  const intervalRef = useRef(null);

  useEffect(() => {
    if (timerActive && bookingTimer > 0) {
      intervalRef.current = setInterval(() => {
        tickTimer();
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerActive, bookingTimer, tickTimer]);

  useEffect(() => {
    if (timerActive && bookingTimer <= 0) {
      resetBooking();
    }
  }, [bookingTimer, timerActive, resetBooking]);

  return {
    timeLeft: bookingTimer,
    isActive: timerActive,
    isWarning: bookingTimer <= 120 && bookingTimer > 0,
    isDanger: bookingTimer <= 60 && bookingTimer > 0,
  };
}
