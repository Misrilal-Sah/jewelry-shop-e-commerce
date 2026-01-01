import { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import './FlashSaleTimer.css';

const FlashSaleTimer = ({ endTime, size = 'default', showLabel = true }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const difference = end - now;

      if (difference <= 0) {
        setExpired(true);
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (expired) {
    return null;
  }

  const formatNumber = (num) => num.toString().padStart(2, '0');

  return (
    <div className={`flash-sale-timer ${size}`}>
      {showLabel && (
        <div className="timer-label">
          <Zap size={size === 'small' ? 14 : 18} />
          <span>Flash Sale</span>
        </div>
      )}
      <div className="countdown">
        {timeLeft.days > 0 && (
          <div className="time-unit">
            <span className="number">{formatNumber(timeLeft.days)}</span>
            <span className="label">days</span>
          </div>
        )}
        <div className="time-unit">
          <span className="number">{formatNumber(timeLeft.hours)}</span>
          <span className="label">hrs</span>
        </div>
        <div className="separator">:</div>
        <div className="time-unit">
          <span className="number">{formatNumber(timeLeft.minutes)}</span>
          <span className="label">min</span>
        </div>
        <div className="separator">:</div>
        <div className="time-unit">
          <span className="number">{formatNumber(timeLeft.seconds)}</span>
          <span className="label">sec</span>
        </div>
      </div>
    </div>
  );
};

export default FlashSaleTimer;
