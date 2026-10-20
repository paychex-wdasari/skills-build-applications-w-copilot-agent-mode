import { Activity, Team, User, Workout } from '../models/index.js';
import { Types } from 'mongoose';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity input is required'), { status: 400 });
  }

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !Types.ObjectId.isValid(userId) ||
    typeof teamId !== 'string' || !Types.ObjectId.isValid(teamId) ||
    typeof type !== 'string' || !type.trim() ||
    typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0
  ) {
    throw Object.assign(new Error('Invalid activity input'), { status: 400 });
  }

  const [user, team] = await Promise.all([
    User.exists({ _id: userId }),
    Team.exists({ _id: teamId }),
  ]);
  if (!user || !team) {
    throw Object.assign(new Error('Activity user or team was not found'), { status: 404 });
  }

  return Activity.create({
    user: userId,
    team: teamId,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team input is required'), { status: 400 });
  }

  const { name, mascot, members } = input as Record<string, unknown>;
  if (
    typeof name !== 'string' || !name.trim() ||
    typeof mascot !== 'string' || !mascot.trim() ||
    (members !== undefined && (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !Types.ObjectId.isValid(member))))
  ) {
    throw Object.assign(new Error('Invalid team input'), { status: 400 });
  }

  const memberIds = (members ?? []) as string[];
  const existingMembers = await User.countDocuments({ _id: { $in: memberIds } });
  if (existingMembers !== new Set(memberIds).size) {
    throw Object.assign(new Error('One or more team members were not found'), { status: 404 });
  }

  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('_id name').lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));

  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) {
    throw Object.assign(new Error('User was not found'), { status: 404 });
  }

  const [recentActivity, workouts] = await Promise.all([
    Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean(),
    Workout.find().lean(),
  ]);
  const activityFocus: Record<string, string> = {
    run: 'endurance',
    cycle: 'endurance',
    walk: 'endurance',
    strength: 'strength',
  };
  const recentFocus = recentActivity
    ? activityFocus[recentActivity.type.toLowerCase()] ?? recentActivity.type.toLowerCase()
    : undefined;
  const goalFocus = user.fitnessGoal.toLowerCase();
  const hasGoalMatch = workouts.some((workout) => workout.focus.toLowerCase() === goalFocus);
  const preferredFocus = hasGoalMatch ? goalFocus : recentFocus;

  return workouts
    .sort((left, right) => {
      const leftPreferred = left.focus.toLowerCase() === preferredFocus;
      const rightPreferred = right.focus.toLowerCase() === preferredFocus;
      return Number(rightPreferred) - Number(leftPreferred) || left.title.localeCompare(right.title);
    })
    .map((workout) => ({
      ...workout,
      reason: workout.focus.toLowerCase() === goalFocus
        ? `Supports your ${user.fitnessGoal} fitness goal.`
        : workout.focus.toLowerCase() === recentFocus && recentActivity
          ? `Recommended based on your recent ${recentActivity.type} activity.`
          : `Suggested to support your ${workout.focus} training.`,
    }));
}

export { User };
