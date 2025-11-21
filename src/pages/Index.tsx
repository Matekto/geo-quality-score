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
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Unable to analyze this page",
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
            GEO Analyzer
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Optimize your web pages' visibility in AI-generated results
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
            <p className="text-muted-foreground mt-6">Analyzing your page content...</p>
          </div>
        )}

        {analysis && !isLoading && (
          <GeoResults analysis={analysis} url={analyzedUrl} />
        )}

        {!analysis && !isLoading && (
          <div className="max-w-5xl mx-auto mt-16 space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Why GEO is Essential for Your Marketing?</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Today, 40% of searches are performed via AIs like ChatGPT, Claude, or Gemini. 
                GEO ensures your content is properly understood and recommended by these assistants.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg bg-card border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">What is GEO?</h3>
                <p className="text-muted-foreground">
                  GEO (Generative Engine Optimization) optimizes your pages to be better understood and recommended by generative AIs like ChatGPT.
                </p>
              </div>
              
              <div className="p-6 rounded-lg bg-card border border-border">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-secondary">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">How Does It Work?</h3>
                <p className="text-muted-foreground">
                  Our tool analyzes your page against 10 key criteria: reliable sources, precise statistics, clear structure, and actionable content.
                </p>
              </div>
              
              <div className="p-6 rounded-lg bg-card border border-border">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-accent">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">The Benefits</h3>
                <p className="text-muted-foreground">
                  Increase your visibility in AI responses, strengthen your credibility, and get concrete improvement recommendations.
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
