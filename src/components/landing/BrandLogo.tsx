import { Link } from "react-router-dom";
import { useBranding } from "@/hooks/useBranding";
import { useTheme } from "@/hooks/useTheme";

interface BrandLogoProps {
  to?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function BrandLogo({ to = "/", className = "", size = "md" }: BrandLogoProps) {
  const branding = useBranding();
  const { resolvedTheme } = useTheme();

  const logoUrl = resolvedTheme === "dark" && branding.logo_dark_url
    ? branding.logo_dark_url
    : branding.logo_url;

  const iconSizes = { sm: "h-7 w-7", md: "h-8 w-8", lg: "h-10 w-10" };
  const textSizes = { sm: "text-lg", md: "text-xl", lg: "text-2xl" };

  return (
    <Link to={to} className={`flex items-center gap-2.5 ${className}`}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={branding.platform_name}
          className={`${iconSizes[size]} object-contain`}
        />
      ) : (
        <div className={`${iconSizes[size]} rounded-lg bg-primary flex items-center justify-center`}>
          <span className="text-primary-foreground font-bold text-sm">
            {branding.platform_name.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      <span className={`font-heading ${textSizes[size]} tracking-wide text-foreground`}>
        {branding.platform_name.toUpperCase()}
      </span>
    </Link>
  );
}
