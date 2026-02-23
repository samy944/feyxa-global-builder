import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface MarketSearchProps {
  placeholder?: string;
  className?: string;
}

export function MarketSearch({ placeholder = "Rechercher un produit, une marque…", className = "" }: MarketSearchProps) {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/market?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <Search
        size={16}
        className="absolute left-4 top-1/2 -translate-y-1/2"
        style={{ color: "#6B7280" }}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full h-13 pl-11 pr-5 text-sm transition-all duration-150 focus:outline-none"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "0.75rem",
          color: "#FFFFFF",
          fontWeight: 400,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(71,210,30,0.35)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(71,210,30,0.08), 0 0 20px rgba(71,210,30,0.06)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </form>
  );
}
