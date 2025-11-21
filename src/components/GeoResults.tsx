import { Card } from "@/components/ui/card";
import { GeoScoreCircle } from "./GeoScoreCircle";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface GeoImprovement {
  text: string;
  score: number;
}

interface GeoAnalysis {
  score: number;
  diagnostic: string;
  improvements: GeoImprovement[];
}

interface GeoResultsProps {
  analysis: GeoAnalysis;
  url: string;
}

export const GeoResults = ({ analysis, url }: GeoResultsProps) => {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 animate-in fade-in-50 duration-700">
      <Card className="p-8 bg-card border-border shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0">
            <GeoScoreCircle score={analysis.score} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2 text-foreground">GEO Score</h2>
            <p className="text-muted-foreground mb-4">
              Analysis of: <span className="text-primary font-mono text-sm break-all">{url}</span>
            </p>
            <div className="flex gap-2 justify-center md:justify-start">
              {analysis.score >= 80 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success/10 text-success text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Excellent
                </span>
              )}
              {analysis.score >= 60 && analysis.score < 80 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-warning/10 text-warning text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  Good
                </span>
              )}
              {analysis.score < 60 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-medium">
                  <AlertCircle className="h-4 w-4" />
                  Needs Improvement
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-8 bg-card border-border shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-foreground">Diagnostic</h3>
        <div className="prose prose-invert max-w-none">
          <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {analysis.diagnostic.split(/(\*\*.*?\*\*)/).map((part, index) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={index} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        </div>
      </Card>

      <Card className="p-8 bg-card border-border shadow-lg">
        <h3 className="text-xl font-bold mb-6 text-foreground">10 Priority Recommendations</h3>
        <div className="space-y-3">
          {analysis.improvements.map((improvement, index) => {
            const scoreColor = improvement.score >= 7 ? 'text-success' : 
                              improvement.score >= 4 ? 'text-warning' : 
                              'text-destructive';
            
            return (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <p className="text-foreground leading-relaxed flex-1">{improvement.text}</p>
                <div className="flex-shrink-0 flex flex-col items-center gap-1">
                  <span className={`text-2xl font-bold ${scoreColor}`}>
                    {improvement.score}
                  </span>
                  <span className="text-xs text-muted-foreground">/10</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
