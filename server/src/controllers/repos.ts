import { getRepositories as getRepositoriesGithub } from "./github";
import { getRepositories as getRepositoriesForgejo } from "./forgejo";

export type RepoOutput = {
  id: number;
  name: string;
  description: string | null;
  stars: number;
  forks: number;
  url: string;
  language: string | null;
  languageColor: string;
  updatedAt: string;
  source: "github" | "forgejo";
};

async function fetchRepositories(): Promise<RepoOutput[]> {
  switch (process.env.REPO_SOURCE) {
    case "forgejo":
      return getRepositoriesForgejo();
    case "mixed":
      return Promise.all([
        getRepositoriesGithub(),
        getRepositoriesForgejo(),
      ]).then(([github, forgejo]) => [...github, ...forgejo]);
    case "github":
    default:
      return getRepositoriesGithub();
  }
}

// ponytail: single global 5-min cache — unauth GitHub is 60 req/hr, so without
// this a spammer could exhaust it. One entry, no per-user keying needed.
let repoCache: { data: RepoOutput[]; expiresAt: number } | null = null;
const REPO_TTL = 5 * 60_000;

export async function getRepositories(): Promise<RepoOutput[]> {
  if (repoCache && repoCache.expiresAt > Date.now()) return repoCache.data;

  const repositories = await fetchRepositories();
  const data = repositories.sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
  repoCache = { data, expiresAt: Date.now() + REPO_TTL };
  return data;
}
