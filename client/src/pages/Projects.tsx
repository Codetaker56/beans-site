import useTitle from "../hooks/Title";

export default function Projects() {
  useTitle("beans — projects");

  return (
    <div className="centered">
      <h1 style={{ marginBottom: 0 }}>projects</h1>
      <p>
        nothing here yet &mdash; i'm still learning the basics. once i build
        something worth showing, it'll go here.
      </p>
    </div>
  );
}
