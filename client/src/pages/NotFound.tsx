import { FaHome } from "react-icons/fa";

import LinkButton from "../components/LinkButton";
import useTitle from "../hooks/Title";

export default function NotFound() {
  useTitle("beans — 404");

  return (
    <div className="centered">
      <h1 style={{ fontSize: "3rem", marginBottom: "0" }} className="accent">
        404
      </h1>
      <p>this page doesn't exist.</p>
      <LinkButton href="/" lowerText="home" icon={<FaHome size={20} />} />
    </div>
  );
}
