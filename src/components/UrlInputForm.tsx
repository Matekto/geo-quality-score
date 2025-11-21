import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface UrlInputFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export const UrlInputForm = ({ onSubmit, isLoading }: UrlInputFormProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onSubmit(url.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex gap-3">
        <Input
          type="url"
          placeholder="Entrez l'URL de votre page web (ex: https://exemple.com)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
          className="flex-1 h-14 text-lg bg-card border-border focus:border-primary focus:ring-primary"
          required
        />
        <Button
          type="submit"
          disabled={isLoading || !url.trim()}
          size="lg"
          className="h-14 px-8 bg-primary hover:bg-secondary text-primary-foreground font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyse en cours
            </>
          ) : (
            "Analyser"
          )}
        </Button>
      </div>
    </form>
  );
};
