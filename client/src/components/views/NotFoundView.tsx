import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export const NotFoundView: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="py-16 max-w-lg mx-auto flex items-center justify-center animate-fade-in">
      <Card className="w-full text-center p-8 border-border shadow-subtle">
        <CardContent className="space-y-4">
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <FileQuestion className="h-7 w-7" />
          </div>
          <div>
            <span className="text-3xl font-extrabold text-foreground font-mono block">404</span>
            <h2 className="text-base font-semibold text-foreground mt-1">Page Not Found</h2>
            <p className="text-xs text-foreground-muted mt-1.5 max-w-xs mx-auto">
              The network route you are looking for doesn't exist or has been moved.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-1.5 text-xs">
              <ArrowLeft className="h-3.5 w-3.5" />
              Go Back
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/')} className="gap-1.5 text-xs">
              <Home className="h-3.5 w-3.5" />
              Overview Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
