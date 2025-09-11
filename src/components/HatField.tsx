import React from 'react';
import { AlertCircle, CheckCircle, Zap } from 'lucide-react';

interface HatFieldProps {
  value: string;
  onChange: (value: string) => void;
  isValid: boolean;
}

const HatField: React.FC<HatFieldProps> = ({ value, onChange, isValid }) => {

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          placeholder="EXCLUSIVO, POLÍTICA, ECONOMIA..."
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm font-medium transition-all ${
            isValid
              ? 'border-green-300 bg-green-50'
              : value
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300'
          }`}
          maxLength={15}
        />
        
        {/* Ícone de status */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isValid ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
          ) : value ? (
            <AlertCircle className="w-4 h-4 text-red-500" />
          ) : (
            <Zap className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Contador e validação */}
      <div className="flex items-center justify-between">
        <span className={`text-xs ${value.length > 15 ? 'text-red-600' : 'text-gray-500'}`}>
          {value.length}/15 caracteres
        </span>
        
        {/* Mensagem de validação */}
        {!isValid && value && (
          <div className="flex items-center space-x-1 text-red-600 text-xs">
            <AlertCircle className="w-3 h-3" />
            <span>Entre 3 e 15 caracteres</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default HatField; 