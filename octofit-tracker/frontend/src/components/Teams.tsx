import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Team = { name: string; members: string[] };
type TeamResponse = { teams: Team[] };

const loadTeams = () => getJson<TeamResponse>('/api/teams').then((response) => response.teams);

export default function Teams() {
  return (
    <CapabilityCard
      title="Teams"
      description="Manage teams and members."
      emptyText="No teams found."
      loadItems={loadTeams}
      renderItems={(teams) => (
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li className="list-group-item d-flex justify-content-between" key={`${team.name}-${index}`}>
              <span>{team.name}</span>
              <span>{team.members.length} members</span>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
