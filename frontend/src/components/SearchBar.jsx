export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-box">
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search kanji, meaning, or reading..."
      />
    </div>
  );
}
