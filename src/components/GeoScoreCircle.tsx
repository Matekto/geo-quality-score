import { cn } from "@/lib/utils";

interface GeoScoreCircleProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export const GeoScoreCircle = ({ score, size = "lg" }: GeoScoreCircleProps) => {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getCircleStroke = (score: number) => {
    if (score >= 80) return "stroke-success";
    if (score >= 60) return "stroke-warning";
    return "stroke-destructive";
  };

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sizeClasses = {
    sm: "w-24 h-24 text-2xl",
    md: "w-32 h-32 text-3xl",
    lg: "w-40 h-40 text-5xl",
  };

  return (
    <div className={cn("relative", sizeClasses[size])}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          cx="50%"
          cy="50%"
          r="70"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted opacity-20"
        />
        <circle
          cx="50%"
          cy="50%"
          r="70"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={cn("transition-all duration-1000 ease-out", getCircleStroke(score))}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("font-bold", getScoreColor(score))}>{score}</span>
      </div>
    </div>
  );
};
