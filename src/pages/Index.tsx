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
        title: "Analyse terminée",
        description: `Score GEO : ${data.score}/100`,
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Erreur d'analyse",
        description: error instanceof Error ? error.message : "Impossible d'analyser cette page",
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
            Analyseur GEO
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Optimisez la visibilité de vos pages web dans les résultats générés par l'Intelligence Artificielle
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
            <p className="text-muted-foreground mt-6">Analyse du contenu de votre page...</p>
          </div>
        )}

        {analysis && !isLoading && (
          <GeoResults analysis={analysis} url={analyzedUrl} />
        )}

        {!analysis && !isLoading && (
          <div className="max-w-5xl mx-auto mt-16 space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4 text-foreground">Pourquoi le GEO est essentiel pour votre marketing ?</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Aujourd'hui, 40% des recherches sont effectuées via des IA comme ChatGPT, Claude ou Gemini. 
                Le GEO garantit que votre contenu est correctement compris et recommandé par ces assistants.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-lg bg-card border border-border">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Qu'est-ce que le GEO ?</h3>
                <p className="text-muted-foreground">
                  Le GEO (Generative Engine Optimization) optimise vos pages pour être mieux comprises et recommandées par les IA générative comme ChatGPT.
                </p>
              </div>
              
              <div className="p-6 rounded-lg bg-card border border-border">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-secondary">2</span>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Comment ça marche ?</h3>
                <p className="text-muted-foreground">
                  Notre outil analyse votre page selon 10 critères clés : sources fiables, statistiques précises, structure claire, et contenu actionnable.
                </p>
              </div>
              
              <div className="p-6 rounded-lg bg-card border border-border">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-accent">3</span>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">Les bénéfices</h3>
                <p className="text-muted-foreground">
                  Augmentez votre visibilité dans les réponses IA, renforcez votre crédibilité, et obtenez des recommandations concrètes d'amélioration.
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
