import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = { title: string; reason: string };
type WorkoutResponse = { suggestions: WorkoutSuggestion[] };

const userEmail = 'mona@example.com';
const loadSuggestions = () => getJson<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`)
  .then((response) => response.suggestions);

export default function Workouts() {
  return (
    <CapabilityCard
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      emptyText="No workout suggestions found."
      loadItems={loadSuggestions}
      renderItems={(suggestions) => (
        <ul className="list-group list-group-flush">
          {suggestions.map((suggestion, index) => (
            <li className="list-group-item" key={`${suggestion.title}-${index}`}>
              <strong>{suggestion.title}</strong>
              <p className="mb-0">{suggestion.reason}</p>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
