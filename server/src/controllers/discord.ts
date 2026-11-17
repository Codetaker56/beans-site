import { discordClient } from "../modules/discordClient";

type DiscordInfo = {
  name: string;
  username: string;
  avatar?: string;
  avatar_decoration?: string;
  banner?: string;
  banner_color?: number;
  status: string;
  activities?: string[];
};

type RawActivity = {
  type: number;
  name: string;
  details?: string | null;
  state?: string | null;
};

function formatOne(a: RawActivity): string {
  switch (a.type) {
    case 0:
      return `Playing ${a.name}`;
    case 1:
      return `Streaming ${a.name}`;
    case 2:
      return a.name === "Spotify" && a.details
        ? `Listening to ${a.details}${a.state ? ` — ${a.state}` : ""}`
        : `Listening to ${a.name}`;
    case 3:
      return `Watching ${a.name}`;
    case 4:
      return a.state || ""; // custom status
    case 5:
      return `Competing in ${a.name}`;
    default:
      return a.name || "";
  }
}

// Every activity in the member's presence, one line each.
function formatActivities(activities: RawActivity[] | undefined): string[] {
  if (!activities) return [];
  return activities.map(formatOne).filter((s) => s.length > 0);
}

const cacheTTL = 30_000;
const userCache = new Map<string, { data: DiscordInfo; expiresAt: number }>();

// Only serve the profile(s) the site actually shows. Without this, anyone could
// enumerate every member of the bot's guild (name/avatar/presence) and, because
// each miss spends the shared bot token on Discord API calls, hammer that token.
const ALLOWED_IDS = new Set(
  (process.env.DISCORD_USER_ID || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);
const SNOWFLAKE = /^\d{17,20}$/;

function getAssetExtention(id: string): string {
  return id.startsWith("a_") ? "gif" : "png";
}

export async function getUserInfo(userId: string): Promise<DiscordInfo | null> {
  if (!SNOWFLAKE.test(userId)) return null;
  if (ALLOWED_IDS.size > 0 && !ALLOWED_IDS.has(userId)) return null;

  const now = Date.now();

  const cached = userCache.get(userId);
  if (cached && cached.expiresAt > now) return cached.data;

  const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
  });

  if (response.status == 404) return null;
  if (!response.ok)
    throw new Error(`Failed to fetch discord info: ${response.status}`);

  const user = await response.json();
  const guild = await discordClient.guilds.fetch(
    process.env.DISCORD_GUILD_ID!,
  );

  var member;
  try {
    member = await guild.members.fetch(userId);
  } catch (e) {
    return null;
  }

  const banner = user.banner
    ? `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${getAssetExtention(user.banner)}?size=256`
    : "";

  const avatar = user.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${getAssetExtention(user.avatar)}?size=256`
    : "";

  const avatarDecoration = user.avatar_decoration_data
    ? `https://cdn.discordapp.com/media/v1/collectibles-shop/${user.avatar_decoration_data.sku_id}/animated`
    : "";

  const data: DiscordInfo = {
    name: member.user.globalName || member.user.username,
    username: member.user.username,
    avatar: avatar,
    avatar_decoration: avatarDecoration,
    banner: banner,
    banner_color: user.banner_color ?? "#dcd9d6",
    status: member.presence?.status ?? "offline",
    activities: formatActivities(member.presence?.activities),
  };

  userCache.set(userId, {
    data,
    expiresAt: now + cacheTTL,
  });

  return data;
}
