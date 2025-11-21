import { useState } from "react";
import { UrlInputForm } from "@/components/UrlInputForm";
import { GeoResults } from "@/components/GeoResults";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";

interface GeoAnalysis {
  score: number;
  diagnostic: string;
  improvements: string[];
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<GeoAnalysis | null>(null);
  const [analyzedUrl, setAnalyzedUrl] = useState("");
  const { toast } = useToast();

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-geo", {
        body: { url },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
      setAnalyzedUrl(url);
      
      toast({
        title: "Analysis Complete",
        description: `GEO Score: ${data.score}/100`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the website",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/20 mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-5xl font-bold mb-4 text-foreground">
            GEO Scoring Engine
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Analyze and optimize your webpages for Large Language Models with advanced GEO techniques
          </p>
        </div>

        <div className="mb-12">
          <UrlInputForm onSubmit={handleAnalyze} isLoading={isLoading} />
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-pulse">
              <div className="h-3 w-64 bg-primary/20 rounded mb-4"></div>
              <div className="h-3 w-48 bg-primary/10 rounded mx-auto"></div>
            </div>
            <p className="text-muted-foreground mt-6">Analyzing webpage content...</p>
          </div>
        )}

        {analysis && !isLoading && (
          <GeoResults analysis={analysis} url={analyzedUrl} />
        )}

        {!analysis && !isLoading && (
          <div className="max-w-4xl mx-auto mt-16">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg bg-card border border-border">
                <h3 className="text-lg font-semibold mb-3 text-foreground">What is GEO?</h3>
                <p className="text-muted-foreground">
                  Generative Engine Optimization (GEO) refers to techniques that increase the perceived quality of a webpage for Large Language Models, improving visibility and accuracy in AI-generated responses.
                </p>
              </div>
              <div className="p-6 rounded-lg bg-card border border-border">
                <h3 className="text-lg font-semibold mb-3 text-foreground">How it works</h3>
                <p className="text-muted-foreground">
                  Our engine analyzes your webpage against 10 key criteria including authoritative sources, statistics, expert quotes, clear structure, and actionable recommendations.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
