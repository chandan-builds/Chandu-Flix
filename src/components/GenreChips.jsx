import { Link } from "react-router-dom";
import "./GenreChips.css";
const categories = [
  ["All stories", "/movies"],
  ["Action", "/movies?genre=28"],
  ["Comedy", "/movies?genre=35"],
  ["Thriller", "/movies?genre=53"],
  ["Sci-fi", "/movies?genre=878"],
  ["Romance", "/movies?genre=10749"],
  ["Animation", "/movies?genre=16"],
  ["Drama", "/movies?genre=18"],
  ["Documentary", "/movies?genre=99"],
];
export default function GenreChips() {
  return (
    <nav className="genre-chips-container" aria-label="Explore genres">
      <div className="genre-chips-scroll">
        {categories.map(([label, path]) => (
          <Link className="genre-chip" key={label} to={path}>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
