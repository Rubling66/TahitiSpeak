'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  RefreshCw, 
  Home, 
  MessageCircle, 
  Wifi,
  WifiOff
} from 'lucide-react';

interface TahitianErrorMessageProps {
  error?: Error | string;
  errorCode?: string;
  isOffline?: boolean;
  onRetry?: () => void;
  onGoHome?: () => void;
  onContactSupport?: () => void;
  showDetails?: boolean;
}

interface ErrorTranslation {
  french: string;
  tahitian: string;
  english: string;
}

const ERROR_MESSAGES: Record<string, ErrorTranslation> = {
  network: {
    french: "Problème de connexion réseau",
    tahitian: "Te taui ra te hoê taui i te fenua",
    english: "Network connection problem"
  },
  offline: {
    french: "Vous êtes hors ligne",
    tahitian: "Ua reva 'oe i te fenua",
    english: "You are offline"
  },
  server: {
    french: "Erreur du serveur",
    tahitian: "Te hape ra te 'ohipa",
    english: "Server error"
  },
  notFound: {
    french: "Page non trouvée",
    tahitian: "Aita i ite ia te 'api",
    english: "Page not found"
  },
  unauthorized: {
    french: "Accès non autorisé",
    tahitian: "Aita e fa'a'ite ia",
    english: "Unauthorized access"
  },
  validation: {
    french: "Données invalides",
    tahitian: "Te mau 'ite hape",
    english: "Invalid data"
  },
  timeout: {
    french: "Délai d'attente dépassé",
    tahitian: "Ua roa roa te fa'arue",
    english: "Request timeout"
  },
  generic: {
    french: "Une erreur inattendue s'est produite",
    tahitian: "Ua tupu te hape e aita i te fa'anahora'a",
    english: "An unexpected error occurred"
  }
};

const SOLUTION_MESSAGES: Record<string, ErrorTranslation> = {
  network: {
    french: "Vérifiez votre connexion internet et réessayez",
    tahitian: "Fa'amaita'i i to 'oe hoê ra'a internet e fa'ahou",
    english: "Check your internet connection and try again"
  },
  offline: {
    french: "Reconnectez-vous à internet pour continuer",
    tahitian: "Fa'ahou i te hoê ra'a internet no te fa'anahora'a",
    english: "Reconnect to internet to continue"
  },
  server: {
    french: "Nos serveurs rencontrent des difficultés. Veuillez réessayer plus tard",
    tahitian: "Te mau 'ohipa e fa'atau nei i te mau hape. Fa'ahou atu i muri ae",
    english: "Our servers are experiencing issues. Please try again later"
  },
  notFound: {
    french: "La page que vous cherchez n'existe pas",
    tahitian: "Te 'api e 'imi nei 'oe aita",
    english: "The page you're looking for doesn't exist"
  },
  unauthorized: {
    french: "Vous devez vous connecter pour accéder à cette page",
    tahitian: "E ti'a 'oe e ho'i mai no te fa'anahora'a i teie 'api",
    english: "You need to log in to access this page"
  },
  validation: {
    french: "Veuillez vérifier les informations saisies",
    tahitian: "Fa'amaita'i i te mau 'ite i fa'a'ite",
    english: "Please check the information entered"
  },
  timeout: {
    french: "La requête a pris trop de temps. Veuillez réessayer",
    tahitian: "Ua roa roa te patira'a. Fa'ahou atu",
    english: "The request took too long. Please try again"
  },
  generic: {
    french: "Veuillez réessayer ou contacter le support",
    tahitian: "Fa'ahou atu pe ho'i atu i te tauturu",
    english: "Please try again or contact support"
  }
};

const getErrorType = (error?: Error | string, errorCode?: string): string => {
  if (errorCode) return errorCode;
  
  if (typeof error === 'string') {
    const errorLower = error.toLowerCase();
    if (errorLower.includes('network') || errorLower.includes('fetch')) return 'network';
    if (errorLower.includes('404')) return 'notFound';
    if (errorLower.includes('401') || errorLower.includes('unauthorized')) return 'unauthorized';
    if (errorLower.includes('500') || errorLower.includes('server')) return 'server';
    if (errorLower.includes('timeout')) return 'timeout';
    if (errorLower.includes('validation')) return 'validation';
  }
  
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();
    if (errorMessage.includes('network') || errorMessage.includes('fetch')) return 'network';
    if (errorMessage.includes('timeout')) return 'timeout';
  }
  
  return 'generic';
};

const TahitianErrorMessage: React.FC<TahitianErrorMessageProps> = ({
  error,
  errorCode,
  isOffline = false,
  onRetry,
  onGoHome,
  onContactSupport,
  showDetails = false
}) => {
  const errorType = isOffline ? 'offline' : getErrorType(error, errorCode);
  const errorMessage = ERROR_MESSAGES[errorType] || ERROR_MESSAGES.generic;
  const solutionMessage = SOLUTION_MESSAGES[errorType] || SOLUTION_MESSAGES.generic;

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isOffline ? (
              <WifiOff className="h-16 w-16 text-red-500" />
            ) : (
              <AlertTriangle className="h-16 w-16 text-yellow-500" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Oops! {errorMessage.french}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Multilingual Error Messages */}
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-base">
                <div className="space-y-2">
                  <p><strong>Français:</strong> {errorMessage.french}</p>
                  <p><strong>Reo Tahiti:</strong> {errorMessage.tahitian}</p>
                  <p><strong>English:</strong> {errorMessage.english}</p>
                </div>
              </AlertDescription>
            </Alert>

            <Alert className="border-blue-200 bg-blue-50">
              <MessageCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-base">
                <div className="space-y-2">
                  <p><strong>Solution (Français):</strong> {solutionMessage.french}</p>
                  <p><strong>Solution (Reo Tahiti):</strong> {solutionMessage.tahitian}</p>
                  <p><strong>Solution (English):</strong> {solutionMessage.english}</p>
                </div>
              </AlertDescription>
            </Alert>
          </div>

          {/* Error Details (if enabled) */}
          {showDetails && error && (
            <Alert className="border-gray-200 bg-gray-50">
              <AlertDescription className="text-sm font-mono">
                <strong>Technical Details:</strong><br />
                {typeof error === 'string' ? error : error.message}
                {error instanceof Error && error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Stack Trace</summary>
                    <pre className="mt-2 text-xs overflow-auto">{error.stack}</pre>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onRetry && (
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Réessayer / Fa'ahou / Retry
              </Button>
            )}
            
            {onGoHome && (
              <Button variant="outline" onClick={onGoHome} className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Accueil / Fare / Home
              </Button>
            )}
            
            {onContactSupport && (
              <Button variant="outline" onClick={onContactSupport} className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                Support / Tauturu / Help
              </Button>
            )}
          </div>

          {/* Network Status Indicator */}
          {isOffline && (
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <WifiOff className="h-4 w-4" />
              <span>Mode hors ligne / Offline mode</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TahitianErrorMessage;