import { useState } from "react";
import { FaCheck, FaClipboard } from "react-icons/fa";

import DiscordWidget from "../components/DiscordInfo";
import useTitle from "../hooks/Title";

const DISCORD_USER_ID = "1084538643206647909";
const DISCORD_USERNAME = "bakedbeans._._.";

export default function Home() {
  useTitle("beans");

  const [copied, setCopied] = useState(false);

  async function copyDiscord() {
    try {
      await navigator.clipboard.writeText(DISCORD_USERNAME);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard denied — silent */
    }
  }

  return (
    <div className="centered">
      <h1 style={{ fontSize: "2.75rem", marginBottom: "0" }}>
        hi, i'm <span className="accent-gradient">beans</span>.
      </h1>

      <p>
        i'm learning to code. right now i know some basic{" "}
        <span className="accent">Python</span>, and i want to pick up more
        languages as i go.
      </p>

      <h2>say hi</h2>
      <DiscordWidget userId={DISCORD_USER_ID} />

      <div className="copy-container" style={{ marginTop: "0.5rem" }}>
        <code>{DISCORD_USERNAME}</code>
        <button onClick={copyDiscord} title="copy discord username">
          {copied ? <FaCheck size={14} /> : <FaClipboard size={14} />}
        </button>
      </div>
    </div>
  );
}
