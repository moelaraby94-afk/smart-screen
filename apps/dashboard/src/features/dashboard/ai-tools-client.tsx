'use client';

import { useState } from 'react';
import { Sparkles, FileText, Target, Palette, TrendingUp, DollarSign, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';

const suggestionTypes = [
  { type: 'headline', icon: FileText, inputPlaceholder: 'Topic (e.g., Summer Sale)' },
  { type: 'body-text', icon: FileText, inputPlaceholder: 'Topic or headline' },
  { type: 'cta', icon: Target, inputPlaceholder: 'Product or goal' },
  { type: 'color-scheme', icon: Palette, inputPlaceholder: 'Industry (e.g., Retail)' },
];

const mockResults: Record<string, string[]> = {
  headline: ['Unbeatable Summer Deals!', 'Get 50% Off This Summer', 'Your Summer Sale Starts Here'],
  'body-text': ['Discover amazing discounts on all your favorite products this summer season.', 'Limited time offer - shop now and save big on everything you need.'],
  cta: ['Shop Now', 'Claim Your Discount', 'Don\'t Miss Out - Buy Today'],
  'color-scheme': ['#2563eb + #f59e0b (Blue + Amber)', '#0ea5e9 + #f97316 (Sky + Orange)', '#7c3aed + #10b981 (Purple + Emerald)'],
};

export function AiToolsClient() {
  const t = useTranslations('aiPage');
  const [generating, setGenerating] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string[]>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const handleGenerate = (type: string) => {
    setGenerating(type);
    setTimeout(() => {
      setResults({ ...results, [type]: mockResults[type] || [] });
      setGenerating(null);
    }, 1000);
  };

  const totalRequests = 142;
  const spend = 3.27;
  const budget = 50.0;
  const budgetPct = (spend / budget) * 100;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {suggestionTypes.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.type}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-lg border border-primary/20 bg-primary/10 p-2.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{t(`tool_${s.type}`)}</h3>
                    <p className="text-sm text-muted-foreground">{t(`tool_${s.type}_desc`)}</p>
                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder={s.inputPlaceholder}
                        value={inputs[s.type] || ''}
                        onChange={(e) => setInputs({ ...inputs, [s.type]: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate(s.type)}
                      />
                      <Button size="sm" onClick={() => handleGenerate(s.type)} disabled={generating === s.type}>
                        <Sparkles className="mr-1.5 h-4 w-4" />
                        {generating === s.type ? t('generating') : t('generate')}
                      </Button>
                    </div>
                    {results[s.type] && results[s.type].length > 0 && (
                      <div className="mt-3 space-y-2">
                        {results[s.type].map((r, i) => (
                          <div key={i} className="rounded-lg bg-muted/50 p-3 text-sm">{r}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('usage')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-2.5">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{totalRequests}</p>
                <p className="text-sm text-muted-foreground">{t('totalRequests')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-2.5">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">${spend.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">{t('currentSpend')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-primary/20 bg-primary/10 p-2.5">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">${budget.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">{t('monthlyBudget')}</p>
                <Badge variant={budgetPct > 80 ? 'danger' : 'muted'} className="mt-1">
                  {budgetPct.toFixed(0)}% {t('used')}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
