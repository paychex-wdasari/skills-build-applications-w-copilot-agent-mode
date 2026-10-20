import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

const loadLeaderboard = () => getJson<LeaderboardResponse>('/api/leaderboard').then((response) => response.leaderboard);

export default function Leaderboard() {
  return (
    <CapabilityCard
      title="Leaderboard"
      description="Compare team point totals."
      emptyText="No leaderboard scores yet."
      loadItems={loadLeaderboard}
      renderItems={(entries) => (
        <ol className="list-group list-group-numbered">
          {entries.map((entry, index) => (
            <li className="list-group-item d-flex justify-content-between" key={`${entry.teamName}-${index}`}>
              <span>{entry.teamName} (rank {entry.rank})</span>
              <span>{entry.totalPoints} points</span>
            </li>
          ))}
        </ol>
      )}
    />
  );
}
