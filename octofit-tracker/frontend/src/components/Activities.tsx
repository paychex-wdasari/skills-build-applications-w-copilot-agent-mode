import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = {
  type: string;
  minutes: number;
  points: number;
};

type ActivityResponse = { activities: Activity[] };

const loadActivities = () => getJson<ActivityResponse>('/api/activities').then((response) => response.activities);

export default function Activities() {
  return (
    <CapabilityCard
      title="Activities"
      description="Track student activity minutes and points."
      emptyText="No activities found."
      loadItems={loadActivities}
      renderItems={(activities) => (
          <ul className="list-group list-group-flush">
            {activities.map((activity, index) => (
              <li className="list-group-item d-flex justify-content-between" key={`${activity.type}-${index}`}>
                <span>{activity.type}</span>
                <span>{activity.minutes} minutes</span>
                <span>{activity.points} points</span>
              </li>
            ))}
          </ul>
      )}
    />
  );
}
