import React from 'react';
import '../styles/components/ScopedNotification.css';

interface ScopedNotificationProps {
  impactedMeasuresCount: number;
  showOnlyImpactedKPI: boolean;
  onToggleShowOnlyImpactedKPI: (checked: boolean) => void;
}

const ScopedNotification: React.FC<ScopedNotificationProps> = ({
  impactedMeasuresCount,
  showOnlyImpactedKPI,
  onToggleShowOnlyImpactedKPI,
}) => {
  if (impactedMeasuresCount === 0) {
    return null;
  }

  return (
    <div className="scoped-notification">
      <div className="scoped-notification-content">
        <svg className="scoped-notification-icon" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" clipRule="evenodd" d="M19.7693 16.3443L12.2115 2.1009C11.75 1.3309 10.75 1.3309 10.2885 2.1009L2.73077 16.3443C2.05769 17.4797 2.73077 19.2116 4.19231 19.2116H18.8077C20.2692 19.2116 20.9423 17.4797 20.2693 16.3443ZM10 15.2C9.34615 15.2 8.84615 14.7 8.84615 14.0462C8.84615 13.3923 9.34615 12.8923 10 12.8923C10.6538 12.8923 11.1538 13.3923 11.1538 14.0462C11.1538 14.7 10.6538 15.2 10 15.2ZM10 11.2C9.34615 11.2 8.84615 10.7 8.84615 10.0462V6.2C8.84615 5.54615 9.34615 5.04615 10 5.04615C10.6538 5.04615 11.1538 5.54615 11.1538 6.2V10.0462C11.1538 10.7 10.6538 11.2 10 11.2Z" fill="#8C4B02"/>
        </svg>
        <span className="scoped-notification-text">
          {impactedMeasuresCount} {impactedMeasuresCount === 1 ? 'Measure' : 'Measures'} are impacted by this edit
        </span>
        <label className="scoped-notification-checkbox-label">
          <input
            type="checkbox"
            className="scoped-notification-checkbox"
            checked={showOnlyImpactedKPI}
            onChange={(e) => onToggleShowOnlyImpactedKPI(e.target.checked)}
          />
          <span className="scoped-notification-checkbox-text">Show Only Impacted Measures</span>
        </label>
      </div>
    </div>
  );
};

export default ScopedNotification;

